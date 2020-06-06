/**
 * Cloudflare Workers server app source codes.
 * 
 * ***** IMPORTANT *****
 * This is Cloudflare Workers CFW version of server app.
 */

import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler';
// import { v4 as uuidv4 } from 'uuid';
// const numeral = require('numeral');

const assert = require('assert');

const SharedFuncs = require('../sharedFuncs.js');

// We support the GET, POST, HEAD, and OPTIONS methods from any origin,
// and accept the Content-Type header on requests. These headers must be
// present on all responses to all CORS requests. In practice, this means
// all responses to OPTIONS or POST requests.
const CORS_HEADER = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};


/**
 * Initialise the SharedFuncs
 */
SharedFuncs.setEnv({ // Used by SharedFuncs. Created using command: wrangler secret put XXX
  SERVER_URL: SERVER_URL,
  GOOGLE_APP_CLIENT_ID: GOOGLE_APP_CLIENT_ID,
  GOOGLE_APP_CLIENT_SECRET: GOOGLE_APP_CLIENT_SECRET,
  FACEBOOK_APP_CLIENT_ID: FACEBOOK_APP_CLIENT_ID,
  FACEBOOK_APP_CLIENT_SECRET: FACEBOOK_APP_CLIENT_SECRET,
});
SharedFuncs.setDebugMode(true);
SharedFuncs.setHost(SERVER_URL);
SharedFuncs.setSaveUserJsonFn(async (email, data) => {
  assert(email);
  assert(typeof data === 'object');

  const key = `user:${email.toLowerCase()}`;
  await DB.put(key, JSON.stringify(data));
});
SharedFuncs.setLoadUserJsonFn(async (email) => {
  assert(email);

  const key = `user:${email.toLowerCase()}`;
  let data = await DB.get(key);
  return JSON.parse(data);
});

// CFW version to change query strings to JSON
function _parseQueryString(url) {
  let urlObj = new URL(url);
  let queryStrings = urlObj.search.slice(1).split('&');
  let json = {};
  for (let i = 0; i < queryStrings.length; ++i) {
    let qs = queryStrings[i];
    let ss = qs.split('=');
    json[ss[0]] = decodeURIComponent(ss[1]);
  }
  return json;
}

/**
 * The DEBUG flag will do two things that help during development:
 * 1. we will skip caching on the edge, which makes it easier to
 *    debug.
 * 2. we will return an error message on exception in your Response rather
 *    than the default 404.html page.
 */
const DEBUG = true

addEventListener('fetch', event => {
  try {
    event.respondWith(handleEvent(event));
  } catch (e) {
    if (DEBUG) {
      return event.respondWith(
        new Response(e.message || e.toString(), {
          // status: 500,
          status: 200
        }),
      );
    }
    event.respondWith(new Response('Internal Error', { status: 500 }));
  }
})

