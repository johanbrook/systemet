(function() {
  var coll, dbCallback, db_name, done, error, fs, gauss, host, http, importFromXML, isEmpty, mongo, mongo_url, parser, port, req_opts, xml;

  fs = require("fs");

  mongo = require("mongodb");

  xml = require("xml2js");

  gauss = require('gausskruger');

  http = require("http");

  require("date-utils");

  parser = new xml.Parser();

  gauss.swedish_params("rt90_2.5_gon_v");

  isEmpty = function(obj) {
    return typeof obj === "object" && Object.keys(obj).length === 0;
  };

  db_name = "systemet";

  host = "localhost";

  port = 27017;

  coll = "stores";

  req_opts = {
    host: "www.systembolaget.se",
    path: "/Assortment.aspx?butikerombud=1",
    port: 80,
    headers: {
      "Content-Type": "text/xml"
    }
  };

  mongo_url = process.env.MONGOLAB_URI || ("mongodb://" + host + ":" + port + "/" + db_name);

  mongo.connect(mongo_url, {}, function(err, db) {
    console.log("* Connecting to MongoDB on " + mongo_url);
    db.addListener("error", error);
    db.dropCollection(coll);
    return db.collection(coll, dbCallback);
  });

  dbCallback = function(err, collection) {
    var req;
    collection.ensureIndex({
      loc: "2d"
    });
    req = http.get(req_opts, function(res) {
      res.setEncoding('utf8');
      return res.on("data", function(chunk) {
        return importFromXML(chunk, collection);
      });
    }).on("error", error);
    return req.end();
  };

  importFromXML = function(xml, collection) {
    parser.removeAllListeners();
    return parser.parseString(xml, function(err, json) {
      var data, item, lat_long, s, schedule, store, stores, today, _i, _len;
      if (err) error(err);
      stores = json.ButikOmbud;
      data = [];
      for (_i = 0, _len = stores.length; _i < _len; _i++) {
        item = stores[_i];
        store = {};
        if (!item.RT90x || !item.RT90y || isEmpty(item.Oppettider) || item.Typ !== "Butik") {
          continue;
        }
        lat_long = gauss.grid_to_geodetic(item.RT90x, item.RT90y);
        today = Date.today().toFormat("YYYY-MM-DD");
        s = item.Oppettider;
        schedule = s.substr(s.search(today), 22).split(";");
        store.store_nr = item.Nr;
        store.address = item.Address1;
        store.postal_code = item.Address3.replace("S-", "");
        store.locality = item.Address4;
        store.phone = item.Telefon.replace("\/", "-");
        store.loc = lat_long;
        store.opening_hours = {
          short_date: "" + schedule[0] + " " + schedule[1] + "-" + schedule[2],
          opens: new Date(Date.parse("" + schedule[0] + " " + schedule[1] + " GMT+0200")),
          closes: new Date(Date.parse("" + schedule[0] + " " + schedule[2] + " GMT+0200"))
        };
        data.push(store);
      }
      return collection.insert(data, {
        safe: true
      }, done);
    });
  };

  done = function(err, result) {
    if (err) {
      console.log(err);
    } else {
      console.log("* Imported " + result.length + " items from " + req_opts.host + " into collection '" + coll + "'");
    }
    console.log("* Closed connection to database, exiting");
    return process.exit();
  };

  error = function(error) {
    console.error("En error occurred: " + error);
    return process.exit();
  };

}).call(this);
