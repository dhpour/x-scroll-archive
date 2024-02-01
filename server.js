//var cors            = require('cors'),
var http           = require('http'),
    express         = require('express'),
    //errorhandler    = require('errorhandler'),
    //dotenv          = require('dotenv'),
    bodyParser      = require('body-parser'),
    fs              = require('fs');

var cors = require('cors');
const { Client } = require('@elastic/elasticsearch');
const logger = require('./Logger');
const report = require("./report");
const funcs = require("./funcs");

require('dotenv').config();
//console.log(process.env);

//const ANNOTATION_INDEX = 'xannsample';
//const TWEETS_INDEX = "newsarchive_gql";

var app = express();

const elastic = new Client({
    node: process.env.ELASTIC,
    tls: {
        rejectUnauthorized: false
    }
});

/*elastic.get({
    index: 'newsarchive_web',
    id: "1733490801811054910",
}).then(out => {
    console.log('document: ', out);
})*/

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
    /*
    makes a localized datetime format
    e.g.
        let add_date = new Date();
    e.g.
        //converts ISOString (twitter) to localized format
        let created_at = new Date(tweet['created_at']);
        created_at = dateFormat4elastic(created_at);
    */
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

    //console.log('bulk: ', req.body);
    let bulk = 'bulk' in req.body ? req.body.bulk : null;
    if(!bulk || bulk.length === 0){
        logger.warn('/bulk: bulk is empt');
        return res.status(400).send({msg: 'error'})
    }
    for(let i=0; i<bulk.length;i++){
        //bulk[i]['add_date'] = (new Date().toISOString());
        bulk[i]['add_date'] = dateFormat4elastic(new Date());
        //bulk[i]['created_at'] = dateFormat4elastic(new Date(bulk[i]['created_at']));
    }
    const operations = bulk.flatMap(doc => ["fa", "und" ].includes(doc['lang']) ? [ { create: { _index: process.env.TWEETS_INDEX, _id: doc['id'] } }, doc] : []);
    for(let i in operations){
        //console.log('op: ', i, i%2, Number(i)+1, operations.length);
        //console.log('op2: ', i%2);
        if(i%2 == 0 && Number(i)+1 < operations.length){
            //console.log('len: ', operations[Number(i)+1].full_text?.length);
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
    //console.log(operations);
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
              // If the status is 429 it means that you can retry the document,
              // otherwise it's very likely a mapping error, and you should
              // fix the document before to try it again.
              status: action[operation].status,
              error: action[operation].error,
              operation: operations[i * 2],
              document: operations[i * 2 + 1]
            })
          }
        })
        logger.error('/buk: ' + JSON.stringify(erroredDocuments));
        console.log(erroredDocuments)
    }
    //console.log('bulk_result: ', bulkResponse);
    logger.info('/buk: ' + JSON.stringify(bulkResponse.items));
    return res.status(200).send({result: bulkResponse.items})
})

app.post('/translate', async function(req, res) {

    //console.log('tweet: ', req.body)
    let trans = 'trans' in req.body ? req.body.trans : null;
    if(!trans){
        logger.warn('/translate: trans is empty');
        return res.status(400).send({msg: 'error'})
    }

    if(trans.destinationLanguage === "fa"){}
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
        //console.log('pos_response: ', outdoc)

        //detect if no changes happened
        /*if(!tweet.hasOwnProperty("in_reply_to_status_id_str") && !tweet.hasOwnProperty("original_text") && outdoc['result'] != 'created')
        {
                outdoc['result'] = "noop";
        }*/
        logger.info('/translate: ' + JSON.stringify(outdoc.result));
        return res.status(200).send({result: outdoc.result});
    }).catch((err) => {
        console.log('neg_response: ', err)
        logger.error('/translate: ' + JSON.stringify(err));
        return res.status(500).send({result: err});
    })
})    

