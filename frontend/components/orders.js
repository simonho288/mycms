'use strict'

import { Util } from '../util.js';

const template = `
<div id="orders-page-div">
  <div id="orders-page-main-func" class="ui container">
    <div id="orders-list" class="ui container">
    </div>
    <div id="orders-detail" class="ui long modal">
      <i class="close icon"></i>
      <div class="header">Order</div>
      <div class="scrolling content">
      </div>
    </div>
  </div>
</div>`;

export class ScreenOrders {
  constructor(app) {
    console.assert(app != null);

    this._app = app;
    this._tagDiv = '#screen-orders';
    this._userRec = app.getUserRec();
  } // constructor()

  setupEvents() {
    console.log('setupEvents()');

    // SemanticUI initialisation
    $('.checkbox').checkbox();
    $('#btn-debug-assign-orders').off().on('click', this.onBtnAssignOrder.bind(this));
    $('.btn-order-detail').off().on().on('click', this.onBtnOrderDetail.bind(this));
  } // setupEvents()

  setMainScreen() {
    console.log('setMainScreen()');

    $('#app').html(template);
    // if (Util.parseCookie('is_debug') == '1') {
    if (false) {
      $('#debug-div').html(`
      <button id="btn-debug-assign-orders" class="ui button">Create Dummy Order (debug)</button>
      `);
    }
  } // setMainScreen()

  screenStart() {
    console.log('screenStart()');

    if (this._userRec.orders && this._userRec.orders.length > 0) {
      this.renderOrders();
    } else {
      
    }
    this.setupEvents();
  } // screenStart()

  renderOrders() {
    console.log('renderOrders()');

    let mkup = `<table class="ui celled table">`;
    mkup += `<thead><tr>
      <th>Order No.</th>
      <th>Date</th>
      <th>Customer</th>
      <th>Total Amount</th>
      <th>Total Qty.</th>
      <th>Payment</th>
      <th></th>
      </tr></thead>`;
    mkup += `<tbody>`;
    let orders = this._userRec.orders;
    for (let i = 0; i < orders.length; i++) {
      let order = orders[i];
      let totalItems = order.items.reduce((acc, val, idx) => acc + val.quantity, 0);
      mkup += `<tr data-orderid="${order.orderId}">`;
      mkup += `<td data-label="Order No.">${order.orderId}</td>`;
      mkup += `<td data-label="Date">${Util.formatDate(order.date)}</td>`;
      mkup += `<td data-label="Customer">${order.customer}</td>`;
      mkup += `<td data-label="Total Amount">${Util.formatCurrency(order.amount)}</td>`;
      mkup += `<td data-label="Total Qty.">${Util.formatNumber(totalItems)}</td>`;
      mkup += `<td data-label="Payment">${order.payment_status}</td>`;
      mkup += `<td><button class="ui mini button btn-order-detail">details</button></td>`;
      mkup += `</tr>`;
    }
    mkup += `</tbody>`;
    mkup += `</table>`;

    $('#orders-page-div').find('#orders-list').html(mkup);
  } // renderOrders()

