var express = require('express');
var router = express.Router();
var twitch = require('../../../api/twitchtv/settings.js');
var config = require('../../../config/server');

router.get('/',
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
        res.redirect('/test');
      }
    })
  });

module.exports = router;
