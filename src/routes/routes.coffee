mongo = 	require "mongodb"
url =	 	require "url"
nconf = 	require "nconf"

nconf.argv().env().file(file: "./config.json")

db_name = 	nconf.get "database:name"
host = 		nconf.get "database:host"
port = 		nconf.get "database:port"
coll = 		nconf.get "database:collection"

mongo_url = "mongodb://#{host}:#{port}/#{db_name}"

console.log "Connecting to Mongo database '#{db_name}' at #{host} on port #{port} ..."
db = new mongo.Db(db_name, new mongo.Server(host, port, {}))
db.open () ->


# Helpers

get_stores_from_coordinates = (coords, limit, callback) ->
	db.collection coll, (err, collection) ->
		q = 
			loc : 
				# No idea why I have to call parseFloat on the coords ..
				$near : [parseFloat(coords[0]), parseFloat(coords[1])]
		
		collection.find(q).limit(limit).toArray(callback)
		


success = (results, res) ->
	responseText = JSON.stringify results
	res.writeHead 200, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(responseText)
	res.end responseText


error = (code, msg, res) ->
	console.log msg
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
