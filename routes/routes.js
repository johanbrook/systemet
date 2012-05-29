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

  error = function(msg, code, res) {
    var json;
    console.log(msg);
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
      return error("Please provide lat and lon query parameters", 400, res);
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
