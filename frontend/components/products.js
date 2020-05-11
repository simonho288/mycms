'use strict'

import { Util } from '../util.js';

let template = `
<div id="products-page-div" class="ui basic segment">
  <div class="ui segment">
    <div class="ui left floated statistic">
      <div class="value"></div>
      <div class="label">Products</div>
    </div>
    <p>
      You can add, change or delete products for your online store in this screen
    </p>
    <div id="btn-addproduct" class="ui primary button">Add Product</div>
  </div>
  <div id="products-page-main-func"></div>
</div>`;

let inputFormTemplate = `
<div id="screen-products" class="ui basic segment">
  <div class="ui attached big message">
    <div class="header">
      Product
    </div>
    <p>Please input the product info and click [Save] button when done</p>
  </div>
  <!-- Product input form -->
  <form id="product-input-form" class="ui form big attached fluid segment">
    <div class="field required">
      <label>Product ID</label>
      <input type="text" name="product-id" placeholder="Letter and/or digit">
      <div class="ui pointing label">
        Product ID will be displayed in the orders
      </div>
    </div>
    <div class="field required">
      <label>Name</label>
      <input type="text" name="name" maxlength="50" placeholder="Max. 50 characters">
      <div class="ui pointing label">
        Product name will be displayed in the orders
      </div>
    </div>
    <div class="field required">
      <label>Description (Support multiple lines)</label>
      <div id="quill-toolbar">
        <!-- Add font size dropdown -->
        <button class="ql-link" tabindex="-1"></button>
        <select class="ql-size" tabindex="-1">
          <option value="small">Small</option>
          <!-- Note a missing, thus falsy value, is used to reset to default -->
          <option selected value="normal">Normal</option>
          <option value="large">Large</option>
          <option value="huge">Huge</option>
        </select>
        <!-- Add a bold button -->
        <button class="ql-bold" tabindex="-1"></button>
        <button class="ql-italic" tabindex="-1"></button>
        <button class="ql-underline" tabindex="-1"></button>
        <button class="ql-strike" tabindex="-1"></button>
        <select class="ql-color" tabindex="-1"></select>
        <select class="ql-align" tabindex="-1"></select>
        <button class="ql-list" value="ordered" tabindex="-1"></button>
        <button class="ql-list" value="bullet" tabindex="-1"></button>
        <button class="ql-indent" value="-1" tabindex="-1"></button>
        <button class="ql-indent" value="+1" tabindex="-1"></button>
        <button class="ql-blockquote" tabindex="-1"></button>
        <button class="ql-clean" tabindex="-1"></button>
      </div>
      <div id="item-dspt"></div>
    </div>
    <div class="field required">
      <label>Regular Price</label>
      <input type="number" name="regular-price" maxlength="12" placeholder="Numeric value with max. 2 digits">
      <div class="ui pointing label">
        Regular selling price
      </div>
    </div>
    <div class="field">
      <label>Sell price</label>
      <input type="number" name="sell-price" maxlength="12" placeholder="Numeric value with max. 2 digits">
      <div class="ui pointing label">
        Optional discounted selling price
      </div>
    </div>
    <div class="field required">
      <label>Tax</label>
      <input type="number" name="tax" maxlength="10" placeholder="Numeric value with max. 2 digits">
      <div class="ui pointing label">
        Tax fee per item sell
      </div>
    </div>
    <div class="field required">
      <div id="active" class="ui checkbox">
        <input type="checkbox" name="active" class="hidden">
        <label>Is active? (this product will not shown if not active)</label>
      </div>
    </div>
    <div class="field">
      <label>Images (from 1 to 8, max. 8 images)</label>
      <div class="ui divided items">
        <div id="image0-div" class="item">
          <div class="image">
            <img id="img-preview0" src="">
          </div>
          <div class="content">
            <div class="extra">
              <div class="ui left floated description">
                <input type="file" name="input-image-0" data-image-num="0" class="input-image-upload" />
              </div>
              <button class="ui right floated button btn-del-img" data-image-num="0">delete</button>
            </div>
          </div>
        </div>
        <div id="image1-div" class="item">
          <div class="image">
            <img id="img-preview1" src="">
          </div>
          <div class="content">
            <div class="extra">
              <div class="ui left floated description">
                <input type="file" name="input-image-1" data-image-num="1" class="input-image-upload" />
              </div>
              <button class="ui right floated button btn-del-img" data-image-num="1">delete</button>
            </div>
          </div>
        </div>
        <div id="image2-div" class="item">
          <div class="image">
            <img id="img-preview2" src="">
          </div>
          <div class="content">
            <div class="extra">
              <div class="ui left floated description">
                <input type="file" name="input-image-2" data-image-num="2" class="input-image-upload" />
              </div>
              <button class="ui right floated button btn-del-img" data-image-num="2">delete</button>
            </div>
          </div>
        </div>
        <div id="image3-div" class="item">
          <div class="image">
            <img id="img-preview3" src="">
          </div>
          <div class="content">
            <div class="extra">
              <div class="ui left floated description">
                <input type="file" name="input-image-3" data-image-num="3" class="input-image-upload" />
              </div>
              <button class="ui right floated button btn-del-img" data-image-num="3">delete</button>
            </div>
          </div>
        </div>
        <div id="image4-div" class="item">
          <div class="image">
            <img id="img-preview4" src="">
          </div>
          <div class="content">
            <div class="extra">
              <div class="ui left floated description">
                <input type="file" name="input-image-4" data-image-num="4" class="input-image-upload" />
              </div>
              <button class="ui right floated button btn-del-img" data-image-num="4">delete</button>
            </div>
          </div>
        </div>
        <div id="image5-div" class="item">
          <div class="image">
            <img id="img-preview5" src="">
          </div>
          <div class="content">
            <div class="extra">
              <div class="ui left floated description">
                <input type="file" name="input-image-5" data-image-num="5" class="input-image-upload" />
              </div>
              <button class="ui right floated button btn-del-img" data-image-num="5">delete</button>
            </div>
          </div>
        </div>
        <div id="image6-div" class="item">
          <div class="image">
            <img id="img-preview6" src="">
          </div>
          <div class="content">
            <div class="extra">
              <div class="ui left floated description">
                <input type="file" name="input-image-6" data-image-num="6" class="input-image-upload" />
              </div>
              <button class="ui right floated button btn-del-img" data-image-num="6">delete</button>
            </div>
          </div>
        </div>
        <div id="image7-div" class="item">
          <div class="image">
            <img id="img-preview7" src="">
          </div>
          <div class="content">
            <div class="extra">
              <div class="ui left floated description">
                <input type="file" name="input-image-7" data-image-num="7" class="input-image-upload" />
              </div>
              <button class="ui right floated  button btn-del-img" data-image-num="7">delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <button id="btn-save" class="ui primary button">Save and close</button>
    <button id="btn-delete" class="ui negative button">Delete this product</button>
    <button id="btn-cancel" class="ui button">Canel</button>
  </form>
  <div id="form-error" class="ui bottom big attached error message" style="display: none">
    <div class="header">
      Data not save due to below error(s):
    </div>
    <ul id="field-errors" class="list">
      <li>...</li>
    </ul>
  </div>
</div>
`;

