(function() {
  var coll, db, db_name, error, fs, get_stores_from_coordinates, host, http, mongo, parser, port, success, url, xml;

  fs = require("fs");

  xml = require("xml2js");

  http = require("http");

  mongo = require("mongodb");

  url = require("url");

  parser = new xml.Parser();

  db_name = "systemet";

  host = "localhost";

  port = 27017;

  coll = "stores";

  console.log("Connecting to Mongo database '" + db_name + "' at " + host + " on port " + port + " ...");

  db = new mongo.Db(db_name, new mongo.Server(host, port, {}));

  db.open(function() {});

  get_stores_from_coordinates = function(coords, limit, callback) {
    return db.collection(coll, function(err, collection) {
      var q;
      q = {
        loc: {
          $near: [parseFloat(coords[0]), parseFloat(coords[1])]
        }
      };
      return collection.find(q).limit(limit).toArray(callback);
    });
  };

  success = function(results, res) {
    var responseText;
    responseText = JSON.stringify(results);
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(responseText)
    });
    return res.end(responseText);
  };

  error = function(error, res) {
    res.statusCode(500);
    return res.end("Something went wrong");
  };

  exports.db = function(req, res) {
    return db.collection(coll, function(err, collection) {
      return collection.find().toArray(function(err, results) {
        return res.render('stores', {
          stores: results
        });
      });
    });
  };

  exports.index = function(req, res) {
    return res.render("index", {
      title: "Är systemet öppet?"
    });
  };

  /*	fs.readFile __dirname + "/../data.xml", (err, data) ->
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
  */

  exports.stores = function(req, res) {
    var latitude, longitude, query;
    query = url.parse(req.url, true).query;
    latitude = query.lat;
    longitude = query.lon;
    console.log("Request to /stores received: " + latitude + " " + longitude);
    return get_stores_from_coordinates([latitude, longitude], 1, function(err, results) {
      if (!err) {
        return success(results, res);
      } else {
        return error(err, res);
      }
    });
  };

}).call(this);
