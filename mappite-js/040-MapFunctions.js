/*** Map Functions ***/

// Map initiation and Reverse Lookup function 
// that updates Active Route point and related view on map 

/** FUNCTON: initiateMap(center point, zoomLevel)
 *	initiate the map
 **/
function initiateMap(ll, z) {
	var ml = document.getElementById("gOptions.mapLayer").value; // get layer name
	curL = mapLayer[ml];
	curA = L.control.attribution({prefix: ''}).addAttribution(attrs[ml]+attrs['mappite']);
	
	// Protomaps: apply custom rules
	// mapLayer["protomaps.l"].paintRules = roadsPaintRules(); 

	// create the map
	map = L.map('map', { center: ll, zoom: z, maxZoom: 18,  layers: [curL ], attributionControl: false, tap: true});

	// set attribution control
	map.addControl(curA);
	
	// set search control (geocoder)
	var geocoder = L.Control.geocoder({
				defaultMarkGeocode: false,
				suggestMinLength: 4,
				//geocoder: new L.Control.Geocoder.LatLng({next: new L.Control.Geocoder.Photon({geocodingQueryParams: {limit: 8}})} ) // works but miss searchas you type with Photon - L.Control.Geocoder.Photon() // L.Control.Geocoder.Nominatim() L.Control.Geocoder.LatLng
				geocoder: new L.Control.Geocoder.LatLng({next: new L.Control.Geocoder.Photon({next: new L.Control.Geocoder.Nominatim(), geocodingQueryParams: {limit: 8}})} ) // works but miss searchas you type with Photon - L.Control.Geocoder.Photon() // L.Control.Geocoder.Nominatim() L.Control.Geocoder.LatLng
				//geocoder: new L.Control.Geocoder.LatLng({next: new L.Control.Geocoder.Nominatim()} ) // works but miss searchas you type with Photon - L.Control.Geocoder.Photon() // L.Control.Geocoder.Nominatim() L.Control.Geocoder.LatLng
			}).on('markgeocode', function(e) {
				var ll = e.geocode.center;
				var label = e.geocode.name;//.split(",")[0]; // ll.lat+","+ll.lng;.split(",")[0];
				var pos = label.lastIndexOf(','); // country
				if (pos > 1) { label = label.substring(0,pos); } // remove country
				
				map.addLayer(createPoiMarker(ll.lat, ll.lng, label, iconPoiSearch)); // fixme, this can't be removed!
				
				map.fitBounds(e.geocode.bbox); // map.panTo(ll);//setView(ll);
			}).addTo(map);
			

	
	// set scale control
	var isMetricScale = (document.getElementById("gOptions.uom").value==="k"?true:false);
	scale = L.control.scale({ position: 'bottomright', metric: isMetricScale , imperial: !isMetricScale });
	scale.addTo(map);
	
	// set top rigth Icon Panel
	iconCtrl = new IconCtrl();
	map.addControl(iconCtrl);
	
	// initiate top left banner (header)
	headerCls = new HeaderCls();
	
	// set which event calls onMapClick,contextmenu is long tap
	map.on(isTouchDevice()?'contextmenu':'click', onMapClick); // see 060-Layers for protomaps click
	
	// on zoom action
	map.on('zoom', function (e) {
		// change map based on zoom level
		consoleLog("Zoom Level: "+  map.getZoom());
		// enable/disable icons
		iconCtrl.onZoom();

		// change to OSM map at max zoom (except for satellite)
		// logic below preserves the OSM map if previous one is not free
		zoomIdx = map.getZoom();
		var ml = document.getElementById("gOptions.mapLayer").value; 
		var switchAtZoom = (ml.startsWith("protomaps")?16:14);
		if (zoomIdx <= switchAtZoom && mapLayer[ml] !== curL ) { // true only if the else below has forced the map to OSM
			if (canUseMap()) { 
				onMapLayersChange(); // reset to the original map selection
			} else {
				document.getElementById("gOptions.mapLayer").value = "osm";// silently set to OSM
			}

		} else if (zoomIdx > switchAtZoom ) {  // force OSM map, on except for satellite	
			if (ml != "mapboxSat") setMapLayer("osm");
		}
		
		// EXPERIMENTAL: if over an area covered by protomaps layers
		var mc = map.getBounds().getCenter()
		if (!isProtomapsLoaded && zoomIdx > 10) {
			var idx = isLatLngWithin( mc.lat, mc.lng, PROTOMAPS_LATS);
			if (idx) {
				document.getElementById("protomapsLayers").style.display = "block";
				consoleLog("* protomaps icon enabled!");
				//alertOnce("prototype.available");
				alertOnceIcon("prototype.available", "trackLayer.svg", false);
			}
		}
	});
	
	// map.on('keypress', onKeyPress);
	
	map.on('locationfound', onLocationFound);
	map.on('locationerror', onLocationError);
	
	map.addLayer(markersCluster);
	
	$( ".leaflet-container" ).css( "cursor" ,  "pointer");
	
	// in dev environment, add string with version 
	if ( window.location.pathname.indexOf('alpha') != -1 ) $( "#gHeaderContent" ).append("TEST ALPHA: " + mversion);
	
	// manage Draggable Marker on bottom right for touch screens
	var draggableMarker = document.getElementById("gMarkerDrag"); // gMarkerDrag div
	
	draggableMarker.addEventListener('touchmove', function(event) {
	    dragRemoveShow();
	    var touch = event.targetTouches[0];
	    // Place element slightly left from fingerprint to see marker bottom 
	    draggableMarker.style.left = touch.pageX-75 + 'px';
	    draggableMarker.style.top  = touch.pageY-10 + 'px';
	    event.preventDefault(); // this prevent the click event...
	  }, false);


	// TODO: it seems I'm not able to make a single function for dragend as well.
	// issue is with dragging document.getElementById("gMarkerDrag").getBoundingClientRect() does not change
	// I should calculat offset with event.x/y however, who cares to drag the icon whe you can click?
	var touchEnd = function(event) {
	    dragRemoveHide();
	    var el = document.getElementById("gMarkerDrag").getBoundingClientRect();
	    console.log("touchEnd");
	    //var touch = event.targetTouches[0];
	    if (el.top > 80 && (window.innerWidth-el.left > 50 || window.innerHeight-el.top >90)) { // check if not in red banner and not released above  icon itself (click), it must be a user error...
		    // left/top are marker div topleft point: +12/+41 is the marker bottom point
		    ll = map.containerPointToLatLng(L.point([(el.left+12),(el.top+41)]));
		    addPoint(ll);
	    } else { // it's a click
		if (activeRoute == null) { // if no route exists show a message
		   var msg = "<br><br><div>"+translations['info.dragMarker']+"</div>"; //  translations["cloud.unenrolledWarning"] + "<div class='clsEnroll' onClick=\"javascript:$( \'#gHeaderContent\' ).load(\'"+ enrollFile+"\');\">" +translations["cloud.enrollInvite"] + "</div>";
		   $( "#gHeaderContent" ).html(msg); 
		   headerCls.show();
		}
		if (!map.hasLayer(markersCluster)) { // toggle markersCluster on click
		   map.addLayer(markersCluster);
		} else {
		   map.removeLayer(markersCluster);
		}
	    }
	    // place it back to original position
	    draggableMarker.style.top= '';
	    draggableMarker.style.left = '';
	    draggableMarker.className ="gdrag";
	     
	    event.preventDefault();
	    
	};
	
	draggableMarker.addEventListener('touchend',touchEnd, false);

	draggableMarker.addEventListener('click', function(event) {
		if (!map.hasLayer(markersCluster)) { // toggle markersCluster on click
		   map.addLayer(markersCluster);
		} else {
		   map.removeLayer(markersCluster);
		}
	});
	  
}