/**
 * Products screen
 */
export class ScreenProducts {
  constructor(app) {
    console.assert(app != null);

    this._tagDiv = '#screen-products';
    this._quillDspt = null;
    this._app = app;
    this._userRec = app.getUserRec();
    this._curProduct = null; // Current user selected product JSON
    this._formMode = null; // Current form mode
  }

  setMainScreen() {
    console.log('setMainScreen()');

    $('#app').html(template);
    this.updatePageHead(true);
  } // setMainScreen()

  setupEvents() {
    console.log('setupEvents()');

    // SemanticUI initialisation
    $('.checkbox').checkbox();
    // $('.ui.sidebar').sidebar({
    //   context: $('.bottom.segment')
    // }).sidebar('attach events', '.menu .item');
    $('#btn-save').off().on('click', this.onBtnSave.bind(this));
    $('#btn-delete').off().on('click', this.onBtnDelete.bind(this));
    $('#btn-cancel').off().on('click', this.onBtnCancel.bind(this));
    $('#btn-addproduct').off().on('click', this.onBtnAddProduct.bind(this));
    $('#product-input-form').find('.input-image-upload').off().on('change', this.onPhotoInputChanged.bind(this));
    $('.product-item').off().on('click', this.onProductItemClick.bind(this));
    $('.btn-del-img').off().on('click', this.onRemoveProdImgClick.bind(this));
  } // setupEvents()

  screenStart() {
    console.log('screenStart()');

    // At screen startup, display the products list
    this.renderProductsListMarkup();
  } // start()

