# Preface

MyCMS is an open source free CMS for shoppers to input the products and provide payment callback (supports Paypal currently) to receive money.

---

## Live Server

A live server running in Cloudflare Workers. Free to use:

https://mycms.simonho.net

---

## Development

### Introduction

If you are software developer, you can download the codes and deploy the MyCMS on your own server. Steps:

1. Clone and this repo.
2. Follow below installation and local debugging section.
3. Modify the codes.
4. Deploy to Cloudflare Workers with your own account.

### Architecture

Codesets Diagram:

![Codesets diagram](https://simon-temp-sharing.s3-ap-southeast-1.amazonaws.com/share/mycms_architecture_diagram.jpg)

### Installation

```sh
$ cd mycms
$ npm install
```

### Configuration

Since mycms supports Facebook or Google login only (email/password authenication is not supported), you'll need to enter the Facebook and Google App ID and secret in `.env` file in project root directory. The `.env` contents should be:

```ini
SERVER_URL=http://localhost:3000
GOOGLE_APP_CLIENT_ID=[Your_Google_App_Client_ID]
GOOGLE_APP_CLIENT_SECRET=[Your_Google_App_Secret]
FACEBOOK_APP_CLIENT_ID=[Your_Facebook_App_Client_ID]
FACEBOOK_APP_CLIENT_SECRET=[Your_Facebook_App_Client_Secret]
```

### Local debugging

Connect to remote server via VSCocde SSH-remote. Then start the VSCode debugger, or run this command:

```sh
$ npm start
```

Then browse to: http://localhost:3000

### Local development vs Live deployment

This is important to remember that the live server is running on [Cloudflare Workers](https://developers.cloudflare.com/workers/) platform. The database server is [Cloudflare Workers KV](https://developers.cloudflare.com/workers/reference/storage). However, the local development server is running NodeJS (with ExpressJS) for easily development. And there is using [node-localstorage](https://www.npmjs.com/package/node-localstorage) to similar Cloudflare Workers KV.

---

### Deployment

Follow below steps to deploy to Cloudflare Workers:

1. Signup a [Cloudflare Workers](https://workers.cloudflare.com/) account with **Unlimited** Plan
2. Install [wrangler](https://github.com/cloudflare/wrangler)
3. Signup a Google developer account and/or a Facebook developer account (either or both, because mycms support Google/Facebook login only)
4. Obtain an client ID and client secret from the [Google Developer Console](https://developers.google.com/adwords/api/docs/guides/authentication). And/or [Facebook Developer Console](https://developers.facebook.com/docs/apps/).
5. Obtain Cloudflare Workers account ID and zone ID. Enter those values in `wrangler.toml`.
6. Create a Cloudflare Workers KV database. Type command: `wrangler kv:namespace create "DB"`. Enter the id in `wrangler.toml` section `kv-namespaces`.

## Cloudflare Workers Commands

Cloudflare Workers preview for debugging:

```sh
$ wrangler preview --watch
```

Cloudflare Workers live deployment:

```sh
$ wrangler publish
```
