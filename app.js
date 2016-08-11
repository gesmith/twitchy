var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var _ = require('lodash');
var dotenv = require('dotenv');
dotenv.load();

var routes = require('./routes/index');
var twitchAuth = require('./routes/oauth/twitchtv/index');

var twitch = require('./helpers/twitch.js');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', routes);
app.use('/oauth/twitchtv', twitchAuth);

// * ALEXA ****
// *****

var alexa = require('./helpers/alexa-app.js');

var reprompt = 'What did you say to me?';
alexa.launch(function(request, response) {
  response.say("You launched Twixa!");
});

alexa.intent("getTopGames", {
    "slots": {
      "LIMIT": "NUMBER"
    },
    "utterances": [
      "{|what|get} {|the} top {-|LIMIT} {|video} games"
    ]
  },
  function(request, response) {
    var limit = request.slot('LIMIT');
    var params = {};
    params.limit = limit || 5; // Default to the first 5 top games.

    twitch.getTopGames(params, function(req, res) {
      var topGames = _.map(res.top, 'game.name');
      console.log('Response: ' + topGames);
      response.say(`The top games are ${topGames}`);

      response.send();
    });
    return false;
  }
);

alexa.intent('getMyFollowerCount', {
    "slots": {},
    "uterrances": [
      "{|how|get} {|many|much} {followers|stream's} {|do|does} {my|I} {stream|channel|I} have"
    ]
  },
  function(request, response) {
    var token = request.sessionDetails.accessToken;
    twitch.getAuthenticatedUserChannel(token, function(req, res) {
      var followerCount = res.followers;
      response.say(`Your stream has ${followerCount} followers.`).send();
    });
    return false;
  }
);

alexa.intent('getStreamKey', {
    "slots": {},
    "uterrances": [
      "get {|my|the} {stream|stream's} key"
    ]
  },
  function(request, response) {
    var token = request.sessionDetails.accessToken;
    twitch.getAuthenticatedUserChannel(token, function(req, res) {
      var streamKey = res.stream_key;
      response.say(streamKey).send();
    });
    return false;
  }
);

// Manually hook the handler function into express
app.post('/twixa',function(req,res) {
  alexa.request(req.body)        // connect express to alexa-app
    .then(function(response) { // alexa-app returns a promise with the response
      res.json(response);      // stream it to express' output
    });
});

module.exports = app;