  onPhotoInputChanged(e) {
    console.log('onPhotoInputChanged()');

    let input = e.currentTarget;
    let imageNum = $(input).data('image-num');
    let $img = $(`#img-preview${imageNum}`);

    // Read the file
    if (input.files && input.files[0]) {
      let reader = new FileReader();

      reader.onloadend = function(e) {
        // Resize the image for preview
        Util.resizeFileInputImageToDataUrl(this.result, 150).done(async (data) => {
          $img.attr('src', data);
        });
      };

      reader.readAsDataURL(input.files[0]);
    }
  } // onPhotoInputChanged()

  async onBtnSave(e) {
    console.log('onBtnSave()');

    e.preventDefault();
    $(e.currentTarget).addClass('loading disable');
    let $form = $('#product-input-form');
    let productId = $form.find('input[name="product-id"]').val().trim();
    let name = $form.find('input[name="name"]').val().trim();
    let description = this._quillDspt.getText().trim();
    let dsptDelta = this._quillDspt.getContents();
    let regularPrice = $form.find('input[name="regular-price"]').val().trim();
    let sellPrice = $form.find('input[name="sell-price"]').val().trim();
    let tax = $form.find('input[name="tax"]').val().trim();
    let isActive = $('#active').checkbox('is checked');

    // Validate the form entries
    let errMsg = [];
    if (productId === '') {
      errMsg.push('Product ID cannot empty');
    }
    if (this._userRec.products.find(p => p.id === productId) != null) {
      errMsg.push('Product ID is already exists');
    }
    if (name === '') {
      errMsg.push('Product name cannot empty');
    }
    if (isNaN(regularPrice)) {
      errMsg.push('Regular price is not a numeric value');
    }
    if (isNaN(tax)) {
      errMsg.push('Tax is not a numeric value');
    }
    if (sellPrice == '') {
      sellPrice = null;
    } else {
      if (isNaN(sellPrice)) {
        errMsg.push('Selling price is not a numeric value');
      } else {
        sellPrice = parseFloat(numeral(sellPrice).format('0.00'));
      }
    }

    regularPrice = parseFloat(numeral(regularPrice).format('0.00'));
    tax = parseFloat(numeral(tax).format('0.00'));

    // Display the error list
    let $prodScr = $('#screen-products');
    if (errMsg.length > 0) {
      $(e.currentTarget).removeClass('loading disable');
      let mkup = '';
      for (let i = 0; i < errMsg.length; ++i) {
        mkup += '<li>' + errMsg[i] + '</li>';
      }
      $prodScr.find('#field-errors').html(mkup);
      $prodScr.find('#form-error').show();
      return;
    } else {
      $prodScr.find('#field-errors').html('');
      $prodScr.find('#form-error').hide();
    }

    // When no errors, upload the images
    let { image0, image1, image2, image3, image4, image5, image6, image7 } = await this.uploadProductImages(productId);

    if (this._formMode === 'addnew') {
      let product = {
        productId,
        name,
        description,
        dsptDelta,
        regularPrice,
        sellPrice,
        tax,
        isActive,
        image0,
        image1,
        image2,
        image3,
        image4,
        image5,
        image6,
        image7
      };
      this._userRec.products.push(product);
    } else if (this._formMode === 'edit') {
      this._curProduct.productId = productId;
      this._curProduct.name = name;
      this._curProduct.description = description;
      this._curProduct.dsptDelta = dsptDelta;
      this._curProduct.regularPrice = regularPrice;
      this._curProduct.sellPrice = sellPrice;
      this._curProduct.tax = tax;
      this._curProduct.isActive = isActive;
      let s3 = await Util.initAwsS3();
      if (image0) {
        if (this._curProduct.image0) {
          let key = Util.s3PathToKey(this._curProduct.image0);
          await Util.removeS3File(s3, key);
        }
        this._curProduct.image0 = image0;
      }
      if (image1) {
        if (this._curProduct.image1) {
          let key = Util.s3PathToKey(this._curProduct.image1);
          await Util.removeS3File(s3, key);
        }
        this._curProduct.image1 = image1;
      }
      if (image2) {
        if (this._curProduct.image2) {
          let key = Util.s3PathToKey(this._curProduct.image2);
          await Util.removeS3File(s3, key);
        }
        this._curProduct.image2 = image2;
      }
      if (image3) {
        if (this._curProduct.image3) {
          let key = Util.s3PathToKey(this._curProduct.image3);
          await Util.removeS3File(s3, key);
        }
        this._curProduct.image3 = image3;
      }
      if (image4) {
        if (this._curProduct.image4) {
          let key = Util.s3PathToKey(this._curProduct.image4);
          await Util.removeS3File(s3, key);
        }
        this._curProduct.image4 = image4;
      }
      if (image5) {
        if (this._curProduct.image5) {
          let key = Util.s3PathToKey(this._curProduct.image5);
          await Util.removeS3File(s3, key);
        }
        this._curProduct.image5 = image5;
      }
      if (image6) {
        if (this._curProduct.image6) {
          let key = Util.s3PathToKey(this._curProduct.image6);
          await Util.removeS3File(s3, key);
        }
        this._curProduct.image6 = image6;
      }
      if (image7) {
        if (this._curProduct.image7) {
          let key = Util.s3PathToKey(this._curProduct.image7);
          await Util.removeS3File(s3, key);
        }
        this._curProduct.image7 = image7;
      }
    } else {
      console.error(`Unhandled form mode: ${this._formMode}!`);
      debugger;
    }

    await this._app.saveUserRec();
    $(e.currentTarget).removeClass('loading disable');
    alertify.success('Data saved successfully'); // https://alertifyjs.com/

    this.renderProductsListMarkup();
  } // onBtnSave()