/* FUNCTION: onMapClick
 * Add a new point to the route or a new POI 
 */
function onMapClick(e) {
	console.log("Click onMapClick: " + e.latlng);
	// if user is not enrolled and a non free map is used change to osm silently
	var ml = document.getElementById("gOptions.mapLayer").value;
	if (!canUseMap()) {
		document.getElementById("gOptions.mapLayer").value = "osm";
		setMapLayer("osm");
	}
	var ll = e.latlng;
	addPoint(ll);
}


/* FUNCTION: addPoint
 * Add a new point to route calling proper reverse geocode function to determine street name
 */
function addPoint(ll) {
	var id = "vp_"+viaPointId++;
	if ( document.getElementById("gOptions.clickOnRoad").value === "y") {
		addRoutePointOnStreet(ll); // add nearest street point
	} else {
		addRoutePoint(ll); // add nearest object (street, track, path etc) point
	}
	if (!map.hasLayer(markersCluster)) { // re-add markers cluster if it was removed (showPoints)
		map.addLayer(markersCluster);
	}
}


/* FUNCTION: addRoutePointOnStreet using Nominatim
 * Input: LatLng , String 
 * do a reverse geocode to get the nearest LatLng point on street, with name, and adds to the route that nearest point
 * ref. https://nominatim.org/release-docs/develop/api/Reverse/
 */
