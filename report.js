//var cors            = require('cors'),
var http           = require('http'),
    express         = require('express'),
    //errorhandler    = require('errorhandler'),
    //dotenv          = require('dotenv'),
    bodyParser      = require('body-parser'),
    fs              = require('fs');

const { Client } = require('@elastic/elasticsearch');
const logger = require('./Logger');
require('dotenv').config();

//const ANNOTATION_INDEX = 'xannsample';
//const TWEETS_INDEX = "newsarchive_gql";

var app = express();

const elastic = new Client({
    node: 'http://localhost:9200',
    tls: {
        rejectUnauthorized: false
    }
});

async function getAnnsSummary(range){

    //GET /xannsample/_search
    let query = {
    aggs: {
        criticalAnsSum: {
        sum: {
            script: {
            lang: "painless",
            source: "doc['critical.a.keyword'].size()"
            }
        }
        },
        criticalQuesSum: {
        sum: {
            script: {
            lang: "painless",
            source: "doc['critical.q.keyword'].size()"
            }
        }
        },
        implicitAnsSum: {
        sum: {
            script: {
            lang: "painless",
            source: "doc['implicit.i.keyword'].size()"
            }
        }
        },
        implicitQuesSum: {
        sum: {
            script: {
            lang: "painless",
            source: "doc['implicit.q.keyword'].size()"
            }
        }
        },
        notincontextAnsSum: {
        sum: {
            script: {
            lang: "painless",
            source: "doc['notincontext.a.keyword'].size()"
            }
        }
        },
        notincontextQuesSum: {
        sum: {
            script: {
            lang: "painless",
            source: "doc['notincontext.a.keyword'].size()"
            }
        }
        },
        topicsSum: {
        sum: {
            script: {
            lang: "painless",
            source: "doc['topics.value.keyword'].size()"
            }
        }
        },
        tagsSum: {
        sum: {
            script: {
            lang: "painless",
            source: "doc['tags.value.keyword'].size()"
            }
        }
        },
        keywordsAnsSum: {
        sum: {
            script: {
            lang: "painless",
            source: "doc['keywords.value.keyword'].size()"
            }
        }
        },
        nerSum: {
        sum: {
            script: {
            lang: "painless",
            source: "doc['ner.value.keyword'].size()"
            }
        }
        },
        toxicSum: {
        sum: {
            script: {
            lang: "painless",
            source: "!doc['toxicity.nsfw'].empty"
            }
        }
        },
        claims_critical: {
            filter: {
                term: {
                    "critical.claim": true
                }
            }
        },
        claims_implicit: {
            filter: {
                term: {
                    "implicit.claim": true
                }
            }
        },
        claims_notincontext: {
            filter: {
                term: {
                    "notincontext.claim": true
                }
            }
        },
        implicit_type: {
            terms: {
              field: "implicit.type"
            }
        }
    },
    size: 0
    };

    if(!!range){
        query['query'] = {
                range: {
                    add_date: range
            }
        }
    }
    //console.log('query: ', query);

    const res = await elastic.search({
        index: process.env.ANNOTATION_INDEX,
        body: query
    }).catch(err => {
        console.log('error:', err)
        return {}
    })
    return res
}

module.exports = {
    getAnnsSummary
};