/*** The Route object and related functions to manipulate and display a route ***/

/* FUNCTION: addViaPoint
 * Input: ViaPoint
 * Add the ViaPoint to the route, a new route is created if not existent
 */

function addViaPoint(vp){
	if (activeRoute==null)  { 
		activeRoute = new Route(vp,routeDefaultName);
		return true;
	} else if (activeRoute.viaPoints.length<MAX_ROUTE_POINTS ||
		   ( isPoiMode() && activeRoute.viaPoints.length<MAX_POI_POINTS ) ) { // FIXME: no limit on POI, need to extimate on
		activeRoute.addViaPoint(vp);		
		return true;
	} else {
		alert(isPoiMode()?translations["poi.maxPointsReached"]:translations["route.maxViaPointsReached"] ); 
		return false;
	}
}


/* FUNCTION: updateViaPoint
 * Input: number, number, string, string
 * update a given viapoint (id) if it exists, otherwise add a new via point FIXME: does it ever need to add a new viapoint?
 * Note: this does not update the route, if lat/lng are changed  call activeRoute.redraw() to re-compute the route
 *	note: this is called from Control.Geocoder.js also, 
 *		it refreshes the route gPanel and updates Marker popup text 
 */
function updateViaPoint(lat,lng,name, id){
	var vp = new ViaPoint(lat,lng,name); // name containe the suffix for viapoint type 
		
	if ( !activeRoute.updateViaPoint(vp,id) ) { addViaPoint(vp); }// update via point id, if it fails (i.e. id does not exists), add it
	
	// remove old marker
	if ( markers[id] != null ) {
		markersCluster.removeLayer(markers[id]);
		delete markers[markers[id]] ;
	}		
	addMarkerToMap(vp);
	
	// need to refresh since there is a new ID now
	refreshRouteInfo();
}

/* FUNCTION: updateViaPoint
 * Input: number, string
 * update name of the viapoint, used when a Point gets renamed (ref refreshRouteInfo() below) 
 * Note: point type is preserved honoring the suffix from old point
 */
function updateViaPointName(newname,id) {
	var oldVp = activeRoute.getViaPoint(id);
	// honor viaPoint type by appending the suffix
	newname = newname + oldVp.nameSuffix;
	updateViaPoint(oldVp.lat,oldVp.lng,newname,id);
	//var vp = new ViaPoint(oldVp.lat,oldVp.lng,name,id);
}


/**  
 * CLASS: ViaPoint
 *
 * Note: special suffix name ending in #s# identifies a shaping point
 *	 icon (ref. addMarkerToMap()) and export (ref. exportGpx()) uses 
 *		route.getUrl adds back #s# to point name in URL
 *	  
 **/
var ViaPoint = L.Class.extend({
    initialize: function (lat,lng,name) {
	this.id = "vp_"+viaPointId++; // unique id
	if (name == "" ||  name == null) name = "no name";
	this.name = name.replace(/\|/g," ");
	this.latLng = L.latLng(lat,lng);
	this.lat = lat;
	this.lng = lng;
	this.isShaping = false;
	this.isBreak = false;
	this.isStop = false;
	this.iconUrl = routeIconsMap.get("##"); // default
	this.nameSuffix = "";
	    
	const rexpStop  = new RegExp('#S.?#$');
	const rexpBreak = new RegExp('#B.?#$');
	    
	if (name.endsWith("#s#")) {
		this.isShaping = true;
		consoleLog("*** Shaping Point: " + name);
	} else if (rexpBreak.test(name)) {
		this.isBreak = true; 
		consoleLog("*** Break Point: " + name);
	} else if (rexpStop.test(name)) {
		this.isStop = true; 
		consoleLog("*** Stop Point: " + name);
	} 
	
	const rexpType  = new RegExp('#.*#$'); // #s#, #S#, #B#, #S.#, #B.#
	var s = name.match(rexpType);	
	if ( s != null) { 
	   this.nameSuffix = s[0];
	   this.iconUrl = routeIconsMap.get(s[0]); 
	}
	
	// remove #.*# from name
	this.name = name.replace(rexpType,"");
	
    },
    getName: function () {
	return this.name;
    },
    getLatLng: function () {
	return this.latLng;
    },  
    getLatLngStr: function () {
	return this.lat+","+this.lng;
    },
    /*isShaping: function () {
	return this.isShapingPoint;
    },
    isBreak: function () {
	return this.isBreakPoint;
    },
    isStop: function () {
	return this.isStopPoint;
    },
    nameSuffix: function () {
	return this.nameSuffix;
    }, */
    getIconUrl: function () {
	return this.iconUrl;
    }
});

