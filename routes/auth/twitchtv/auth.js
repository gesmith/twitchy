var express = require('express');
var router = express.Router();
var twitch = require('../../../api/twitchtv/settings.js');

router.get('/', (req, res) => {
  var authorizationurl = twitch.getAuthorizationUrl();
  res.redirect(authorizationurl);
});

module.exports = router;