  onBtnDelete(e) {
    console.log('onBtnDelete()');

    e.preventDefault();
    alertify.confirm('Are you sure to delete this product?', async function() {
      $(e.currentTarget).addClass('loading disable');
      await this.deleteAllProductImages(this._curProduct);
      this._userRec.products = this._userRec.products.filter(p => p.productId != this._curProduct.productId);

      $(e.currentTarget).addClass('loading disabled');
      await this._app.saveUserRec();
      $(e.currentTarget).removeClass('loading disabled');

      this.renderProductsListMarkup();
    }.bind(this));
  } // onBtnDelete()

  onBtnCancel(e) {
    console.log('onBtnCancel()');

    e.preventDefault();
    this.renderProductsListMarkup();
  } // onBtnCancel()

  onBtnAddProduct(e) {
    console.log('onBtnAddProduct()');

    e.preventDefault();
    this._formMode = 'addnew';
    this.renderInputFormMarkup();
    this.updatePageHead(false);
  } // onBtnAddProduct()

  onProductItemClick(e) {
    console.log('onProductItemClick()');

    e.preventDefault();
    let productId = $(e.currentTarget).data('product-id');
    this.editProduct(productId);
  } // onProductItemClick()

  async onRemoveProdImgClick(e) {
    console.log('onRemoveProdImgClick()');

    e.preventDefault();
    let imageNum = $(e.currentTarget).data('image-num');
    let image = this._curProduct[`image${imageNum}`];
    if (image) {
      let s3 = await Util.initAwsS3();
      let imgUrl = this._curProduct[`image${imageNum}`];
      let key = Util.s3PathToKey(imgUrl);
      let resp = await Util.removeS3File(s3, key);
      this._curProduct[`image${imageNum}`] = null;
      $(`#img-preview${imageNum}`).attr('src', ' ');
    }
  } // onRemoveProdImgClick()

  editProduct(productId) {
    console.log(`editProduct(${productId})`);

    this._curProduct = this._userRec.products.find(p => p.productId == productId);
    console.assert(this._curProduct);
    this._formMode = 'edit';
    this.renderInputFormMarkup();

    // Assign the form values
    let $form = $('#product-input-form');
    $form.find('input[name="product-id"]').val(this._curProduct.productId);
    $form.find('input[name="name"]').val(this._curProduct.name);
    this._quillDspt.setContents(this._curProduct.dsptDelta);

    $form.find('input[name="regular-price"]').val(this._curProduct.regularPrice);
    $form.find('input[name="tax"]').val(this._curProduct.tax);
    $form.find('input[name="sell-price"]').val(this._curProduct.sellPrice);
    $form.find('#active').checkbox('set checked');
    if (this._curProduct.image0) {
      $form.find('#img-preview0').attr('src', this._curProduct.image0);
    }
    if (this._curProduct.image1) {
      $form.find('#img-preview1').attr('src', this._curProduct.image1);
    }
    if (this._curProduct.image2) {
      $form.find('#img-preview2').attr('src', this._curProduct.image2);
    }
    if (this._curProduct.image3) {
      $form.find('#img-preview3').attr('src', this._curProduct.image3);
    }
    if (this._curProduct.image4) {
      $form.find('#img-preview4').attr('src', this._curProduct.image4);
    }
    if (this._curProduct.image5) {
      $form.find('#img-preview5').attr('src', this._curProduct.image5);
    }
    if (this._curProduct.image6) {
      $form.find('#img-preview6').attr('src', this._curProduct.image6);
    }
    if (this._curProduct.image7) {
      $form.find('#img-preview7').attr('src', this._curProduct.image7);
    }
    this.updatePageHead(false);
  }

