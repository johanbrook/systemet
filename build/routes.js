(function() {
  var DB, db_name, error, get_stores_from_coordinates, host, mongo, mongo_url, port, success, url;

  mongo = require("mongodb");

  url = require("url");

  db_name = "systemet";

  host = "localhost";

  port = 27017;

  DB = null;

  mongo_url = process.env.MONGOLAB_URI || ("mongodb://" + host + ":" + port + "/" + db_name);

  mongo.connect(mongo_url, {}, function(error, db) {
    console.log("Connecting to Mongo database on " + mongo_url + " ...");
    if (db === null) {
      console.error("* Error connecting to MongoDB. Db instance is null");
      return process.exit();
    }
    DB = db;
    if (!error) return console.log("* Successfully connected to database");
  });

  get_stores_from_coordinates = function(coords, limit, callback) {
    return DB.collection("stores", function(err, collection) {
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

  error = function(code, msg, res) {
    var json;
    console.error(msg);
    json = "{\"code\": " + code + ", \"message\": \"" + msg + "\"}";
    res.writeHead(code, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(json)
    });
    return res.end(json);
  };

  exports.index = function(req, res) {
    return res.render("index");
  };

  exports.stores = function(req, res) {
    var latitude, longitude, query;
    query = url.parse(req.url, true).query;
    latitude = query.lat;
    longitude = query.lon;
    if (!latitude || !longitude) {
      return error(400, "Please provide lat and lon query parameters", res);
    }
    return get_stores_from_coordinates([latitude, longitude], 1, function(err, results) {
      if (!err) {
        return success(results, res);
      } else {
        return error(err, res);
      }
    });
  };

}).call(this);