/**  
 * CLASS: Legs 
 **/

var Leg = L.Class.extend({
    initialize: function (distance, time, hasUnpaved, lls) {
	this.distance= distance; // distance in selected uom
	this.time = time; // time in secs
	//this.formattedTime = formattedTime; // as it will appear on screen
	this.hasUnpaved = hasUnpaved; // true if route contains unpaved
	this.lls = lls; // array of L.latLng or [lat,lng] ???
    }
}); 

/**  
 * CLASS: Route
 **/
var Route = L.Class.extend({
    initialize: function (vp,name) { // a viapoint and a name
	this.name = name;
	this.viaPoints = [ vp ];
	this.linePoly = L.polyline([vp.latLng], {color: 'red', opacity: 0}).addTo(map); // used only for fit bound before calculation, maybe REMOVE?
	this.legs = new Array();
	this.legsIdx = new Array(); // start (or end) point in lls

	this.routePoly; // the Route polyline from direction service (green)
	this.track;

	this.routeDistance = "n/a"; // displays only if != n/a
	this.routeFormattedTime; 
	this.closedLoop = false; 
	this.markersIdx = {}; // contains  markers index to show marker index in route

    },
    
    setName: function(name) {
	this.name = name;    
    },
    /*
    addLeg: function(leg, position) { // add a new leg at a given position  // BETA not in use - see computeRouteORS
	consoleLog("Adding leg at pos " + position);
	this.legs[position-1] = leg; // position index starts from 0
	// if all legs are defined, (re-)draw the route	
	if ( this.legs.every(el => (typeof el !== "undefined") )) { // SYNTAX ERROR ON IE11 AND SAFARI on IPAD!!!
		refreshRouteInfo(); // refresh html box
		if (activeRoute.routePoly ) { map.removeLayer(activeRoute.routePoly);} // remove existing 
		var rpLls = new Array();
		for (var i = 0; i < this.legs.length; i++) { // append all legs
			Array.prototype.push.apply(rpLls, this.legs[i].lls);
		}
		consoleLog("Complete Route with all Legs has " +rpLls.length+ " shapepoints");
		activeRoute.routePoly = L.polyline(rpLls , {color: 'green'}).addTo(map);
	}
    }, */

    cleanLegs: function(leg) { // clean all legs // BETA not in use - see computeRouteORS
	this.legs = new Array();
    }, 
    
    setLegs: function(legs) { // set all legs at once
	//consoleLog("Setting legs");
	this.legs  = legs;
    },
    setLegsIdx: function(legsIdx) { // 
	//consoleLog("Setting legsIdx");
	this.legsIdx  = legsIdx;
    },
    addViaPoint: function (vp) { // add a via point Note:  use standalon function addViaPoint to control max number of points
	if (insertPointAt<0) {
		if (this.closedLoop != true) {
			this.viaPoints.push(vp);
			this.linePoly.addLatLng(vp.latLng);
		} else { // closed loop, ad before last
			insertPointAt = this.viaPoints.length-1;
			this.linePoly.getLatLngs().splice(insertPointAt, 0, vp.latLng); // add element at pos i+offset
			this.viaPoints.splice(insertPointAt, 0, vp); // add element at pos i+offset
			insertPointAt = -1; // reset 
		}
	} else  {
	    	this.linePoly.getLatLngs().splice(insertPointAt, 0, vp.latLng); // add element at pos i+offset
		this.viaPoints.splice(insertPointAt, 0, vp); // add element at pos i+offset
		insertPointAt = -1; // reset 
	}
    },
	
    insertPointAt: function(idx) { // set the index where the next new vp will be added (-1=at the end)
	 insertPointAt = idx;   
    },
    
    insertPointAfterId: function(id) { // from a givedn viapoint id, set the index where the next new vp will be added (-1=at the end)
	// find index of viapoint
	var i = getViaPointIndex(id);
	this.insertPointAt(i+1);   
    },
    
    insertPointBeforeId: function(id) { // from a givedn viapoint id, set the index where the next new vp will be added (-1=at the end)
	var i = getViaPointIndex(id);
	this.insertPointAt(i);   
    },

    removeViaPoint: function (id, redraw) {
	var i = getViaPointIndex(id);
	consoleLog("Removing via point: " + i);
	this.linePoly.getLatLngs().splice(i, 1); // remove element at pos i
	this.viaPoints.splice(i, 1); // remove element at pos i
	if (redraw) this.redraw();

    },
    
    splice: function (start,end) { // remove points from start to end
	if (this.closedLoop != true) {
		consoleLog("splice("+start+","+start+")");
		if (end == -1) end = this.viaPoints.length; // remove up to last point
		
		if (end<start) {
			consoleLog("splice: end before start");
		} else {
			// remove markers first
			for(k = start; k < end; k++) {
				consoleLog("inverseSplice: removing marker k: " + k);
				markersCluster.removeLayer(markers[this.viaPoints[k].id]);
			}
			this.linePoly.getLatLngs().splice(start,(end-start)); 
			this.viaPoints.splice(start,(end-start)); 
			this.redraw();	
			insertPointAt = -1; //
		}
	} else {
		alert("I can't splice closed loop routes");
	}
    },
    

    moveViaPoint: function (id, offset) { // move a viapoint in the list by offset // could be use to implement drag&drop in gRoute panel
	//for (i = 0; i < this.viaPoints.length; i++) {
	//    if (this.viaPoints[i].id == id) { break; }
	//}
	var i = getViaPointIndex(id);
	if ( i == this.viaPoints.length) { 
		consoleLog("attempt to move a point not in route");
	} else if ( ( i+offset)>  this.viaPoints.length-1 || (i+offset) <  0) {
		consoleLog("attempt to move a point before the first or after the last"); 
	} else {
		var vp = this.viaPoints[i];
		this.linePoly.getLatLngs().splice(i, 1); // remove element at pos i
		this.viaPoints.splice(i, 1); // remove element at pos i
		this.linePoly.getLatLngs().splice(i+offset, 0, vp.latLng); // add element at pos i+offset
		this.viaPoints.splice(i+offset, 0, vp); // add element at pos i+offset
	}
	//this.redraw();
    },
    
    rollFirst: function (id) { // make this point the first one
	var isLoop = false;
	if (this.closedLoop) { // unloop for the roll
	   isLoop = true;
	   this.toggleLoop(false);
	}

	var idx = getViaPointIndex(id);
	if (idx == 0) return; // it's already the first
	    
	var offset = idx;
	var j = 0;
	var newVps =  [];
	while ( idx != offset-1) {
	   newVps[j++] = this.viaPoints[idx++];	
	   if ( idx > this.viaPoints.length-1) { idx = 0; }
	}
	newVps[j] = this.viaPoints[idx];	
	this.viaPoints = newVps;
	
	if (isLoop) { this.toggleLoop(false); } // reloop
	
	this.redraw();
    },

    moveUp: function (id) { // move up
	this.moveViaPoint(id,-1);
	this.redraw();
    },
    moveDown: function (id) { // move up
	this.moveViaPoint(id,1);
	this.redraw();
    },
    reverse: function() { // invert route

	if ( this.closedLoop ) { // siwtch Marker from first to last point
		var firstVp = this.viaPoints[0];
		var lastVp = this.viaPoints[this.viaPoints.length-1];
		markersCluster.removeLayer(markers[firstVp.id]);
		delete markers[firstVp.id];
		addMarkerToMap(lastVp);	
	}
	
	this.viaPoints.reverse();
	this.linePoly.getLatLngs().reverse();
	
	this.redraw();	    
    },
    toggleLoop: function(redraw) { // add a new via point if last does not match with first. 
	if (redraw == null) redraw = true; // redraw = flase when dragging origin in closed loop mode
	//if ( this.viaPoints[0].getLatLngStr() === this.viaPoints[this.viaPoints.length-1].getLatLngStr() )  {
	if ( this.closedLoop ) {
		consoleLog("Setting Closed Loop FALSE");
		this.closedLoop = false;
		// remove last via Point
		this.linePoly.getLatLngs().splice(this.viaPoints.length-1, 1); // remove element at pos i
		this.viaPoints.splice(this.viaPoints.length-1, 1); // remove element at pos i
	    	
	} else {
		// add a new last ViaPoint Matching the first, with no marker
		var firstVp = this.viaPoints[0];
		consoleLog("Adding Last ViaPoint Matching the first: " + firstVp.getLatLng().lng);
		addViaPoint(new ViaPoint(firstVp.getLatLng().lat, firstVp.getLatLng().lng, firstVp.getName()));
		consoleLog("Setting Closed Loop TRUE");
		this.closedLoop = true;
		
	}
	if (redraw) this.redraw();
    },
   updateViaPoint: function (vp, id) { // update via point at pos id with a new viapoint
	for (i = 0; i < this.viaPoints.length; i++) {
	    if (this.viaPoints[i].id == id) { break; }
	}
	// honoring  shaping points is  managed via isNextPointShaping
	
	if ( i == this.viaPoints.length) { 
		return false;
	} else {
		this.linePoly.getLatLngs().splice(i, 1); // remove element at pos i
		this.viaPoints.splice(i, 1); // remove element at pos i
		this.linePoly.getLatLngs().splice(i, 0, vp.latLng); // add element at pos i+
		this.viaPoints.splice(i, 0, vp); // add element at pos i+
		//this.redraw();
		return true;
	}
    },
    
    getViaPoint: function(id) {
	for (i = 0; i < this.viaPoints.length; i++) {
	    if (this.viaPoints[i].id == id) { return this.viaPoints[i]; }
	} 
	return null;
    }, 
    
    redraw: function () { // redraw the viaPoints connection polyline (red) and recompute the route, draw it (green) plus refresh the html divs
	this.linePoly.redraw(); // red line (connects via Points)
	refreshRouteInfo(); // promptly re-draw gRoute panel

	if ( isPoiMode() ) return; // poi mode, nothing to calculate

	if ( this.viaPoints.length>1) { 
		computeRoute(this.viaPoints, false); // green line (route), this redraws again the gRoute panel to update time/distance
	} else if ( this.viaPoints.length==1 & activeRoute.routePoly!=null) {	// if last point has been removed, remove green route and circles
		map.removeLayer(activeRoute.routePoly); 
		routeMilestonesGroup.clearLayers();
	} 
    },
    
    redrawAndFocus: function () { // as redraw() but focus on route once computed
	this.linePoly.redraw(); // red line (connects via Points)
	refreshRouteInfo(); // promptly re-draw gRoute panel

	if (isPoiMode() ) return; // poi mode, nothing to calculate

	if ( this.viaPoints.length>1) { 
		computeRoute(this.viaPoints, true); // green line (route), this redraws again the gRoute panel to update time/distance
	} else if ( this.viaPoints.length == 1) {
		map.setView(this.viaPoints[0].getLatLng(),16)
	}
	    
    },
    
    focus: function () { // center map on route
	//if ( this.viaPoints.length>1) map.fitBounds(activeRoute.routePoly.getBounds());  // map.fitBounds(this.linePoly.getBounds()); 
	if ( this.viaPoints.length>1) map.fitBounds(this.linePoly.getBounds());  // map.fitBounds(this.linePoly.getBounds()); 
    },
    
    
    clean: function () {
	if (window.confirm(translations["route.sureDeleteCurrentRoute"])) {
		this.forceClean();
		history.pushState("clean", "clean", window.location.pathname);
	} 

    },

    forceClean: function () { // do not ask for confirmation and clean...

	// clean route
	for (i = this.viaPoints.length-1; i >=0  ; i--) {
		id = this.viaPoints[i].id;
		this.linePoly.getLatLngs().splice(i, 1); // remove element at pos i
		this.viaPoints.splice(i, 1); // remove element at pos i
		//map.removeLayer(markers[id]); // rfcuster
		if (markers[id] != null) { // last marker is null if cloed loop
			markersCluster.removeLayer(markers[id]);
			delete markers[id] ;
		}
	}

	// activeRoute.routePoly is null for POI or last point has been already deleted
	if (activeRoute.routePoly != null && map.hasLayer(activeRoute.routePoly))  {
		map.removeLayer(activeRoute.routePoly); // remove route
	}
	if (activeRoute.linePoly != null && map.hasLayer(activeRoute.linePoly))  map.removeLayer(activeRoute.linePoly);  // hide red poly

	
	// remove canvas
	document.getElementById("gCanvas").style.display = "none";
	
	routeMilestonesGroup.clearLayers(); // remove milestones
	// 
	this.routePoly = null;
	this.cleanLegs();
	// reset
	this.closedLoop = false;

	// viaPointId = 0; // FIXME: not sure we need to reset the counter, it does not matter

	refreshRouteInfo();
    },    
    getUrl: function () { // returns the encoded points route url

	var names = "";
	for (var i = 0; i < this.viaPoints.length; i++) {
	    names = names + "|" + encodeURIComponent(this.viaPoints[i].name+(this.viaPoints[i].nameSuffix)); // pipe separated list
		//console.log("*** vp name: " + this.viaPoints[i].name);
		//console.log(this.viaPoints[i]);
	}
	var compressed = this.getCompressedPoints(); //trackCompress(points,5);

	var distance = "";
	if (this.viaPoints.length > 1 & !isNaN(this.routeDistance) ) {
		distance = "&distance="+Number(this.routeDistance).toFixed(2)+ (document.getElementById("gOptions.uom").value==="k"?"km":"mi");
	}

	var shortUrl = window.location.pathname+
				"?options="+getOptionsString()+"&viapoints="+compressed+"&names="+names+
				"&name="+encodeURIComponent(this.name)+distance;
	
	//consoleLog("shortUrl : "+ shortUrl );
	return shortUrl;
    },
    
    getCompressedPoints: function () { // it'a actually the ViaPoints
	var points = [];
	var j=0;
	for (var i = 0; i < this.viaPoints.length; i++) {
	    points[j++] = this.viaPoints[i].lat;
	    points[j++] = this.viaPoints[i].lng;
	}
	return compressed = trackCompress(points,5);
    },

    getCompressedTrack: function () { // return compressed route track
	var points = [];
	var track = this.routePoly.getLatLngs();
	var j=0;
	for (var i = 0; i < track.length; i++) {
	    points[j++] = track[i].lat;
	    points[j++] = track[i].lng;
	}
	return compressed = trackCompress(points,5);
    },
    toString: function () {
	var arrayLength = this.viaPoints.length;
	var s = "Via Points ="+arrayLength;
	for (var i = 0; i < arrayLength; i++) {
	    s = s + " -> " + this.viaPoints[i].id + " - " +this.viaPoints[i].name+"("+this.viaPoints[i].latLng+")";
	}
	return s;
    }
    
});		

