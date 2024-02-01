//var cors            = require('cors'),
var http = require('http'),
    express = require('express'),
    //errorhandler    = require('errorhandler'),
    //dotenv          = require('dotenv'),
    bodyParser = require('body-parser'),
    fs = require('fs');

var request = require('request').defaults({ encoding: null });
const { Client } = require('@elastic/elasticsearch');
const logger = require('./Logger');

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

async function makeTimeline(query, next) {
    let xindex = query?.index;//'xindex' in req.body ? req.body.xindex : null;
    delete query?.index;
    console.log('query::::::', query);
    console.log('index::::::', xindex);

    if (!query) {
        query = {
            query: {
                match_all: {}
            },
            sort: [
                {
                    add_date: "desc"
                }
            ]
        }
    }

    if (!query?.sort) {
        query['sort'] = [
            {
                add_date: "desc"
            }
        ];
    }

    if (xindex == null || xindex == process.env.ANNOTATION_INDEX) {

        xindex = process.env.ANNOTATION_INDEX;
        getAnnTimeline(query, xindex, function (res) {
            return next(res)
        })
    }
    else {

        getTimeline(query, xindex, function (res) {
            return next(res)
        })
    }
}

async function getAnnTimeline(query, xindex, next) {
    console.log('getAnnTimeline: ', query);
    if (!query?._source) {
        //query['_source'] = ["_id"];
        //query["size"] = 500;
    }
    const idsobj = await elastic.search({
        index: xindex,
        body: query
    }).catch(err => {
        console.log('error:', err)
        return {}
    })
    let ids = [];

    idsobj?.hits?.hits?.forEach(idDoc => {
        console.log('find: search_after: ', idDoc);
        ids.push(idDoc._id)
    });
    console.log('ids.length: ', ids.length);

    let allDocsLen = idsobj.hits?.total?.value;
    let search_after = idsobj?.hits?.hits[idsobj?.hits?.hits?.length - 1]?.sort;
    console.log('AFTER_SEARCH: ', search_after);
    if(ids.length > 0) {
        elastic.mget({
            index: process.env.TWEETS_INDEX,
            ids: ids
        }).then(async docs => {
            //console.log('docs:', docs)

            console.log(`/getmann catch right ${ids}`);

            //unifing all result formate
            let filterdDocs = docs.docs.filter(doc => doc.found)
            let quotes = [];
            filterdDocs.forEach(doc => {
                if (doc._source?.quoted_status_id_str) {
                    quotes.push(doc._source?.quoted_status_id_str);
                }
            })
            console.log('quotes: ', quotes);
            //get quotes of those have quotes
            if (quotes.length > 0) {
                elastic.mget({
                    index: process.env.TWEETS_INDEX,
                    ids: quotes
                }).then(async qdocs => {
                    let qd = {}; //qdocs.hits.hits;
                    console.log('qdqdqdqdqdqd: ', qdocs)
                    qdocs.docs.forEach(d => {
                        qd[d._id] = d._source;
                    })
                    filterdDocs.forEach(fdoc => {
                        if (fdoc._source?.quoted_status_id_str) {
                            fdoc._source['quoted'] = qd[fdoc._source?.quoted_status_id_str];
                        }
                    })
                    //convertArrayToObject(qdocs, '_id')
                    console.log('AnnTimelien: ', { hits: { hits: filterdDocs }, search_after: search_after });
                    return next({ hits: { hits: filterdDocs }, search_after: search_after, total: allDocsLen });//, qqqs: qd});
                }).catch(err => {
                    console.log('Ann problem retrieving quotes: ', quotes);
                    console.log(err);
                })
            }
            else {
                console.log('Ann there is no quotes');
                return next({ hits: { hits: filterdDocs }, search_after: search_after, total: allDocsLen });
            }

        }).catch(err => {
            console.log('err: ', err, Object.getOwnPropertyNames(err));
            if (err?.meta?.body?.found === false) {
                //console.log('not found: ', ids);
                console.log(`/getmann not found ${ids}`)
                return next({});
            }
            console.log(`/getmann error ` + JSON.stringify(err))
            return next({});
        })
    }
    else {
        return next({});
    }
}

async function getTimeline(query, xindex, next) {
    console.log('QURY: ', query);
    const eres = await elastic.search({
        index: xindex,
        body: query
    }).catch(err => {
        console.log('error:', err)
        return next({})
    })

    let search_after = eres?.hits?.hits[eres?.hits?.hits?.length - 1]?.sort;
    let allDocsLen = eres.hits?.total?.value;
    console.log('AFTER_SEARCH: ', search_after);

    let quotes = [];
    eres?.hits?.hits?.forEach(doc => {
        if (doc._source?.quoted_status_id_str) {
            quotes.push(doc._source?.quoted_status_id_str);
        }
    })
    if (quotes.length > 0) {
        console.log('quotes: ', quotes);
        elastic.mget({
            index: process.env.TWEETS_INDEX,
            ids: quotes
        }).then(async qdocs => {
            let qd = {}; //qdocs.hits.hits;
            console.log('qdqdqdqdqdqd: ', qdocs)
            qdocs.docs.forEach(d => {
                qd[d._id] = d._source;
            })
            console.log('embeded quotes:: ', qdocs);
            eres.hits.hits.forEach(fdoc => {
                if (fdoc._source?.quoted_status_id_str) {
                    fdoc._source['quoted'] = qd[fdoc._source?.quoted_status_id_str];
                }
            })
            //convertArrayToObject(qdocs, '_id')
            console.log('getTimelien: ', eres);
            return next({ ...eres, search_after: search_after, total: allDocsLen });//, qqqs: qd});
        }).catch(err => {
            console.log('getTimelineproblem retrieving quotes: ', quotes);
            console.log(err);
        })
    }
    else {
        console.log('no quotes ');
        return next({ ...eres, search_after: search_after, total: allDocsLen })
    }
}

async function checkAndSaveImage(link){
    const url = new URL(link);
    let newlink = "http://localhost:3300" + url.pathname;
    let parts = url.pathname.split("/")
    let filename = "./media/" + parts[parts.length - 1];

    fs.stat(filename, function(exerr, stat){
        if (exerr == null) {
            console.log(`file exists: ${filename}`);
        }
        else if (exerr.code === 'ENOENT') {
            console.log(`going to dl: ${filename}`);
            console.log('from :', newlink);
            request(newlink).pipe(fs.createWriteStream(filename));
        }
        else{
            console.log(`Some other error for ${filename}: `, exerr.code);
        }
    });   
}

module.exports = {
    makeTimeline,
    checkAndSaveImage
}