'use strict'

import { Constant, Util } from '../util.js';

let template = `
<div id="screen-settings" class="ui basic segment">
  <div class="ui attached big message">
    <div class="header">
      Settings
    </div>
    <p>This are the settings of your online store. Or system configuration settings.</p>
  </div>
  <form class="ui form big attached fluid segment">
    <div class="field required">
      <label>Store name</label>
      <input type="text" name="store-name" placeholder="e.g. Mary's painting store">
    </div>
    <div class="field required">
      <label>Store currency</label>
      <select name="currency" class="ui dropdown">
        <option value="HKD">HKD</option>
        <option value="USD">USD</option>
        <option value="CAD">CAD</option>
      </select>
    </div>
    <div class="field required">
      <label>Locale</label>
      <select name="locale" class="ui dropdown">
        <option value="en-US">English U.S.</option>
        <option value="zh-hk">Chinese Hong Kong</option>
      </select>
    </div>
    <div class="field required">
      <label>Your online store URL (full domain name with http/https)</label>
      <input type="text" name="site-url" placeholder="e.g. https://www.marypainting.com">
    </div>
    <div class="field required">
      <label>Shipping provider</label>
      <input type="text" name="shipping-provider" placeholder="e.g. UPS">
    </div>
    <div class="field required">
      <label>Paypal order success page name (order-success)</label>
      <input type="text" name="paypal-order-success" placeholder="e.g. /order-success.html">
    </div>
    <div class="field required">
      <label>Paypal order cancel page name (order-cancel)</label>
      <input type="text" name="paypal-order-cancel" placeholder="e.g. /order-cancel.html">
    </div>
    <div class="inline fields" id="paypal-mode">
      <label>Paypal Mode</label>
      <div class="field">
        <div class="ui radio checkbox" id="live">
          <input type="radio" name="paypal-mode" checked="checked" data-value="live">
          <label>Live</label>
        </div>
      </div>
      <div class="field">
        <div class="ui radio checkbox" id="sandbox">
          <input type="radio" name="paypal-mode" data-value="sandbox">
          <label>Sandbox</label>
        </div>
      </div>    
    </div>
    <div class="field">
      <label>Client ID (found in Paypal developer portal)</label>
      <input type="text" name="paypal-client-id" placeholder="Client ID">
    </div>
    <div class="field">
      <label>Client Secret (found in Paypal developer portal)</label>
      <input type="text" name="paypal-client-secret" placeholder="Paypal Client Secret">
    </div>
    <div class="field">
      <label>Paypal handling fee (optional per order handling fee for Paypal)</label>
      <input type="number" name="paypal-handling-fee">
    </div>
    <button id="btn-save" class="ui primary button" type="submit">Save</button>
  </form>
  <div id="form-error" class="ui bottom big attached error message" style="display: none">
    <div class="header">
      Data not saved due to below error(s):
    </div>
    <ul id="field-errors" class="list">
      <li>...</li>
    </ul>
  </div>
  <div class="ui form big attached fluid segment">
    <div class="field">
      <h4 class="header">Generate static website</h4>
      {{gen-static-website}}
    </div>
  </div>
  <div class="ui form big attached fluid segment">
    <div class="field">
      <h4 class="header">Data export (JSON format)</h4>
      {{download-product-anchor}}
    </div>
  </div>
</div>
`;

/**
 * User settings screen
 */
export class ScreenSettings {
  constructor(app) {
    console.assert(app != null);

    this._tagDiv = '#screen-settings';
    this._app = app;
    this._userRec = app.getUserRec();
  } // constructor()

  setupEvents() {
    console.log('setupEvents()');

    // SemanticUI initialisation
    $('.checkbox').checkbox();
    // $('select.dropdown').dropdown();

    $('#btn-save').off().on('click', this.onBtnSave.bind(this));
    // $('#btn-export-json').off().on('click', this.onBtnExportJson.bind(this));
    // $('#btn-login-google').off().on('click', this.onBtnGoogleLogin.bind(this));
  } // setupEvents()

  setMainScreen() {
    console.log('setMainScreen()');

    let mkup = template;

    let anchor = `<a id="btn-export-json" href="/api/get-user-json/${this._userRec.email}" class="ui secondary button" target="_blank">Download</a>`;
    mkup = mkup.replace('{{download-product-anchor}}', anchor);
    $('#app').html(mkup);

    anchor = `<a id="btn-export-json" href="/api/gen-static-website/${this._userRec.email}" class="ui secondary button" target="_blank">Generate &amp; download</a>`;
    mkup = mkup.replace('{{gen-static-website}}', anchor);
    $('#app').html(mkup);
  } // setMainScreen()

