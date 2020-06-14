/**
 * MyCMS - Main server App to handle all mycms tasks
 */

const assert = require('assert');
const { v4: uuidv4 } = require('uuid');
const numeral = require('numeral');
const fetch = require('node-fetch');
const extract = require('extract-zip');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const zip = require('express-easy-zip');

const Keys = {
  Google: {
    scope: 'https://www.googleapis.com/auth/userinfo.email+https://www.googleapis.com/auth/userinfo.profile',
    redirect_path: '/auth/google/callback'
  },
  Facebook: {
    scope: 'public_profile,email',
    redirect_path: '/auth/facebook/callback'
  }
};

/**
 * Common APIs for server.js & index.js
 */
let MyCMS = {
  // Local Express needs that
  setDebugMode(isDebug) {
    assert(isDebug != null);
    this._isDebug = isDebug;
  },

  determinePayPalUrl(mode) {
    assert(mode);
    return (mode == 'sandbox') ? 'https://api.sandbox.paypal.com' : 'https://api.paypal.com';
  },

  setHost(host) {
    assert(host);
    this._host = host;
  },

  setSaveUserJsonFn(fn) {
    assert(fn);
    this._putUserJsonFn = fn;
  },

  setLoadUserJsonFn(fn) {
    assert(fn);
    this._getUserJsonFn = fn;
  },

  setEnv(json) {
    assert(json);
    this._env = json;
  },

  /////////////////////////////////////////////////////////////////////////////
  // Server common handlers
  /////////////////////////////////////////////////////////////////////////////

  async getUserJson(params) {
    if (params.email == null) throw new Error('Missing user email!');
    let email = params.email.toLowerCase().trim();
    return await this._getUserJsonFn(email);
  },

  async putUserJson(params) {
    if (params.email == null) throw new Error('Missing user email!');
    let email = params.email.toLowerCase().trim();
    return await this._putUserJsonFn(email, params);
  },

  async paypalCheckout(params) {
    // console.log(data);
    // Email is the key of KV store
    if (params.user == null) throw new Error('Data must includes email!');
    if (params.orderId == null) throw new Error('Data must includes orderId!');
    if (params.date == null) throw new Error('Data must includes date!');
    if (params.customer == null) throw new Error('Data must includes customer!');
    if (params.shipping == null) throw new Error('Data must includes shipping json!');
    if (params.items == null) throw new Error('Data must includes items json!');
    if (params.customer.name == null) throw new Error('Data must includes customer name!');
    if (params.customer.email == null) throw new Error('Data must includes customer email!');

    let userJson = await this._getUserJsonFn(params.user);
    if (userJson == null) throw new Error('User not found in db!');

    if (userJson.orders.find(o => o.id == params.orderId) != null) { // Is order exists?
      throw new Error('Order already exists!');
    }
    const currency = userJson.settings.currency;

    // Calculate the order amount
    let amount = 0, totalTax = 0;
    for (let i = 0; i < params.items.length; ++i) {
      let item = params.items[i];
      amount += item.quantity * item.unitPrice;
      totalTax += item.quantity * item.tax;
    }

    // Construct a request object and set desired parameters
    // Here, OrdersCreateRequest() creates a POST request to /v2/checkout/orders
    // Ref: https://github.com/paypal/Checkout-NodeJS-SDK/blob/master/samples/CaptureIntentExamples/createOrder.js
    const paypalUrl = this.determinePayPalUrl(userJson.settings.paypal.mode);
    let paymentJson = {
      intent: 'CAPTURE',
      application_context: {
        return_url: `${this._host}/api/paypal-payment-success?user=${params.user}&order=${params.orderId}`,
        cancel_url: `${this._host}/api/paypal-payment-cancel?user=${params.user}&order=${params.orderId}`,
        brand_name: userJson.settings.storeName,
        locale: userJson.settings.locale,
        landing_page: 'BILLING',
        shipping_preference: 'SET_PROVIDED_ADDRESS',
        user_action: 'CONTINUE'
      },
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: numeral(amount + totalTax).format('0[.]00'),
          breakdown: {
            item_total: {
              currency_code: currency,
              value: numeral(amount).format('0[.]00')
            },
            shipping: {
              currency_code: currency,
              value: '0'
            },
            handling: {
              currency_code: currency,
              value: numeral(userJson.settings.handlingFee).format('0[.]00')
            },
            tax_total: {
              currency_code: currency,
              value: numeral(totalTax).format('0[.]00')
            },
            shipping_discount: {
              currency_code: currency,
              value: '0'
            }
          }
        },
        items: [],
        shipping: {
          method: userJson.settings.shippingProvider,
          name: {
            full_name: params.customer.name
          },
          address: {
            address_line_1: params.shipping.address1,
            address_line_2: params.shipping.address2,
            admin_area_2: params.shipping.city,
            admin_area_1: params.shipping.province,
            postal_code: params.shipping.postal_code,
            country_code: params.shipping.country
          }
        }
      }]
    };
    for (let i = 0; i < params.items.length; ++i) { // Assign the order items for Paypal
      let item = params.items[i];
      paymentJson.purchase_units[0].items.push({
        name: item.name,
        // description: "Green XL",
        sku: item.productId,
        unit_amount: {
          currency_code: currency,
          value: numeral(item.unitPrice).format('0[.]00')
        },
        tax: {
          currency_code: currency,
          value: numeral(item.tax).format('0[.]00'),
        },
        quantity: item.quantity.toString(),
        category: 'PHYSICAL_GOODS'
      });
    }

    // Get Paypal Access Token. Ref: https://developer.paypal.com/docs/api/get-an-access-token-curl/
    const clientId = userJson.settings.paypal.clientID;
    const clientSecret = userJson.settings.paypal.clientSecret;
    let ppUserBase64 = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    let ppRes = await fetch(paypalUrl + '/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'x-www-form-urlencoded',
        'Authorization': `Basic ${ppUserBase64}`
      },
      body: 'grant_type=client_credentials'
    });
    ppRes = await ppRes.json();
    if (this._isDebug) {
      console.log(`ppRes from ${paypalUrl}/v1/oauth2/token:`);
      console.log(ppRes);
    }
    let accessToken = ppRes.access_token;
    if (accessToken == null) throw new Error(ppRes.error_description);

    // Create order
    ppRes = await fetch(paypalUrl + '/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(paymentJson)
    });
    ppRes = await ppRes.json();
    if (this._isDebug) {
      console.log(`ppRes from ${paypalUrl}/v2/checkout/orders:`);
      console.log(ppRes);
    }
    if (ppRes.error_description) throw new Error(ppRes.error_description);

    // Return the URL to frontend
    let redirectUrl;
    ppRes.links.forEach(link => {
      if (link.rel === 'approve') {
        redirectUrl = link.href;
      }
    });
    if (redirectUrl) {
      // Store the order to the KV
      // userJson.orders = []; // DEBUG: clear all previous orders
      userJson.orders.push({
        orderId: params.orderId,
        date: new Date().toISOString(),
        customer: params.customer,
        payment_status: 'pending', // Initial status is 'pending'
        items: params.items,
        amount: amount,
        paypal_order_id: ppRes.id
      });

      // Save the userJson to db
      await this._putUserJsonFn(params.user, userJson);

      return redirectUrl;
    } else {
      throw ppRes;
    }
  }, // paypalCheckout()

  async paypalReturnSuccess(params) {
    console.log('paypalReturnSuccess()');
    // console.log(params);

    // User is the key of KV store
    if (params.user == null) throw new Error('QS must includes user!');
    if (params.order == null) throw new Error('QS must includes order!');
    if (params.token == null) throw new Error('QS must includes token!');
    if (params.PayerID == null) throw new Error('QS must includes PayerID!');

    // Retrieve the user record
    let userJson = await this._getUserJsonFn(params.user);
    if (userJson == null) throw new Error('User not found in db!');

    // return new Response(JSON.stringify(userJson), {
    //   headers: {
    //     'content-type': 'application/json'
    //   }
    // });

    let cmsOrder = userJson.orders.find(rec => rec.orderId == params.order);
    if (cmsOrder == null) throw new Error('Order not found in our system!');

    // Variables for Paypal API
    const clientId = userJson.settings.paypal.clientID;
    const clientSecret = userJson.settings.paypal.clientSecret;
    const paypalUrl = this.determinePayPalUrl(userJson.settings.paypal.mode);

    // Capture the order: https://developer.paypal.com/docs/api/orders/v2/#orders_capture
    const ppUserBase64 = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    ppRes = await fetch(`${paypalUrl}/v2/checkout/orders/${cmsOrder.paypal_order_id}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ppUserBase64}`,
        'Prefer': 'return=representation' // Obtain the transaction ID
      },
    });
    ppRes = await ppRes.json();
    if (this._isDebug) {
      console.log(`ppRes from ${paypalUrl}/v2/checkout/orders/.../capture:`);
      console.log(ppRes);
    }
    if (ppRes.error_description) throw new Error(ppRes.error_description);

    // Update the mycms order status
    cmsOrder.payment_status = 'success';
    // Paypal Transaction Id
    if (ppRes.purchase_units && ppRes.purchase_units instanceof Array) {
      if (ppRes.purchase_units[0] && ppRes.purchase_units[0].payments && ppRes.purchase_units[0].payments.captures) {
        if (ppRes.purchase_units[0].payments.captures instanceof Array && ppRes.purchase_units[0].payments.captures[0]) {
          if (ppRes.purchase_units[0].payments.captures[0] && ppRes.purchase_units[0].payments.captures[0].id) {
            cmsOrder.paypal_txn_id = ppRes.purchase_units[0].payments.captures[0].id;
          }
        }
      }
    }

    // userJson.orders = []; // DEBUG: CLEAR ALL PRIOR ORDERS
    userJson.orders.push(cmsOrder);

    // Save the userJson to db
    await this._putUserJsonFn(params.user, userJson);

    let url;
    if (userJson.settings.siteUrl && userJson.settings.paypal.orderSuccessPage) {
      url = userJson.settings.siteUrl;
      if (userJson.settings.paypal.orderSuccessPage[0] != '/') url += '/';
      url += userJson.settings.paypal.orderSuccessPage;
    } else {
      url = '/empty-url.html?url-type=order-success';
    }
    return url;
  }, // paypalReturnSuccess()

  async paypalReturnCancel(params) {
    console.log('paypalReturnCancel()');

    // console.log(data);
    // User is the key of KV store
    if (params.user == null) throw new Error('QS must includes user!');
    if (params.order == null) throw new Error('QS must includes order!');
    if (params.token == null) throw new Error('QS must includes token!');

    // Retrieve the user record
    let userJson = await this._getUserJsonFn(params.user);

    // Update the order status
    let order = userJson.orders.find(o => o.orderId === params.order);
    if (order == null) {
      throw new Error('Order not found!');
    }
    order.payment_status = 'cancelled';
    await this._putUserJsonFn(params.user, userJson);

    // Construct the redirect Url
    let url;
    if (userJson.settings.siteUrl && userJson.settings.paypal.orderCancelPage) {
      url = userJson.settings.siteUrl;
      if (userJson.settings.paypal.orderCancelPage[0] != '/') {
        url += '/';
      }
      url += userJson.settings.paypal.orderCancelPage;
    } else {
      url = '/empty-url.html?url-type=order-cancel';
    }
    return url;
  }, // paypalReturnCancel()

  async googleLoginUrl() {
    assert(this._env.GOOGLE_APP_CLIENT_ID); // If not found, check the .env file of this setting
    const scope = encodeURI(Keys.Google.scope);
    let redirectUri = encodeURI(this._host + Keys.Google.redirect_path);
    let authUri = `https://accounts.google.com/o/oauth2/v2/auth?scope=${scope}&access_type=offline&include_granted_scopes=true&state=state_parameter_passthrough_value&redirect_uri=${redirectUri}&response_type=code&client_id=${this._env.GOOGLE_APP_CLIENT_ID}&prompt=consent`;

    return authUri;
  },

  async facebookLoginUrl() {
    assert(this._env.FACEBOOK_APP_CLIENT_ID); // If not found, check the .env file of this setting
    const scope = Keys.Facebook.scope;
    let redirectUri = encodeURI(this._host + Keys.Facebook.redirect_path);
    let authUri = `https://www.facebook.com/v5.0/dialog/oauth?client_id=${this._env.FACEBOOK_APP_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
  
    return authUri;
  },

  // When loggin-in, it creates a new user reocrd if not found in database. If found, returns it.
  async createOrLoginUser(email) {
    if (email == null) throw new Error('User email is required!')

    let value = await this._getUserJsonFn(email);
    if (value == null) {
      // Create a new user record
      value = {
        id: uuidv4().replace(/-/g, ''),
        email: email,
        created: new Date(),
        products: [],
        pages: [],
        orders: [],
        settings: {}
      }
      await this._putUserJsonFn(email, value);
    }

    return email;
  }, // createOrLoginUser()

  async googleOauth2(params) {
    console.log('handleGoogleOauth2cb()')
    assert(this._env.GOOGLE_APP_CLIENT_ID); // If not found, check the .env file of this setting
    assert(this._env.GOOGLE_APP_CLIENT_SECRET); // If not found, check the .env file of this setting
  
    // let url = new URL(request.url)
    // let code = url.searchParams.get('code')
    let code = params.code;
    if (code == null) {
      return '/';
    }
  
    // console.log('code:', code);
    // console.log('url', url.host)
    const data = {
      'code': code,
      'client_id': this._env.GOOGLE_APP_CLIENT_ID,
      'client_secret': this._env.GOOGLE_APP_CLIENT_SECRET,
      'redirect_uri': this._host + Keys.Google.redirect_path,
      'grant_type': 'authorization_code'
    };
    let result = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    result = await result.json();
    console.log(result);
  
    let accessToken = result.access_token;
    if (accessToken == null) {
      return '/error.html';
    }
  
    result = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`);
  
    // req.session.user_id = await createNewUser()
    // req.session.access_token = accessToken
  
    result = await result.json();
    console.log(result);
    let userId = await this.createOrLoginUser(result.email);
  
    // Redirect with cookie in ExpressJS
    let redirectUri = `/login-redirect.html?uid=${userId}`;
    return redirectUri;
  }, // googleOauth2()

  async facebookOauth2(params) {
    console.log('facebookOauth2()')
    assert(this._env.FACEBOOK_APP_CLIENT_ID); // If not found, check the .env file of this setting
    assert(this._env.FACEBOOK_APP_CLIENT_SECRET); // If not found, check the .env file of this setting
  
    // let url = new URL(request.url)
    // let code = url.searchParams.get('code')
    // let params = request.query;
    let code = params.code;
  
    // Back to login if user denied to login
    if (code == null) {
      return '/';
    }
  
    // console.log('code:', code);
  
    let redirect_uri = this._host + Keys.Facebook.redirect_path;
    let result = await fetch(`https://graph.facebook.com/v5.0/oauth/access_token?client_id=${this._env.FACEBOOK_APP_CLIENT_ID}&redirect_uri=${redirect_uri}&client_secret=${this._env.FACEBOOK_APP_CLIENT_SECRET}&code=${code}`);
    result = await result.json();
  
    let accessToken = result.access_token;
    if (accessToken == null) {
      return '/error.html';
    }
  
    const fields = 'name,email,picture.type(large)';
    result = await fetch(`https://graph.facebook.com/me?fields=${fields}&access_token=${accessToken}`);
    result = await result.json();
  
    let userId = await createOrLoginUser(result.email);
  
    // Redirect with cookie in ExpressJS
    let redirectUri = `/login-redirect.html?uid=${userId}`;
    return redirectUri;
  }, // facebookOauth2()

  async genStaticWebsite(req, res) {
    let user = req.body.user.toLowerCase().trim();
    if (user == null) throw 'No user specified!';

    const ejsOpts = {};
    const srcRootDir = 'theme_sample_backup'; // temporary use for development
    const dstRootDir = 'temp';
    // const tempDir = 'temp';
    let userJson = await this._getUserJsonFn(user);
    let outFilePath;
    let rendered;
    let outputFileNames = [];

    let srcPath = `${__dirname}/${srcRootDir}/${user}`;
    if (!fs.existsSync(srcPath)) {
      fs.mkdirSync(srcPath);
    } else {
      // Remove all files before processing
      let files = fs.readdirSync(srcPath);
      for (let i = 0; i < files.length; ++i) {
        fs.unlinkSync(path.join(srcPath, files[i]));
      }
    }
    // Save the uploaded theme.zip to user directory & unzip it
    const themePath = `${srcPath}/theme.zip`;
    await req.files.theme.mv(themePath);
    await extract(themePath, { dir: srcPath });

    // Check the required files existenace
    const indexFilePath = `${srcPath}/index.ejs`;
    if (!fs.existsSync(indexFilePath)) {
      throw 'index.ejs not exists!'
    }
    const productFilePath = `${srcPath}/product.ejs`;
    if (!fs.existsSync(productFilePath)) {
      throw 'product.ejs not exists!'
    }
    const checkoutFilePath = `${srcPath}/checkout.ejs`;
    if (!fs.existsSync(checkoutFilePath)) {
      throw 'checkout.ejs not exists!'
    }
    const orderSuccessFilePath = `${srcPath}/order-success.ejs`;
    if (!fs.existsSync(orderSuccessFilePath)) {
      throw 'order-success.ejs not exists!'
    }
    const orderCancelFilePath = `${srcPath}/order-cancel.ejs`;
    if (!fs.existsSync(orderCancelFilePath)) {
      throw 'order-cancel.ejs not exists!'
    }

    // Create the destination directory if not exists
    let dstPath = `${__dirname}/${dstRootDir}/${user}`;
    if (!fs.existsSync(dstPath)) {
      fs.mkdirSync(dstPath);
    }
    
    // Handle the index.ejs
    rendered = await ejs.renderFile(indexFilePath, userJson, ejsOpts);
    outFilePath = `${dstPath}/index.html`;
    fs.writeFileSync(outFilePath, rendered);
    outputFileNames.push(outFilePath); // Add to zip files list

    // Handle the product.ejs
    for (let i = 0; i < userJson.products.length; ++i) {
      let product = userJson.products[i];
      // Make an images array for ejs template from user JSON's image0..7
      let images = [];
      product.image0 != null ? images.push(product.image0) : null;
      product.image1 != null ? images.push(product.image1) : null;
      product.image2 != null ? images.push(product.image2) : null;
      product.image3 != null ? images.push(product.image3) : null;
      product.image4 != null ? images.push(product.image4) : null;
      product.image5 != null ? images.push(product.image5) : null;
      product.image6 != null ? images.push(product.image6) : null;
      product.image7 != null ? images.push(product.image7) : null;
      product.sellPrice = product.sellPrice != null ? product.sellPrice : product.regularPrice;
      product.images = images;
      let data = {
        product: product,
        settings: userJson.settings
      };
      rendered = await ejs.renderFile(productFilePath, data, ejsOpts);
      outFilePath = `${dstPath}/${product.productId}.html`;
      fs.writeFileSync(outFilePath, rendered);
      outputFileNames.push(outFilePath); // Add to zip files list
    }

    // Handle the checkout.ejs
    rendered = await ejs.renderFile(checkoutFilePath, userJson, ejsOpts);
    outFilePath = `${dstPath}/checkout.html`;
    fs.writeFileSync(outFilePath, rendered);
    outputFileNames.push(outFilePath); // Add to zip files list

    // Handle the order-success.ejs
    rendered = await ejs.renderFile(orderSuccessFilePath, userJson, ejsOpts);
    outFilePath = `${dstPath}/order-success.html`;
    fs.writeFileSync(outFilePath, rendered);
    outputFileNames.push(outFilePath); // Add to zip files list

    // Hanlde the order-cancel.ejs
    rendered = await ejs.renderFile(orderCancelFilePath, userJson, ejsOpts);
    outFilePath = `${dstPath}/order-cancel.html`;
    fs.writeFileSync(outFilePath, rendered);
    outputFileNames.push(outFilePath); // Add to zip files list

    // Generate the ZIP and download response
    let zipOpts = {
      files: outputFileNames.map(f => {
        return {
          path: f,
          name: path.basename(f)
        }
      }),
      filename: 'static_website.zip'
    };
    res.zip(zipOpts).then(() => {
      debugger;
      // Remove all files after processing
      let files = fs.readdirSync(dstPath);
      for (let i = 0; i < files.length; ++i) {
        fs.unlinkSync(path.join(dstPath, files[i]));
      }
    });
  }, // genStaticWebsite()

} // MyCMS

module.exports = MyCMS;
