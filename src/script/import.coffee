fs = 		require "fs"
mongo = 	require "mongodb"
xml = 		require "xml2js"
gauss = 	require 'gausskruger'
http = 		require "http"

require 	"date-utils"

parser = new xml.Parser()
gauss.swedish_params "rt90_2.5_gon_v"

isEmpty = (obj) -> typeof obj is "object" and Object.keys(obj).length is 0

db_name = 	"systemet"
host = 		"localhost"
port = 		27017
coll = 		"stores"

req_opts = 
	host: "www.systembolaget.se"
	path: "/Assortment.aspx?butikerombud=1"
	port: 80
	headers:
		"Content-Type": "text/xml"

mongo_url = process.env.MONGOLAB_URI || "mongodb://#{host}:#{port}/#{db_name}"

mongo.connect mongo_url, {}, (err, db) ->
	console.log "* Connecting to MongoDB on #{mongo_url}"
	
	db.addListener "error", error
	
	db.dropCollection coll
	db.collection coll, dbCallback


# Callback

dbCallback = (err, collection) ->
	collection.ensureIndex loc: "2d"

	req = http.get req_opts, (res) ->
		res.setEncoding('utf8');
		res.on "data", (chunk) ->
			importFromXML chunk, collection
		
	.on "error", error
	
	req.end()

# Import code

importFromXML = (xml, collection) ->
	
	# Cleanup to prevent memory leaks
	parser.removeAllListeners()
	
	parser.parseString xml, (err, json) ->
		error err if err
		
		stores = json.ButikOmbud
		data = []

		for item in stores
			store = {}
			
			# Don't insert into database if there aren't any opening
			# hours or coordinates, or if the type isn't a regular store
			
			continue if not item.RT90x or not item.RT90y or isEmpty(item.Oppettider) or item.Typ isnt "Butik"
			
			lat_long = gauss.grid_to_geodetic item.RT90x, item.RT90y

			today = Date.today().toFormat "YYYY-MM-DD"
			
			s = item.Oppettider
			schedule = s.substr(s.search(today), 22).split(";")
			start_time = if schedule[1].match(/(\d\d:\d\d)/) then schedule[1] else null
			end_time = if schedule[2].match(/(\d\d:\d\d)/) then schedule[2] else null
			
			store.store_nr = item.Nr
			store.address = item.Address1
			store.postal_code = item.Address3.replace("S-", "")
			store.locality = item.Address4
			store.phone = item.Telefon.replace("\/", "-")
			store.loc = lat_long
			
			store.opening_hours = 
				open_today: if start_time and end_time then true else false
				short_date: if start_time and end_time then "#{schedule[0]} #{start_time}-#{end_time}"
				opens: if start_time then new Date( Date.parse("#{schedule[0]} #{start_time} GMT+0200") )
				closes: if end_time then new Date( Date.parse("#{schedule[0]} #{end_time} GMT+0200") )
			
			data.push store
		
		collection.insert data, safe: true, done

done = (err, result) ->
	if err
		console.log err
	else
		console.log "* Imported #{result.length} items from #{req_opts.host} into collection '#{coll}'"

	console.log "* Closed connection to database, exiting"
	process.exit()
	
error = (error) ->
	console.error "En error occurred: #{error}"
	process.exit()