  async onBtnAssignOrder(evt) {
    console.log('onBtnAssignOrder()');

    evt.preventDefault();
    if (this._userRec.products.length < 3) {
      alertify.error('There are at least 3 products!');
      return;
    }
    let $btn = $(evt.currentTarget);
    $btn.addClass('loading disabled');

    // Create dummy orders
    const NUM_ORDERS = 50;
    this._userRec.orders = [];
    for (let i = 0; i < NUM_ORDERS; ++i) {
      let numberItems = Util.getRandomInt(this._userRec.products.length) + 1;
      let items = [];
      let amount = 0;
      // Making order items
      for (let j = 0; j < numberItems; ++j) {
        let product = this._userRec.products[j];
        let quantity = Util.getRandomInt(30) + 1;
        let price = product.sellPrice != '' ? parseFloat(product.sellPrice) : parseFloat(product.regularPrice);
        // debugger
        let total = quantity * price;
        items.push({
          productId: product.productId,
          name: product.name,
          image: product.image0,
          quantity: quantity,
          unitPrice: price
        });
        amount += total;
      }
      // Make an new order
      let date = new Date(2000 + Util.getRandomInt(30), Util.getRandomInt(12), Util.getRandomInt(28) + 1, Util.getRandomInt(24), Util.getRandomInt(60), Util.getRandomInt(60));
      let orderId = Util.getRandomInt(999999999999);
      let oStatus = Util.getRandomInt(3);
      this._userRec.orders.push({
        orderId: orderId.toString(),
        date: date.toISOString(),
        customer: `email${i + 1}@customer.com`,
        items: items,
        amount: amount,
        payment_status: oStatus == 0 ? 'pending' : oStatus == 1 ? 'paid' : 'cancelled'
      });
    }

    await this._app.saveUserRec();
    $btn.removeClass('loading disabled');
    alertify.success('Dummy orders created successfully'); // https://alertifyjs.com/
    this.renderOrders();
  } // onBtnAssignOrder()

  onBtnOrderDetail(evt) {
    console.log('onBtnOrderDetail()');

    // Retrieve the order
    let orderId = $(evt.currentTarget).parent().parent().data('orderid');
    let order = this._userRec.orders.find(o => o.orderId == orderId);
    this.displayOrderDetail(order);
  } // onBtnOrderDetail()

  displayOrderDetail(order) {
    console.log('displayOrderDetail()');

    let totalItems = order.items.reduce((acc, val, idx) => acc + val.quantity, 0);
    $('#orders-detail .header').html('Order:' + order.orderId);
    let mkup = `
<form class="ui form">
  <div class="field">
    <label>Order no.</label>
    <input type="text" value="${order.orderId}" readonly>
  </div>
  <div class="field">
    <label>Date</label>
    <input type="text" value="${Util.formatDatetime(order.date)}" readonly>
  </div>
  <div class="field">
    <label>Customer</label>
    <input type="text" value="${order.customer}" readonly>
  </div>
  <div class="field">
    <label>Total Amount</label>
    <input type="text" value="${Util.formatCurrency(order.amount)}" readonly>
  </div>
  <div class="field">
    <label>Total Quantity</label>
    <input type="text" value="${Util.formatNumber(totalItems)}" readonly>
  </div>
  <div class="field">
    <label>Payment Status</label>
    <input type="text" value="${order.payment_status}" readonly>
  </div>
`;
    if (order.paypal_txn_id) {
      mkup += `
<div class="field">
  <label>Paypal Transaction ID</label>
  <input type="text" value="${order.paypal_txn_id}" readonly>
</div>
      `;
    }
    mkup += `
  <div class="field">
    <label>Ordered Items: ${Util.formatNumber(order.items.length)}</label>
    `;

    // List the order items
    mkup += `<div class="ui divided items">`;
    for (let i = 0; i < order.items.length; ++i) {
      let item = order.items[i];
      mkup += `<div class="item">`;
      mkup += `<div class="image"><img src="${item.image}" /></div>`;
      mkup += `<div class="moddle aligned content">`;
      mkup += `<div class="description">
        <p>Product ID: ${item.productId}</p>
        <p>Name: ${item.name}</p>
        <p>Qty: ${Util.formatNumber(item.quantity)}</p>
        <p>Unit price: ${Util.formatCurrency(item.unitPrice)}</p>
        <p>Amount: ${Util.formatCurrency(item.quantity * item.unitPrice)}</p>
        <p></p>
        </div>`;
      mkup += `</div>`;
      mkup += `</div>`;
    }
    mkup += `</div>`;
    mkup += '</div>';
    mkup += '</form>';
    
    $('#orders-detail .content').html(mkup);
    $('#orders-detail').modal('show');
  } // displayOrderDetail()

}