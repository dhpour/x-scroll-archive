// ==UserScript==
// @name         X Scavenger
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Intercepts HTTP responses and logs them for parsing
// @author       You
// @match        https://*.x.com/*
// @match        https://*.twitter.com/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @connect      localhost
// @connect      127.0.0.1:8050
// ==/UserScript==

function showNotif(icon, msg, bulk=false){
    let node = document.createElement("div");
    node.style.cssText = "bottom: 50px; right: 10px; position: fixed; background-color: #ddd; padding: 15px; border-radius: 10px;";

    node.innerHTML = '<p>' + String.fromCodePoint(icon) + msg + '</p>';
    if(bulk){
        node.innerHTML = '<p> ' + bulk[0].toString() + String.fromCodePoint(9989) + " created!" + '</p>';
        node.innerHTML += '<p> ' + bulk[1].toString() + String.fromCodePoint(9989) + " updated!" + '</p>';
        node.innerHTML += '<p> ' + bulk[2].toString() + String.fromCodePoint(9989) + " duplicate!" + '</p>';
        node.innerHTML += '<p> ' + bulk[3].toString() + String.fromCodePoint(10062) + " error!" + '</p>';
    }
    document.body.appendChild(node);
    setTimeout(function(){
        document.body.removeChild(node);
    },bulk?2500:2000)
}
function submitTweet(data, type){
    GM_xmlhttpRequest({
        method: "POST",
        url: type == 'translate' ? 'http://localhost:8050/translate' : 'http://localhost:8050/bulk',
        data: JSON.stringify(data),
        headers: {
            'Content-Type': "application/json"
        },
        onload: function(response) {
            if([200, 201].includes(response.status)){
                let result = JSON.parse(response.responseText);
                console.log('result: ', result?.result?.length);
                if(typeof(result.result) === "string"){
                    if(result.result == "created"){
                        showNotif(9989, result.result);
                    }else if(result.result == "updated"){
                        showNotif(9989, result.result);
                    }else if(result.result == "noop"){
                        showNotif(9989, result.result);
                    }else if(result.result == 'nothing to add'){
                        console.log('nothing left to add');
                    }else{
                        showNotif(10062, 'not-added!');
                    }
                }
                else{
                    let created = 0;
                    let updated = 0;
                    let duplicate = 0;
                    let err = 0;
                    for(let i=0; i<result.result.length;i++){
                        if([200, 201].includes(result.result[i]?.create?.status)){
                           created += 1;
                        }
                        else if([200, 201].includes(result.result[i]?.update?.status)){
                           if(result.result[i]?.update?.result === "noop"){
                               duplicate += 1
                           }
                           else{
                               updated += 1;
                           }
                        }
                        else if(result.result[i]['create']?.status === 409){
                           duplicate += 1;
                        }
                        else{
                            console.log('err: ', i, result.result[i])
                           err += 1;
                        }
                    }

                    showNotif(9989, "", [created, updated, duplicate, err]);
                    console.log('created: ', created);
                    console.log('updated: ', updated);
                    console.log('duplicate: ', duplicate);
                    console.log('err: ', err);
                }
            }
            else{
                showNotif(10060, response.statusText);
            }
        },
        onerror: function(err){
            console.log(err);
        }
    });

}

function getProperTimeline(timeline){
    let tl = timeline?.data;
    if(tl?.home){
        console.log("tl.home?.home_timeline_urt");
        return tl.home?.home_timeline_urt;
    }
    else if(tl?.threaded_conversation_with_injections_v2){
        console.log("tl?.threaded_conversation_with_injections_v2");
        return tl?.threaded_conversation_with_injections_v2
    }
    else if(tl?.bookmark_timeline_v2){
        console.log("tl.bookmark_timeline_v2?.timeline");
        return tl.bookmark_timeline_v2?.timeline
    }
    else if(tl?.user) {
        let res = tl.user?.result
        if(!!res){
            console.log("res?.timeline_v2?.timeline");
            return res?.timeline_v2?.timeline
        }
    }
    else if(tl?.communityResults){
        let res = tl.communityResults
        if(res?.result){
            console.log("res.result?.community_timeline?.timeline");
            return res.result?.community_timeline?.timeline
        }
    }
    else if(tl?.search_by_raw_query?.search_timeline){
        console.log('tl?.search_by_raw_query?.search_timeline');
        return tl?.search_by_raw_query?.search_timeline?.timeline
    }
    else{
        console.log('no timeline detected:');
        console.log(timeline);
    }
    return null
}

