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

### Local debugging

Connect to remote server via VSCocde SSH-remote. Then start the VSCode debugger, or run this command:

```sh
$ npm start
```

Then browse to: https://dev.simonho.net

### Deployment

Follow below steps to deploy to Cloudflare Workers:

1. Signup a [Cloudflare Workers](https://www.cloudflare.com/) account
2. Install [wrangler](https://github.com/cloudflare/wrangler)
3. Signup a Google developer account and/or a Facebook developer account (either or both, because mycms support Google/Facebook login only)
4. Obtain an client ID and client secret from the [Google Developer Console](https://developers.google.com/adwords/api/docs/guides/authentication). And/or [Facebook Developer Console](https://developers.facebook.com/docs/apps/).
5. Obtain Cloudflare Workers account ID and zone ID. Enter those values in `wrangler.toml`.
6. Create a Cloudflare Workers KV database. Type command: `wrangler kv:namespace create "DB"`. Enter the id in `wrangler.toml` section `kv-namespaces`.

## Deploy to Cloudflare Workers

Cloudflare Workers preview:

```sh
$ wrangler preview --watch
```

Cloudflare Workers production:

```sh
$ wrangler publish
```
