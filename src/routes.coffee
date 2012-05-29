mongo = 	require "mongodb"
url =	 	require "url"

db_name = 	"systemet"
host = 		"localhost"
port = 		27017

DB = null
mongo_url = process.env.MONGOLAB_URI || "mongodb://#{host}:#{port}/#{db_name}"
	
mongo.connect mongo_url, {}, (error, db) ->
	console.log "Connecting to Mongo database on #{mongo_url} ..."
	
	DB = db
	DB.addListener "error", (err) -> console.err "Error connecting to MongoDB"
	console.log "Successfully connected to database" if not error


# Helpers

get_stores_from_coordinates = (coords, limit, callback) ->
	DB.collection "stores", (err, collection) ->
		q = 
			loc : 
				# No idea why I have to call parseFloat on the coords ..
				$near : [parseFloat(coords[0]), parseFloat(coords[1])]
		
		collection.find(q).limit(limit).toArray(callback)
		


success = (results, res) ->
	console.log "Found #{results.length} results"
	responseText = JSON.stringify results
	res.writeHead 200, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(responseText)
	res.end responseText


error = (code, msg, res) ->
	console.err msg
	json = "{\"code\": #{code}, \"message\": \"#{msg}\"}"
	res.writeHead code, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(json)
	res.end json


# Routes

exports.index = (req, res) ->	
	res.render "index"

exports.stores = (req, res) ->
	
	query = url.parse(req.url, true).query
	latitude = query.lat
	longitude = query.lon
	
	if not latitude or not longitude
		return error 400, "Please provide lat and lon query parameters", res
	
	console.log "Incoming request to /stores with coordinates #{latitude}, #{longitude}"
	
	get_stores_from_coordinates [latitude, longitude], 1, (err, results) ->
		if not err then success(results, res)
		else error(err, res)
