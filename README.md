# XCROLL

Archive all your scrolls on X.

## Description

It catches all recieved X's posts/tweets and stores it in elasticsearch/opensearch.

## How to run

You need to run `x-browser.js` script in `tampermonkey` on Chrome or FireFox browsers.

For server-side:

```
npm install
``` 

Configure your `elasticsearch` path, port, index and server port in `.env` file:

```
TWEETS_INDEX=<TWEET_INDEX>
ELASTIC=<ELASTIC_PATH>
BACKPATH=<BACK_PATH>
BACKPORT=<BACK_PORT>
```

Run server:
```
node server.js
```