function addRoutePointOnStreet(ll) {
	consoleLog( "addRoutePointOnStreet Nominatim" );
	processingStart();
	var url="https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&lat="+ll.lat+"&lon="+ll.lng;
	$.ajax({
	  dataType: "json",
	  url: url,
	  timeout: 1500,
	  success: function( json ) {
		processingEnd();

		// ref. https://github.com/osm-search/Nominatim/issues/2720
		// ref https://nominatim.org/release-docs/develop/customize/Ranking/#search-rank
		if (map.getZoom() >= 10 && parseInt(json.place_rank) < 26 ) { 
			alert(translations["options.snapOnRoadFailure"]);
			return;
		} 

		var name = json.name;
		if (json.address.village || json.address.town || json.address.city  ) {
		   name = (json.address.road?json.address.road:"- ") + ", " + (json.address.village?json.address.village:(json.address.town?json.address.town:json.address.city));
		}
		consoleLog("get Nominatim result: " + name);
		var vpjs = new ViaPoint(json.lat,json.lon,name); 
		addViaPoint(vpjs);
		activeRoute.redraw();
		addMarkerToMap(vpjs);
		
		if (getDistance([ll.lat,ll.lng], [json.lat,json.lon],0,0) > 1) { // if > 1 km
			// consoleLog("**** DISTANCE ***");
			alertOnce("options.onroadWarning");
		}
		consoleLog("get Nominatim result from vpjs: " + vpjs.name);
	  },
	  error: function(jqXHR, textStatus, errorThrown) {
		processingError();  
		consoleLog( "*** Nominatim Request Failure: " + textStatus + " - " + errorThrown);
		addRoutePointOnStreetOSRM(ll);
		/*
		if (isInternalRoutingPoint(ll.lat, ll.lng)) {
			consoleLog( "Revert to OSRM" );
			addRoutePointOnStreetOSRM(ll, id);
		} else {
			consoleLog( "Revert to mapquest" );
			addRoutePointMapQuest(ll, id);
		}
		*/
	  }
	});
}

/* FUNCTION: addRoutePointOnStreet using OSRM
 * Input: LatLng , String 
 * do a reverse geocode to get the nearest LatLng point on street, with name, and adds to the route that nearest point
 * ref. https://github.com/Project-OSRM/osrm-backend/wiki/Server-api
 */

function addRoutePointOnStreetOSRM(ll) {
	consoleLog( "addRoutePointOnStreet OSRM" );
	processingStart();
	var url="https://router.project-osrm.org/nearest/v1/driving/"+ll.lng+","+ll.lat+"?number=1"; // was http // removed.json as per orsm backedn #6164
	$.ajax({
	  dataType: "json",
	  url: url,
	  timeout: 1500,
	  success: function( json ) {
		processingEnd();
		var vpjs = new ViaPoint(json.waypoints[0].location[1], json.waypoints[0].location[0], json.waypoints[0].name); 
		addViaPoint(vpjs);
		activeRoute.redraw();
		addMarkerToMap(vpjs);
		consoleLog("getOsrmNearest result vp  in  JSON: " + vpjs.name);
	  },
	  error: function(jqXHR, textStatus, errorThrown) {
		processingError();  
		consoleLog( "*** OSRM Request Failure: " + textStatus + " - " + errorThrown);
		consoleLog( "Revert to mapquest" );
		addRoutePointMapQuest(ll);
	  }
	});
}

/* FUNCTION: addRoutePoint
 * Input: LatLng , String 
 * do a reverse geocode to get the street/area name on LatLng point, adds the point on route exactly at LatLng
 * Note: fallback function called by addRoutePointOnStreet in case of errors
 */
function addRoutePointMapQuest(ll) {
	consoleLog( "addRoutePoint MapQuest" );
	processingStart();
	// var url="https://open.mapquestapi.com/geocoding/v1/reverse?key="+mapquestKey+"&json={location:{latLng:{lat:"+ll.lat+",lng:"+ll.lng+"}}}"; // was http
	var url="https://www.mapquestapi.com/geocoding/v1/reverse?key="+mapquestKey+"&location="+ll.lat+","+ll.lng;
	$.getJSON(url) .done(function( json ) {
			processingEnd();
			var location = json.results[0].locations[0]
			var lat = ll.lat; 
			var lng= ll.lng; 
			var label = location.street + ", " + location.adminArea5;
			var vpjs = new ViaPoint(lat, lng, label);
			addViaPoint(vpjs);
			activeRoute.redraw();
			addMarkerToMap(vpjs);
			consoleLog("Mapquest Reverse Geo result is: " + label );
		})
		.fail(function( jqxhr, textStatus, error ) {
			processingError();
			consoleLog( "Mapquest Reverse Geo Failure: " + textStatus + " - " + error);
			// add the point raw...
			var vpjs = new ViaPoint(ll.lat, ll.lng, "n/a");
			addViaPoint(vpjs); 
			activeRoute.redraw();
			addMarkerToMap(vpjs);
		});  		
}

function addRoutePoint(ll) {
	addRoutePointMapQuest(ll);
}