  screenStart() {
    console.log('screenStart()');

    // Fill the form with db values
    $(this._tagDiv).find('input[name="store-name"]').val(this._userRec.settings.storeName);
    $(this._tagDiv).find('input[name="site-url"]').val(this._userRec.settings.siteUrl);
    let currency = this._userRec.settings.currency ? this._userRec.settings.currency : 'USD';
    $(this._tagDiv).find('select[name="currency"]').val(currency);
    let locale = this._userRec.settings.locale ? this._userRec.settings.locale : 'en-US';
    $(this._tagDiv).find('select[name="locale"]').val(locale);
    $(this._tagDiv).find('input[name="shipping-provider"]').val(this._userRec.settings.shippingProvider);

    if (this._userRec.settings.paypal) {
      if (!this._userRec.settings.paypal.orderSuccessPage) this._userRec.settings.paypal.orderSuccessPage = '/order-success.html';
      if (!this._userRec.settings.paypal.orderCancelPage) this._userRec.settings.paypal.orderSuccessPage = '/order-cancel.html';
      $(this._tagDiv).find('input[name="paypal-client-id"]').val(this._userRec.settings.paypal.clientID);
      $(this._tagDiv).find('input[name="paypal-client-secret"]').val(this._userRec.settings.paypal.clientSecret);
      $(this._tagDiv).find('input[name="paypal-handling-fee"]').val(this._userRec.settings.paypal.handlingFee);
      $(this._tagDiv).find('input[name="paypal-order-success"]').val(this._userRec.settings.paypal.orderSuccessPage);
      $(this._tagDiv).find('input[name="paypal-order-cancel"]').val(this._userRec.settings.paypal.orderCancelPage);
      $(this._tagDiv).find('#paypal-mode').find(`#${this._userRec.settings.paypal.mode}`).checkbox('set checked');
    } else {
      $(this._tagDiv).find('input[name="paypal-order-success"]').val('/order-success.html');
      $(this._tagDiv).find('input[name="paypal-order-cancel"]').val('/order-cancel.html');
    }
  } // screenStart()

  async onBtnSave(e) {
    console.log('onBtnSave()');

    e.preventDefault();
    let errorMsgs = [];
    // let paypalAcc = $(this._tagDiv).find('input[name="paypal-account"]').val();
    // if (!/^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(paypalAcc)) {
    //   errorMsgs.push('Paypal account invalid email format');
    // }

    let siteUrl = $(this._tagDiv).find('input[name="site-url"]').val().trim();
    let storeName = $(this._tagDiv).find('input[name="store-name"]').val().trim();
    let currency = $(this._tagDiv).find('select[name="currency"]').val();
    let locale = $(this._tagDiv).find('select[name="locale"]').val();
    let shippingProvider = $(this._tagDiv).find('input[name="shipping-provider"]').val().trim();
    let paypalClientID = $(this._tagDiv).find('input[name="paypal-client-id"]').val().trim();
    let paypalClientSecret = $(this._tagDiv).find('input[name="paypal-client-secret"]').val().trim();
    let paypalHandlingFee = $(this._tagDiv).find('input[name="paypal-handling-fee"]').val().trim();
    let paypalOrderSuccessPage = $(this._tagDiv).find('input[name="paypal-order-success"]').val().trim();
    let paypalOrderCancelPage = $(this._tagDiv).find('input[name="paypal-order-cancel"]').val().trim();
    // let paypalMode = $(this._tagDiv).find('input[name="paypal-mode"]:checked').data('value');
    let isPaypalModeLive = $(this._tagDiv).find('#paypal-mode').find(`#live`).checkbox('is checked');
    // let isPaypalModeSandbox = $(this._tagDiv).find('#paypal-mode').find(`#sandbox`).checkbox('is checked');
    let paypalMode = isPaypalModeLive ? 'live' : 'sandbox';

    if (siteUrl == '') {
      errorMsgs.push('Your online store URL cannot empty');
    }
    if (!Util.testUrl(siteUrl)) {
      errorMsgs.push('Your online store URL invalid format');
    }
    if (storeName == '') {
      errorMsgs.push('Store name cannot empty');
    }
    if (paypalOrderSuccessPage == '') {
      errorMsgs.push('order-success page name cannot empty');
    }
    if (paypalOrderCancelPage == '') {
      errorMsgs.push('order-cancel page name cannot empty');
    }
    if (shippingProvider == '') {
      errorMsgs.push('Shipping provider cannot empty');
    }

    if (errorMsgs.length > 0) {
      this.displayFormError(errorMsgs);
    } else {
      this.hideFormSubmitError();
      // this._userRec.settings.paypalAcc = paypalAcc;
      this._userRec.settings.siteUrl = siteUrl;
      this._userRec.settings.storeName = storeName;
      this._userRec.settings.currency = currency;
      this._userRec.settings.locale = locale;
      this._userRec.settings.shippingProvider = shippingProvider;
      this._userRec.settings.paypal = {};
      this._userRec.settings.paypal.clientID = paypalClientID;
      this._userRec.settings.paypal.clientSecret = paypalClientSecret;
      this._userRec.settings.paypal.handlingFee = parseFloat(numeral(paypalHandlingFee).format('0.00'));
      this._userRec.settings.paypal.orderSuccessPage = paypalOrderSuccessPage;
      this._userRec.settings.paypal.orderCancelPage = paypalOrderCancelPage;
      this._userRec.settings.paypal.mode = paypalMode;
      $(e.currentTarget).addClass('loading disabled');
      await this._app.saveUserRec();
      $(e.currentTarget).removeClass('loading disabled');

      alertify.success('Data saved successfully'); // https://alertifyjs.com/
      $("html, body").animate({ scrollTop: 0 });
    }
  }

  displayFormError(errorMsgs) {
    console.log('displayFormError()');

    let mkup = '';
    errorMsgs.forEach((el) => {
      mkup += '<li>' + el + '</li>';
    });
    $(this._tagDiv).find('#field-errors').html(mkup);
    $(this._tagDiv).find('#form-error').show();
  }

  hideFormSubmitError() {
    console.log('hideFormSubmitError()');
    
    $(this._tagDiv).find('#form-error').hide();
  }

} // class ScreenSettings
