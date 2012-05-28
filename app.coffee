###
	Module dependencies.
###

express = 	require 'express'
routes = 	require './routes/routes'
ejs = 		require "ejs"
require 	"date-utils"

app = module.exports = express.createServer()

# Configuration

ejs.filters.format = (date, format) ->
	new Date(date).toFormat format

app.configure ->
	app.set('views', __dirname + '/views')
	app.set('view engine', 'ejs')
	app.use(express.bodyParser())
	app.use(express.methodOverride())
	app.use(app.router)
	app.use(express.static(__dirname + '/public'))



app.configure 'development', ->
  app.use(express.errorHandler { dumpExceptions: true, showStack: true } )

app.configure 'production', ->
  app.use(express.errorHandler())



# Routes

app.get '/', routes.index
app.get '/stores', routes.stores
app.get "/test", routes.db

app.listen 3000
console.log "Express server listening on port %d in %s mode", app.address().port, app.settings.env
