(function() {
  var capitalize, error, geoError, handler, render, showClosestStore, t;

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
    var closes, data, is_open, obj, opens, store_is_closing_soon, time_left, today, unit;
    if (!json || json.length === 0) return error("No data was received");
    obj = json[0];
    today = new Date();
    opens = new Date(Date.parse(obj.opening_hours.opens));
    closes = new Date(Date.parse(obj.opening_hours.closes));
    is_open = obj.opening_hours.open_today && today.between(opens, closes);
    console.log(obj);
    time_left = today.getMinutesBetween(closes);
    store_is_closing_soon = is_open && time_left < 30;
    unit = time_left === 1 ? "minut" : "minuter";
    data = {
      opens: opens.toFormat("HH24:MI"),
      closes: closes.toFormat("HH24:MI"),
      now: today.toFormat("HH24:MI"),
      time_left: store_is_closing_soon ? "<p><strong>" + time_left + " " + unit + " till stängning!</strong></p>" : "",
      opening_hours: is_open ? "Öppnar <time>" + opens + "</time> och stänger <time>" + closes + "</time>" : "<strong>Denna butik har stängt idag</strong>",
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

  geoError = function(err) {
    var message;
    switch (err.code) {
      case err.PERMISSION_DENIED:
        message = "Du måste godkänna positionering för att använda appen";
        break;
      case err.POSITION_UNAVAILABLE:
        message = "Din position kunde inte hittas";
        break;
      case err.PERMISSION_DENIED_TIMEOUT:
        message = "Det tog för lång tid att avgöra din position";
    }
    if (message === "") message = "Okänt fel uppstod";
    return error(message);
  };

  $(document).ready(function() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(handler, geoError);
    } else {
      error("Geolocation is not supported. Get a better browser in order to use this app");
    }
    if (navigator.standalone) $("html").addClass("standalone");
    return $(".card").live("click tap", function(evt) {
      $("#card").toggleClass("flipped");
      return evt.preventDefault();
    });
  });

}).call(this);