/* FUNCTION: getPointLegIdx
 * returns the lls index of the point closest to ll // FIXME: evaluate to use getClosestPointIdx
 * Input: LatLng
 */
function getPointLegIdx (ll) {
	var idx = -1; // detect in which leg is the point to be added. -1 is last one	
	var minDist = 1000; // mt
	var llsIdx = -1;
	if (activeRoute.routePoly) { 
		var lls = activeRoute.routePoly.getLatLngs();
		idx = 0;
		for(var i = 0; i<lls.length;i++) {
			d =  getDistance([lls[i].lat,lls[i].lng], [ll.lat, ll.lng], 0,0);
			if (d<minDist) { minDist = d; llsIdx=i; }
		} //  llsIdx contains the lls index of the closest point to click event
		console.log("clicked point is at index: " + llsIdx);
		while( idx < activeRoute.legsIdx.length) {
			if ( llsIdx < activeRoute.legsIdx[idx] ) break;
			idx++;
		}
	} 
	return idx;
	
}


/* 
 * Refresh  gRoute/gRouteInfo panels (divs) to reflect current active route
 * Note: this is called twice every time a new point is added (to provide a prompt feedback and then to update with new leg info)
 */

function refreshRouteInfo() {
	
	var arrayLength = activeRoute.viaPoints.length;

	var indexIconStartClass = "gIMGreen";
	var indexIconEndClass = "gIMRed";

	if ( activeRoute.closedLoop ) {
		consoleLog("Route is a LOOP! Setting Icon classes");
		indexIconStartClass = "gIMLoop";
		indexIconEndClass = "collapsed";
	}

	
	var uom = (document.getElementById("gOptions.uom").value==="k"?"km":"mi");
	var routeInfo= "";
	if (arrayLength> 1 && activeRoute.routeDistance != "n/a" ) { 
		var closedRouteStyle="";
		if (activeRoute.closedLoop) { closedRouteStyle='style="color: green;"'; }
		routeInfo = '<a class="gactions" href="javascript:activeRoute.clean();" title="Clean Current Route">&#215;</a> ' +
			formatDecimal(activeRoute.routeDistance,2)+ uom +" ("+ activeRoute.routeFormattedTime+")" +
			'&nbsp;<a id="gClosedRoute" class="gactions" href="javascript:activeRoute.toggleLoop();" title="'+translations["route.closedLoop"]+'" '+closedRouteStyle+'>&#8634;</a> ' +
			'&nbsp;<a class="gactions" href="javascript:activeRoute.reverse();" title="'+translations["route.invert"]+'"><img src="./icons/reverse.svg" width="20" height="20"/></a> ';
			// '&nbsp;<a class="gactions" href="javascript:activeRoute.reverse();" title="'+translations["route.invert"]+'">&#8644;</a> ';
	}
	document.getElementById("gRouteInfo").innerHTML  = routeInfo;
	var s = "";
	
	// clean Index markers so they can get refreshed according to position on route below
	for (idx in activeRoute.markersIdx) {
		//consoleLog("deleting idx:" + idx);
		//consoleLog(activeRoute.markersIdx[idx]);
		map.removeLayer(activeRoute.markersIdx[idx] );
		delete activeRoute.markersIdx[idx] ;
	} 

	var legsTimeTotal = 0;
	var legsDistanceTotal = 0;
	
	for (var i = 0; i < arrayLength; i++) {
		vp = activeRoute.viaPoints[i];

		preS = "<span style='width: 24px; display: inline-block;'></span>";// just to reserve 24px (20+ 2x2padding)
		postS = "<span style='width: 24px; display: inline-block;'></span>";
		
		indexIconClass = "gIMWhite";
		
		if (i==(arrayLength-1)) { // Last
			indexIconClass = indexIconEndClass;
			if (!activeRoute.closedLoop) { // omit in closed loop since we don't want to add points after the last one
				postS= "&nbsp;<a class='gaddWayPoint' style='color: green;width: 20px; display: inline-block;' title='Add Point Here'  onclick='javascript:addPointHereCss(this);' href='javascript:activeRoute.insertPointAt(\""+(i+1)+"\");'>+</a>"; 
			}
		} else {
			if (!activeRoute.closedLoop || ( i!=(arrayLength-2) && i!=0 ) ) { // no down arrow if closed loop and first or one before last
				postS = "<a class='gactions' title='Move After' href='javascript:activeRoute.moveDown(\""+vp.id+"\")'><img src='./icons/down.svg' width='20' height='20'></a>";
			}
		}

		if (i==0) { // First
			indexIconClass = indexIconStartClass ;
			if (!activeRoute.closedLoop) { // omit in closed loop since we don't want to add points before the last one
				preS= "<a class='gaddWayPoint' title='Add Point Here' style='width: 20px; display: inline-block;'  onclick='javascript:addPointHereCss(this);' href='javascript:activeRoute.insertPointAt(\"0\");'>+</a>&nbsp;";
			}
		} else {
			if (!activeRoute.closedLoop || ( i!=(arrayLength-1) && i!=1 ) ) { // no up arrow if closed loop and last or second
				preS = "<a class='gactions' title='Move Before' href='javascript:activeRoute.moveUp(\""+vp.id+"\")'><img src='./icons/up.svg' width='20' height='20'></a>"
			}
		}
		
		// style point number and name based on point type
		var numberstyle ="padding-left: 2px; border-radius: 3px;";
		var txtstyle = "";
		if (vp.isStop) numberstyle += "color: white;background-color: black;";
		else if (vp.isBreak) numberstyle += "color: black;background-color: #aaaaaa;";
		else if (vp.isShaping) txtstyle+= "font-weight: normal;";
		
		s = s +"<span class='groute_vp'>"+
		     preS +
	             "<span style='"+numberstyle +"'>"+(i+1)+".</span> <input style='"+txtstyle +"' type='text'  id='"+vp.id+"' onclick='javascript:openViaPointMarker(\""+vp.id+"\")'  class='inputsRoute' value='" +escapeHTML(vp.name)+"' size='20' maxlength='50'>" +
	             postS+
		     "</span>";
		elid = "#"+vp.id;
		//consoleLog( "Adding:" + elid + " to change event with delegation"); 
		// Handler to update point name
		// remove previous handler 
		$(document.body).off("change", elid);
		$(document.body).on("change", elid, (function(){ 
				//consoleLog( "On Change for:" + this.id +  " New name will be:" + document.getElementById(this.id).value);
				updateViaPointName(document.getElementById(this.id).value,this.id);
				// update url
				history.pushState(name, name, activeRoute.getUrl());
			}));	

		// Add distance/time
		if (arrayLength>1 && activeRoute.legs[i] != null && i< arrayLength-1)  {
			
			var legIcon = "legViaVia";
			if (legsInfo==1) legIcon = "legStopVia"; 
			else if (legsInfo==2) legIcon = "legBreakVia"; 
			
			// reset totals at day stops or at breaks if legsInfo==2
			if (vp.isStop || (vp.isBreak && legsInfo==2) ) {
				legsTimeTotal = 0;
				legsDistanceTotal = 0;
				//legIcon = "legStartCont.svg";  // cumul start *-°
			} 
			legsTimeTotal += +activeRoute.legs[i].time;
			legsDistanceTotal += activeRoute.legs[i].distance;
			
			var time = activeRoute.legs[i].time;
			var distance = activeRoute.legs[i].distance;
			if (legsInfo!=0) {
			    time = legsTimeTotal;
			    distance = legsDistanceTotal;
			}
			// if next viaPoint exists and it is a stop/break, update icon
			if (legsInfo!=0 && i < (arrayLength-1)) {
				var nextVp = activeRoute.viaPoints[i+1];
				if ( (nextVp.isStop || nextVp.isBreak) && legsInfo==2) legIcon = "legBreakBreak";
				else if (nextVp.isStop) legIcon = "legStopStop";
			}
			// The "+" sign can be clicked on to add next point after this one
			// keyboard keys pressed when "+" sign is focused are passed to onCutKeyPress
			// to cut the route
			s += "<div id='dd_"+vp.id+ "' class='legsInfo'>"+ 
			        "<span onclick='javascript:legsInfoToggle()' style='width: 230px;'>"+
				 "<img src='./icons/"+ legIcon + ".svg' width='20' height='20'>"+ formatDecimal(distance,2)+ uom + " ("+ formatTime(time) + ")"+ 
			        "</span>" + 
				"<span>&nbsp;<a class='gaddWayPoint' title='Add Point Here' onclick='javascript:addPointHereCss(this);' href='javascript:activeRoute.insertPointAt(\""+(i+1)+"\");'>+</a></span>"+
			     "</div>";
			//consoleLog("* leg("+ i +"): dist/time" + time  + "/" + distance);
			
		}
		
		// add index below marker
		var indexIcon = L.divIcon({className: 'gIndexMarker '+indexIconClass, html: (i+1)}); //, iconSize: 16});
		var markerPos = L.marker(activeRoute.viaPoints[i], {icon: indexIcon});
		
		markerPos.on("click",  function(e) {
			//L.DomEvent.stopPropagation(e); 
			//L.DomEvent.preventDefault(e);
			map.zoomIn();
			} ).setZIndexOffset(1000); 
		activeRoute.markersIdx["idx_"+(i+1)] = markerPos;
		markerPos.addTo(map);
	}
	document.getElementById("gRoute").innerHTML = s;

	if (document.getElementById("gExport").style.display === "block") refreshExportPanel();

}