app.get('/getann', async function(req, res) {
    let id = 'id' in req.query ? req.query.id : null;
    let date = 'date' in req.query ? req.query.date : null;
    let func = 'func' in req.query ? req.query.func : null;

    console.log(id, func, date);
    //console.log('id: ', id);
    if(!id){
        //console.log('bad reqs')
        logger.warn('/getann: id not available');
        //return res.status(400).send({msg: 'bad request'});
    }
    
    async function getDoc(id){
        const odoc = await elastic.get({index: process.env.TWEETS_INDEX, id: id}).catch(err => {
            console.log('/getann: getDoc' + JSON.stringify(err));
            //console.log('err: ', err, Object.getOwnPropertyNames(err));
            if(err?.meta?.body?.found === false){
                //console.log('not found: ', id);
                return {_source: {
                    full_text: ''
                }}
            }
            else{
                //return res.status(500).send({'err': err});
                //console.log({'err': err});
                return {_source: {
                    full_text: ''
                }}
            }
        });
        return odoc
    }
    //console.log('full_text: ', org_doc._source.full_text);
    if(id){
        elastic.get({
            index: process.env.ANNOTATION_INDEX,
            id: id
        }).then(async doc => {
            //console.log('doc:', doc)
            logger.info(`/getann: ${id}`);
            const org_doc = await getDoc(id)
            return res.status(200).send({full_text: org_doc?._source?.full_text, ...doc});
        }).catch(async err => {
            //console.log('err: ', err, Object.getOwnPropertyNames(err));
            if(err?.meta?.body?.found === false){
                //console.log('not found: ', id);
                logger.warn(`/getann: ${id} annotation does not exist`);
                const org_doc = await getDoc(id)
                return res.status(200).send({full_text: org_doc?._source?.full_text});
                //return res.status(404).send({'err': 'not found'});
            }
            logger.error(`/getann: ${id}` + JSON.stringify(err));
            return res.status(500).send({'err': err});
        })
    }
    else if(date && func){
        date = decodeURIComponent(date);
        elastic.search({
            index: process.env.ANNOTATION_INDEX,
            body: {
                query: {
                    range: {
                        add_date: {
                            [func]: date
                        }
                    }
                },
                size: 1,
                sort: [{
                        add_date: {
                            order: func === 'lt' ? "desc" : "asc"
                        }
                    }
                ]
            }
        }).then(async elRes => {
            if(elRes?.hits?.hits?.length > 0){
                //console.log('doc:', doc)
                let doc = elRes.hits.hits[0]
                //console.log('doc-: ', doc);

                console.log(`/getann: doc: ${doc._id}`);
                const org_doc = await getDoc(doc._id);
                console.log('------------------------');
                console.log('doc-: ', {full_text: org_doc?._source?.full_text, ...doc});
                return res.status(200).send({full_text: org_doc?._source?.full_text, ...doc});
            }
            else{
                console.log(`/getann1: annotation does not exist`);
                return res.status(404).send({msg: 'annotation doc does not exist'});
            }
        }).catch(async err => {
            //console.log('err: ', err, Object.getOwnPropertyNames(err));
            if(err?.meta?.body?.found === false){
                //console.log('not found: ', id);
                console.log(`/getann2: annotation does not exist`);
                return res.status(404).send({err: 'not found'});
            }
            console.log(`/getann: err-: ` + JSON.stringify(err));
            return res.status(500).send({'err': err});
        })
    }
});

app.post('/getmann', async function(req, res) {
    
    let ids = 'ids' in req.body ? req.body.ids : null;
    if(!ids){
        logger.warn(`/getmann: did not rovide id`);
        return res.status(400).send({msg: 'error'})
    }
    
    //console.log('full_text: ', org_doc._source.full_text);
    elastic.mget({
        index: process.env.ANNOTATION_INDEX,
        ids: ids,
        //_source: ['toxicity', 'keywords', 'topics', 'tags']
    }).then(async docs => {
        //console.log('docs:', docs)
        logger.info(`/getmann catch right ${ids}`)
        return res.status(200).send({docs: docs});
    }).catch(err => {
        console.log('err: ', err, Object.getOwnPropertyNames(err));
        if(err?.meta?.body?.found === false){
            //console.log('not found: ', ids);
            logger.warn(`/getmann not found ${ids}`)
            return res.status(404).send({'err': 'not found'});
        }
        logger.error(`/getmann error ` + JSON.stringify(err))
        return res.status(500).send({'err': err});
    })
});

