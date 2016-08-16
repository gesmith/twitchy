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
      response.say(`The top games are ${topGames}`).shouldEndSession(false);

      response.send();
    });
    return false;
  }
);

alexa.intent("getMyFollowerCount", {
    "slots": {},
    "utterances": [
      "how {many|much} followers {|do|does} {my|I} {stream|channel|I} have",
      "get my {|stream's|channel's} {follower|followers} count"
    ]
  },
  function(request, response) {
    var token = request.sessionDetails.accessToken;
    twitch.getAuthenticatedUserChannel(token, function(req, res) {
      var followerCount = res.followers;
      response.say(`Your stream has ${followerCount} followers.`).shouldEndSession(false).send();
    });
    return false;
  }
);

alexa.intent('updateChannelTitle', {
    "slots": {
      "STATUS": "CHANNEL_TITLE"
    },
    "utterances": [
      "{set|update|make|change} {|my|the} {stream|stream's|channel|channel's} {title|status} {|to} {-|STATUS}"
    ]
  },
  function(request, response) {
    var token = request.sessionDetails.accessToken;
    twitch.getAuthenticatedUserChannel(token, function(userReq, userRes) {
      var username = userRes.name;
      var status = request.slot('STATUS');
      var channelOptions = {
        channel: {
          status: status
        }
      }
      // requires channel_editor scope
      twitch.updateChannel(username, token, channelOptions, function (req, res) {
        // console.log(req);
        // console.log(res);
        response.say('Your title has been updated.').shouldEndSession(false).send();
      });
      return false;
    });
    return false;
  }
);

alexa.intent('startCommercialForDuration', {
    "slots": {
      "DURATION": "COMMERCIAL_DURATION"
    },
    "utterances": [
      "{start|play} {|a|an|the} {commercial|ad} for {-|DURATION} {|seconds}"
    ]
  },
  function(request, response) {
    var token = request.sessionDetails.accessToken;
    twitch.getAuthenticatedUserChannel(token, function(userReq, userRes) {
      var channel = userRes.name;
      var duration = request.slot('DURATION') || 30;
      var params = {
        length: duration
      };
      twitch.startCommercial(channel, token, params, function (req, res) {
        response.say(`Starting a ${duration} second commercial.`).shouldEndSession(false).send();
      });
      return false;
    });
    return false;
  }
);

alexa.intent('startCommercial', {
    "slots": {},
    "utterances": [
      "{start|play} {|a|an|the} {commercial|ad}"
    ]
  },
  function(request, response) {
    var token = request.sessionDetails.accessToken;
    twitch.getAuthenticatedUserChannel(token, function(userReq, userRes) {
      var channel = userRes.name;
      twitch.startCommercial(channel, token, {}, function (req, res) {
        response.say('Commercial starting.').shouldEndSession(false).send();
      });
      return false;
    });
    return false;
  }
);
// just for testing purposes.
// alexa.intent('getStreamKey', {
//     "slots": {},
//     "utterances": [
//       "get {|my|the} {stream|stream's} key"
//     ]
//   },
//   function(request, response) {
//     var token = request.sessionDetails.accessToken;
//     twitch.getAuthenticatedUserChannel(token, function(req, res) {
//       var streamKey = res.stream_key;
//       console.log(res);
//       response.say(streamKey).send();
//     });
//     return false;
//   }
// );

alexa.express(app);

// Manually hook the handler function into express
app.post('/twixa',function(req,res) {
  alexa.request(req.body)        // connect express to alexa-app
    .then(function(response) { // alexa-app returns a promise with the response
      res.json(response);      // stream it to express' output
    });
});

module.exports = app;
