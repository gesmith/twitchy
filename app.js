var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var dotenv = require('dotenv');
dotenv.load();

var routes = require('./routes/index');
var twitchAuth = require('./routes/oauth/twitchtv/index');

var config = require('./config/server');

var twitch = require('./helpers/twitch.js');

var app = express();

// app.use('/user', function(req, res) {
//   twitch.getAuthenticatedUserChannel(config.ACCESS_TOKEN, function(request, response) {
//     console.log(response);
//     res.render('test', {
//       data: response
//     });
//   });
// });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(require('node-sass-middleware')({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true,
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', routes);
app.use('/oauth/twitchtv', twitchAuth);

// * ALEXA ****
// *****
var alexa = require('./helpers/alexa-app.js');
var reprompt = 'What did you say to me?';

alexa.launch(function(request, response) {
  console.log('launch');
  response.say("You launched the app!").reprompt(reprompt);
});

alexa.intent("getTopGames", {
    "slots": {
      "LIMIT": "NUMBER"
    },
    "utterances": [
      "{|my|the} top {-|LIMIT} {|video} games"
    ]
  },
  function(request, response) {
    var limit = request.slot('LIMIT');
    var params = {};
    // Default to the first 5 top games.
    params.limit = limit || 5;

    twitch.getTopGames(params, function(req, res) {
      var topGame = res.top[0].game.name;
      console.log('Response: ' + topGame);
      response.say(`The top game is ${topGame}`);

      response.send();
    }).catch(function(err) {
      console.log('Error');
      response.say('There was an error getting that information from Twitch.').send();
    });
    return false;
  }
);
alexa.express(app, "/echo/");

module.exports = app;