app.post('/setann', async function(req, res) {

    //console.log('tweet: ', req.body)
    let critical = 'critical' in req.body ? req.body.critical : null;
    let implicit = 'implicit' in req.body ? req.body.implicit : null;
    let toxicity = 'toxicity' in req.body ? req.body.toxicity : null;
    let notincontext = 'notincontext' in req.body ? req.body.notincontext : null;
    let implicitEmpty = 'implicitEmpty' in req.body ? req.body.implicitEmpty : null;
    let notincontextEmpty = 'notincontextEmpty' in req.body ? req.body.notincontextEmpty : null;
    let criticalEmpty = 'criticalEmpty' in req.body ? req.body.criticalEmpty : null;
    let id = 'id' in req.body ? req.body.id : null;
    if(!critical && !implicit && !toxicity && !notincontext){
        logger.warn(`/setann not enough params provided`)
        return res.status(400).send({msg: 'error'})
    }

    console.log('i>d: ', id);
    console.log('critical: ', critical);
    console.log('implicit: ', implicit);
    console.log('notincontext: ', notincontext);
    console.log('toxicity: ', toxicity);
    console.log('implicitEmpty: ', implicitEmpty);
    console.log('notincontextEmpty: ', notincontextEmpty);
    console.log('criticalEmpty: ', criticalEmpty);
    let doc = {};
    let critics = [];
    critical?.forEach( obj => {
        if(obj.q != ''){
            let temp = {
                q: obj.q
            }
            if(!!obj?.a){
                temp['a'] = obj.a;
            }
            if(obj?.hasOwnProperty('claim')){
                temp['claim'] = obj.claim;
            }
            critics.push(temp);
        }
    });
    console.log('crit>>>>>>:', critics);
    if(critics.length > 0 || criticalEmpty){
        doc['critical'] = critics
    }

    let nocontexts = [];
    notincontext?.forEach( obj => {
        if(obj.q != ''){
            let temp = {
                q: obj.q
            }
            if(!!obj?.a){
                temp['a'] = obj.a;
            }
            if(obj?.hasOwnProperty('claim')){
                temp['claim'] = obj.claim;
            }
            nocontexts.push(temp);
        }
    });
    console.log('nocontexts>>>>>>:', nocontexts);
    if(nocontexts.length > 0 || notincontextEmpty){
        doc['notincontext'] = nocontexts
    }

    let implications = [];
    implicit?.forEach( obj => {
        if(obj.i != ''){
            let temp = {
                i: obj.i
            }
            if(!!obj?.q){
                temp['q'] = obj.q;
            }
            if(obj?.hasOwnProperty('claim')){
                temp['claim'] = obj.claim;
            }
            if(!!obj?.type){
                temp['type'] = obj.type;
            }
            implications.push(temp);
        }
    });
    console.log('imp>>>>>>:', implications);
    if(implications.length > 0 || implicitEmpty){
        doc['implicit'] = implications
    }

    doc['toxicity'] = toxicity;

    elastic.update({
        index: process.env.ANNOTATION_INDEX,
        id: id,
        doc: doc,
        upsert: {...doc, add_date: dateFormat4elastic(new Date())}
    }).then((outdoc) => {
        //console.log(outdoc);
        logger.info(`/setann anns submitted: ${ids}`)
        return res.status(200).send({result: outdoc});
    }).catch((err) => {
        //console.log('neg_response: ', err)
        logger.error(`/getmann problem setting anns for: `, JSON.stringify(err))
        return res.status(200).send({result: err});
    })
}) 

app.post('/settoxicity', async function(req, res) {

    //console.log('tweet: ', req.body)
    let toxicity = 'toxicity' in req.body ? req.body.toxicity : null;
    let id = 'id' in req.body ? req.body.id : null;
    if(!toxicity){
        logger.warn(`/settoxicity not provided proper params`)
        return res.status(400).send({msg: 'error'})
    }

    console.log('i>d: ', id);
    console.log('toxicity: ', toxicity);

    elastic.update({
        index: process.env.ANNOTATION_INDEX,
        id: id,
        doc: {toxicity: toxicity},
        upsert: { //if doc does not exist add
            toxicity: toxicity,
            add_date: dateFormat4elastic(new Date())
        }
    }).then((outdoc) => {
        //console.log(outdoc);
        logger.info(`/settoxicity set for ${id}`)
        return res.status(200).send({result: outdoc});
    }).catch((err) => {
        //console.log('neg_response: ', err)
        logger.error(`/settoxicity problen occured for ${id}` + JSON.stringify(err))
        return res.status(200).send({result: err});
    })
});

