'use strict';
module.exports = function (io) {
  var express = require('express');
  var session = require('express-session');
  var bodyParser = require('body-parser');
  var cookieParser = require('cookie-parser');
  var SessionStore = require('express-mysql-session');
  var fs = require('fs');
  var path = require('path');
  var http = require('http');
  var events = require('events');

  var HttpError = rootRequire('error');
  var config = rootRequire('config');

  var app = express();
  var eventEmitter = new events.EventEmitter();
  var appDir = '';

  app.set('events', eventEmitter);
  app.set('domain', config.get('domains')); 
  app.set('io', io);

  app.disable('x-powered-by');
  app.enable('trust proxy');

  //process.env.NODE_ENV = 'development';
  console.log('process.env =', process.env.NODE_ENV);
  test: {
    switch (process.env.NODE_ENV) {
    case 'test':
      appDir = path.join(__dirname, '/test');
      app.use('/bower_components', express.static(path.join(__dirname, '/bower_components')));
      break test;
    case 'development':
      Error.prototype.toString = function () {
        return this.name + ': ' + this.message;
      }
      app.set('rootPath', '/public');
      appDir = path.join(__dirname, app.get('rootPath'));
      app.use(require('morgan')('dev'));
      break;
    case 'production':
      Error.prototype.toString = function () {
        return this.message;
      }
      app.set('rootPath', '/dist');
      appDir = path.join(__dirname, app.get('rootPath'));
      app.enabled('view cache');
      break;
    default:
      process.exit(1);
    }

    app.use(bodyParser.urlencoded({
      extended: true
    }));
    app.use(bodyParser.json());
    app.use(bodyParser.json({
      type: 'application/vnd.api+json'
    }));

    app.use(cookieParser());

    //Расширяем Response методом generateNewPage
    app.use(rootRequire('middleware/replace-page')(appDir + '/'));

    app.use(session({
      resave: true,
      saveUninitialized: true,
      secret: config.get('session:secret'),
      key: config.get('session:key'),
      cookie: config.get('session:cookie'),
      store: new SessionStore(config.get("mysql"))
    }));

    app.use(express.static(appDir));
    app.use('/reports', express.static(path.join(__dirname, '/reports')));

    rootRequire('routes')(app, express);

    app.use(function (err, req, res, next) {
      var redirect = function (error) {
        var url = '/error?' + 'msg=' + encodeURIComponent(error.message) + '&c=' + encodeURIComponent(error.status);
        res.redirect(url);
      };

      if (typeof err === 'number') err = new HttpError(err);

      addErr: {
        if (err instanceof HttpError) break addErr;
        if (err instanceof Error) {
          err = new HttpError(err.status || 500, err.toString());
        } else {
          console.error(err);
          err = new HttpError(500);
        }
      }

      req.headers["x-requested-with"] == 'XMLHttpRequest' ? res.send(err) : redirect(err);
    });
  }

  var port = config.get("defaultPort");
  http.createServer(app).listen(port, function (req, res) {    
    console.log('Express started on port ' + port);
  });
};