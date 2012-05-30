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
	return error "No data was received" if not json or json.length is 0
	obj = json[0]
	
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
	
	render "#closest-store", "#closest-store-template", data


error = (object) ->
	if object instanceof XMLHttpRequest
		data = JSON.parse object.responseText
	else	
		data = {message: object}
		
	console.error object
	render "[role='main']", "#error-template", data


$(document).ready ->
	if navigator.geolocation
		navigator.geolocation.getCurrentPosition handler, error
	else
		error "Geolocation is not supported. Get a better browser in order to use this app"
	
	
	$(".flip").live "click", (evt) ->
		$("#card").toggleClass "flipped"
		evt.preventDefault()
