'use strict'

import { ScreenSettings } from './components/settings.js';
import { ScreenProducts } from './components/products.js';
import { ScreenOrders } from './components/orders.js';
import { ScreenGenerate } from './components/generate.js';
import { Util } from './util.js';

$(document).ready(function() {
  App.init();
});

/**
 * App of this webpage
 */
var App = {
  _appId: 'online-shop',
  _curScr: null,
  _userRec: null,

  // App initialisation
  async init() {
    console.log('init()');

    this._userRec = await Util.getUserRecord();
    if (this._userRec == null) {
      window.location.replace('/index.html');
      return;
    }

    this._curScr = new ScreenSettings(this);
    this._curScr.setMainScreen();
    this._curScr.setupEvents();
    this._curScr.screenStart();

    // $('.ui.sidebar').sidebar({
    //   context: $('.bottom.segment')
    // }).sidebar('attach events', '.menu .item');
    // $('.context.dashboard .ui.sidebar').sidebar({
    //   context: $('.context.dashboard .bottom.segment')
    // }).sidebar('attach events', '.context.dashboard .menu .item');
    $('.dropdown').dropdown();
    $('#nav-settings').off().on('click', this.onSwitchSettings.bind(this));
    $('#nav-products').off().on('click', this.onSwitchProducts.bind(this));
    $('#nav-orders').off().on('click', this.onSwitchOrders.bind(this));
    $('#nav-generate').off().on('click', this.onSwitchGenerate.bind(this));
    $('.ui .item').on('click', function() {
      // $('.ui .item').removeClass('active');
      // $(this).addClass('active');
    });
  }, // init()

  getUserRec() {
    return this._userRec;
  },

  // Save the whole userRec to database (CFW in live or Nodejs in development)
  async saveUserRec() {
    console.log('saveUserRec()');

    let resp = await fetch('/api/put-user-json', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this._userRec)
    });
    resp = await resp.json();

    if (resp.result === 'ok') {
      localStorage.setItem('userRec', JSON.stringify(this._userRec));
    }
    return;
  }, // saveUserRec()

  // Switch to Settings screen
  onSwitchSettings(e) {
    console.log('onSwitchSettings()');

    this._curScr = new ScreenSettings(this);
    this._curScr.setMainScreen();
    this._curScr.setupEvents();
    this._curScr.screenStart();

    setTimeout(function() {
      $('.ui.sidebar').sidebar('hide');
    }, 200);
  }, // onSwitchSettings()

  // Switch to Products screen
  onSwitchProducts(e) {
    console.log('onSwitchProducts()');

    this._curScr = new ScreenProducts(this);
    this._curScr.setMainScreen();
    this._curScr.setupEvents();
    this._curScr.screenStart();

    setTimeout(function() {
      $('.ui.sidebar').sidebar('hide');
    }, 200);
  }, // onSwitchProducts()

  // Switch to Orders screen
  onSwitchOrders(e) {
    console.log('onSwitchOrders()');

    this._curScr = new ScreenOrders(this);
    this._curScr.setMainScreen();
    this._curScr.setupEvents();
    this._curScr.screenStart();
    setTimeout(function() {
      $('.ui.sidebar').sidebar('hide');
    }, 200);
  }, // onSwitchOrders()

  // Switch to Generate screen
  onSwitchGenerate(e) {
    console.log('onSwitchGenerate()');

    this._curScr = new ScreenGenerate(this);
    this._curScr.setMainScreen();
    this._curScr.setupEvents();
    this._curScr.screenStart();
    setTimeout(function() {
      $('.ui.sidebar').sidebar('hide');
    }, 200);
  },

};
