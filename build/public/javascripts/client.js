(function() {
  var capitalize, error, handler, render, showClosestStore, t;

  t = function(template, data) {
    var key, val;
    for (key in data) {
      val = data[key];
      template = template.replace(new RegExp("{" + key + "}", 'g'), val);
    }
    return template;
  };

  render = function(element, template, data) {
    var text;
    text = t($(template).html(), data);
    return $(element).html(text);
  };

  capitalize = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  handler = function(position) {
    var latitude, longitude;
    console.log(position.coords.latitude + " " + position.coords.longitude);
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
    return $.ajax({
      url: "/stores",
      data: {
        lat: latitude,
        lon: longitude
      },
      dataType: "json",
      success: showClosestStore,
      error: error
    });
  };

  showClosestStore = function(json) {
    var closes, data, is_open, obj, opens;
    if (!json || json.length === 0) return error("No data was received");
    obj = json[0];
    opens = new Date(Date.parse(obj.opening_hours.opens));
    closes = new Date(Date.parse(obj.opening_hours.closes));
    is_open = new Date().between(opens, closes);
    data = {
      opens: opens.toFormat("HH24:MI"),
      closes: closes.toFormat("HH24:MI"),
      now: new Date().toFormat("HH24:MI"),
      store: obj.address,
      postal_code: obj.postal_code,
      locality: capitalize(obj.locality),
      is_open: is_open ? "Ja" : "Nej",
      phone: obj.phone,
      answer: is_open ? "yes" : "no",
      query_url: encodeURIComponent("" + obj.address + " " + obj.postal_code + " " + obj.locality)
    };
    return render("#closest-store", "#closest-store-template", data);
  };

  error = function(object) {
    var data;
    if (object instanceof XMLHttpRequest) {
      data = JSON.parse(object.responseText);
    } else {
      data = {
        message: object
      };
    }
    console.error(object);
    return render("[role='main']", "#error-template", data);
  };

  $(document).ready(function() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(handler, error);
    } else {
      error("Geolocation is not supported. Get a better browser in order to use this app");
    }
    return $(".card").live("click tap", function(evt) {
      $("#card").toggleClass("flipped");
      return evt.preventDefault();
    });
  });

}).call(this);
