//load pins
var infoWindow = [],
	locations,
	currentData;

//create map
var initMap = function() {
	var url = "/get_data.php",
		$preloader = $('#preloader');

	$preloader.css('display', 'block'); //show preloader

	//need to get better method to cache data, taking too long to retrieve each time the page loads
	$.getJSON(url, function(data) {
		$preloader.css('display', 'none'); //hide preloader
		
		locations = data; //assign locations with returned data
		var mapContainer = document.getElementById('map'),
			latSF = 37.773972, //SF
			lngSF = -122.431297; //SF

		//create map
		var map = new google.maps.Map(mapContainer, {
	    	center: {lat: latSF, lng: lngSF}, //San Francisco
	    	zoom: 13
	  	});

		setMarkers(map, locations); //create markers
    });
}

//drop markers
function setMarkers(map, locations) {
	var marker;
	
	for (var i = 0; i < locations.length; i++) {
		var name = locations[i].name,
			lat = locations[i].lat,
			lng = locations[i].lng,
			is_reserved = locations[i].is_reserved || false,
			cost_per_minute = locations[i].cost_per_minute;
			reserved_until = locations[i].reserved_until || null;

		latlngset = new google.maps.LatLng(lat, lng);

		var marker = new google.maps.Marker({  
			map: map, title: name , position: latlngset
		});

		map.setCenter(marker.getPosition());

		//there are better templating methods, insert each object into data attribute for easy access
		var content = "<h4>Parking Number: <strong>" + name + "</strong></h4><p>Cost per minute: <strong>$" + cost_per_minute + "</strong></p>" + (is_reserved ? "<p class='text-error'>" + reserved_until + "</p>" : "<p><a href='#' id='reserve-parking' data-details='" + JSON.stringify(locations[i]) + "' class='btn btn-success btn-block'>Reserve</a></p>") + "</p>";

		var infowindow = new google.maps.InfoWindow()

		google.maps.event.addListener(marker,'click', (function(marker, content, infowindow) {
			return function() {
				closeInfoWindows(); //close all other info windows
				infowindow.setContent(content);
				infowindow.open(map,marker);

				google.maps.event.addDomListener(infowindow, 'domready', function() {
					var $reserveButton = $('#reserve-parking');
				    
				    $reserveButton.click(function(e) {
				    	e.preventDefault();
				    	
				    	currentData = JSON.parse($(this).attr("data-details")); //set current data for access later
				        var $reservationModal = $('#reservation-modal'),
				        	$parkingName = $('#reservation-parking-name'),
				        	$parkingCost = $('#reservation-cost');
				        
				        $reservationModal.modal('show'); //open reservation modal
				        $parkingName.html(currentData.name);
				        $parkingCost.html("$" + currentData.cost_per_minute);

				        //set the duration option field (note: with enough time, you could implement a nice slider here)
				        //also prettier values (mins and when it gets to 60mins it will output hours, etc)
				        var reservationMax = currentData.max_reserve_time_mins,
				        	reservationMin = currentData.min_reserve_time_mins,
				        	$selectDuration = $('#reservation-duration'),
				        	$optionsDuration = "";

				        $optionsDuration = setDurationOptions(reservationMin, reservationMax);
				        $selectDuration.empty().append($optionsDuration);
				    });
				});

              	infoWindow[0] = infowindow; //record the current info window for other use
		    };
		})(marker,content,infowindow)); 
	}
}

function setDurationOptions(min, max) {
	var options = "";	
	for (var i = 0; i <= max; i += 5) { //skips every 5 minutes, no need to get too specific in time
    	if (i !== 0) {
    		options += '<option value="' + i + '">' + i + ' mins</option>';
    	} else {
    		options += '<option value="' + i + '">Please select</option>';//default value
    	}
    }

    return options;
}

//close all other info windows
function closeInfoWindows(){
   if(infoWindow.length > 0){
      infoWindow[0].set("marker", null);
      infoWindow[0].close(); //close info window
      infoWindow.length = 0; //reset array
   }
}

$(function() {
	//date time picker
	$('#datetimepicker1').datetimepicker();

	//update total
	var $selectDuration = $('#reservation-duration');

	$selectDuration.on('change', function(e) {
		var $duration = $(this).val();

		if ($duration) {
			var $total = $('#total-cost'),
				cost_per_minute = currentData.cost_per_minute,
				total = $duration * cost_per_minute; //set total and update

			$total.html("$" + parseFloat(total).toFixed(2));
		}
		
	});

	var $form = $('#reservation-form');
	$form.on("submit", function(e) {
		e.preventDefault();

		//Do some logic here
		//more than likely should do some AJAX post, with validation (server and client to check data integrity)
		//get data via serialize(), append all other required data to input into database
		//save info
		console.log("Current chosen data: " + JSON.stringify(currentData));
		console.log("Form fields: " + $(this).serialize());
	});
});