function ExtractTweets(instructions){
    let tweets = []
    let users = [];
    for(let addEntries of instructions){
        if(addEntries.type === "TimelineAddEntries"){
            let entries = addEntries.entries;
            for(let entry of entries){
                if(entry.content.entryType === "TimelineTimelineItem"){
                    if(entry.content.itemContent.itemType === "TimelineTweet"){
                        console.log('entry.content.itemContent.tweet_results.result?.__typename: ', entry.content.itemContent.tweet_results.result?.__typename);
                        if(entry.content.itemContent.tweet_results.result?.__typename != "TweetTombstone"){  //  added 30/06/2024 12:27pc
                            let user = {};
                            let tweet = {};
                            let res = ExtractSingleTweet(JSON.parse(JSON.stringify(entry.content.itemContent.tweet_results.result)))
                            tweet = res[0];
                            user = res[1];
                            if(tweet['lang'] === "fa" || true){
                                if(entry.content.itemContent.tweet_results.result?.quoted_status_result?.result){
                                    let quser = {};
                                    let qtweet = {};
                                    let res2 = ExtractSingleTweet(JSON.parse(JSON.stringify(entry.content.itemContent.tweet_results.result.quoted_status_result.result)))
                                    qtweet = res2[0];
                                    quser = res2[1];
                                    tweets.push(qtweet);
                                    if(!!quser){
                                        users.push(quser);
                                    }
                                }
                                tweets.push(tweet);
                                if(!!user){
                                    users.push(user);
                                }
                            }
                        }
                    }
                    else{
                        console.log('NoneTweet: ', entry.content.itemContent.itemType);
                    }
                }
                else if(entry.content.entryType === "TimelineTimelineModule") {
                    for(let item of entry.content.items){

                        if(item.item.itemContent.itemType === "TimelineTweet"){
                            console.log('item.item.itemContent.tweet_results.result?.__typename: ', item.item.itemContent.tweet_results.result?.__typename);
                            if(item.item.itemContent.tweet_results.result?.__typename != "TweetTombstone"){  //  added 30/06/2024 12:27pc
                            //if(item.item.itemContent.tweet_results.result?.__typename == "Tweet" || true){ //deleted 30/06/2024 12:27pc
                                //item.item.itemContent.tweet_results.result
                                let user = {};
                                let tweet = {};
                                let res = ExtractSingleTweet(JSON.parse(JSON.stringify(item.item.itemContent.tweet_results.result)))
                                tweet = res[0];
                                user = res[1];
                                if(tweet['lang'] === "fa" || true){
                                    if(item.item.itemContent.tweet_results.result?.quoted_status_result){
                                        let quser = {};
                                        let qtweet = {};
                                        let res2 = ExtractSingleTweet(JSON.parse(JSON.stringify(item.item.itemContent.tweet_results.result.quoted_status_result.result)))
                                        qtweet = res2[0];
                                        quser = res2[1];
                                        tweets.push(qtweet);
                                        if(!!quser){
                                            users.push(quser);
                                        }
                                    }

                                    tweets.push(tweet);
                                    if(!!user){
                                        users.push(user);
                                    }
                                }
                            }
                        }
                        else{
                            console.log('something Else');
                        }

                    }
                }
                else{
                    console.log('Unknown: ', entry);
                }
            }

        }
    }
    //console.log('tweets: ', tweets);
    console.log('tweets.length: ', tweets.length);

    console.log('users.length: ', users.length);
    return [tweets, users]
}

