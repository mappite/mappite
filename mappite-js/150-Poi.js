
/* Function: poiToPoiRoute()
 * transform visible poiCluster markers in a new PoiRoute
 * Used by onRouteModeClick when switching to POI Editor and active POI are displayed.
 * This is to edit an existing list of Poi (first display, then switch to poiEditor)
 */
 /*
function poiToPoiRoute() {
	
	if (poiMap.size > 0) {
		//var it = poiMap.keys();
		poiMap.forEach((val, key) => {
			consoleLog("** key: " + key);
			var poiCluster = val; //poiMap.get(key);
			var poiMarkers = poiCluster.getLayers(); 
			
			if (poiMarkers.length == 0) return; // no active POI in poiCluster to include
			
			for (var i = 0; i < poiMarkers.length; i++) {
			    var cm = poiMarkers[i];

			    var vp = new ViaPoint(cm.getLatLng().lat, cm.getLatLng().lng, cm.name);

			    if (i==0) {
				activeRoute = new Route(vp, key);
			    } else { 
				addViaPoint(vp);
			    }
			    addMarkerToMap(vp);
			}
			document.getElementById("sRouteName").value = key;
		});
		activeRoute.redrawAndFocus();
	}

} */


/* Function: createPoiMarker
 * Used by loadRoute() when loading a POI list
 * Returns the Marker
 */
function createPoiMarker(lat, lon, name, icon) {
	var elem = new Object();
	elem.lat = lat;
	elem.lon = lon;
	elem.name = name;
	
	// ref. addMarkerToMap for POI added in POI Editor mode when clicking on map
	var cm = L.marker(L.latLng(elem.lat,elem.lon), {icon: L.icon({ iconUrl: icon, iconSize: [30, 30], iconAnchor: [15,35] })}); //20, 30  -> -15, -35
	cm.name = name;
	cm.bindPopup(elem.name+"<br/><div class='gsmall'>"+rightClickText+ " to add to route</div>", {offset: L.point(0,-13)}); // also doubleclick
	cm.on('contextmenu dblclick', L.bind(addJsonNode, this, elem) ); // dblclick does not work since 1st click is consumed by popup...
	return cm;
}


function editPoiId(idx) {
	var key = localStoragesKeys[idx]; //localStorage.key(idx);
	var name = key.substring(7+5);	
	
	if (isPoiMode() ) { // we're already editing a POI list
		exitPoiMode(previousMode); // attempt to set previosu mode if user doeadn want to save/cancel
	} else {
	
		// if not displayed, load them (in poiMap, this also displays in map with blue markers)
		if (!poiMap.has(name)) { consoleLog("POI not in poiMap, loading... " + name); loadRouteId(idx); }

		// if change to Poi mode is successfull
		if (setPoiMode()) {
			
			// if  displayed, hide them (remove bleu markers from map)
			if (poiMap.has(name)) { consoleLog("POI is visible, hiding"); map.removeLayer(poiMap.get(name));}

			var poiCluster = poiMap.get(name);
			var poiMarkers = poiCluster.getLayers(); 
			
			// build a new "PoiRoute" that gets managed as a route
			for (var i = 0; i < poiMarkers.length; i++) {
			    var cm = poiMarkers[i];
			    var vp = new ViaPoint(cm.getLatLng().lat, cm.getLatLng().lng, cm.name);

			    if (i==0) {
				activeRoute = new Route(vp, name);
			    } else { 
				addViaPoint(vp);
			    }
			    addMarkerToMap(vp);
			}
			
			document.getElementById("sRouteName").value = name;
			activeRoute.redrawAndFocus();
		}
	}
}

function showHidePoiId(idx) {
	if (isPoiMode() ) { // we're already editing a POI list
		if (exitPoiMode(previousMode)) { showHidePoiId(idx); } // attempt to set previous mode if user doesnt want to save/cancel and show items
	} else {
		var key = localStoragesKeys[idx]; // localStorage.key(idx);
		var name = key.substring(7+5);

		if (poiMap.has(name)) { // if POI is in map (== shown on screen), turn off
			consoleLog("Removing POI list: " + name);
			map.removeLayer(poiMap.get(name));
			poiMap.delete(name);
			$("#gpoi_"+idx).attr("src", "./icons/poi-gray.svg");
		} else {
			// load
			loadRouteId(idx);
			$("#gpoi_"+idx).attr("src", "./icons/poi-green.svg");
		}
	}
}

function isPoiMode() {
	return (currentMode === 'gMode.poiEditor');
}

function setPoiMode() {
	
	if ( !isEnrolled() ) {
		alert(translations["cloud.featureNotAvailable"]);
		return false;
	}
		
	if ( activeRoute != null && activeRoute.viaPoints.length >1 ) { // an active route exists
		if (window.confirm(translations["route.sureDeleteCurrentRoute"])) {
			activeRoute.forceClean();
		} else {
			return false; // no changes
		}
	}
	previousMode = currentMode;
	currentMode = 'gMode.poiEditor';
	alertOnce("poi.instructions");
	// highlight bg color
	$(".gpanel").attr('style','background-color: rgba(255, 190, 190, 0.8)');
	highlighMode();
	// hide options (faster, shorter, ect)
	document.getElementById("gOptions.car").style.display = "none";
	
	return true;
}

function exitPoiMode(id) {
	if ( activeRoute != null && activeRoute.viaPoints.length >1 ) { // an active route (POI route) exists
		if (window.confirm(translations["poi.sureDiscardPoiEdit"])) {
			activeRoute.forceClean();
		} else {
			return false; // no changes
		}		
	}
	consoleLog("Setting to mode: " +  id);
	currentMode = id; 
	highlighMode();
	// reset bg color
	$(".gpanel").attr('style','background-color: rgba(255, 255, 255, 0.8)');
	document.getElementById("gOptions.car").style.display = "block";
	return true;	
}
