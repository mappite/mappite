/*** Markers management ***/

/* Add a marker in the map for a route viapoint */
function addMarkerToMap(vp) { // shall this be renamed add marker to route ????
	marker = isPoiMode()?L.marker(vp.latLng, {icon: L.icon({ iconUrl: iconPoiEdit, iconSize: [30, 30], iconAnchor: [20,30]}), draggable:'true' }):L.marker(vp.latLng, {draggable:'true'});
	
	markers[vp.id] = marker;
	removeText = "Double-click or long tap to remove";
	if (translations != undefined) { // nasty workaroung if async call to translate has not been completed yet...
		removeText = doubleClickText+"/"+rightClickText+" " + translations["popup.remove"]; 
	}
	popupText =  	"<div class='gmid'>"+escapeHTML(vp.name)+"</div>" +
			"<div class='gsmall'>Lat,Lng ("+ vp.latLng.lat.toFixed(6) + ","+ vp.latLng.lng.toFixed(6)+  ")</div>";
	
	if (isPoiMode()) {
	  popupText = popupText + "<a onclick='javascript:removeMarker(\""+vp.id+"\");'>   <img src='./scripts/images/trash.svg'   title='Delete' width='18' height='15' />    </a>&nbsp;";
	} else {
	  popupText = popupText + "<div style='cursor: pointer; display: flex; align-items: center; justify-content: space-between;'>" + // <span style='float: left; cursor: pointer;'>"+
				"<a class='gaddWayPoint' title='Add Point Before' onclick='javascript:addPointHereCss(this);' href='javascript:insertPointBeforeId(\""+vp.id+"\");'>+</a>&nbsp;" +
				"<a onclick='javascript:cutRouteBefore(\""+vp.id+"\");'> <img src='./icons/leftBarredArrow.svg'  title='Cut Before' width='18' height='10' /></a>&nbsp;"+
				"<a onclick='javascript:rollFirst(\""+vp.id+"\");'>      <img src='./icons/startArrow.svg'       title='Make First' width='18' height='10' /></a>&nbsp;" +
				"<a onclick='javascript:removeMarker(\""+vp.id+"\");'>   <img src='./scripts/images/trash.svg'   title='Delete' width='18' height='15' />    </a>&nbsp;" +
				"<a onclick='javascript:cutRouteAfter(\""+vp.id+"\");'>  <img src='./icons/rightBarredArrow.svg' title='Cut After' width='18' height='10' /> </a>&nbsp;" +
				"<a class='gaddWayPoint' title='Add Point After' onclick='javascript:addPointHereCss(this);' href='javascript:insertPointAfterId(\""+vp.id+"\");'>+</a>"+
			"</div>";
	}
		
	marker.bindPopup(popupText); //.addTo(map);// rfcuster
	markersCluster.addLayer(marker);
	// remove on long tap/rigth click or doubleclick
	marker.on('contextmenu dblclick',function(e) {
		//map.removeLayer(e.target); //  rfcuster
		consoleLog("contextmenu or dblclick");
		dragRemoveHide(); // on touch device a long press mat trigger touch move that shows the red banner, hide it
		
		if (activeRoute.viaPoints[0].id === vp.id  && activeRoute.closedLoop) { // FIXME:  if this was a potential marker the code is not in!!! + add in DRAG MOVE
			consoleLog("Attempt to delete First point of loop route, toggling to no loop");
			activeRoute.toggleLoop(); // this removes last point (instead of first)
		} else {
			removeMarker(vp.id);
			//markersCluster.removeLayer(e.target);
			//delete markers[vp.id] ;
			//activeRoute.removeViaPoint(vp.id, true);
		}
	});
	
	draggerize(marker, vp);

}

function removeMarker(id) {
	markersCluster.removeLayer(markers[id]);
	delete markers[id] ;
	activeRoute.removeViaPoint(id, true); // true = redraw route
}

function insertPointAfterId(id) {
	activeRoute.insertPointAfterId(id);
	alertOnce("route.addAfter");
}

function insertPointBeforeId(id) {
	activeRoute.insertPointBeforeId(id);
	alertOnce("route.addBefore");
}

/* Apply drag events to objects
    used by  addMarkerToMap and addPotentialMarkerToMap */
function draggerize(marker, vp) {
	marker.on('drag', function(e) { 
		//consoleLog("drag");
		dragRemoveShow();
	});

	marker.on('dragend', function(e) { // note: not fired if long tap/rigth click remved the target.
		//consoleLog("dragend"); 
		dragRemoveHide();
		
		if (activeRoute.viaPoints[0].id === vp.id  && activeRoute.closedLoop) { // if first point of a closed loop
			//consoleLog("*   Moving first point of a loop: " + vp.id);
			activeRoute.toggleLoop(false); // false = avoid recalculation since we (may) add a new point below 
			activeRoute.insertPointAt(0); //  first point will be moved
		} else if (activeRoute.viaPoints.length >1) {
			var idx = getPointLegIdx(vp.latLng); /// original marker latLng // on closed loop this returns the last (that's why this if)
			activeRoute.insertPointAt(idx);
			//consoleLog("*  Moving point idx: " +idx);
		}

		//remove marker
		markersCluster.removeLayer(e.target);
		delete markers[vp.id] ;
		activeRoute.removeViaPoint(vp.id, false);
		
		//var orig =map.getPixelOrigin();
		//var pos = map.latLngToLayerPoint(e.target.getLatLng());
		//var prj = map.project(e.target.getLatLng());
		var cnt = map.latLngToContainerPoint(e.target.getLatLng());
		//consoleLog(e);
		if (cnt.y >80) { // if outside red banner - fake event to generate click and create new marker
			e.latlng = e.target.getLatLng();
			onMapClick(e); // it will redraw()
		} else {
			activeRoute.redraw(); // redraw - point has been deleted already
			activeRoute.insertPointAt(-1); // reset to last
		}
	});	
}

/* Show/Hide red banner 
    used by draggerize() and InitiateMap for gMarkerDrag */
function dragRemoveShow() {
	// display red banner
	document.getElementById("gMarkerRemove").style.zIndex =1000; 
	document.getElementById("gMarkerRemove").style.background = "rgba(255, 0, 0, 0.2)";
	document.getElementById("gMarkerRemove").innerHTML = translations["route.deleteAreaMsg"];
} 

/* Hide red banner */
function dragRemoveHide() {
	// remove red banner
	document.getElementById("gMarkerRemove").style.zIndex =0; 
	// just to avoid showing red banner with text if maps does not load fast
	document.getElementById("gMarkerRemove").style.background = "rgba(0, 0, 0, 0)";	
	document.getElementById("gMarkerRemove").innerHTML = "";
} 

/* Delete a Potential Marker in the map for a potential route waypoint. 
   Called by Potential Marker popup,  addPotentialMarkerToMap */
/*function onDeletePotentialMarker(id) {
	//map.removeLayer(markers[id]); // rfcuster
	markersCluster.removeLayer(markers[id]);
	delete markers[id] ;
}
*/

function openViaPointMarker(id) {
	// open popup
	markers[id].openPopup();
	//setView(activeRoute.getLatLng(id)); // center 
}