(function() {
  var fs, getStoreJSON, http, parser, xml;

  fs = require("fs");

  xml = require("xml2js");

  http = require("http");

  parser = new xml.Parser();

  getStoreJSON = function() {
    var options;
    options = {
      url: "www.systembolaget.se",
      path: "/Assortment.aspx?butikerombud=1"
    };
    return http.get(options, function(res) {
      res.setEncoding("utf8");
      return res.on("data", function(data) {
        return data;
      });
    }).on("error", function(e) {
      return console.error(e.message);
    });
  };

  exports.index = function(req, res) {
    return fs.readFile(__dirname + "/data.xml", function(err, data) {
      return parser.parseString(data, function(err, result) {
        var closes, date, opens, schedule, store, today;
        if (err) {
          console.log(err);
          return;
        }
        schedule = result.ButikOmbud.Oppettider.split(";;;")[0];
        date = schedule.split(";")[0];
        opens = new Date(Date.parse(date + "T" + schedule.split(";")[1]));
        closes = new Date(Date.parse(date + "T" + schedule.split(";")[2]));
        today = new Date();
        store = {
          address: result.ButikOmbud.Address1,
          date: new Date(Date.parse(date)),
          opens: opens,
          closes: closes,
          isOpen: today.between(opens, closes)
        };
        return res.render('index', {
          title: 'Är systemet öppet?',
          store: store
        });
      });
    });
  };

}).call(this);
