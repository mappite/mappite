/*** Markers management ***/

/* Add a marker in the map for a route viapoint */
function addMarkerToMap(vp) { // shall this be renamed add marker to route ????
	marker = null; // = isPoiMode()?L.marker(vp.latLng, {icon: L.icon({ iconUrl: iconPoiEdit, iconSize: [30, 30], iconAnchor: [20,30]}), draggable:'true' }):L.marker(vp.latLng, {draggable:'true'});
	
	if (isPoiMode()) {
		marker = L.marker(vp.latLng, {zIndexOffset: 1001, icon: L.icon({ iconUrl: iconPoiEdit, iconSize: [30, 30], iconAnchor: [20,30]}), draggable:'true' });
	} else if (vp.isShaping) { // different size & different anchor offset
		marker = L.marker(vp.latLng, {zIndexOffset: 1005, icon: L.icon({ iconUrl: vp.getIconUrl(), iconSize: [20, 20], iconAnchor: [8,20]}), draggable:'true'});		
	} else { // normal marker
		// marker = L.marker(vp.latLng, {zIndexOffset: 1010, draggable:'true'});
		marker = L.marker(vp.latLng, {zIndexOffset: 1010, icon: L.icon({ iconUrl: vp.getIconUrl(), iconSize: [30, 40], iconAnchor: [15,40]}), draggable:'true'});
	}
	
	markers[vp.id] = marker;
	removeText = "Double-click or long tap to remove";
	if (translations != undefined) { // nasty workaroung if async call to translate has not been completed yet...
		removeText = doubleClickText+"/"+rightClickText+" " + translations["popup.remove"]; 
	}
	popupContent =  "<div id='popup_"+vp.id+"'>"+
	                "<div class='gmid'>"+escapeHTML(vp.name)+"</div>" +
			"<div class='gsmall'>Lat,Lng ("+ vp.latLng.lat.toFixed(6) + ","+ vp.latLng.lng.toFixed(6)+  ")</div>";
	
	if (isPoiMode()) {
	  popupContent = popupContent + "<a onclick='javascript:removeMarker(\""+vp.id+"\");'>   <img src='./scripts/images/trash.svg'   title='"+translations["point.delete"]+"' width='18' height='15' />    </a>&nbsp;";
	} else {
	  popupContent = popupContent + "<div style='cursor: pointer; display: flex; align-items: center; justify-content: space-between; min-width: 200px;'>" + // <span style='float: left; cursor: pointer;'>"+
				"<a class='gaddWayPoint' title='"+translations["point.addBefore"]+"' onclick='javascript:addPointHereCss(this);' href='javascript:insertPointBeforeId(\""+vp.id+"\");'>+</a>" +
				"<span class='justifiedEvenly gactions' id='t_"+vp.id+"'>"+
				 "<span><a onclick='javascript:removeMarker(\""+vp.id+"\");'><img src='./scripts/images/trash-gray.svg'   title='Delete' width='18' height='18' /></a></span>" +
				 "<span onclick='javascript:switchDivs(\"t_"+vp.id+"\",\"h_"+vp.id+"\");' ><img src='./icons/hamburger-gray.svg' alt='Export Settings' width='18' height='18'></span>"+
				"</span>" +
				"<span id='h_"+vp.id+"'  class='justifiedEvenly gactions' style='display: none;'>"+
				"<a onclick='javascript:cutRouteBefore(\""+vp.id+"\");'><img src='./icons/leftBarredArrow.svg'  title='"+translations["point.cutBefore"]+"' width='18' height='18' /></a>&nbsp;&nbsp;"+
				"<a onclick='javascript:rollFirst(\""+vp.id+"\");'><img src='./icons/startArrow.svg'       title='"+translations["point.makeFirst"]+"' width='18' height='18' /></a>&nbsp;&nbsp;" +
				
				"<a href='javascript:selectPointType(\""+vp.id+"\");'><img src='./icons/routeMarkersType.svg'  title='"+translations["point.type"]+"' width='18' height='18' /></a>&nbsp;&nbsp;" +
				"<a onclick='javascript:changeRoutePointType(\""+vp.id+"\", \"#s#\");'><img src='./icons/poiShaping-gray.svg'  title='ViaPoint <-> ShapingPoint' width='18' height='18' /></a>&nbsp;&nbsp;" +
				"<a onclick='javascript:cutRouteAfter(\""+vp.id+"\");'><img src='./icons/rightBarredArrow.svg' title='"+translations["point.cutAfter"]+"' width='18' height='18' /></a>" +
				"</span>" +
				"<a class='gaddWayPoint' title='"+translations["point.addAfter"]+"' onclick='javascript:addPointHereCss(this);' href='javascript:insertPointAfterId(\""+vp.id+"\");'>+</a>"+
				"</div>";
	}
	popupContent = popupContent + "</div>";
	
	marker.bindPopup(popupContent); //.addTo(map);// rfcuster
	markersCluster.addLayer(marker);
	
	marker.on('contextmenu dblclick',function(e) {
		e.target.openPopup();
	});
	// remove on long tap/rigth click or doubleclick
	
	/*
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
	}); */
	
	draggerize(marker, vp);

}