/* Triggered when Route name has changed, update Route name */
function onRouteNameChange (){
	if (activeRoute!= null ) {
		activeRoute.name = document.getElementById("sRouteName").value;
		refreshExportPanel();
		// update url
		history.pushState(name, name, activeRoute.getUrl());
	}
}

function getViaPointIndex(id) {
	for (i = 0; i < activeRoute.viaPoints.length; i++) { // is this optimal?
	    if (activeRoute.viaPoints[i].id == id) { break; }
	}
	return i;	
}

function rollFirst(id) { // roll and make viapoint ID the first point in the route
	if (window.confirm(translations["route.makeFirst"])) {
		activeRoute.rollFirst(id);
	}
}

function cutRouteBefore(id) {
	if (activeRoute.closedLoop) {
		alert(translations["route.cantCutClosed"]);
		return;
	}
	var i = getViaPointIndex(id);
	if (window.confirm(translations["route.cutBefore"]+(i+1))) {
		activeRoute.splice(0,i); // remove from 0 to this point id			
	}
}

function cutRouteAfter(id) {
	if (activeRoute.closedLoop) {
		alert(translations["route.cantCutClosed"]);
		return;
	}
	var i = getViaPointIndex(id);
	if (window.confirm(translations["route.cutAfter"]+(i+1))) {
		activeRoute.splice(i+1,-1); // remove from 0 to this point id			
	}
}