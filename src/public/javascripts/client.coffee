render = (template, data) ->

	for key, val of data
		template = template.replace new RegExp( "{#{key}}", 'g'), val
	
	return template

capitalize = (string) ->
	string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()


handler = (position) ->
	console.log position.coords.latitude + " " + position.coords.longitude
	latitude = position.coords.latitude
	longitude = position.coords.longitude

	$.ajax
		url: "/stores"
		data: lat: latitude, lon: longitude
		dataType: "json"
		success: showClosestStore
		error: error


showClosestStore = (json) ->
	return if !json
	
	obj = json[0]
	console.log obj
	
	opens = new Date(Date.parse obj.opening_hours.opens)
	closes = new Date(Date.parse obj.opening_hours.closes)
	is_open = new Date().between opens, closes

	data = 
		opens: opens.toFormat "HH24:MI"
		closes: closes.toFormat "HH24:MI"
		now: new Date().toFormat "HH24:MI"
		store: obj.address
		postal_code: obj.postal_code
		locality: capitalize obj.locality
		is_open: if is_open then "Ja" else "Nej"
		phone: obj.phone
		answer: if is_open then "yes" else "no"
		query_url: encodeURIComponent("#{obj.address} #{obj.postal_code} #{obj.locality}")
	
	text = render $("#closest-store-template").html(), data
	$("#closest-store").html(text)


error = (msg, status) ->
	alert "Something went wrong. See the log for details"
	console.error status
	console.error msg


$(document).ready ->
	if navigator.geolocation
		navigator.geolocation.getCurrentPosition handler, error
	else
		alert "Geolocation is not supported. Get a better browser"
