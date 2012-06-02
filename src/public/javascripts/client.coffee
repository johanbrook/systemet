t = (template, data) ->

	for key, val of data
		template = template.replace new RegExp( "{#{key}}", 'g'), val
	
	return template

render = (element, template, data) ->
	text = t $(template).html(), data
	$(element).html text
	

capitalize = (string) ->
	string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()


handler = (position) ->
	latitude = position.coords.latitude
	longitude = position.coords.longitude

	$.ajax
		url: "/stores"
		data: lat: latitude, lon: longitude
		dataType: "json"
		success: showClosestStore
		error: error


showClosestStore = (json) ->	
	return error "No data was received" if not json or json.length is 0
	obj = json[0]
	
	today = new Date()
	opens = new Date(Date.parse obj.opening_hours.opens)
	closes = new Date(Date.parse obj.opening_hours.closes)
	is_open = today.between opens, closes
	
	time_left = today.getMinutesBetween closes
	store_is_closing_soon = is_open and time_left < 30
	unit = if time_left is 1 then "minut" else "minuter"

	data = 
		opens: opens.toFormat "HH24:MI"
		closes: closes.toFormat "HH24:MI"
		now: today.toFormat "HH24:MI"
		time_left: if store_is_closing_soon then "<p><strong>#{time_left} #{unit} till stängning!</strong></p>" else ""
		store: obj.address
		postal_code: obj.postal_code
		locality: capitalize obj.locality
		is_open: if is_open then "Ja" else "Nej"
		phone: obj.phone
		answer: if is_open then "yes" else "no"
		query_url: encodeURIComponent("#{obj.address} #{obj.postal_code} #{obj.locality}")
	
	render "#closest-store", "#closest-store-template", data


error = (object) ->
	if object instanceof XMLHttpRequest
		data = JSON.parse object.responseText
	else	
		data = {message: object}
		
	console.error object
	render "[role='main']", "#error-template", data

geoError = (err) ->
	switch err.code
        when err.PERMISSION_DENIED
            message = "Du måste godkänna positionering för att använda appen";

        when err.POSITION_UNAVAILABLE
            message = "Din position kunde inte hittas";

        when err.PERMISSION_DENIED_TIMEOUT
            message = "Det tog för lång tid att avgöra din position";            
	
	message = "Okänt fel uppstod" if message is ""
	error message

$(document).ready ->
	if navigator.geolocation
		navigator.geolocation.getCurrentPosition handler, geoError
	else
		error "Geolocation is not supported. Get a better browser in order to use this app"
	
	if navigator.standalone
		$("html").addClass "standalone"
	
	$(".card").live "click tap", (evt) ->
		$("#card").toggleClass "flipped"
		evt.preventDefault()
