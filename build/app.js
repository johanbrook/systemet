
/*
	Module dependencies.
*/

(function() {
  var app, express, gzippo, routes;

  express = require('express');

  gzippo = require('gzippo');

  routes = require('./routes');

  app = module.exports = express.createServer();

  app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    return app.use(gzippo.staticGzip(__dirname + '/public', {
      contentTypeMatch: /text|javascript|json|css|html/
    }));
  });

  app.configure('development', function() {
    return app.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
  });

  app.configure('production', function() {
    app.use(express.errorHandler());
    return app.use(connect.compress());
  });

  app.get('/', routes.index);

  app.get('/stores', routes.stores);

  app.listen(process.env.PORT || 3000);

  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

}).call(this);
