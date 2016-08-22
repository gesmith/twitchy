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

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', routes);
app.use('/oauth/twitchtv', twitchAuth);

// * ALEXA *
var alexa = require('./helpers/alexa-app.js');
alexa.express(app);

// Manually hook the handler function into express
app.post('/twitchy',function(req,res) {
  alexa.request(req.body)        // connect express to alexa-app
    .then(function(response) { // alexa-app returns a promise with the response
      res.json(response);      // stream it to express' output
    });
});

module.exports = app;
