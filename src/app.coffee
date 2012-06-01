###
	Module dependencies.
###

express = 	require 'express'
gzippo = 	require 'gzippo'
routes = 	require './routes'

app = module.exports = express.createServer()

# Configuration

app.configure ->
	app.set 'views', __dirname + '/views'
	app.set 'view engine', 'ejs'
	app.use express.bodyParser()
	app.use express.methodOverride()
	app.use app.router
	app.use gzippo.staticGzip __dirname + '/public', 
		contentTypeMatch: /text|javascript|json|css|html/

app.configure 'development', ->
	app.use express.errorHandler { dumpExceptions: true, showStack: true }

app.configure 'production', ->
	app.use express.errorHandler()

# Routes

app.get '/', 		routes.index
app.get '/stores', 	routes.stores

app.listen process.env.PORT or 3000
console.log "Express server listening on port %d in %s mode", app.address().port, app.settings.env