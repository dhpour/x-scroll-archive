# XCROLL

Archive all your scrolls on X.

## Description

It captures all recieved X's posts/tweets and stores them in `elasticsearch`.

## How to run

You need to run the `x-browser.js` script in [`Tampermonkey`](https://www.tampermonkey.net/) on Chrome or FireFox browsers.

For the server side:

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

Run the server:
```
node server.js
```

## Configuration
For archiving only specific languages add them to `LANG` variable in `.env` file. for archiving all posts do not add `LANG` variable to your `.env` file:

```
LANG=fa,und,ar
```
