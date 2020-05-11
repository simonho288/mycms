'use strict'

var Page = {
  _appId: 'online-shop',

  init() {
    console.log('init()');

    this.setupEvents();
  },

  setupEvents() {
    console.log('setupEvents()');

    $('.checkbox').checkbox();
    // $('#btn-login-google').off().on('click', this.onBtnGoogleLogin.bind(this));
  },

  async onBtnLogin(e) {
    console.log('onBtnLogin()');

    e.preventDefault();

    var email = $('#login-form input[name="email"]').val();
    var password = $('#login-form input[name="password"]').val();
    var isRemember = $('#cb-rememberme').checkbox('is checked');
    
    // Disable the button
    $('#btn-login').addClass('loading disabled');
    await this.fetchLogin(email, password);
    $('#btn-login').removeClass('loading disabled');
  },

  async fetchLogin(email, password) {
    console.log('fetchLogin()');

    var data = {
      email: email,
      password: password
    };

    let response = await fetch('/login', {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    let result = await response.json();
    if (result.status === 'ok') {

    } else {
      if (result.error === 'user_not_found') {
        $('#msg-error').html(`
        <ul class="list">
          <li>Invalid email or password. Click "forgot password" if needed</li>
        </ul>
        `);  
      }
      $('#login-form').addClass('error');  
    }
  },

};

$(document).ready(function() {
  Page.init();
});