  initQuillEditor() {
    console.log('initQuillEditor()');

    let self = this;
    // Initialise the Quill editor
    var quill = new Quill('#item-dspt', {
      theme: 'snow',
      placeholder: 'You can enter one or more paragraph. Formatting, colouring are also support.',
      modules: {
        toolbar: {
          container: '#quill-toolbar',
        }
      }
    });
    quill.on('selection-change', function(range, oldRange, source) {
      if (range) {
        if (range.length == 0) {
          // console.log('User cursor is on', range.index);
          if (range.index === 0 && self._quillDspt.getText() === '\n') {
            self._quillDspt.setText(' ');
          }
        } else {
          var text = self._quillDspt.getText(range.index, range.length);
          // console.log('User has highlighted', text);
        }
      } else {
        // console.log('Cursor not in the editor');
      }
    });
    this._quillDspt = quill;
  }

  renderInputFormMarkup() {
    console.assert(inputFormTemplate);

    $('#products-page-main-func').html(inputFormTemplate);
    $('#active').checkbox('set checked');
    this.initQuillEditor();
    this.setupEvents();
  } // renderInputFormMarkup()

  renderProductsListMarkup() {
    console.log('renderProductsListMarkup()');

    // Semantic-UI list: https://semantic-ui.com/elements/list.html
    let mkup = '<div class="ui list">';
    this._userRec.products.forEach(product => {
      console.assert(product.productId);
      console.assert(product.name);
      // console.assert(product.description);
      console.assert(product.regularPrice);
      // console.assert(product.sellPrice);
      // console.assert(product.photos);

      // Get the product image thumbnail. Use http://upload.mycms.simonho.net/assets/question_mark_150.png if no images found
      let imageSrc = product.image0 ? product.image0 :
                      product.image1 ? product.image1 :
                      product.image2 ? product.image2 :
                      product.image3 ? product.image3 :
                      product.image4 ? product.image4 :
                      product.image5 ? product.image5 :
                      product.image6 ? product.image6 :
                      product.image7 ? product.image7 : "http://upload.mycms.simonho.net/assets/question_mark_150.png";

      mkup += `<div class="item">`;
      mkup += `  <img class="ui avatar image" src="${imageSrc}">`;
      mkup += `  <div class="content">`;
      mkup += `  <a data-product-id="${product.productId}" class="header product-item">${product.productId}</a>`;
      mkup += `  <div class="name">${product.name} - \$${Util.formatNumber(product.regularPrice)}</div>`;
      mkup += `  </div>`;
      mkup += `</div>`;
    });
    mkup += '</div>';

    $('#products-page-main-func').html(mkup);
    this._formMode = null;
    this._curProduct = null;
    this.setupEvents();
    this.updatePageHead(true);
  } // renderProductsListMarkup()

  saveToDb(e) {
    console.log('saveToDb()');
    
    evt.preventDefault();
    var self = this;

    // Disable all clickable elements to prevent duplicated actions
    $(evt.currentTarget).addClass('loading');
    $("a").off('click');
//    $('button').addClass('disabled');

    Util.preProcessQuillContents(this._quillDspt).then(function() {
      var delta = self._quillDspt.getContents();
      var text = self._quillDspt.getText();
      var html = self._quillDspt.root.innerHTML; // Get the Quill HTML markup where user inputted
      console.log('Result image size (in base64 string: ' + html.length);
      return self.SaveAnswerToDb('live', text, html, delta, true);
    }).then(function(status, error) {
      $(e.target).removeClass('loading');
    });
  } // saveToDb()