app.post('/setkws', async function(req, res) {

    //console.log('tweet: ', req.body)
    let kws = 'kws' in req.body ? req.body.kws : null;
    let type = 'type' in req.body ? req.body.type : null;
    let id = 'id' in req.body ? req.body.id : null;
    if(!kws && !type){
        logger.warn(`/setkws not provided proper params`)
        return res.status(400).send({msg: 'error'})
    }

    console.log('i>d: ', id);
    console.log('kws: ', kws);

    let doc = {}
    if(type === 'keyword'){
        doc['keywords'] = kws
    }
    else if(type === 'topic'){
        doc['topics'] = kws
    }
    else if(type === 'tag'){
        doc['tags'] = kws
    }
    else if(type === 'ner'){
        doc['ner'] = kws
    }

    elastic.update({
        index: process.env.ANNOTATION_INDEX,
        id: id,
        doc: doc,
        upsert: {...doc, add_date: dateFormat4elastic(new Date())}
    }).then((outdoc) => {
        //console.log(outdoc);
        logger.info(`/setkws set for ${id}`)
        return res.status(200).send({result: outdoc});
    }).catch((err) => {
        //console.log('neg_response: ', err)
        logger.error(`/setkws problen occured for ${id}` + JSON.stringify(err))
        return res.status(200).send({result: err});
    })
});

app.get('/getreport', async function(req, res) {
    //let id = 'id' in req.query ? req.query.id : null;
    let rep = await report.getAnnsSummary();
    console.log(rep);
    return res.status(200).send(rep)
})

app.get('/getspecreport', async function(req, res) {
    let range = 'range' in req.query ? req.query.range : 'day';
    console.log('selected: ', range);
    let chr = 'd'
    switch(range){
        case 'day': 
            chr = 'd';
            break;
        case 'week':
            chr = 'w';
            break;
        case 'month':
            chr = 'M';
            break;
        case 'year':
            chr = 'y';
            break;
    }
    let ranges = [
        {
            gt: `now-1${chr}/${chr}`,
            lte: dateFormat4elastic(new Date())//`now/${chr}`
        }
    ];

    for(let i=1; i<=6; i++){
        ranges.push({
            gt: `now-${i+1}${chr}/${chr}`,
            lte: `now-${i}${chr}/${chr}`
        })
    }
    console.log(ranges);

    let [
        elasticRes1, 
        elasticRes2,
        elasticRes3,
        elasticRes4,
        elasticRes5,
        elasticRes6,
        elasticRes7] = await Promise.all([
            report.getAnnsSummary(ranges[0]), 
            report.getAnnsSummary(ranges[1]),
            report.getAnnsSummary(ranges[2]),
            report.getAnnsSummary(ranges[3]),
            report.getAnnsSummary(ranges[4]),
            report.getAnnsSummary(ranges[5]),
            report.getAnnsSummary(ranges[6])]);

    return res.status(200).send({
        resps: [
            {...elasticRes1, range: ranges[0]}, 
            {...elasticRes2, range: ranges[1]},
            {...elasticRes3, range: ranges[2]},
            {...elasticRes4, range: ranges[3]},
            {...elasticRes5, range: ranges[4]},
            {...elasticRes6, range: ranges[5]},
            {...elasticRes7, range: ranges[6]}
        ]
    });
});

app.get('/report', async function(req, res) {
    //let id = 'id' in req.query ? req.query.id : null;
    res.sendFile(__dirname + '/report.html');
})

app.post('/gettweets', async function(req, res) {
    //console.log('tweet: ', req.body)
    let query = 'query' in req.body ? req.body.query : null;
    funcs.makeTimeline(query, function(eres){
        return res.status(200).send({tweets: eres?.hits?.hits, search_after: eres?.search_after, total: eres?.total})
    })
});

function createDate(){
    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    let dateTemplate = `Fri Jan ${getRandomInt(1, 10)} ${getRandomInt(1, 23)}:${getRandomInt(1, 50)}:10 +0000 2024`
    return dateTemplate
}

