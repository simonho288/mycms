/**
 * This is an ExpressJS server app to simulate Cloudflare Workers same as cfw-backend/index.js
 * 
 * ***** IMPORTANT *****
 * This is only for local development.
 * Everything here must be re-implemneted in Cloudflare Workers in cfw-backend/index.js **
 */

'use strict'

const assert = require('assert');
const Bundler = require('parcel-bundler');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser')
const url = require('url');
const zip = require('express-easy-zip');
const fileUpload = require('express-fileupload');
// const numeral = require('numeral');
const app = express();
const bodyParser = require('body-parser');
// const fetch = require('node-fetch');
const LocalStorage = require('node-localstorage').LocalStorage;
const MyCMS = require('./mycms.js');

require('dotenv').config(); // Read the .env settings into env variable

/**
 * In development, local Express server uses localStorage to simulate Cloudflare Workers KV as a database to store user JSON.
 */
const localStorage = new LocalStorage('./data');
const port = 3000; // Express Server port#

// Setup Express server tools/libs
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(zip());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
}));
app.use(cookieParser()); // need cookieParser middleware before we can do anything with cookies
// app.use(express.static('frontend/dist')); // This is the parcelJS output dir. See below parcelOptions
app.use(express.static('frontend/dist', {
  setHeaders: (res, path, stat) => {
    res.set('Set-Cookie', 'is_debug=1') // Tells frontend this is debug mode
  }
})); // This is the parcelJS output dir. See below parcelOptions

/**
 * Setup the MyCMS
 */
MyCMS.setEnv(process.env); // See the values in .env
MyCMS.setDebugMode(true);
if (process.env.SERVER_URL == null) throw 'Environment variable "SERVER_URL" not specified!';
MyCMS.setHost(process.env.SERVER_URL);
/**
 * Two Callback functions for MyCMS to load/save userJson. In the Express server, use localStorage as data store.
 */
MyCMS.setSaveUserJsonFn((email, data) => {
  assert(email);
  assert(typeof data === 'object');

  const key = `user:${email.toLowerCase()}`;
  localStorage.setItem(key, JSON.stringify(data));
});
MyCMS.setLoadUserJsonFn((email) => {
  assert(email);

  const key = `user:${email.toLowerCase()}`;
  let data = localStorage.getItem(key);
  return JSON.parse(data);
});

///////////////////////////// Express Routers /////////////////////////////

// Tells frontend this is debug server mode
app.use((req, res, next) => {
  res.cookie('is_debug', '1');
  next();
});

app.get('/', (req, res) => {
  res.send(reg_form.toHTML());
});

app.get('/api/get-user-json/:email', async (req, res) => {
  let params = req.params;
  let json = await MyCMS.getUserJson(params);

  // Return the result to the client
  res.set({ 'content-type': 'application/json' });
  res.json(json);
});

app.post('/api/gen-static-website', async (req, res) => {
  /*
  let zipfile = await MyCMS.genStaticWebsite(req.params);

  // Return the result to the client
  res.set({ 'content-type': 'application/zip' });
  res.sendFile(zipfile);
  */
  // res.set({ 'content-type': 'text/html' });
  // res.send(await MyCMS.genStaticWebsite(req, res));
  // res.end();
  await MyCMS.genStaticWebsite(req, res);
});

app.put('/api/put-user-json', async (req, res) => {
  let params = req.body;
  await MyCMS.putUserJson(params);

  res.set({ 'content-type': 'application/json' });
  res.json({
    result: 'ok'
  });
});

/**
 * The example is mentioned in frontend/test-paypal-order.html
 * Ref: https://developer.paypal.com/docs/api/orders/v2/
 */
app.post('/api/paypal-checkout', async (req, res) => {
  let data = req.body;
  let redirectUrl = await MyCMS.paypalCheckout(data);
  res.json({
    paypal_url: redirectUrl
  })
  res.end();
});

/**
 * Called by Paypal to handle payment success. It will redirect to the user's URL
 * Notes: Paypal pass the parameters by query string (QS)
 */
app.get('/api/paypal-payment-success', async (req, res) => {
  let params = req.query;

  let redirectUrl = await MyCMS.paypalReturnSuccess(params);
  res.redirect(301, redirectUrl);
});

/**
 * Called by Paypal to handle payment cancel. It will redirect to the user's URL
 * Notes: Paypal pass the parameters by query string (QS)
 */
app.get('/api/paypal-payment-cancel', async (req, res) => {
  let params = req.query;

  let redirectUrl = await MyCMS.paypalReturnCancel(params);
  res.redirect(301, redirectUrl);
});

app.post('/google_login', async (req, res) => {
  let authUri = await MyCMS.googleLoginUrl();
  res.redirect(authUri);
});

app.post('/facebook_login', async (req, res) => {
  let authUri = await MyCMS.facebookLoginUrl();
  res.redirect(authUri);
});

app.get('/auth/google/callback', async (req, res) => {
  let params = req.query;
  let redirectUrl = await MyCMS.googleOauth2(params);
  res.redirect(301, redirectUrl);
});

app.get('/auth/facebook/callback', async (req, res) => {
  let params = req.query;
  let redirectUrl = await MyCMS.facebookOauth2(params);
  res.redirect(301, redirectUrl);
});

/**
 * Uses ParcelJS to build the frontend codes
 * Ref: https://en.parceljs.org/api.html
 */
if (process.env.NODE_ENV === 'development') {
  const indexFile = 'frontend/*.html';
  const parcelOptions = {
    outDir: './frontend/dist',
    hmr: false
  };
  const bundler = new Bundler(indexFile, parcelOptions);
  app.use(bundler.middleware());
}
app.listen(port, () => console.log(`Development server app listening origin: ${process.env.SERVER_URL} port:${port}`));
