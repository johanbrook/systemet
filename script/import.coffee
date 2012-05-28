fs = 	require "fs"
mongo = require "mongodb"
xml = 	require "xml2js"
gauss = require 'gausskruger'
require "date-utils"

isEmpty = (obj) -> typeof obj is "object" and Object.keys(obj).length is 0

parser = new xml.Parser()
gauss.swedish_params "rt90_2.5_gon_v"

db_name = "systemet"
host = "localhost"
port = 27017
coll = "stores"

file = process.argv[2]

if !file
	console.log "\n	Please provide an XML file to import\n"
	console.log "	Usage:\n	$ node import.js <filename>\n"
	process.exit()

console.log "* Connecting to #{db_name} at #{host} on port #{port} ..."

client = new mongo.Db(db_name, new mongo.Server(host, port, {}))
client.open (err, db) ->
	console.log "Error: #{err}" if err
	client.dropCollection coll
	client.collection coll, importFromFile



importFromFile = (err, collection) ->
	collection.ensureIndex loc: "2d", { min: -500, max: 500 }
	
	fs.readFile file, (err, data) ->
		console.log err if err

		parser.parseString data, (err, json) ->

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
				
				store.store_nr = item.Nr
				store.address = item.Address1
				store.postal_code = item.Address3.replace("S-", "")
				store.locality = item.Address4
				store.phone = item.Telefon.replace("\/", "-")
				store.loc = lat_long
				
				
				store.opening_hours = 
					short_date: "#{schedule[0]} #{schedule[1]}-#{schedule[2]}"
					opens: new Date( Date.parse("#{schedule[0]} #{schedule[1]} GMT+0200") )
					closes: new Date( Date.parse("#{schedule[0]} #{schedule[2]} GMT+0200") )
				
				data.push store
			
			collection.insert data, safe: true, done


done = (err, result) ->
	if err
		console.log err
	else
		console.log "* Imported #{result.length} items into '#{coll}'"

	client.close()
	console.log "* Closed connection to database, exiting"
	process.exit()