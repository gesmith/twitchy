var express = require('express');
var router = express.Router();
var twitch = require('../../../helpers/twitch.js');

var state = '';

router.get('/', (req, res) => {
  var authorizationurl = twitch.getAuthorizationUrl();
  state = req.query.state;
  res.redirect(authorizationurl);
});

router.get('/callback',
  function(req, res) {
    var code = req.query.code;
    twitch.getAccessToken(code, function(err, body) {
      if (err) {
        console.log(err);
      } else {
        var amazonAuthUrl = `https://pitangui.amazon.com/spa/skill/account-linking-status.html?vendorId=${process.env.AMAZON_VENDOR_ID}#access_token=${body.access_token}&state=${state}&client_id=${process.env.AMAZON_CLIENT_ID}&response_type=Bearer`;
        res.redirect(amazonAuthUrl);
      }
    })
  });

module.exports = router;
