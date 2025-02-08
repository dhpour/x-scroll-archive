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
To archive only specific languages, add them to `LANG` variable in `.env` file. To archive all posts, do not add `LANG` variable in your `.env` file:

```
LANG=fa,und,ar
```
For translated posts, their language should be consistent with the ones you set in the `.env` file, otherwise they will not be recorded. If you do not set `LANG` variable, translated posts to any language will be stored.

To change the `translate to language` option, go to X's web client settings and set your default language to enable translation of posts into it.