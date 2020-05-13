const assert = require('assert');
const { v4: uuidv4 } = require('uuid');
const numeral = require('numeral');
const fetch = require('node-fetch');

require('dotenv').config(); // Read the .env settings into env variable

const Keys = {
  Google: {
    client_id: '[Your_GoogleApp_ClientID]',
    client_secret: '[Your_GoogleApp_ClientSecret]',
    scope: 'https://www.googleapis.com/auth/userinfo.email+https://www.googleapis.com/auth/userinfo.profile',
    redirect_path: '/auth/google/callback'
  },
  Facebook: {
    client_id: '[Your_FacebookApp_ClientID]',
    client_secret: '[Your_FacebookApp_ClientSecret]',
    scope: 'public_profile,email',
    redirect_path: '/auth/facebook/callback'
  }
};

/**
 * Common APIs for server.js & index.js
 */
let SharedFuncs = {
  // Local Express needs that
  setDebugMode(isDebug) {
    this._isDebug = isDebug;
  },

  determinePayPalUrl(mode) {
    return (mode == 'sandbox') ? 'https://api.sandbox.paypal.com' : 'https://api.paypal.com';
  },

  setHost(host) {
    this._host = host;
  },

  setSaveUserJsonFn(fn) {
    this._putUserJsonFn = fn;
  },

  setLoadUserJsonFn(fn) {
    this._getUserJsonFn = fn;
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

    let userJson = await this._getUserJsonFn(params.user);
    if (userJson == null) throw new Error('User not found in db!');

    if (userJson.orders.find(o => o.id == params.orderId) != null) { // Is order exists?
      throw new Error('Order already exists!');
    }
    const currency = userJson.settings.paypalCurrency;

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
            full_name: params.customer
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
    const clientId = userJson.settings.paypalClientID;
    const clientSecret = userJson.settings.paypalClientSecret;
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

    // Store the order to the KV
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
    this._putUserJsonFn(params.user, userJson);

    // Return the URL to frontend
    let redirectUrl;
    ppRes.links.forEach(link => {
      if (link.rel === 'approve') {
        redirectUrl = link.href;
      }
    });
    if (redirectUrl) {
      return redirectUrl;
    } else {
      throw new Error('Cannot find redirect url from paypal payment result!');
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

    let cmsOrder = userJson.orders.find(rec => rec.orderId == params.order);
    if (cmsOrder == null) throw new Error('Order not found in our system!');

    // Variables for Paypal API
    const clientId = userJson.settings.paypalClientID;
    const clientSecret = userJson.settings.paypalClientSecret;
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

    // CLEAR ALL PRIOR ORDERS
    userJson.orders = [ cmsOrder ];

    // Save the userJson to db
    this._putUserJsonFn(params.user, userJson);

    let url;
    if (userJson.settings.siteUrl && userJson.settings.orderSuccessPage) {
      url = userJson.settings.siteUrl;
      if (userJson.settings.orderSuccessPage[0] != '/') url += '/';
      url += userJson.settings.orderSuccessPage;
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
    await this._putUserJsonFun(params.user, userJson);

    // Construct the redirect Url
    let url;
    if (userJson.settings.siteUrl && userJson.settings.orderCancelPage) {
      url = userJson.settings.siteUrl;
      if (userJson.settings.orderCancelPage[0] != '/') {
        url += '/';
      }
      url += userJson.settings.orderCancelPage;
    } else {
      url = '/empty-url.html?url-type=order-cancel';
    }
    return url;
  }, // paypalReturnCancel()

  async googleLoginUrl() {
    assert(process.env.GOOGLE_APP_CLIENT_ID); // If not found, check the .env file of this setting
    const scope = encodeURI(Keys.Google.scope);
    let redirectUri = encodeURI(this._host + Keys.Google.redirect_path);
    let authUri = `https://accounts.google.com/o/oauth2/v2/auth?scope=${scope}&access_type=offline&include_granted_scopes=true&state=state_parameter_passthrough_value&redirect_uri=${redirectUri}&response_type=code&client_id=${process.env.GOOGLE_APP_CLIENT_ID}&prompt=consent`;

    return authUri;
  },

  async facebookLoginUrl() {
    assert(process.env.FACEBOOK_APP_CLIENT_ID); // If not found, check the .env file of this setting
    const scope = Keys.Facebook.scope;
    let redirectUri = encodeURI(this._host + Keys.Facebook.redirect_path);
    let authUri = `https://www.facebook.com/v5.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
  
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
    assert(process.env.GOOGLE_APP_CLIENT_ID); // If not found, check the .env file of this setting
    assert(process.env.GOOGLE_APP_CLIENT_SECRET); // If not found, check the .env file of this setting
  
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
      'client_id': process.env.GOOGLE_APP_CLIENT_ID,
      'client_secret': process.env.GOOGLE_APP_CLIENT_SECRET,
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
  
    // Outputs will be:
    // {
    //   "id": "103729431481034928215",
    //   "email": "simonho288@gmail.com",
    //   "verified_email": true,
    //   "name": "Simon Ho",
    //   "given_name": "Simon",
    //   "family_name": "Ho",
    //   "picture": "https://lh3.googleusercontent.com/a-/AAuE7mCBuILxtP7LQyMTqlPYO0ak69zn-14ktTPfgLmXUw",
    //   "locale": "en"
    // }
  
    // Redirect with cookie in ExpressJS
    let redirectUri = `/login-redirect.html?uid=${userId}`;
    return redirectUri;

  /*
    // Forward request to origin, get response.
    let response = await fetch(request);
  
    // Copy Response object so that we can edit headers to add HTTP redirect.
    response = new Response(response.body, {
      status: 302,
      headers: {
        // 'Set-Cookie': `name=${result.email}`,
        'Location': url.protocol + '//' + url.host + '/getcookie'
      }
    }, response);
  
    // Save the return info to cookie
    appendCookie(response.headers, 'user_googleid', result.id, 5);
    appendCookie(response.headers, 'user_email', result.email, 5);
    appendCookie(response.headers, 'user_name', result.name, 5);
    appendCookie(response.headers, 'user_avatar', result.picture, 5);
    appendCookie(response.headers, 'user_locale', result.locale, 5);
    appendCookie(response.headers, 'user_givenname', result.given_name, 5);
    appendCookie(response.headers, 'user_familyname', result.family_name, 5);
  
    // Go HTTP redirect
    return response;
  */
  }, // googleOauth2()

  async facebookOauth2(params) {
    console.log('facebookOauth2()')
    assert(process.env.FACEBOOK_APP_CLIENT_ID); // If not found, check the .env file of this setting
    assert(process.env.FACEBOOK_APP_CLIENT_SECRET); // If not found, check the .env file of this setting
  
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
    let result = await fetch(`https://graph.facebook.com/v5.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_CLIENT_ID}&redirect_uri=${redirect_uri}&client_secret=${process.env.FACEBOOK_APP_CLIENT_SECRET}&code=${code}`);
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
  
    // return new Response(JSON.stringify(grResult), {
    //   headers: { 'content-type': 'application/json' },
    // })
  
    // https://oauth-server-2.simonho.workers.dev/
  
    // req.session.user_id = await createNewUser()
    // req.session.access_token = accessToken
  
    // Outputs will be:
    // {
    //   "name": "Simon Ho",
    //   "email": "go@simonho.net",
    //   "picture": {
    //     "data": {
    //       "height": 200,
    //       "is_silhouette": false,
    //       "url": "https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=10156841747671328&height=200&width=200&ext=1580150034&hash=AeTSfq8TGVn2AT4i",
    //       "width": 200
    //     }
    //   },
    //   "id": "10156841747671328"
    // }
  
  /*
    // Forward request to origin, get response.
    let response = await fetch(request)
  
    // Copy Response object so that we can edit headers to add HTTP redirect.
    response = new Response(response.body, {
      status: 302,
      headers: {
        // 'Set-Cookie': `name=${result.email}`,
        'Location': url.protocol + '//' + url.host + '/getcookie'
      }
    }, response)
  
    // Save the return info to cookie
    appendCookie(response.headers, 'user_facebookid', grResult.id, 5)
    appendCookie(response.headers, 'user_email', grResult.email, 5)
    appendCookie(response.headers, 'user_name', grResult.name, 5)
    appendCookie(response.headers, 'user_avatar', grResult.picture.data.url, 5)
  
    // Go HTTP redirect
    return response
  */
  }, // facebookOauth2()
  
} // SharedFuncs

module.exports = SharedFuncs;
