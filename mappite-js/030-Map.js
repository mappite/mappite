/*** Map Layers, Attributions and functions to manage them ***/

/* Attributions */
var attrs = {};
attrs['osm'] 		= '&copy; <a href="http://openstreetmap.org" target="_blank">OSM</a>, ' +
			'<a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a>'; 
attrs['mapboxCust'] 	= '&copy; <a href="http://openstreetmap.org" target="_blank">OSM</a>' + 
			' | Tiles <a target="_blank" href="https://www.mapbox.com/about/maps/" target="_blank">Mapbox</a>, '+
			' <a target="_blank" href="https://www.mapbox.com/map-feedback/">Improve</a>';
attrs['mapboxOut'] 	= attrs['mapboxCust'] ;
attrs['mapboxSat'] 	= attrs['mapboxCust'] ;
attrs["opentopo"] 	= '&copy; <a href="http://openstreetmap.org" target="_blank">OSM</a>-Mitwirkende, SRTM | ' +
			'<a href="http://opentopomap.org" target="_blank">OpenTopoMap</a> - <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a>'; 
attrs['protomaps.l']  	= '&copy; <a href="http://openstreetmap.org" target="_blank">OSM</a> ' + 
			' | <a href="https://protomaps.com">Protomaps</a>';
attrs['protomaps.d']  	= attrs['protomaps.l'];	
attrs['graph_dir']	= ' | Route <a href="https://www.graphhopper.com" target="_blank">Graphhopper</a>';
attrs['mapquest_dir']	= ' | Route <a href="http://www.mapquest.com/" target="_blank">MapQuest</a>';
attrs['ors_dir'] 	= ' | Route <a href="https://go.openrouteservice.org/" target="_blank">ORS</a>';
attrs['osrm']  		= 'Reverse Geocoding by <a href="http://project-osrm.org/">OSRM</a>';
attrs['mappite'] 	= ' | <b>mappite.org</b>';

/* Map Layers (tiles servers) */
var mapLayer = {};
mapboxUrl = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}';
mapLayer["mapboxCust"] 	= L.tileLayer(mapboxUrl, {id: 'mapbox/streets-v11', tileSize: 512, zoomOffset: -1, accessToken: mapboxKey}); // id:  mapbox.emerald gspeed.l4pg2nnm mapbox.outdoors mapbox.satellite
mapLayer["mapboxOut"] 	= L.tileLayer(mapboxUrl, {id: 'mapbox/outdoors-v11', tileSize: 512, zoomOffset: -1, accessToken: mapboxKey}); // mapbox.satellite mapbox.mapbox-streets-v7 mapbox.outdoors
mapLayer["mapboxSat"] 	= L.tileLayer(mapboxUrl, {id: 'mapbox/satellite-streets-v11', tileSize: 512, zoomOffset: -1, accessToken: mapboxKey}); 
mapLayer["osm"] 	= L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
mapLayer["opentopo"] 	= L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png');
//mapLayer["protomaps.l"] = protomapsL.leafletLayer({url:'https://api.protomaps.com/tiles/v3/{z}/{x}/{y}.mvt?key='+protomapsKey,attribution: '', theme:"light"});
mapLayer["protomaps.l"] = protomapsL.leafletLayer({url:'https://api.protomaps.com/tiles/v3/{z}/{x}/{y}.mvt?key='+protomapsKey,attribution: '', paintRules: roadsPaintRules(), labelRules: roadsLabelRules()});
mapLayer["protomaps.d"] = protomapsL.leafletLayer({url:'https://api.protomaps.com/tiles/v3/{z}/{x}/{y}.mvt?key='+protomapsKey,attribution: '', theme:"dark"});

/* Map Route Color */
var mapRouteColor = {};
mapRouteColor["mapboxCust"]  = "green";
mapRouteColor["mapboxOut"]   = "green";
mapRouteColor["mapboxSat"]   = "#ff00ff";
mapRouteColor["osm"] 	     = "green";
mapRouteColor["opentopo"]    = "#ff00ff";
mapRouteColor["protomaps.l"] = "green";
mapRouteColor["protomaps.d"] = "#ff00ff";

/* FUNCTION: onMapLayersChange 
 * set map layer to selected map in list
 * called from:
	index.html  $(".JgMapLayers" ).change(onMapLayersChange)
	map.on zoom event to restore original zoom
 */

function onMapLayersChange (){
	var ml = document.getElementById("gOptions.mapLayer").value;
	if (!canUseMap()) {
		showToast(translations["options.forEnrolledOnly"], false, "warning");
		// reset to OSM
		document.getElementById("gOptions.mapLayer").value = "osm";
	} else {
		setMapLayer(ml);
	}
}

/* FUNCTION: setMapLayer 
 * set map layer to new one (does nothing if new is equal to current)
 * called from:
	map.on zoom event when zoom is high to use OSM
	loadRoute to set route map layer
 */
function setMapLayer (ml){
	// update layer only if new value is different from previous
	if (curL === mapLayer[ml]) return;
	consoleLog("onMapLayerChange() - layer is changing to: " + ml);
	
	map.removeLayer(curL);
	map.removeControl(curA);
	map.removeControl(scale); // to re-add it on top of attr
	curL = mapLayer[ml] ;
	curA = L.control.attribution({prefix: ''}).addAttribution(attrs[ml]+attrs['mappite']); // mapAttr[document.getElementById("gOptions.mapLayer").value];
	map.addLayer(curL);
	map.addControl(curA);
	map.addControl(scale); 

	if (activeRoute != null) { 
		// update url if route exist:
		history.pushState(name, name, activeRoute.getUrl()); 
		// set active route color
		routeColor = mapRouteColor[document.getElementById("gOptions.mapLayer").value];
		activeRoute.routePoly.setStyle({color: routeColor, opacity: 0.8, weight: 4});
	} else {
		getOptionsString(); // re-builds options string and sets the browser cookie // FIXME: check why this in in else...
	}
}

function dropHandler(e) {
	console.log('File(s) dropped');
	console.log(e);
	// Prevent default behavior (Prevent file from being opened)
	e.preventDefault();

	if (e.dataTransfer.items) {
		// Use DataTransferItemList interface to access the file(s)
		for (var i = 0; i < e.dataTransfer.items.length; i++) {
			// If dropped items aren't files, reject them
			if (e.dataTransfer.items[i].kind === 'file') {
				var file = e.dataTransfer.items[i].getAsFile();
				loadFile(file);
			}
		}
	}
}

function dragOverHandler(e) {
	console.log('File(s) in drop zone');
	// Prevent default behavior (Prevent file from being opened)
	e.preventDefault();
}