/* Update a point type: icon an GPX export behaviour is affected */
function changeRoutePointType(id, nameSuffix) {
	// updateViaPointName(activeRoute.getViaPoint(id).name+nameSuffix,id); 
	// this forces the point to be re-added with a different type:
	var oldVp = activeRoute.getViaPoint(id);
	updateViaPoint(oldVp.lat,oldVp.lng,oldVp.name+nameSuffix,id);
}

/* Show list of available point */
function selectPointType(id) {
	//alertOnce("route.changeRoutePointType");  
	var marker = document.getElementById("popup_"+id);
	
	// default 
	var text = "<div class='justified'><a onclick='javascript:changeRoutePointType(\""+id+"\",\"##\");'><img src='"+routeIconsMap.get("##")+"'  width='36' height='36' /></a></div>";
	var i=1;
	text += "<div class='justified'>";
	routeIconsMap.forEach(	(iconUrl, suffix) => {
	    if (suffix !== "#s#" && suffix !== "##") {
		text += "<a onclick='javascript:changeRoutePointType(\""+id+"\",\""+suffix+"\");'><img src='"+iconUrl+"'  width='36' height='36' /></a>";
		if (i++ % 3 == 0 && (i+1) < routeIconsMap.size )  text += "</div><div class='justified'>";
	    }
	});
	text += "</div>";
	text += "<div class='justified gsmall'><span style='color: black;background-color: #aaaaaa;padding: 3px;' >"+translations["point.break"]+"</span>"+
	                                      "<span style='color: white;background-color: black;padding: 3px;'>"+translations["point.dayStop"]+"</font></span></div>";
	marker.innerHTML= text;
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
    used by  addMarkerToMap */
function draggerize(marker, vp) {
	marker.on('drag', function(e) { 
		//consoleLog("drag");
		dragRemoveShow();
	});

	marker.on('dragend', function(e) { // note: not fired if long tap/rigth click remved the target.
		consoleLog("dragend: " + vp.id);
		consoleLog("insertPointAt: " + insertPointAt);		
		dragRemoveHide();
		
		if (activeRoute.viaPoints[0].id === vp.id  && activeRoute.closedLoop) { // if first point of a closed loop
			//consoleLog("*   Moving first point of a loop: " + vp.id);
			activeRoute.toggleLoop(false); // false = avoid recalculation since we (may) add a new point below 
			activeRoute.insertPointAt(0); //  first point will be moved
		} else if (activeRoute.viaPoints.length >1) {
			// Set where the point has to be inserted
			activeRoute.insertPointBeforeId(vp.id);
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
		} else { // delete point
			activeRoute.redraw(); // redraw - point has been deleted already
			activeRoute.insertPointAt(-1); // reset to last
		}
	});	
}

/* Show/Hide red banner 
    used by draggerize() and InitiateMap for gMarkerDrag */
function dragRemoveShow() {
	//document.getElementById("gMarkerRemove").style.display = "solid";
	// display red banner
	
	document.getElementById("gMarkerRemove").style.zIndex =1005; 
	document.getElementById("gMarkerRemove").style.background = "rgba(255, 0, 0, 0.2)";
	document.getElementById("gMarkerRemove").innerHTML = translations["route.deleteAreaMsg"];
} 

/* Hide red banner */
function dragRemoveHide() {
	// remove red banner
	//document.getElementById("gMarkerRemove").style.display = "none";
	
	document.getElementById("gMarkerRemove").style.zIndex =0; 
	// just to avoid showing red banner with text if maps does not load fast
	document.getElementById("gMarkerRemove").style.background = "rgba(0, 0, 0, 0)";	
	document.getElementById("gMarkerRemove").innerHTML = "";
} 


function openViaPointMarker(id) {
	// open popup
	markers[id].openPopup();
	//setView(activeRoute.getLatLng(id)); // center 
}