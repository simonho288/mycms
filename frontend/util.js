'use strict'

import 'numeral';
import { format } from 'date-fns';

const Constant = {
  numberFormat: '0,0',
  currencyFormat: '$0,0[.]00',
  dateFormat: 'YYYY-MM-DD',
  datetimeFormat: 'YYYY-MM-DD h:mm',
  urlRegex: /(https?)\:\/\/[0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*(:(0-9)*)*(\/?)([a-zA-Z0-9\-\.\?\,\'\/\\\+&amp;%\$#_]*)?/gi
  // urlRegex: /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi
};

export let Util = {

  testUrl: function(url) {
    var regex = new RegExp(Constant.urlRegex)
    return url.match(regex);
  },

  preProcessQuillContents: function(quill) {
    console.log('preProcessQuillContents()');

    var $dfd = $.Deferred();
    var defArray = []; // jQUery deferred array. WIll be used for "promise.all"

    var deltas = quill.getContents();
    if (deltas.ops) {
      for (var i = 0; i < deltas.ops.length; ++i) {
        var delta = deltas.ops[i];
        // console.log(delta);

        // Is it a image delta?
        if (delta.insert && delta.insert.image) {
          // Perform image resize
          var width = 600;
          var percentRe = RegExp(/\d+(%)/g) // filter out '100%', 90%, *% ...
          if (delta.attributes && delta.attributes.width && !percentRe.test(delta.attributes.width)) {
            width = parseInt(delta.attributes.width);
          }

          defArray.push(this.resizeQuillDeltaImage(delta, width));
        }
      }
    } else {
      console.error('It should has ops in Quill delta but now not found!');
    }

    // "Promise all" deferred array. Wait for all image resize done
    $.when.apply(undefined, defArray).then(function() {
      quill.setContents(deltas);
      $dfd.resolve();
    });
    return $dfd;
  },

  // Resize (reduce resolution) the image(s) which found in Quill's delta
  // THis is defer based
  resizeQuillDeltaImage: function(delta, width) {
    console.assert(delta);
    console.assert(delta.insert);
    console.assert(delta.insert.image);

    var self = this;
    var $dfd = $.Deferred();
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var image = new Image();
    image.onload = function() {
      if (image.width > width) {
        ctx.drawImage(image, 0, 0);
        delta.insert.image = self.resizeImageToDataUrl(image, width);

        // Make every image display as full width
        if (delta.attributes == null) {
          delta.attributes = {
            width: '100%'
          };
        } else {
          delta.attributes.width = '100%';
        }
      }
      $dfd.resolve();
    };
    image.src = delta.insert.image;

    return $dfd;
  },

  makeSquareImage: function(image, dimension) {
    let canvas = document.createElement('canvas');
    canvas.width = dimension;
    canvas.height = dimension;
    let ctx = canvas.getContext('2d');
    let dim = this.calAspectRatio(image.width, image.height, dimension);
    ctx.drawImage(image, dim.dx, dim.dy, dim.width, dim.height);
    return canvas;
  },

  resizeFileInputImageToDataUrl: function(data, dimension) {
    console.log('resizeFileInputImageToDataUrl()');
    console.assert(data);
    console.assert(dimension);

    let self = this;
    let $dfd = $.Deferred();
    let image = new Image();
    image.onload = function() {
      let canvas = self.makeSquareImage(image, dimension);
      $dfd.resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    image.src = data;

    return $dfd;
  }, // resizeFileInputImageToDataUrl()

  resizeFileInputImageToBlob(data, dimension) {
    console.assert(data);
    console.assert(dimension);

    let self = this;
    return new Promise((resolve, reject) => {
      let image = new Image();
      image.onload = async function() {
        let canvas = self.makeSquareImage(image, dimension);
        canvas.toBlob(function(blob) {
          resolve(blob);
        }, 'image/jpeg', 0.8);
      };
      image.src = data;
    });
  }, // resizeFileInputImageToBlob()

  calAspectRatio(width, height, dimension) {
    let aspect = width / height;
    let dstwid, dstheg;
    if (width > height) {
      dstheg = dimension;
      dstwid = Math.floor(dimension * aspect);
    } else {
      dstwid = dimension;
      dstheg = Math.floor(dimension / aspect);
    }
    return {
      aspect: aspect,
      width: dstwid,
      height: dstheg,
      dx: dimension / 2 - dstwid / 2,
      dy: dimension / 2 - dstheg / 2,
    };
  },

  // Resize (reduce image resolution) a HTML5 image using HTML5 canvas.
  // This returns JPEG image base64 string instead of binary
  resizeImageToDataUrl(img, dimension) {
    console.log('resizeImageToDataUrl()');

    let dim = this.calAspectRatio(img.width, img.height, dimension);

    // Create the canvas
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext("2d");
    canvas.width = dim.width;
    canvas.height = dim.height;

    ctx.drawImage(img, 0, 0, dim.width, dim.height);

    return canvas.toDataURL('image/jpeg', 0.8);
  }, // resizeImageToDataUrl

  resizeImageToBlob(img, dimension) {
    console.log('resizeImageToBlob()');

    return new Promise((resolve, reject) => {
      var aspect = img.width / img.height;
      var dstwid, dstheg;
      if (img.width > img.height) {
        dstwid = dimension;
        dstheg = Math.floor(dimension / aspect);
      } else {
        dstheg = dimension;
        dstwid = Math.floor(dimension * aspect);
      }
  
      // Create the canvas
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext("2d");
      canvas.width = dstwid;
      canvas.height = dstheg;
  
      // var x = dimension / 2 - dstwid / 2;
      // var y = dimension / 2 - dstheg / 2;
      ctx.drawImage(img, 0, 0, dstwid, dstheg);
  
      canvas.toBlob(function(blob) {
        resolve(blob);
      }, 'image/jpeg', 0.8);
    });
  }, // resizeImageToBlob

  async getUserRecord() {
    console.log('getUserRecord()');

    // Get the user email from localStorage
    let userId = localStorage.getItem('user_id');

    // Retrieve most update userRec from server
    let res = await fetch(`/api/get-user-json/${encodeURIComponent(userId)}`, {
      headers: {
        'Accept': 'application/json',
      }
    });
    let userRec = await res.json();

    // Save the userRec to localStorage
    // console.log(userRec);
    return userRec;
  }, // getUserRecord()

  // Requires AWS script:
  // <script src="https://sdk.amazonaws.com/js/aws-sdk-2.283.1.min.js"></script>
  // Must configured AWS Cognito "My CMS":
  // https://ap-southeast-1.console.aws.amazon.com/cognito/federated/?region=ap-southeast-1
  // Ref:
  // https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/s3-example-photo-album.html
  initAwsS3() {
    console.log('initAwsS3()');

    const bucketName = 'upload.mycms.simonho.net';
    const bucketRegion = 'ap-southeast-1';
    const poolId = 'ap-southeast-1:55716aa6-1f60-4f94-b7ce-1d8e82db9181'; // Obtain in AWS Federated Identities->Identity browser
    return new Promise((resolve, reject) => {
      AWS.config.update({
        region: bucketRegion,
        credentials: new AWS.CognitoIdentityCredentials({
          IdentityPoolId: poolId
        })
      });
      AWS.config.credentials.get(function (err) {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          console.log(AWS.config.credentials);
        }
      });
      let s3 = new AWS.S3({
        apiVersion: '2006-03-01',
        params: { Bucket: bucketName }
      });
  
      resolve(s3);
    });
  }, // initAwsS3()

  // Upload the blob to Nodejs backend /upload_image
  async uploadBlob(s3, folderName, fileName, datum) {
    console.log('uploadBlob()');
    console.assert(s3);
    console.assert(folderName);
    console.assert(fileName);
    console.assert(datum);

    let formData = new FormData();
    formData.append('prodimg', datum);
    // formData.append('folder', folderName);
    // formData.append('file', fileName);

    let param = `dir=${folderName}&file=${fileName}`;
    let res = await fetch('/upload_image?' + param, {
      method: 'post',
      // header: {
      //   'Content-Type': 'multipart/form-data'
      // },
      body: formData
    });

    return await res.json();
  }, // uploadBlob()

  uploadBlobToS3(s3, folderName, fileName, datum) {
    console.log('uploadBlobToS3()');
    console.assert(s3);
    console.assert(folderName);
    console.assert(fileName);
    console.assert(datum);

    return new Promise((resolve, reject) => {
      // let folderKey = encodeURIComponent(folderName) + '//';
      let folderKey = folderName + '/';
      let fileKey = folderKey + fileName;
      // Use S3 MangedUpload class as it supports multipart uploads
      s3.upload({
        Key: fileKey,
        Body: datum,
        ACL: 'public-read'
      }, function(err, data) {
        if (err) {
          reject('There was an error uploading file: ' + err.message);
        } else {
          resolve(data);
        }
      });
    });
  }, // uploadBlobToS3()

  async removeS3File(s3, filePath) {
    console.log('removeS3File()');
    console.assert(s3);
    console.assert(filePath);

    return new Promise((resolve, reject) => {
      let param = {
        Key: filePath
      };
      s3.deleteObject(param, function(err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }, // removeS3File()

  s3PathToKey(url) {
    console.log('s3PathToKey()');
    console.assert(url);

    const domain = 'upload.mycms.simonho.net';
    let si = url.indexOf(domain);
    let key = url.substring(si + domain.length + 1, url.length); // remove the 1st '/' in key
    return key;
  }, // s3PathToKey()

  formatNumber(n) {
    return numeral(n).format(Constant.numberFormat);
  },

  formatCurrency(n) {
    return numeral(n).format(Constant.currencyFormat);
  },

  formatDate(d) {
    if (d == null) {
      return '';
    }
    if (typeof d === 'string') {
      d = new Date(d)
    }
    return format(d, 'yyyy-MM-dd');
  },

  formatDatetime(d) {
    if (d == null) {
      return '';
    }
    if (typeof d === 'string') {
      d = new Date(d)
    }
    return format(d, 'yyyy-MM-dd h:maa').toLowerCase();
  },

  parseCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },

  getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  },

} // Util