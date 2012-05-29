(function() {
  var capitalize, error, handler, render, showClosestStore;

  render = function(template, data) {
    var key, val;
    for (key in data) {
      val = data[key];
      template = template.replace(new RegExp("{" + key + "}", 'g'), val);
    }
    return template;
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
    var closes, data, is_open, obj, opens, text;
    if (!json) return;
    obj = json[0];
    console.log(obj);
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
      query_url: encodeURIComponent("" + obj.address + " " + obj.postal_code + " " + obj.locality)
    };
    text = render($("#closest-store-template").html(), data);
    return $("#closest-store").html(text);
  };

  error = function(msg, status) {
    alert("Something went wrong. See the log for details");
    console.error(status);
    return console.error(msg);
  };

  $(document).ready(function() {
    if (navigator.geolocation) {
      return navigator.geolocation.getCurrentPosition(handler, error);
    } else {
      return alert("Geolocation is not supported. Get a better browser");
    }
  });

}).call(this);