async function handleEvent(event) {
  const url = new URL(event.request.url);
  const pathname = url.pathname;
  console.log('pathname', pathname);

  // Handle CORS options
  if (event.request.method === "OPTIONS") {
    return handleOptions(event.request);
  } else if (pathname === '/google_login') {
    return await handleGoogleLogin(event);
  } else if (pathname === '/facebook_login') {
    return await handleFacebookLogin(event);
  } else if (pathname === '/auth/google/callback') {
    return await handleGoogleCallback(event);
  } else if (pathname === '/auth/facebook/callback') {
    return await handleFacebookCallback(event);
  } else if (pathname.startsWith('/api/get-user-json')) { // e.g. /api/get-user-json/go@simonho.net
    return await handleGetUserJson(event);
  } else if (pathname.startsWith('/api/put-user-json')) {
    return await handlePutUserJson(event);
  } else if (pathname.startsWith('/api/paypal-checkout')) {
    return await handlePaypalCheckout(event);
  } else if (pathname.startsWith('/api/paypal-payment-success')) {
    return await handlePaypalSuccess(event);
  } else if (pathname.startsWith('/api/paypal-payment-cancel')) {
    return await handlePaypalCancel(event);
  } else if (pathname === '/my-test' && DEBUG) {
    return await handleMyTest(event);
  }

  let options = {};

  /**
   * You can add custom logic to how we fetch your assets
   * by configuring the function `mapRequestToAsset`
   */
  // options.mapRequestToAsset = handlePrefix(/^\/docs/)

  try {
    if (DEBUG) {
      // customize caching
      options.cacheControl = {
        bypassCache: true,
      };
    }
    return await getAssetFromKV(event, options);
  } catch (e) {
    // if an error is thrown try to serve the asset at 404.html
    if (!DEBUG) {
      try {
        let notFoundResponse = await getAssetFromKV(event, {
          mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/404.html`, req),
        });

        return new Response(notFoundResponse.body, { ...notFoundResponse, status: 404 });
      } catch (e) {}
    }

    return new Response(e.message || e.toString(), { status: 500 });
  }
}

async function handleMyTest(event) {
  // let result = await createOrLoginUser('go@simonho.net')
  // return new Response(JSON.stringify(result));
  let url = new URL(event.request.url);
  let req = event.request;
  if (req.method.toLowerCase() != 'put') {
    throw new Error('Allow PUT method only!');
  }
  if (!req.headers.get('content-type').includes('application/json')) {
    throw new Error('Allow JSON data only!');
  }
  
  let data = await req.json().catch(e => null);
  // console.log(data);
  if (data == null) {
    throw new Error('JSON parse failure!');
  }
  // if (data.email == null) {
  //   throw new Error('JSON must includes email property!');
  // }
  // const KV_KEY = `user:${data.email}`;
  // await DB.put(KV_KEY, JSON.stringify(data));
  // return new Response('Hello');
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      // 'Access-Control-Allow-Origin': '*',
      // 'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, OPTIONS',
      // 'Access-Control-Allow-Headers': 'Content-Type',
      // ...CORS_HEADER,
    }
  });
}

// HTTP OPTIONS method for CORS handling
function handleOptions(request) {
  if (request.headers.get('Origin') !== null &&
      request.headers.get('Access-Control-Request-Method') !== null &&
      request.headers.get('Access-Control-Request-Headers') !== null) {
    // Handle CORS pre-flight request.
    return new Response(null, {
      // headers: CORS_HEADER
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } else {
    // Handle standard OPTIONS request.
    return new Response(null, {
      headers: {
        'Allow': 'GET, HEAD, POST, PUT, OPTIONS'
      }
    });
  }
} // handleOptions()

/**
 * Here's one example of how to modify a request to
 * remove a specific prefix, in this case `/docs` from
 * the url. This can be useful if you are deploying to a
 * route on a zone, or if you only want your static content
 * to exist at a specific path.
 */
function handlePrefix(prefix) {
  return request => {
    // compute the default (e.g. / -> index.html)
    let defaultAssetKey = mapRequestToAsset(request)
    let url = new URL(defaultAssetKey.url)

    // strip the prefix from the path for lookup
    url.pathname = url.pathname.replace(prefix, '/')

    // inherit all other props from the default request
    return new Request(url.toString(), defaultAssetKey)
  }
} // handlePrefix()

/**
 * Called by frontend to redirect to Google to display login window
 */
async function handleGoogleLogin(event) {
  let authUri = await SharedFuncs.googleLoginUrl();
  return Response.redirect(authUri, 301)
} // handleGoogleLogin()

/**
 * Called by frontend to redirect to Facebook to display login window
 */
async function handleFacebookLogin(event) {
  let authUri = await SharedFuncs.facebookLoginUrl();
  return Response.redirect(authUri, 301);
} // handleFacebookLogin()

/*
function appendCookie(headers, name, value, expiryInMinute) {
  const expiry = new Date(new Date().getTime() + expiryInMinute * 60000);
  // console.log('time', expiry.toGMTString())
  const cookie = `${name}=${value}; Expires=${expiry.toGMTString()}; Path='/'`
  // const cookie = `${name}=${value}`
  headers.append('Set-Cookie', cookie)
}
*/

/**
 * REST API called by Google social login webserver. See Google developer console of URL mycms.simonho.net/auth/google/callback
 */
async function handleGoogleCallback(event) {
  let url = new URL(event.request.url);
  let code = url.searchParams.get('code');

  const params = { // Make same params with express
    code: code
  };
  let redirectUrl = await SharedFuncs.googleOauth2(params);
  let redirectUri = url.origin + redirectUrl;
  return Response.redirect(redirectUri, 301);

/*
  if (code == null) {
    return Response.redirect('/', 302)
  }

  console.log('code:', code);

  // console.log('url', url.host)
  const data = {
    'code': code,
    'client_id': Keys.Google.client_id,
    'client_secret': Keys.Google.client_secret,
    'redirect_uri': Keys.Google.redirect_uri,
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
    return Response.redirect('/error.html', 302)
  }

  result = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`);

  // req.session.user_id = await createNewUser()
  // req.session.access_token = accessToken

  result = await result.json();
  console.log(result);
  let userId = await createOrLoginUser(result.email);

  let redirectUri = `${url.origin}/login-redirect.html?uid=${userId}`;
  return Response.redirect(redirectUri, 301);


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
  // response.cookie('user_id', userId);
  // response.redirect(302, '/dashboard.html');

  */
} // handleGoogleCallback()

/**
 * REST API called by Facebook social login webserver. See Facebook developer console of URL mycms.simonho.net/auth/facebook/callback
 */
async function handleFacebookCallback(event) {
  let url = new URL(event.request.url)
  let code = url.searchParams.get('code')
  const params = { // Make same params with express
    code: code
  };
  let redirectUrl = await SharedFuncs.facebookOauth2(params);
  let redirectUri = url.origin + redirectUrl;
  return Response.redirect(redirectUri, 301);

/*
  if (code == null) {
    return Response.redirect('/', 302)
  }

  // Back to login if user denied to login
  if (code == null) {
    response.redirect(302, '/');
    return;
  }

  console.log('code:', code);

  let result = await fetch(`https://graph.facebook.com/v5.0/oauth/access_token?client_id=${Keys.Facebook.client_id}&redirect_uri=${Keys.Facebook.redirect_uri}&client_secret=${Keys.Facebook.client_secret}&code=${code}`);
  result = await result.json();

  let accessToken = result.access_token;
  if (accessToken == null) {
    response.redirect(302, '/error.html');
    return;
  }

  const fields = 'name,email,picture.type(large)';
  result = await fetch(`https://graph.facebook.com/me?fields=${fields}&access_token=${accessToken}`);
  result = await result.json();

  let userId = await createOrLoginUser(result.email);

  let redirectUri = `${url.origin}/login-redirect.html?uid=${userId}`;
  return Response.redirect(redirectUri, 301);
*/
} // handleFacebookCallback()

/**
 * For REST API to get an user record:
 * Example:
let resp = await fetch('/api/get-user-json/go@simonho.net')
resp = await resp.json()
console.log(resp)
 */
async function handleGetUserJson(event) {
  let url = new URL(event.request.url);
  const pathname = url.pathname;
  // Extract the email from the email
  let email = pathname.substring('/api/get-user-json'.length + 1, pathname.length);
  const params = { email: email };
  let json = await SharedFuncs.getUserJson(params);

  return new Response(JSON.stringify(json), {
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
  });

  // if (email == null) throw new Error('User email not found in url!');
  // email = email.toLowerCase().trim();
  // const KV_KEY = `user:${email}`;
  // let value = await DB.get(KV_KEY);

  // value = value ? value : JSON.stringify({ error: 'email not found!' });

  // // return new Response(email)
  // return new Response(value, {
  //   headers: { 'Content-Type': 'application/json;charset=UTF-8' },
  // });
} // handleGetUserJson()

/**
 * For REST API to save an user record.
 * Example:
var data = {
  email: 'go2@simonho.net',
  created: new Date(),
  products: [],
  settings: {}
}
let resp = await fetch('/api/put-user-json', {
method: 'POST',
cache: 'no-cache',
headers: {
  'Content-Type': 'application/json'
},
body: JSON.stringify(data)
});
resp = await resp.json();
console.log(resp);
 */
async function handlePutUserJson(event) {
  console.log('handlePutUserJson()');

  let url = new URL(event.request.url);
  let req = event.request;
  if (req.method.toLowerCase() != 'put') {
    throw new Error('Allow PUT method only!');
  }
  if (!req.headers.get('content-type').includes('application/json')) {
    throw new Error('Allow JSON data only!');
  }
  
  let data = await req.json().catch(e => null);
  await SharedFuncs.putUserJson(data);

  /*
  // console.log(data);
  if (data == null) {
    throw new Error('JSON parse failure!');
  }
  if (data.email == null) {
    throw new Error('JSON must includes email property!');
  }
  const KV_KEY = `user:${data.email}`;
  await DB.put(KV_KEY, JSON.stringify(data));
  */

  return new Response(JSON.stringify({ result: 'ok'}), {
    headers: {
      'content-type': 'application/json',
      // "Access-Control-Allow-Origin": "*",
      // "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, OPTIONS",
      // "Access-Control-Allow-Headers": "Content-Type",
      ...CORS_HEADER,
    },
  });
} // handlePutUserJson()

/**
 * For user login/registration, this will create a new user if not found in database
 */
/*
async function createOrLoginUser(email) {
  if (email == null) throw new Error('User email is required!');

  email = email.toLowerCase().trim();
  const KV_KEY = `user:${email}`;
  let value = await DB.get(KV_KEY);
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
    };
    await DB.put(KV_KEY, JSON.stringify(value));
  }

  return email;
}
*/

async function handlePaypalCheckout(event) {
  console.log('handlePaypalCheckout()');

  try {
    let request = event.request;
    if (request.method !== 'POST')
      throw new Error('Must be POST request!');
    if (!request.headers.get('content-type').includes('application/json'))
      throw new Error('POST data must be JSON!');

    let data = await request.json();
    let redirectUrl = await SharedFuncs.paypalCheckout(data);
    let rtnVal = {
      paypal_url: redirectUrl
    };
    return new Response(JSON.stringify(rtnVal), {
      headers: {
        'content-type': 'application/json',
        ...CORS_HEADER
      }
    });
  } catch (exp) {
    return new Response(JSON.stringify({ error: exp.message }), {
      headers: {
        'content-type': 'application/json',
        ...CORS_HEADER
      }
    });  
  }
}
/*
async function handlePaypalCheckout(event) {
  console.log('handlePaypalCheckout()');

  try {
    let request = event.request;
    if (request.method !== 'POST')
      throw new Error('Must be POST request!');
    if (!request.headers.get('content-type').includes('application/json'))
      throw new Error('POST data must be JSON!');

    let data = await request.json();
    if (data.user == null) throw new Error('Data must includes email!');
    if (data.orderId == null) throw new Error('Data must includes orderId!');
    if (data.date == null) throw new Error('Data must includes date!');
    if (data.customer == null) throw new Error('Data must includes customer!');
    if (data.items == null) throw new Error('Data must includes items!');
    const KV_KEY = `user:${data.user}`;
    let userRecStr = await DB.get(KV_KEY);
    if (userRecStr == null) throw new Error('User not found in db!');
    let userRec = JSON.parse(userRecStr);
    if (userRec.orders.find(o => o.id == data.orderId) != null) { // Is order exists?
      throw new Error('Order already exists!');
    }
    const currency = userRec.settings.paypalCurrency;
    if (currency == null) throw new Error('Currency not defined!');

    // Calculate the order amount
    let amount = 0;
    for (let i = 0; i < data.items.length; ++i) {
      let item = data.items[i];
      amount += item.quantity * item.unitPrice;
    }

    // Retrieve paypal settings from userJson
    let clientId = userRec.settings.paypalClientID;
    let clientSecret = userRec.settings.paypalClientSecret;
    const host = 'https://mycms.simonho.net';

    // Construct a request object and set desired parameters
    // Here, OrdersCreateRequest() creates a POST request to /v2/checkout/orders
    // Ref: https://github.com/paypal/Checkout-NodeJS-SDK/blob/master/samples/CaptureIntentExamples/createOrder.js
    const paypalUrl = (userRec.settings.paypalMode == 'sandbox') ? 'https://api.sandbox.paypal.com' : 'https://api.paypal.com';
    let paymentJson = {
      intent: 'CAPTURE',
      application_context: {
        return_url: `${host}/api/paypal-payment-success?user=${data.user}&order=${data.orderId}`,
        cancel_url: `${host}/api/paypal-payment-cancel?user=${data.user}&order=${data.orderId}`,
        brand_name: "EXAMPLE INC",
        locale: 'en-US',
        landing_page: 'BILLING',
        shipping_preference: 'SET_PROVIDED_ADDRESS',
        user_action: 'CONTINUE'
      },
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: numeral(amount).format('0[.]00'),
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
              value: '0'
            },
            tax_total: {
              currency_code: currency,
              value: '0'
            },
            shipping_discount: {
              currency_code: currency,
              value: '0'
            }
          }
        },
        items: [],
        shipping: {
          method: "United States Postal Service",
          name: {
            full_name:"John Doe"
          },
          address: {
            address_line_1: "123 Townsend St",
            address_line_2: "Floor 6",
            // admin_area_2: "San Francisco",
            // admin_area_1: "CA",
            postal_code: "94107",
            country_code: "US"
          }
        }
      }]
    };
    for (let i = 0; i < data.items.length; ++i) {
      let item = data.items[i];
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
          value: '0'
        },
        quantity: item.quantity.toString(),
        category: 'PHYSICAL_GOODS'
      });
    }
  
    // Get Paypal Access Token. Ref: https://developer.paypal.com/docs/api/get-an-access-token-curl/
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
    let accessToken = ppRes.access_token;
    if (accessToken == null) throw new Error('Access token not returned!');
  
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
    if (ppRes == null) throw new Error('Failed create order!');
  
    // Store the order to the KV
    userRec.orders.push({
      orderId: data.orderId,
      date: new Date().toISOString(),
      customer: data.customer,
      payment_status: 'pending', // Initial status is 'pending'
      items: data.items,
      amount: amount,
      paypal_order_id: ppRes.id
    });
    await DB.put(KV_KEY, JSON.stringify(userRec));
  
    // Return the URL to frontend
    let redirectUrl;
    ppRes.links.forEach(link => {
      if (link.rel === 'approve') {
        redirectUrl = link.href;
      }
    });
    if (redirectUrl) {
      let rtnVal = {
        paypal_url: redirectUrl
      };
      return new Response(JSON.stringify(rtnVal), {
        headers: {
          'content-type': 'application/json',
          ...CORS_HEADER
        }
      });  
    } else {
      throw new Error('Cannot find redirect url from paypal payment result!');
    }
  } catch (exp) {
    return new Response(JSON.stringify({ error: exp.message }), {
      headers: {
        'content-type': 'application/json',
        ...CORS_HEADER
      }
    });  
  }
}
*/

async function handlePaypalSuccess(event) {
  console.log('handlePaypalSuccess()');

  try {
    let request = event.request;
    if (request.method !== 'GET')
      throw new Error('Must be GET request!');
    let params = _parseQueryString(request.url);

    let redirectUrl = await SharedFuncs.paypalReturnSuccess(params);
    return Response.redirect(redirectUrl, 301);
  } catch (exp) {
    return new Response(JSON.stringify({ error: exp.message }), {
      headers: {
        'content-type': 'application/json',
        ...CORS_HEADER
      }
    });
  }
}
/* BACKUP
async function handlePaypalSuccess(event) {
  console.log('handlePaypalSuccess()');

  try {
    let request = event.request;
    if (request.method !== 'GET')
      throw new Error('Must be GET request!');
    let params = _parseQueryString(request.url);

    // User is the key of KV store
    if (params.user == null) throw new Error('QS must includes user!');
    if (params.order == null) throw new Error('QS must includes order!');
    if (params.token == null) throw new Error('QS must includes token!');
    if (params.PayerID == null) throw new Error('QS must includes PayerID!');

    // Retrieve the user record
    const KV_KEY = `user:${params.user}`;
    let userRecStr = await DB.get(KV_KEY);
    if (userRecStr == null) throw new Error('User not found in db!');
    let userRec = JSON.parse(userRecStr);

    // Update the order status
    let order = userRec.orders.find(o => o.orderId === params.order);
    if (order == null) {
      throw new Error('Order not found!');
    }
    order.payment_status = 'success';
    await DB.put(KV_KEY, JSON.stringify(userRec));

    if (userRec.settings.siteUrl && userRec.settings.orderSuccessPage) {
      let url = userRec.settings.siteUrl;
      if (userRec.settings.orderSuccessPage[0] != '/') {
        url += '/';
      }
      url += userRec.settings.orderSuccessPage;
      return Response.redirect(url, 301);
    } else {
      let url = '/empty-url.html?url-type=order-success';
      return Response.redirect(url, 301);
    }
  } catch (exp) {
    return new Response(JSON.stringify({ error: exp.message }), {
      headers: {
        'content-type': 'application/json',
        ...CORS_HEADER
      }
    });
  }
}
*/

async function handlePaypalCancel(event) {
  console.log('handlePaypalCancel()');

  try {
    let request = event.request;
    if (request.method !== 'GET')
      throw new Error('Must be GET request!');
    let params = _parseQueryString(request.url);

    let redirectUrl = await SharedFuncs.paypalReturnCancel(params);
    return Response.redirect(redirectUrl, 301);
  } catch (exp) {
    return new Response(JSON.stringify({ error: exp.message }), {
      headers: {
        'content-type': 'application/json',
        ...CORS_HEADER
      }
    });  
  }
}
/* BACKUP
async function handlePaypalCancel(event) {
  console.log('handlePaypalCancel()');

  try {
    let request = event.request;
    if (request.method !== 'GET')
      throw new Error('Must be GET request!');
    let params = _parseQueryString(request.url);

    // User is the key of KV store
    if (params.user == null) throw new Error('QS must includes user!');
    if (params.order == null) throw new Error('QS must includes order!');
    if (params.token == null) throw new Error('QS must includes token!');

    // Retrieve the user record
    const KV_KEY = `user:${params.user}`;
    let userRecStr = await DB.get(KV_KEY);
    if (userRecStr == null) throw new Error('User not found in db!');
    let userRec = JSON.parse(userRecStr);

    // Update the order status
    let order = userRec.orders.find(o => o.orderId === params.order);
    if (order == null) {
      throw new Error('Order not found!');
    }
    order.payment_status = 'cancelled';
    await DB.put(KV_KEY, JSON.stringify(userRec));

    if (userRec.settings.siteUrl && userRec.settings.orderCancelPage) {
      let url = userRec.settings.siteUrl;
      if (userRec.settings.orderCancelPage[0] != '/') {
        url += '/';
      }
      url += userRec.settings.orderCancelPage;
      return Response.redirect(url, 301);
    } else {
      let url = '/empty-url.html?url-type=order-cancel';
      return Response.redirect(url, 301);
    }
  } catch (exp) {
    return new Response(JSON.stringify({ error: exp.message }), {
      headers: {
        'content-type': 'application/json',
        ...CORS_HEADER
      }
    });  
  }
}
*/
