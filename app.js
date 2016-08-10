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

app.use('/', routes);
app.use('/oauth/twitchtv', twitchAuth);

// * ALEXA ****
// *****
var alexa = require('./helpers/alexa-app.js');
alexa.launch(function(request,response) {
	response.say("You launched the app!");
});
// alexa.dictionary = {"names":["matt","joe","bob","bill","mary","jane","dawn"]};
// alexa.intent("nameIntent",
// 	{
// 		"slots":{"NAME":"LITERAL"}
// 		,"utterances": [
// 			"my {name is|name's} {names|NAME}"
// 			,"set my name to {names|NAME}"
// 		]
// 	},
// 	function(request,response) {
// 		response.say("Success!");
// 	}
// );
alexa.intent("getTopGames",
	{
		"slots":""
		,"utterances": [
			"get {my|the|} top games"
		]
	},
	function(request,response) {
		twitch.getTopGames(null, function (res) {
      response.say('The top game is ' + res.top[0].game.name);

      response.send();
    });
    return false;
	}
);
alexa.express(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
