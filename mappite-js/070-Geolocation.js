/*** Geolocation ***/

/* Called when user clicks on center icon */
function centerMap() {
	$("#locate").attr("src", "icons/spinner.svg");
	//map.locate({setView: true, watch: true, maxZoom: 16, timeout: 5000, enableHighAccuracy: true});
	map.locate({ watch: true, timeout: 5000, enableHighAccuracy: true, maximumAge: 1000});
}

/* Called when location has been found from GPS */
function onLocationFound(e) {
    var radius = e.accuracy / 2;
    var ll = e.latlng;
    
    if (!isLocate) { // this is first Location, centering the map at zoom 16
	    isLocate = true;
	    map.setView(ll, 16);
    }
    if (circleLocate != null) map.removeLayer(circleLocate  ); // remove previous if it exists 
    if (radius>10) { // add circle if radius is > 10 mt
	circleLocate = L.circle(e.latlng, radius).addTo(map);
	//circleLocate.on("contextmenu",  function(e) {L.DomEvent.stopPropagation(e); map.removeLayer(circleLocate); } );
	//circleLocate.on("click",  function(e) {L.DomEvent.stopPropagation(e); map.removeLayer(circleLocate); } );
    }
    
    if (markerLocate != null) map.removeLayer(markerLocate); // remove previous
    markerLocate = L.marker(ll, {icon: L.icon({ iconUrl: "./icons/locate.svg", iconSize: [20, 20] })});
    var label = "<b>"+translations["locate.radius1"]  + radius.toFixed(0) + translations["locate.radius2"] + "</b><br/> ("+ll.lat.toFixed(6)+","+ll.lng.toFixed(6) + ") "
                +"<br/><div class='gsmall'>"+rightClickText+ " " + translations["popup.add"] +"</div>"; 
    markerLocate.bindPopup(label, {offset: L.point(0,-13)}).addTo(map);
    node = { lat: ll.lat.toFixed(6), lon: ll.lng.toFixed(6), name: ll.lat.toFixed(6)+","+ll.lng.toFixed(6) };
    markerLocate.on('contextmenu dblclick', L.bind(addJsonNode, this, node) ); // dblclick does not work since 1st click is consumed by popup...
	
    /* here we coudl add a polyline and track the track !!! */
    //mapIcons["locate"].push(markerLocate );

    // reset icon
    $("#locate").attr("src", "./icons/locate.svg");
}

function onLocationError(e) {
    alert(translations["locate.error"] + e.message + "("+e.code+")");
    map.stopLocate();
    // reset icon
    $("#locate").attr("src", "./icons/locate.svg");
}
