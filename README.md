## Preface

MyCMS is an open source free CMS for shoppers to input the products and provide payment callback (supports Paypal currently) to receive money. 

## Architecture

![Test image](https://alslab-cms-ojs2.s3-ap-southeast-1.amazonaws.com/1474511893630_SN001.JPG)

## Installation

```sh
$ cd my-cms
$ npm install
```

## Development

Develop using VSCode SSH-remote development.

### Start the dev server

Connect to remote server via VSCocde SSH-remote. Then start the VSCode debugger, or run this command:

```sh
$ npm start
```

Then browse to: https://dev.simonho.net

## Cloudflare Workers Commands

Create KV store:

```sh
$ wrangler kv:namespace create "DB"
```

Start development Site:

```sh
$ wrangler preview --watch
```

Live Deployment:

```sh
$ wrangler publish
```
