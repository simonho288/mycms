
$(document).ready(function() {
  refreshCartIcon();

  $('.btn-add-cart').click(function(evt) {
    var $tar = $(evt.currentTarget);
    var imgUrl = $tar.closest('.product').find('img').attr('src');
    var productId = $tar.data('product-id');
    var name = $tar.data('name');
    var regularPrice = $tar.data('regular-price');
    var sellPrice = $tar.data('sell-price');
    var tax = $tar.data('tax');
    var cartItems = sessionStorage.getItem('shopping_cart');
    cartItems = cartItems != null ? JSON.parse(cartItems) : [];
    var found = cartItems.find(i => i.productId === productId);
    if (found) {
      found.qty++;
    } else {
      cartItems.push({
        productId: productId,
        name: name,
        regularPrice: regularPrice,
        sellPrice: sellPrice,
        qty: 1,
        tax: tax,
        img_url: imgUrl
      });
    }
    sessionStorage.setItem('shopping_cart', JSON.stringify(cartItems));
    refreshCartIcon();
    window.scroll(0, 0); // Emphasis the cart icon
  });
});

function refreshCartIcon() {
  var cartItems = sessionStorage.getItem('shopping_cart');
  cartItems = cartItems != null ? JSON.parse(cartItems) : [];
  var totalItems = 0;
  cartItems.forEach(i => {
    totalItems += i.qty
  });
  if (totalItems === 0) {
    $('#cart-icon').html('Cart: Empty');
  } else {
    $('#cart-icon').html(`Cart: ${totalItems} <a class="ui mini button" href='checkout.html'>Checkout</a>`);
  }
}
