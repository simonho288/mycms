
$(document).ready(function() {
  $('.ui.dropdown').dropdown();
  $('#paypal').click(payWithPaypal);

  renderCarts();
  renderSummary();
});

function formatCurrency(value) {
  return '$' + numeral(value).format('0[.]00');
}

// Render the shopping cart by every item in the cart.
function renderCarts() {
  var template = $('#cart-item').html();
  // Alter the underscore template syntax
  _.templateSettings = {
    interpolate: /\{\{=([\s\S]+?)\}\}/g,
    evaluate: /\{\{([\s\S]+?)\}\}/g,
    // interpolate: /\{\{(.+?)\}\}/g
  };
  var compiler = _.template(template);
  var markup = '';

  var cartItems = sessionStorage.getItem('shopping_cart');
  cartItems = cartItems != null ? JSON.parse(cartItems) : [];
  cartItems.forEach(item => {
    var item2 = {};
    item2.img_url = item.img_url;
    item2.name = item.name;
    item2.productId = item.productId;
    item2.qty = item.qty;
    item2.regularPrice = formatCurrency(item.regularPrice);
    item2.sellPrice = formatCurrency(item.sellPrice);
    item2.tax = formatCurrency(item.tax);
    item2.amount = formatCurrency(item.sellPrice * item.qty);
    markup += compiler(item2);
  });
  $('#cart-items').html(markup);
}

// Render the bottom order summmary
function renderSummary() {
  var cartItems = sessionStorage.getItem('shopping_cart');
  cartItems = cartItems != null ? JSON.parse(cartItems) : [];

  var totalTax = 0;
  var totalAmount = 0;
  cartItems.forEach(item => {
    totalAmount += item.qty * item.sellPrice;
    totalTax += item.qty * item.tax;
  });
  $('#summary #tax').html(formatCurrency(totalTax));
  $('#summary #total_amount').html(formatCurrency(totalAmount));
}

async function payWithPaypal(evt) {
  var $form = $('#shipping');
  var name = $form.find('input[name="name"]').val().trim();
  var email = $form.find('input[name="email"]').val().trim();
  var address1 = $form.find('input[name="address1"]').val().trim();
  var address2 = $form.find('input[name="address2"]').val().trim();
  var city = $form.find('input[name="city"]').val().trim();
  var province = $form.find('input[name="state"]').val().trim();
  var postal = $form.find('input[name="postal"]').val().trim();
  var country = $form.find('#country').dropdown('get value');
  if (name == '' || email == '' || address1 == '' || address2 == '' || city == '' || province == '' || postal == '' || country == '') {
    $('#error_message .header').html('Missing input field(s)!');
    $('#error_message .description').html('Please fill all fields before payment');
    $('#error_message').show();
    return;
  } else {
    $('#error_message').hide();
  }

  var cartItems = sessionStorage.getItem('shopping_cart');
  cartItems = cartItems != null ? JSON.parse(cartItems) : [];
  if (cartItems.length > 0) {
    // Build the JSON for MyCMS
    var json = {
      user: 'simonho288@gmail.com', // MyCMS user account
      orderId: new Date().getTime().toString(),
      date: new Date().toISOString(),
      customer: {
        name: name,
        email: email
      },
      shipping: {
        address1: address1,
        address2: address2,
        city: city,
        province: province,
        postal_code: postal,
        country: country.toUpperCase()
      },
      items: [] // will be added below
    };

    // Convert the cart items to MyCMS items list
    for (var i = 0; i < cartItems.length; ++i) {
      var item = cartItems[i];
      json.items.push({
        productId: item.productId,
        name: item.name,
        image: item.img_url,
        quantity: item.qty,
        unitPrice: item.sellPrice,
        tax: item.tax
      });
    }

    console.log(json);

    var resp = await fetch('https://mycms.simonho.net/api/paypal-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(json)
    });
    resp = await resp.json();

    if (resp.paypal_url) {
      window.location.href = resp.paypal_url;
    }
  }
}
