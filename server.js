var http           = require('http'),
    express         = require('express'),
    bodyParser      = require('body-parser'),
    fs              = require('fs');

var cors = require('cors');
const { Client } = require('@elastic/elasticsearch');
const logger = require('./Logger');

require('dotenv').config();

var app = express();

const elastic = new Client({
    node: process.env.ELASTIC,
    tls: {
        rejectUnauthorized: false
    }
});

const LANG = process.env.LANG?.split(",") || [];
console.log('Languages: ', LANG);

var corsOptions = {
    origin: process.env.FRONT,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});
  
app.use(cors(corsOptions));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({limit: '50mb'}));
//app.use(cors());

function dateFormat4elastic(date){

    let dateOptions = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', year: 'numeric', hour12: false }
    let stringDate = date.toLocaleDateString('en-US', dateOptions);
    stringDate = stringDate.replace(/,/g, '');
    let arrayDate = stringDate.split(' ');
    if(arrayDate[4].split(":")[0] == "24"){
        parts = arrayDate[4].split(":")
        parts[0] = "00"
        arrayDate[4] = parts.join(":");
    }
    let cur = [
        arrayDate[0],
        arrayDate[1],
        arrayDate[2],
        arrayDate[4],
        '+0000',
        arrayDate[3]].join(' ');
    return cur
}

app.post('/bulk', async function(req, res) {

    let bulk = 'bulk' in req.body ? req.body.bulk : null;
    if(!bulk || bulk.length === 0){
        logger.warn('/bulk: bulk is empt');
        return res.status(400).send({msg: 'error'})
    }
    for(let i=0; i<bulk.length;i++){
        bulk[i]['add_date'] = dateFormat4elastic(new Date());
    }
    const operations = bulk.flatMap(doc => (LANG.length === 0 || LANG.includes(doc['lang'])) ? [ { create: { _index: process.env.TWEETS_INDEX, _id: doc['id'] } }, doc] : []);
    //bulk.forEach(doc => (LANG.length === 0 || LANG.includes(doc['lang'])) ? console.log('lang: ', doc['lang']) : console.log('lang: ', []));
    for(let i in operations){
        if(i%2 == 0 && Number(i)+1 < operations.length){
            if(operations[Number(i)+1]?.display_text_range[1] >= 280 || operations[Number(i)+1]?.CommunityNote){
                let tmp = JSON.parse(JSON.stringify(operations[i]));
                operations[i] = {
                    update: tmp['create']
                }
                delete operations[Number(i)+1]?.display_text_range;
                operations[Number(i)+1] = {
                    script: {
                        source: `
                            boolean flag = false;
                            if(params['tweet'].full_text.length() > ctx._source.full_text.length()){
                                ctx._source.full_text = params['tweet'].full_text;
                                flag = true;
                            }
                            if(params['tweet'].containsKey('CommunityNote')){
                                ctx._source.CommunityNote = params['tweet'].CommunityNote;
                                flag = true;
                            }
                            if(flag){
                                ctx['op'] = 'index';
                            }
                            else{
                                ctx['op']= null;
                            }
                        `,
                        params: {
                            tweet: operations[Number(i)+1]
                        }
                    },
                    upsert: operations[Number(i)+1]
                    //doc_as_upsert: true
                }
            }
        }
    }
    if(operations.length == 0){
        logger.info('/bulk: nothing to add');
        return res.status(200).send({result: 'nothing to add'})
    }
    const bulkResponse = await elastic.bulk({ refresh: true, operations });

    if (bulkResponse.errors) {
        const erroredDocuments = []
        bulkResponse.items.forEach((action, i) => {
          const operation = Object.keys(action)[0]
          if (action[operation].error) {
            erroredDocuments.push({
              status: action[operation].status,
              error: action[operation].error,
              operation: operations[i * 2],
              document: operations[i * 2 + 1]
            })
          }
        })
        logger.error('/buk: ' + JSON.stringify(erroredDocuments));
    }
    logger.info('/buk: ' + JSON.stringify(bulkResponse.items));
    bulkResponse?.items?.forEach(doc => {
        if(doc.hasOwnProperty('create')){
            if([200, 201].includes(doc.create.status)){
                console.log(`doc create status: ${JSON.stringify(doc.create)}`);
            }
            else{
                console.log(`doc create status: ${doc.create.status}, reason: ${doc.create.error.reason}`);
            }
        }else if(doc.hasOwnProperty('update')){
            if([200, 201].includes(doc.update.status)){
                console.log(`doc update status: ${JSON.stringify(doc.update)}`);
            }
            else{
                console.log(`doc update status: ${doc.update.status}, reason: ${doc.update.error.reason}`);
            }
        }
    })
    return res.status(200).send({result: bulkResponse.items})
})

app.post('/translate', async function(req, res) {
    let trans = 'trans' in req.body ? req.body.trans : null;
    if(!trans){
        logger.warn('/translate: trans is empty');
        return res.status(400).send({msg: 'error'})
    }

    //if(trans.destinationLanguage === "fa"){}
    elastic.update({
        index: process.env.TWEETS_INDEX,
        id: trans.id,
        script: {
            lang: "painless",
            source: `
                boolean flag = false;
                if(params.containsKey('translation')){
                    ctx._source.original_text = ctx._source.full_text;
                    ctx._source.original_lang = ctx._source.lang;
                    ctx._source.full_text = params.translation;
                    ctx._source.lang = params.destinationLanguage;
                    flag = true;
                }
                if(flag){
                    ctx['op'] = 'index';
                }
                else{
                    ctx['op']= null;
                }
            `,
            params: {
                destinationLanguage: trans.destinationLanguage,
                sourceLanguage: trans.sourceLanguage,
                translation: trans.translation
            }
        }
    }).then((outdoc) => {
        logger.info('/translate: ' + JSON.stringify(outdoc.result));
        return res.status(200).send({result: outdoc.result});
    }).catch((err) => {
        console.log('neg_response: ', err)
        logger.error('/translate: ' + JSON.stringify(err));
        return res.status(500).send({result: err});
    })
})    

console.log('start back.js app in \t\t\t\t>>>>', "<<<<");
http.createServer(app).listen(process.env.BACKPORT, process.env.BACKPATH, function (err) {
  console.log(`listening on ${process.env.BACKPATH}:${process.env.BACKPORT}`);
});