var express = require('express');
var router = express.Router();
var twitch = require('../../../api/twitchtv/settings.js');

var state = '';

router.get('/', (req, res) => {
  var authorizationurl = twitch.getAuthorizationUrl();
  console.log('!!!!!!! ' + req.query.state);
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
        config.ACCESS_TOKEN = body.access_token;
        // "vendorId=#{session[:vendor_id]}" \
        // "#access_token=#{access_token.token},#{access_token.secret}" \
        // "&state=#{session[:state]}" \
        // "&client_id=#{session[:client_id]}" \
        // '&response_type=Bearer'
        res.redirect(`https://pitangui.amazon.com/spa/skill/account-linking-status.html?vendorId=${process.env.AMAZON_VENDOR_ID}#access_token=${body.access_token}&state=${state}&client_id=${process.env.TWITCHTV_CLIENT_ID}&response_type=Bearer`);
      }
    })
  });

module.exports = router;