function ExtractSingleTweet(entry){

    let user = {};

    if(entry?.tweet){
        console.log('tweet instead of legacy is available!');
        entry = entry?.tweet;
    }

    if(entry?.core){
         user = JSON.parse(JSON.stringify(entry.core.user_results.result.legacy));
         user['user_id'] = entry.core.user_results.result.rest_id;
         delete entry.core;
    }

    let tweet = JSON.parse(JSON.stringify(entry.legacy))
    let cNote = {};
    if(entry?.birdwatch_pivot){
        cNote = JSON.parse(JSON.stringify(entry.birdwatch_pivot))
        delete cNote['callToAction'];
        delete cNote['footer'];
        delete cNote['shorttitle'];
        delete cNote['title'];
        delete cNote['visualStyle'];
        tweet['CommunityNote'] = cNote;
    }
    if(entry?.note_tweet?.is_expandable){//.note_tweet_results?.result?.text){
        tweet['full_text'] = entry?.note_tweet?.note_tweet_results?.result?.text;
    }
    tweet['user'] = {
        user_id_str: tweet['user_id_str'],
        screen_name: user.screen_name,
        name: user.name,
        profile_picture: user.profile_image_url_https
    }
    tweet["id"] = tweet["id_str"];
    delete tweet['user_id_str'];
    tweet['view_count'] = entry.views.count;

    //console.log(tweet);
    return [tweet, user]
}

(function() {
    'use strict';
    const _open = XMLHttpRequest.prototype.open;

    let focusedTweet = {};
    let pageStatusId = '';
    // Override the native open
    XMLHttpRequest.prototype.open = function() {
        // For every state change, log the request and its response
        this.addEventListener('readystatechange', function() {
            if(this.readyState === 4) { // The request is done
                let currentUrlsParts = window.location.href.split("/");
                if(currentUrlsParts.length === 6 && currentUrlsParts[currentUrlsParts.length - 2] === "status"){
                    pageStatusId = currentUrlsParts[currentUrlsParts.length - 1];
                }
                if(this.responseURL.startsWith("https://twitter.com/i/api/graphql") ||
                   this.responseURL.startsWith("https://x.com/i/api/graphql")){
                    let timeline = getProperTimeline(JSON.parse(this.responseText));
                    if(!!timeline){
                        console.log('Request URL:', this.responseURL);
                        //console.log(timeline);
                        let tweetsAndUsers = ExtractTweets(timeline?.instructions);
                        let tweets = tweetsAndUsers[0];
                        let users = tweetsAndUsers[1];
                        if(tweets.length > 0){
                            if(pageStatusId != '') {
                               for(let status of tweets){
                                   if(pageStatusId === status['id']){
                                       focusedTweet = JSON.parse(JSON.stringify(status));
                                       break
                                   }
                               }
                              }
                            submitTweet({bulk: tweets}, 'bulk');
                        }
                        else{
                            console.log('no tweets to send');
                        }
                    }
                }
                else if(this.responseURL.startsWith("https://twitter.com/i/api/1.1/strato/column/") ||
                        this.responseURL.startsWith("https://x.com/i/api/1.1/strato/column/")){
                    console.log('Translation url:', this.responseURL);
                    let raw = JSON.parse(this.responseText);

                    if(focusedTweet?.id == raw.id_str){
                        focusedTweet['original_text'] = focusedTweet['full_text'];
                        focusedTweet['original_lang'] = focusedTweet['lang'];

                        focusedTweet['full_text'] = raw.translation;
                        focusedTweet['lang'] = raw.destinationLanguage;
                        console.log('mainTweet: ', focusedTweet);
                        submitTweet({bulk: [focusedTweet]}, 'bulk');
                        //break;
                    }
                    else{
                        console.log('cannot find main tweet');
                    }
                    console.log('Translation:', JSON.parse(this.responseText));
                }
            }
        }, false);

        _open.apply(this, arguments);
    };

})();