var express = require('express');
var router = express.Router();
var twitch = require('../../../api/twitchtv/settings.js');
var config = require('../../../config/server');

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
        /*
         * body = {
         *   access_token: 'your authenticated user access token',
         *   scopes: [array of granted scopes]
         * }
         */

        // remove access token config storing after alexa account linking is setup.
        config.ACCESS_TOKEN = body.access_token;
        var amazonAuthUrl = `https://pitangui.amazon.com/spa/skill/account-linking-status.html?vendorId=${process.env.AMAZON_VENDOR_ID}#access_token=${body.access_token}&state=${state}&client_id=${process.env.AMAZON_CLIENT_ID}&response_type=Bearer`;
        res.redirect(amazonAuthUrl);
      }
    })
  });

module.exports = router;