app.get('/temp', async function(req, res) {
    
    let refDate = "Fri Jan 12 13:20:10 +0000 2024";
    let newDate = '';

    let index = "xannsample";
    let query = {
        "query": {
          "match_all": {}
        },
        "size": 500
      }
      await elastic.search({
        index: process.env.ANNOTATION_INDEX,
        body: query
      }).then(elres => {
        elres.hits.hits.forEach( async doc => {
            //console.log(doc._id, doc._source.add_date);
            let dt = doc._source.add_date.toString();
            let old = dt
            if(dt.search("Jan")){
                console.log(":::::::", old);
            }
            if(dt.search(" Jan 1 ") !== -1 || dt.search(" Jan 8 ") !== -1 || dt.search(" Jan 15 ") !== -1 || dt.search(" Jan 22 ") !== -1 || dt.search(" Jan 29 ") !== -1){
                //dt = dt.replaceAll("Fri", "Mon")
                if(dt === "Fri Jan 8 20:15:10 +0000 2024"){
                    //console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
                }
                //console.log(dt);
                if(dt === "Fri Jan 8 20:15:10 +0000 2024"){
                    //console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
                }
                dt = "Mon" + dt.substr(3);
                //console.log(dt);
                //console.log('Mon-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-:');
                
            }
            else if(dt.search(" Jan 2 ") !== -1 || dt.search(" Jan 9 ") !== -1 || dt.search(" Jan 16 ") !== -1 || dt.search(" Jan 23 ") !== -1 || dt.search(" Jan 30 ") !== -1){
                //dt = dt.replaceAll("Fri", "Tue")
                //console.log(dt);
                dt = "Tue" + dt.substr(3);
                //console.log(dt);
                //console.log('Tue-=-=-=-=-');
            }
            else if(dt.search(" Jan 3 ") !== -1 || dt.search(" Jan 10 ") !== -1 || dt.search(" Jan 17 ") !== -1 || dt.search(" Jan 24 ") !== -1 || dt.search(" Jan 31 ") !== -1){
                //dt = dt.replaceAll("Fri", "Wed")
                //console.log(dt);
                dt = "Wed" + dt.substr(3);
                //console.log(dt);
                //console.log('Wed-=-=-=-=-');
            }
            else if(dt.search(" Jan 4 ") !== -1 || dt.search(" Jan 11 ") !== -1 || dt.search(" Jan 18 ") !== -1 || dt.search(" Jan 25 ") !== -1){
                //dt = dt.replaceAll("Fri", "Thu")
                //console.log(dt);
                dt = "Thu" + dt.substr(3);
                //console.log(dt);
                //console.log('Thu-=-=-=-=-');
            }
            else if(dt.search(" Jan 5 ") !== -1 || dt.search(" Jan 12 ") !== -1 || dt.search(" Jan 19 ") !== -1 || dt.search(" Jan 26 ") !== -1){
                //dt = dt.replaceAll("Fri", "Fri")
                //console.log(dt);
                dt = "Fri" + dt.substr(3);
                //console.log(dt);
                //console.log('Fri-=-=-=-=-');
            }
            else if(dt.search(" Jan 6 ") !== -1 || dt.search(" Jan 13 ") !== -1 || dt.search(" Jan 20 ") !== -1 || dt.search(" Jan 27 ") !== -1){
                //dt = dt.replaceAll("Fri", "Sat")
                //console.log(dt);
                dt = "Sat" + dt.substr(3);
                //console.log(dt);
                //console.log('Sat-=-=-=-=-');
            }
            else if(dt.search(" Jan 7 ") !== -1 || dt.search(" Jan 14 ") !== -1 || dt.search(" Jan 21 ") !== -1 || dt.search(" Jan 28 ") !== -1){
                //dt = dt.replaceAll("Fri", "Sun")
                //console.log(dt);
                dt = "Sun" + dt.substr(3);
                //console.log(dt);
                //console.log('Sun-=-=-=-=-');

            }
            if(dt.search(" Jan 8 ") !== -1){
                console.log("+++++++++++++");
                dt = "Mon" + dt.substr(3);
                console.log("+++++++++++++")
            }
            if(old !== dt){
                console.log(")))))))))))))", dt);
            }
            //console.log(">>", doc._source.add_date, "==>", dt)
            await elastic.update({
                index: process.env.ANNOTATION_INDEX,
                id: doc._id,
                doc: {
                    add_date: dt
                }
            })
        });
        return res.status(200).send(elres)
      }).catch(err => {
        console.log(err);
      })
});

app.get('/saveimage', async function(req, res){
    let img = "https://pbs.twimg.com/media/GCIHm3vbUAAnZRV.jpg";
    //request(img).pipe(fs.createWriteStream('img.jpg'));   
    funcs.checkAndSaveImage(img);
})

console.log('start back.js app in \t\t\t\t>>>>', "<<<<");
http.createServer(app).listen(process.env.BACKPORT, process.env.BACKPATH, function (err) {
  console.log(`listening on ${process.env.BACKPATH}:${process.env.BACKPORT}`);
});