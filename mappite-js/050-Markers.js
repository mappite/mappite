/*** Markers management ***/

/* Add a marker in the map for a route viapoint */
function addMarkerToMap(vp) { // shall this be renamed add marker to route ????
	marker = L.marker(vp.latLng, {draggable:'true'}); 
	
	markers[vp.id] = marker;
	removeText = "Double-click or long tap to remove";
	if (translations != undefined) { // nasty workaroung if async call to translate has not been completed yet...
		removeText = doubleClickText+"/"+rightClickText+" " + translations["popup.remove"]; 
	}
	popupText =  	"<div class='gmid'>"+escapeHTML(vp.name)+"</div>" +
			"<div class='gsmall'>Lat,Lng ("+ vp.latLng.lat.toFixed(6) + ","+ vp.latLng.lng.toFixed(6)+  ")<br>"+ removeText +"</div>"+
			"<span style='float: right; cursor: pointer;'>"+
			"<img src='./icons/leftBarredArrow.svg'  onclick='javascript:cutRouteBefore(\""+vp.id+"\");' title='Cut Before' width='15' height='8' />&nbsp;&nbsp;"+
			"<img src='./icons/rightBarredArrow.svg' onclick='javascript:cutRouteAfter(\""+vp.id+"\");'  title='Cut After' width='15' height='8' ></span>";
	
	marker.bindPopup(popupText); //.addTo(map);// rfcuster
	markersCluster.addLayer(marker);
	// remove on long tap/rigth click or doubleclick
	marker.on('contextmenu dblclick',function(e) {
		//map.removeLayer(e.target); //  rfcuster
		consoleLog("contextmenu or dblclick");
		dragRemoveHide(); // on touch device a long press mat trigger touch move that shows the red banner, hide it
		
		if (activeRoute.viaPoints[0].id === vp.id  && activeRoute.closedLoop) { // EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE if potential the code is not in!!! + add in DRAG MOVE
			consoleLog("Attempt to delete First point of loop route, toggling to no loop");
			activeRoute.toggleLoop(); // this removes last point (instead of first)
		} else {
			markersCluster.removeLayer(e.target);
			delete markers[vp.id] ;
			activeRoute.removeViaPoint(vp.id);
			activeRoute.redraw();
		}
	});
	
	draggerize(marker, vp);

}


/* Add a (semi-transparent) marker in the map for a potential route waypoint.
   PotentialMarkers are the one created by  by Search */
function addPotentialMarkerToMap(vp, info, icon) {
	// default for info since IE does not support  ES2015 default parameters
	info= (typeof info !== 'undefined') ?  info : null;
	
	var ll = vp.latLng;
	var id = vp.id;
	var label = vp.name;
	var popupText = 
		"<div id='"+"a_"+id +"' class='gsmall'>"+rightClickText+ " " + translations["popup.add"] + "</div>" +
		"<div class='gmid'>"+escapeHTML(label)+"</div>" +
		(info != null?info:'') +
		"&nbsp;-&nbsp;<a href='javascript:onDeletePotentialMarker(\""+id+"\")'><img src='./scripts/images/trash.svg' alt='Remove' width='10' height='10'></a>";
	if (icon) {
		potentialMarker = new L.Marker(ll, {icon: L.icon({ iconUrl: icon, iconSize: [20, 20] })});
	} else {
		potentialMarker = new L.Marker(ll).setOpacity(0.5);
	}
	//potentialMarker.bindPopup(popupText)
	//		.addTo(map)
	//		.openPopup();
	
	markersCluster.addLayer(potentialMarker);
	potentialMarker.bindPopup(popupText).openPopup(); //  rfcuster addedd to bind and open popup to marker in cluster
		
	markers[id] = potentialMarker;
	potentialMarker.on('contextmenu',function(e) { // make it a real way Marker
			//consoleLog("in PotentialMarker contextmenu event: " +"a_"+id);
			e.target.setOpacity(1);
			e.target.dragging.enable();
			/*e.target.on('dragend', function(e) {
				consoleLog("Drag ends at:" + e.target.getLatLng());
				var idx = getPointLegIdx(vp.latLng); /// original marker latLng
				activeRoute.insertPointAt(idx);
				//remove marker
				markersCluster.removeLayer(e.target);
				delete markers[vp.id] ;
				activeRoute.removeViaPoint(vp.id);
				// fake event...
				e.latlng = e.target.getLatLng();
				onMapClick(e); 
			});*/
			draggerize(e.target,vp);
			
			popupText =  
				"<div id='"+"a_"+id +"' class='gsmall'>"+rightClickText+ " " + translations["popup.remove"] + "</div>" +
				"<div class='gmid'>"+escapeHTML(label)+"</div>" +
				"<div class='gsmall'>Lat,Lng  ("+ ll.lat.toFixed(6)+","+ll.lng.toFixed(6)+  ")</div>" +
				(info != null?info:'') +
				"<span style='float: right; cursor: pointer;'>"+
				"<img src='./icons/leftBarredArrow.svg'  onclick='javascript:cutRouteBefore(\""+vp.id+"\");' title='Cut Before' width='15' height='8' />&nbsp;&nbsp;"+
				"<img src='./icons/rightBarredArrow.svg' onclick='javascript:cutRouteAfter(\""+vp.id+"\");'  title='Cut After' width='15' height='8' ></span>";

			geoResultsNames[id]= info ;
			e.target.setPopupContent(popupText);  
			addNewViaPoint(ll.lat,ll.lng, label,id);  
			activeRoute.redraw();
			e.target.off('dblclick'); // remove event listener to remove on douibleckicl
			e.target.off('contextmenu'); // remove event listener to add this wp on right click / long tap
			// add new event listener to remove this wp on right click / long tap
			e.target.on('contextmenu',function(e) {
					//map.removeLayer(e.target);  // rfcuster
					markersCluster.removeLayer(e.target);
					delete markers[id] ;
					delete geoResultsNames[id];
					if (activeRoute!=null) activeRoute.removeViaPoint(id); // 
					activeRoute.redraw();
			});
	});
	potentialMarker.on('dblclick',function(e) {
			//map.removeLayer(e.target);  // rfcuster
			markersCluster.removeLayer(e.target);
			delete markers[id] ;
			delete geoResultsNames[id];
			if (activeRoute!=null) activeRoute.removeViaPoint(id);
			activeRoute.redraw();
	});
	

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
		activeRoute.removeViaPoint(vp.id);
		
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
} 

/* Hide red banner */
function dragRemoveHide() {
	// remove red banner
	document.getElementById("gMarkerRemove").style.zIndex =0; 
	document.getElementById("gMarkerRemove").style.background = "rgba(0, 0, 0, 0)";	// just to avoid showing red banner if maps does not load fast
} 

/* Delete a Potential Marker in the map for a potential route waypoint. 
   Called by Potential Marker popup,  addPotentialMarkerToMap */
function onDeletePotentialMarker(id) {
	//map.removeLayer(markers[id]); // rfcuster
	markersCluster.removeLayer(markers[id]);
	delete markers[id] ;
}

function openViaPointMarker(id) {
	// open popup
	markers[id].openPopup();
	//setView(activeRoute.getLatLng(id)); // center 
}