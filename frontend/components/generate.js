'use strict'

import { Util } from '../util.js';

const template = `
<div id="generate-page-div">
  <div id="generate-page-main-func" class="ui container">
    <form method="post" action="/api/gen-static-website/{{user_id}}" class="ui form big attached fluid segment" enctype="multipart/form-data">
      <div class="field">
        <input type="file" name="theme" required />
      </div>
      <div class="field">
        <input class="ui primary button" type="submit" value="Upload Theme (5MB max.)">
      </div>
    </form>
  </div>
</div>`;

export class ScreenGenerate {
  constructor(app) {
    console.assert(app != null);

    this._app = app;
    this._tagDiv = '#screen-generate';
    this._userRec = app.getUserRec();
  } // constructor()

  setupEvents() {
    console.log('setupEvents()');

    // SemanticUI initialisation
    $('.checkbox').checkbox();
    // $('#btn-debug-assign-generate').off().on('click', this.onBtnAssignGenerate.bind(this));
    // $('.btn-order-detail').off().on().on('click', this.onBtnGenerateDetail.bind(this));
  } // setupEvents()

  setMainScreen() {
    console.log('setMainScreen()');

    var templ = template.replace(/{{user_id}}/g, this._userRec.email);
    $('#app').html(templ);
    // if (Util.parseCookie('is_debug') == '1') {
    if (false) {
      $('#debug-div').html(`
      <button id="btn-debug-assign-generate" class="ui button">Create Dummy Order (debug)</button>
      `);
    }
  } // setMainScreen()

  screenStart() {
    console.log('screenStart()');

    if (this._userRec.generate && this._userRec.generate.length > 0) {
      this.renderGenerate();
    } else {
      
    }
    this.setupEvents();
  } // screenStart()

  renderGenerate() {
    console.log('renderGenerate()');

    let mkup = `<table class="ui celled table">`;
    mkup += `<thead><tr>
      <th>Order No.</th>
      <th>Date</th>
      <th>Customer name</th>
      <th>Total Amount</th>
      <th>Total Qty.</th>
      <th>Payment</th>
      <th></th>
      </tr></thead>`;
    mkup += `<tbody>`;
    let generate = this._userRec.generate;
    for (let i = 0; i < generate.length; i++) {
      let order = generate[i];
      let totalItems = order.items.reduce((acc, val, idx) => acc + val.quantity, 0);
      mkup += `<tr data-orderid="${order.orderId}">`;
      mkup += `<td data-label="Order No.">${order.orderId}</td>`;
      mkup += `<td data-label="Date">${Util.formatDate(order.date)}</td>`;
      mkup += `<td data-label="Customer name">${order.customer.name}</td>`;
      mkup += `<td data-label="Total Amount">${Util.formatCurrency(order.amount)}</td>`;
      mkup += `<td data-label="Total Qty.">${Util.formatNumber(totalItems)}</td>`;
      mkup += `<td data-label="Payment">${order.payment_status}</td>`;
      mkup += `<td><button class="ui mini button btn-order-detail">details</button></td>`;
      mkup += `</tr>`;
    }
    mkup += `</tbody>`;
    mkup += `</table>`;

    $('#generate-page-div').find('#generate-list').html(mkup);
  } // renderGenerate()


}