  // Resize & upload 4 product images to S3
  async uploadProductImages(productId) {
    console.log('uploadProductImages()');

    let s3 = await Util.initAwsS3();
    let $form = $('#product-input-form');

    // Process the photos
    let $image0 = $form.find('input[name="input-image-0"]');
    let s3result0 = await this.resizeImageAndUpload(s3, $image0[0], productId, '00');
    let $image1 = $form.find('input[name="input-image-1"]');
    let s3result1 = await this.resizeImageAndUpload(s3, $image1[0], productId, '01');
    let $image2 = $form.find('input[name="input-image-2"]');
    let s3result2 = await this.resizeImageAndUpload(s3, $image2[0], productId, '02');
    let $image3 = $form.find('input[name="input-image-3"]');
    let s3result3 = await this.resizeImageAndUpload(s3, $image3[0], productId, '03');
    let $image4 = $form.find('input[name="input-image-4"]');
    let s3result4 = await this.resizeImageAndUpload(s3, $image4[0], productId, '04');
    let $image5 = $form.find('input[name="input-image-5"]');
    let s3result5 = await this.resizeImageAndUpload(s3, $image5[0], productId, '05');
    let $image6 = $form.find('input[name="input-image-6"]');
    let s3result6 = await this.resizeImageAndUpload(s3, $image6[0], productId, '06');
    let $image7 = $form.find('input[name="input-image-7"]');
    let s3result7 = await this.resizeImageAndUpload(s3, $image7[0], productId, '07');

    let image0 = s3result0 ? 'http://upload.mycms.simonho.net/' + s3result0.key : null;
    let image1 = s3result1 ? 'http://upload.mycms.simonho.net/' + s3result1.key : null;
    let image2 = s3result2 ? 'http://upload.mycms.simonho.net/' + s3result2.key : null;
    let image3 = s3result3 ? 'http://upload.mycms.simonho.net/' + s3result3.key : null;
    let image4 = s3result4 ? 'http://upload.mycms.simonho.net/' + s3result4.key : null;
    let image5 = s3result5 ? 'http://upload.mycms.simonho.net/' + s3result5.key : null;
    let image6 = s3result6 ? 'http://upload.mycms.simonho.net/' + s3result6.key : null;
    let image7 = s3result7 ? 'http://upload.mycms.simonho.net/' + s3result7.key : null;

    return { image0, image1, image2, image3, image4, image5, image6, image7 };
  } // uploadProductImages()

  async resizeImageAndUpload(s3, input, productId, imageNum) {
    console.log('resizeImageAndUpload()');
    console.assert(s3);
    console.assert(input);
    console.assert(productId);
    console.assert(imageNum);

    return new Promise((resolve, reject) => {
      let folderName = `userdata/${this._userRec.id}`;
      // let fileName = 'prodimg_' + new Date().getTime() + '.jpg';
      let fileName = `prodimg_${productId}_${imageNum}.jpg`;
      if (input.files == null || input.files[0] == null) {
        resolve(null);
      } else {
        let file = input.files[0];
        let reader = new FileReader();
        reader.onload = async function(e) {
          let blob = await Util.resizeFileInputImageToBlob(this.result, 800)
          let result = await Util.uploadBlobToS3(s3, folderName, fileName, blob);
          resolve(result);
        }
        reader.onerror = function(err) {
          debugger
          reject(err);
        }
        reader.readAsDataURL(file);
      }
    });
  } // resizeImageAndUpload()

  updatePageHead(btnAddStatue) {
    console.log('updatePageHead()');

    let $head = $('#products-page-div');
    $head.find('.value').html(this._userRec.products.length);
    if (btnAddStatue != null) {
      if (btnAddStatue) {
        $head.find('#btn-addproduct').removeClass('disabled');
      } else {
        $head.find('#btn-addproduct').addClass('disabled');
      }
    }
  } // updatePageHead()

  async deleteAllProductImages(product) {
    console.log('deleteAllProductImages()');
    console.assert(product);

    const domain = 'upload.mycms.simonho.net';
    let imgUrl, si, key, resp;

    let s3 = await Util.initAwsS3();
    if (product.image0) {
      let key = Util.s3PathToKey(product.image0);
      resp = await Util.removeS3File(s3, key);
    }
    if (product.image1) {
      let key = Util.s3PathToKey(product.image1);
      resp = await Util.removeS3File(s3, key);
    }
    if (product.image2) {
      let key = Util.s3PathToKey(product.image2);
      resp = await Util.removeS3File(s3, key);
    }
    if (product.image3) {
      let key = Util.s3PathToKey(product.image3);
      resp = await Util.removeS3File(s3, key);
    }
    if (product.image4) {
      let key = Util.s3PathToKey(product.image4);
      resp = await Util.removeS3File(s3, key);
    }
    if (product.image5) {
      let key = Util.s3PathToKey(product.image5);
      resp = await Util.removeS3File(s3, key);
    }
    if (product.image6) {
      let key = Util.s3PathToKey(product.image6);
      resp = await Util.removeS3File(s3, key);
    }
    if (product.image7) {
      let key = Util.s3PathToKey(product.image7);
      resp = await Util.removeS3File(s3, key);
    }
  } // deleteAllProductImages()

} // class ScreenProducts
