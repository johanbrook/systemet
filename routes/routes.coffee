fs = 		require "fs"
xml = 		require "xml2js"
http = 		require "http"
mongo = 	require "mongodb"
url =	 	require "url"

parser = new xml.Parser()

db_name = "systemet"
host = "localhost"
port = 27017
coll = "stores"

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


error = (error, res) ->
	res.statusCode 500
	res.end "Something went wrong"



# GET home page.

exports.db = (req, res) ->
	db.collection coll, (err, collection) ->
		collection.find().toArray (err, results) ->
			res.render 'stores', stores: results

exports.index = (req, res) ->	
	
	res.render "index", title: "Är systemet öppet?"
	
###	fs.readFile __dirname + "/../data.xml", (err, data) ->
		parser.parseString data, (err, result) ->
			return if err
			
			schedule = result.ButikOmbud.Oppettider.split(";;;")[0]
			date = schedule.split(";")[0]
			opens = new Date( Date.parse date+"T"+schedule.split(";")[1])
			closes = new Date( Date.parse date+"T"+schedule.split(";")[2])
			
			today = new Date()
			lat_long = gauss.grid_to_geodetic result.ButikOmbud.RT90x, result.ButikOmbud.RT90y
			
			store = {
				address: result.ButikOmbud.Address1
				date: new Date(Date.parse date)
				opens: opens
				closes: closes
				isOpen: today.between opens, closes
				lat: lat_long[0]
				long: lat_long[1]
			}
			
			res.render 'index', { 
				title: 'Är systemet öppet?'
				store: store
			}
###

exports.stores = (req, res) ->
	
	query = url.parse(req.url, true).query
	latitude = query.lat
	longitude = query.lon
	
	console.log "Request to /stores received: #{latitude} #{longitude}"
	
	get_stores_from_coordinates [latitude, longitude], 1, (err, results) ->
		if not err then success(results, res)
		else error(err, res)
