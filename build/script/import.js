(function() {
  var coll, db_name, done, fs, gauss, host, importFromFile, isEmpty, mongo, mongo_url, parser, path, port, xml;

  fs = require("fs");

  mongo = require("mongodb");

  xml = require("xml2js");

  gauss = require('gausskruger');

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

  mongo_url = process.env.MONGOLAB_URI || ("mongodb://" + host + ":" + port + "/" + db_name);

  path = process.argv[2];

  if (!path) {
    console.log("\n	Please provide an XML file to import\n");
    console.log("	Usage:\n	$ node import.js <filename>\n");
    process.exit();
  }

  console.log("* Connecting to " + db_name + " at " + host + " on port " + port + " ...");

  mongo.connect(mongo_url, {}, function(error, db) {
    db.addListener("error", function(err) {
      return console.err("Error connecting to MongoDB");
    });
    db.dropCollection(coll);
    return db.collection(coll, importFromFile);
  });

  importFromFile = function(err, collection) {
    collection.ensureIndex({
      loc: "2d"
    });
    return fs.readFile(path, function(err, data) {
      if (err) console.log(err);
      return parser.parseString(data, function(err, json) {
        var item, lat_long, s, schedule, store, stores, today, _i, _len;
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
    });
  };

  done = function(err, result) {
    if (err) {
      console.log(err);
    } else {
      console.log("* Imported " + result.length + " items into '" + coll + "'");
    }
    console.log("* Closed connection to database, exiting");
    return process.exit();
  };

}).call(this);
