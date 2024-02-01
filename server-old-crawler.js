//old crawl from html elements
//xCrawl tampermonkey script

//var cors            = require('cors'),
var http           = require('http'),
    express         = require('express'),
    //errorhandler    = require('errorhandler'),
    //dotenv          = require('dotenv'),
    bodyParser      = require('body-parser'),
    fs              = require('fs');

const { Client } = require('@elastic/elasticsearch');

var app = express();

const elastic = new Client({
    node: 'http://localhost:9200',
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
        return res.status(400).send({msg: 'error'})
    }
    for(let i=0; i<bulk.length;i++){
        bulk[i]['add_date'] = (new Date().toISOString());
    }
    const operations = bulk.flatMap(doc => [{ create: { _index: 'newsarchive_web', _id: doc['id'] } }, doc]);
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
        console.log(erroredDocuments)
    }
    //console.log('bulk_result: ', bulkResponse);
    return res.status(200).send({result: bulkResponse.items})
})

app.post('/tweet', async function(req, res) {

    //console.log('tweet: ', req.body)
    let tweet = 'tweet' in req.body ? req.body.tweet : null;
    if(!tweet){
        return res.status(400).send({msg: 'error'})
    }

    tweet['add_date'] = (new Date().toISOString());

    /*elastic.index({
        index: 'newsarchive_web',
        id: tweet.id,
        document: tweet
    }).then((outdoc) => {
        console.log('pos_response: ', outdoc)
        return res.status(200).send({result: outdoc.result});
    }).catch((err) => {
        console.log('neg_response: ', err)
        return res.status(200).send({result: 'error'});
    })*/
    /*
    elastic.update({
        index: 'newsarchive_web',
        id: tweet.id,
        script: {
            lang: "painless",
            source: `
                if(
                    !(
                        (!params['tweet'].containsKey('in_reply_to_status_id_str') && ctx._source.containsKey('in_reply_to_status_id_str')) || 
                        (!params['tweet'].containsKey('original_text') && ctx._source.containsKey('original_text'))
                    ))
                {
                    ctx._source = params['tweet'];
                }`,
            params: {
                tweet: tweet
            }
        },
        upsert: tweet,
        _source_includes: ["in_reply_to_status_id_str", "original_text"]
    })
    */
    elastic.update({
        index: 'newsarchive_web',
        id: tweet.id,
        script: {
            lang: "painless",
            source: `
                boolean flag = false;
                if(params['tweet'].containsKey('in_reply_to_status_id_str')){
                    ctx._source.in_reply_to_status_id_str = params['tweet'].in_reply_to_status_id_str;
                    flag = true;
                }
                if(params['tweet'].containsKey('original_text')){
                    ctx._source.original_text = params['tweet'].original_text;
                    ctx._source.original_lang = params['tweet'].original_lang;
                    ctx._source.full_text = params['tweet'].full_text;
                    ctx._source.lang = params['tweet'].lang;
                    flag = true;
                }
                else if(params['tweet'].full_text.length() > ctx._source.full_text.length()){
                    ctx._source.full_text = params['tweet'].full_text;
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
                tweet: tweet
            }
        },
        upsert: tweet,
        _source_includes: ["in_reply_to_status_id_str", "original_text", "full_text"]
    }).then((outdoc) => {
        //console.log('pos_response: ', outdoc)

        //detect if no changes happened
        /*if(!tweet.hasOwnProperty("in_reply_to_status_id_str") && !tweet.hasOwnProperty("original_text") && outdoc['result'] != 'created')
        {
                outdoc['result'] = "noop";
        }*/
        return res.status(200).send({result: outdoc.result, extra: outdoc.get._source});
    }).catch((err) => {
        console.log('neg_response: ', err)
        return res.status(200).send({result: err});
    })
})    
console.log('start back.js app in \t\t\t\t>>>>', "<<<<");
http.createServer(app).listen(8090, "0.0.0.0", function (err) {
  console.log('listening in ', "0.0.0.0",':',  8090);
});