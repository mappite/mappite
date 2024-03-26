/*** Routing ***/


/* Internal Graphhopper routing Engine area - 202008 covers Europe*/
function isInternalRoutingArea(rvps) {
	
	var lats = INTERNAL_ROUTING_LATS;
	
	for (var i = 0; i < rvps.length; i++) {
		lat = rvps[i].lat
		lng = rvps[i].lng;
		var isIn = false;
		for(var j=0; j<lats.length;j++) {
			if ( (lat < lats[j][0] && lat > lats[j][1]) && ( lng > lats[j][2] && lng < lats[j][3] ) ) {
				isIn = true;
				break;
			}
		}
		if (!isIn) return false;
	}
	consoleLog("* Internal Routing *");
	return true;
}

function isInternalRoutingPoint(lat, lng) {
	return isLatLngWithin(lat, lng,INTERNAL_ROUTING_LATS);
	/*
	var lats = INTERNAL_ROUTING_LATS;
	for(var j=0; j<lats.length;j++) { 
		if  ( (lat < lats[j][0] && lat > lats[j][1]) && ( lng > lats[j][2] && lng < lats[j][3] ) ) return true;
	} 
	return false;*/
}

// used by isInternalRoutingPoint and 040-Mapfuntions initiateMap
// return false if not found, or the index+1 of the lats
function isLatLngWithin( lat, lng, lats) {
	for(var j=0; j<lats.length;j++) { 
		if  ( (lat < lats[j][0] && lat > lats[j][1]) && ( lng > lats[j][2] && lng < lats[j][3] ) ) return (j+1);
	} 
	return false;	
}

	
/* Wrapper to select which provider to use */
function computeRoute(rvps, cacheAndfocus){
	//cacheAndfocus=false // DEV
	
	processingStart();
	
	if (xAjax != null) {
		xAjax.abort(); // make sure previous call is aborted
	}

	var attrDir ;
	
	if ( currentMode === 'gMode.walk' || currentMode === 'gMode.bicycle') {
		consoleLog("Using ORS");
		computeRouteORS(rvps, cacheAndfocus);
		attrDir = attrs['ors_dir'];
	} else if ( currentMode === 'gMode.car') {
		routeType = $('input[name="gOptions.type"]:checked').val();  // s f x
		if (isInternalRoutingArea(rvps)) {
			if (routeType === "x" ) {
				consoleLog("Using GH Experimental Offroad Routing Engine");
				computeRouteGSpeed(rvps, cacheAndfocus, 'routing.mappite.com');
				attrDir = attrs['graph_dir'];		
			} else if  ( routeType === "f" && document.getElementById('gOptions.ferries').checked && document.getElementById('gOptions.highways').checked) {
				consoleLog("Using GH Speed Routing Engine");
				//computeRouteGFlex(rvps, cacheAndfocus);
				computeRouteGSpeed(rvps, cacheAndfocus, MAPPITE_SERVER);
				attrDir = attrs['graph_dir'];
			} else {
				// computeRouteMapQuest(rvps, cacheAndfocus);
				// attrDir = attrs['mapquest_dir'];
				computeRouteORS(rvps, cacheAndfocus);
				attrDir = attrs['ors_dir'];
			}
		} else {
			/*if ((routeType === "f" || routeType === "s") && (document.getElementById("gOptions.clickOnRoad").value === "n" || rvps.length > 30 )) { 
				consoleLog("Using MapQuest");
				computeRouteMapQuest(rvps, cacheAndfocus);
				attrDir = attrs['mapquest_dir'];
			} else { */
				consoleLog("Using ORS");
				computeRouteORS(rvps, cacheAndfocus);
				attrDir = attrs['ors_dir'];
			// }
		}
	}
	

	
	map.removeControl(curA);
	map.removeControl(scale); // to re-add it on top of attr
	curA = L.control.attribution({prefix: ''}).addAttribution( attrs[document.getElementById("gOptions.mapLayer").value]
	       + attrDir +attrs['mappite']);
	map.addControl(curA);
	map.addControl(scale);
	
	// assume user already read the tip, so hide it
	if (headerCls!= null)  { headerCls.hide();  }
	
}

/* FUNCTION: computeDone
 * called by computeRouteXXX once work is performed successfully
 * Input: ViaPoint[],boolean (true if map gets refocused on route)
 */
function computeDone(){
	// reset panel toggle arrows
	processingEnd();	
	// push State
	var shortUrl = activeRoute.getUrl();
	consoleLog("computeDone: pushing state // " + shortUrl);
	history.pushState(null , activeRoute.name,  shortUrl);	
}

/* FUNCTION: computeRoute using Graphhopper SPEED MODE
 * Compute and display the route.
 * Input: ViaPoint[],boolean (true to check in cache and refocus mapon route)
 */
function computeRouteGSpeed(rvps, focus, server){
	
	var url="";

	if (focus) {
		consoleLog("Looking if Cached");
		var cacheKey= getOptionsString() + "_" +  activeRoute.getCompressedPoints();
		url="pc.php?cache="+cacheKey+"&method=GET" +
		    "&url=https://"+server+"/route/&"; 
	} else {
		consoleLog("Direct");
		url="https://"+server+"/route/?";
		//url="http://localhost:8989/route/?";
	}
	
	queryString= '';
	for (var i = 0; i < rvps.length; i++) {
	    queryString = queryString + 'point='+rvps[i].lat+'%2C'+rvps[i].lng+'&';
	}

	queryString = queryString + 'elevation=true&locale=en-US&';	


	uom = document.getElementById("gOptions.uom").value; // k (km) or m (miles)
	var uomFactor = 1;
	if (uom=="m") uomFactor = 1.609344; // convert to miles
	
	// profile	
	var routeType = $('input[name="gOptions.type"]:checked').val();
	var profile = "car"; // default car (fastest)
	if (routeType.value == 'x') {
		profile = "offroad";
	} else if (!document.getElementById('gOptions.tolls').checked) {
		profile = "notollcar";
	} 
	queryString = queryString + 'profile='+profile+'&'; 
	

	consoleLog("queryString : " + queryString );
	
	var computeStartTime = new Date().getTime();
	consoleLog(">>>> GSPEED Start Time: " + computeStartTime );
	
	xAjax = $.ajax({
	    type: "GET",
	    dataType: "json",
	    url: url+queryString,
	    timeout: 8000, 
	    success: function (json) { 
		//**consoleLog(JSON.stringify(json, undefined, 2));
		var d = new Date();
		consoleLog(">>>> GSPEED Calc Time: " + (d.getTime()-computeStartTime  ) );
		// Error Control
		// if (json.info.statuscode !== 0) document.getElementById("gRoute").innerHTML = "Route Calculation Error [#"+json.info.statuscode+" "+json.info.statuscode.messages+"], <br>try to move a bit the last point location..."
		    
		var ghpath = json.paths[0];

		consoleLog("Distance Mt: " + ghpath.distance);
		consoleLog("Time: " + ghpath.time);
		    
		if (ghpath.distance > 20000000) { // 20k km
			var error = { code: 1, message: "Route Too long, please split in multiple routes" };
			ghError(error);
			return;
		}

		// Elevation
		var ele = new Array(); // elevation for each point
		var maxEle = 0;
		var minEle = 50000; // it might fail for starships, note is minEle stays at 50000 it means no ele in track, see TrackCanvas.draw()
		var dist = new Array(); // distance of each point from start
		dist[0] = 0;

		sps =  trackEleDecompress(ghpath.points,5); // json.route.shape.shapePoints;
		var lls = new Array(); // stores shapePoints as [lat,lng] couples array
		var i=0;
		/*
		while(i < sps.length/2) {
		    lls[i] = [sps[i*2],sps[i*2+1]];
		    i++;
		}*/
		while(i < sps.length/3) {
		    lls[i] = [sps[i*3],sps[i*3+1]];
		    ele[i] = Math.round(sps[i*3+2]/100);
		    if (i>0) dist[i] = dist[i-1] + getDistance(lls[i-1], lls[i], ele[i-1], ele[i]);
		    if (ele[i]>maxEle)  { maxEle = ele[i]; }
		    if (ele[i]<minEle)  { minEle = ele[i]; }
		    i++;
		}
		    
		consoleLog("Route returned with " +lls.length+ " shapepoints");

		var legs = new Array();
		var legsIdx = new Array();
		var legIdx = 0;

		if (ghpath.instructions) {
		   var distance = 0;
		   var time = 0;
		   for (var j = 0; j < ghpath.instructions.length; j++) {
		      var instr = ghpath.instructions[j]; 
		      time += instr.time;
		      distance += instr.distance;
		      if(instr.sign == 5 || instr.sign == 4) { // viapoint or finish
				// legIdx contains the lls index where thsi leg ends 
				legsIdx[legIdx] = instr.interval[1]; //legIdx;
				//consoleLog("______Leg: "+ legIdx +" time: " + (time/1000) + "formattime: " + formatTime(time/1000));
				legs[legIdx++] = new Leg((distance/uomFactor/1000), (time/1000), false );
				distance = 0;
				time = 0;
		      }
		   }
		}

		activeRoute.setLegs(legs); 
		activeRoute.setLegsIdx(legsIdx);
		activeRoute.routeFormattedTime = formatTime(Math.round(ghpath.time/1000));
		activeRoute.routeDistance = ghpath.distance / uomFactor / 1000;	
		
		//createRoutePoly(lls);
		// Elevation
		var track = new Track("::activeRoute", lls);
		track.setEle(ele);
		track.setDist(dist);
		track.setMaxEle(maxEle);
		track.setMinEle(minEle);
		track.draw();
		
		activeRoute.track = track;

		refreshRouteInfo(); // redraw Route Info Panel
		computeDone();
		
		if (focus) activeRoute.focus(); 
		
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
			consoleLog("Graphhopper - textStatus: "+textStatus +" - errorThrown: " + errorThrown);
		    
			//var responseJson = jQuery.parseJSON(jqXHR.responseText); // fails if not a proper json which is the case whent iemout occours
			//consoleLog(responseJson.message);
		    
			processingError();
		    
			if ( errorThrown === "Bad Request" ) { errorThrown = translations["compute.errorBadRequest"]; 
			} else if ( errorThrown === "timeout" ) { errorThrown = translations["compute.errorTimeout"]; }
			
			//document.getElementById("gRoute").innerHTML = errorThrown;
			document.getElementById("gRouteInfo").innerHTML = errorThrown;
	    }
	});
}


/* FUNCTION: computeRoute using Graphhopper FLEX - CURRENTLY NOT USED, it may be used in the future if willing to move to GH FLEX 
 * Compute and display the route.
 * Input: ViaPoint[],boolean (true if map gets refocused on route)
 */
/*
function computeRouteGFlex(rvps, focus){
	

	var url="";

	if (false) {
		consoleLog("Cache");
		var cacheKey= getOptionsString() + "_" +  activeRoute.getCompressedPoints();
		url="pc.php?cache="+cacheKey+"&method=POST" +
		    "&http://localhost:8989/flex"; // key in pc.php
	} else {
		consoleLog("Direct");
		url="http://localhost:8989/flex";
	}
	

	postJSON= '"request": { "points" : [';
	for (var i = 0; i < rvps.length-1; i++) {
	    postJSON = postJSON + '['+rvps[i].lng+', '+rvps[i].lat+'], ';
	}
	postJSON = postJSON + '['+rvps[i].lng+', '+rvps[i].lat+'] ] }, ';

	// route options	
	// [k|m][f|s|p|b][h|x][t|x][f|x]   options = ksxxf
	uom = document.getElementById("gOptions.uom").value; // k (km) or m (miles) // TO BE IMPLEMENTED IN GH

	postJSON = postJSON + '"model": { "base":"custom1", "max_speed":120 ' ;
		
	var  routeType = $('input[name="gOptions.type"]:checked').val(); 
	switch(routeType.value ) {
	    case "s":
		postJSON = postJSON +  ', "distance_factor":90 '; // shortest";
		break;
	    case "p":
		alert("graphhopper - pedestrian unsupported now"); //"pedestrian"
		break;
	    case "b":
		alert("graphhopper - bicicle unsupported now"); //"bicycle";
		break;
	    default:
		//postJSON = postJSON +  ', "distance_factor":0 '; // "fastest";
		//postJSON = postJSON ; // "fastest";
	} 
	
	
	// { "base":"car", "max_speed":160, "no_access": { "toll": ["all"],  "road_class": ["trunk"]}}
	
	var avoidancesArray = new Array();
	if (document.getElementById('gOptions.highways').checked) {
		avoidancesArray.push('"road_class": ["motorway"]');
	}
	if (document.getElementById('gOptions.tolls').checked) {
		avoidancesArray.push('"toll": ["all"]');
	}
	// if (document.getElementById('gOptions.ferries').checked) { // ???
	//	avoidancesArray.push('ferries');
	//} 
	var avoidances  = '';
	if (avoidancesArray.length>0) {
		for(var i=0; i<avoidancesArray.length-1;i++) {
			avoidances = avoidances+avoidancesArray[i] + ", ";
		}
		avoidances =   avoidances+avoidancesArray[i];
		postJSON = postJSON + ', "no_access": { '+avoidances+' } ';
	}
	
	postJSON = postJSON + '} ';
	
	consoleLog("postJSON : " + postJSON );
	
	var computeStartTime = new Date().getTime();
	consoleLog(">>>> GFLEX Start Time: " + computeStartTime );

	
	xAjax = $.ajax({
	    url: url,
	    dataType: 'json',
	    type: 'POST',
	    contentType:'application/json',
	    data: "{"+postJSON+"}",
	    timeout: 8000, 
	    success: function (json) { 
		//consoleLog(JSON.stringify(json, undefined, 2));
		var d = new Date();
		consoleLog(">>>> GFLEX Calc Time: " + (d.getTime()-computeStartTime) );


		// Error Control
		// if (json.info.statuscode !== 0) document.getElementById("gRoute").innerHTML = "Route Calculation Error [#"+json.info.statuscode+" "+json.info.statuscode.messages+"], <br>try to move a bit the last point location..."
		    
		var ghpath = json.paths[0];

		consoleLog("Distance: " + ghpath.distance);
		consoleLog("Time: " + ghpath.time);

		sps =  trackDecompress(ghpath.points,5); // json.route.shape.shapePoints;
		var lls = new Array(); // stores shapePoints as [lat,lng] couples array
		var i=0;
		while(i < sps.length/2) {
		    lls[i] = [sps[i*2],sps[i*2+1]];
		    i++;
		}
		    
		consoleLog("Route returned with " +lls.length+ " shapepoints");

		var legs = new Array();
		var legsIdx = new Array();
		var legIdx = 0;

		if (ghpath.instructions) {
		   var distance = 0;
		   var time = 0;
		   for (var j = 0; j < ghpath.instructions.length; j++) {
		      var instr = ghpath.instructions[j]; 
		      time += instr.time;
		      distance += instr.distance;
		      if(instr.sign == 5 || instr.sign == 4) { // viapoint or finish
				// legIdx contains the lls index where thsi leg ends 
				legsIdx[legIdx] = instr.interval[1]; //legIdx;
				//consoleLog("Leg: "+ legIdx +" ends at point: " + legIdx);
				legs[legIdx++] = new Leg((distance/1000), (time/1000), false );
				distance = 0;
				time = 0;
		      }
		   }
		}

		activeRoute.setLegs(legs);
		activeRoute.setLegsIdx(legsIdx);
		activeRoute.routeFormattedTime = formatTime(Math.round(ghpath.time/1000));
		activeRoute.routeDistance = ghpath.distance / 1000;	
		createRoutePoly(lls);

		refreshRouteInfo(); // redraw Route Info Panel
		computeDone();
		if (focus) activeRoute.focus(); 
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
			consoleLog("Graphhopper - textStatus: "+textStatus +" - errorThrown: " + errorThrown);
		    
			var responseJson = jQuery.parseJSON(jqXHR.responseText); // fails if not a proper json which is the case whent iemout occours  !!!
			consoleLog(responseJson.message);
		    
			processingError();
		    
			if ( responseJson.message.startsWith("No path found due to maximum nodes") ) { errorThrown = translations["compute.errorMaxNodes"]
			} else if ( errorThrown === "Bad Request" ) { errorThrown = translations["compute.errorBadRequest"]; 
			} else if ( errorThrown === "timeout" ) { errorThrown = translations["compute.errorTimeout"]; }
			
			//document.getElementById("gRoute").innerHTML = errorThrown;
			document.getElementById("gRouteInfo").innerHTML = errorThrown;
	    }
	});
	
}
*/

/* FUNCTION: computeRoute using MapQuest API
 * Compute and display the route.
 * Input: ViaPoint[],boolean (true if map gets refocused on route)
 */
function computeRouteMapQuest(rvps, focus){
	
	var url=""; 
	
	
	if (focus) {
		consoleLog("computeRouteMapQuest: from Cache");
		var cacheKey= getOptionsString() + "_" +  activeRoute.getCompressedPoints();
		url="pc.php?cache="+cacheKey+"&method=POST" +
		    "&url=https://open.mapquestapi.com/directions/v2/route?key="+mapquestKey;
	} else {
		consoleLog("computeRouteMapQuest: direct");
		url="https://open.mapquestapi.com/directions/v2/route?key="+mapquestKey;
	}
	
	//route locations		
	locationsJSON= '"locations":[';
	for (var i = 0; i < rvps.length-1; i++) {
	    locationsJSON = locationsJSON + '{"latLng":{"lat": '+rvps[i].lat+',"lng": '+rvps[i].lng+'}},';
	}
	locationsJSON =  locationsJSON + '{"latLng":{"lat":'+rvps[i].lat+',"lng": '+rvps[i].lng+'}}]';
	// route options	
	// [k|m][f|s|p|b][h|x][t|x][f|x]   options = ksxxf
	uom = document.getElementById("gOptions.uom").value; // k (km) or m (miles)

	// in mapQuest routeType can be shortest,fastest,pedestrian, bicycle
	
	if (currentMode === 'gMode.bicycle') {
		routeType = "bicycle";
	} else if (currentMode === 'gMode.walk') {
		routeType = "pedestrian";
	} else if (currentMode === 'gMode.car') {
		var t = $('input[name="gOptions.type"]:checked').val();
		routeType = (t==='s'?"shortest":"fastest");
	} 
		
	consoleLog("routeType: " + routeType);
	
	avoidances = (!document.getElementById('gOptions.highways').checked?'"Limited Access"' : null);
	avoidances = (!document.getElementById('gOptions.tolls').checked?((avoidances==null?'':avoidances+', ') +'"Toll Road"'):avoidances);
	avoidances = (!document.getElementById('gOptions.ferries').checked?((avoidances==null?'':avoidances+', ') +'"Ferry"'):avoidances);
	//avoidances = avoidances + ", Approximate Seasonal Closure",
	consoleLog("avoidances: " + avoidances);
	optionsJSON = '"options": { "outShapeFormat": "cmp", "generalize":10,"routeType": "'+routeType+'", "doReverseGeocode": "false", "narrativeType": "none", "unit": "'+uom+'", "avoids": ['+ (avoidances!=null?avoidances:'') +'] }';
	
	// test JSON text with parser
	//data = JSON.parse("{"+locationsJSON+","+optionsJSON+"}");
	//url = "http://open.mapquestapi.com/directions/v2/route?key=Fmjtd|luu82902n0%2Cbx%3Do5-947l5w&from=44.24152,11.80391&to=44.25887,11.8284";

	var computeStartTime = new Date().getTime();
	consoleLog(">>>> MQ Start Time " + computeStartTime );

	xAjax = $.ajax({
	    url: url,
	    dataType: 'json',
	    type: 'POST',
	    contentType:'application/json',
	    data: "{"+locationsJSON+","+optionsJSON+"}",
	    timeout: 8000, 
	    success: function(json) { 
		//**consoleLog(JSON.stringify(json, undefined, 2));
		var d = new Date();
		consoleLog(">>>> MQ Calc Time: " + (d.getTime()-computeStartTime));

		if (json.info.statuscode !== 0) document.getElementById("gRoute").innerHTML = "Route Calculation Error [#"+json.info.statuscode+" "+json.info.statuscode.messages+"], <br>try to move a bit the last point location..."
		    
		consoleLog("Distance: " + json.route.distance + " Time: " +json.route.formattedTime);
		
		//consoleLog( 'compressed:'+json.route.shape.shapePoints);
		//consoleLog( 'decompress:'+trackDecompress(json.route.shape.shapePoints,5));
		    
		sps =  trackDecompress(json.route.shape.shapePoints,5); // json.route.shape.shapePoints;
		var lls = new Array(); // stores shapePoints as [lat,lng] couples array
		var i=0;
		while(i < sps.length/2) {
		    lls[i] = [sps[i*2],sps[i*2+1]];
		    i++;
		}
		    
		consoleLog("Route returned with " +lls.length+ " shapepoints");
		consoleLog("Route returned with " +json.route.legs.length+ " Legs");
		
		var legs = json.route.legs;
		/* for(i=0; i< legs.length; i++) {
			consoleLog("__leg["+i+"]: "+ + legs[i].distance +"  "+legs[i].time); // legs[i].formattedTime
		} */
		var legsIdx = new Array();
		var llsIdx = 0;
		var legIdx = 0;
		for(k=0; k< legs.length; k++) {
			// calculate which lls index matches with leg ends (suboptimal)
			var minDist = 1000; // mt
			for(llsIdx=legIdx; llsIdx<lls.length;llsIdx++) { // start form last one (but still suboptimal...)
				d =  getDistance(lls[llsIdx], [rvps[k+1].lat, rvps[k+1].lng], 0,0)
				if (d<minDist) { minDist = d; legIdx=llsIdx; }
			}
			// legIdx contains the lls index where thsi leg ends 
			legsIdx[k] = legIdx;
			//consoleLog("MQ Leg: "+ k +" ends at point: " + legIdx);
			//consoleLog("__leg["+k+"]: "+ + legs[k].distance +"  "+legs[k].time);
		}
		activeRoute.setLegs(legs);
		activeRoute.setLegsIdx(legsIdx);
		activeRoute.routeFormattedTime = formatTime(Math.round(json.route.time));
		activeRoute.routeDistance = json.route.distance; // in uom

		//createRoutePoly(lls);
		var dist = new Array(); // distance of each point from start
		dist[0] = 0;
		for(i=0;i < lls.length;i++) {
		    if (i>0) dist[i] = dist[i-1] + getDistance(lls[i-1], lls[i], 0, 0);
		}
		var track = new Track("::activeRoute", lls);
		track.setDist(dist);
		track.draw();
		
		activeRoute.track = track; // note, ele is missed
		
		refreshRouteInfo(); // redraw Route Info Panel so it shows updated time&distance 
		computeDone();

		if (focus) activeRoute.focus(); 

	    },
	    error: function(jqXHR, textStatus, errorThrown) {
			consoleLog("Mapquest Error - textStatus: "+textStatus +" - errorThrown: " + errorThrown);
			processingError();
			if ( errorThrown === "Bad Request" ) { errorThrown = translations["compute.errorBadRequest"]; }
			if ( errorThrown === "timeout" ) { errorThrown = translations["compute.errorTimeout"]; }
			document.getElementById("gRouteInfo").innerHTML = errorThrown;
	    }
	});
	
   }



/* FUNCTION: computeRoute using  ORS - openrouteservice.org
 * Compute and display the route.
 * Input: ViaPoint[],boolean (true if map gets refocused on route)
 */
function computeRouteORS(rvps, focus){

	var profile="";	
	var preference="";	
	var bikeOrFoot = false;

	if (currentMode === 'gMode.bicycle') {
		profile = "cycling-regular";
		preference = "fastest";
		bikeOrFoot = true;
	} else if (currentMode === 'gMode.walk') {
		profile = "foot-walking";
		preference = "fastest";
		bikeOrFoot = true;
	} else if (currentMode === 'gMode.car') {
		profile = "driving-car";
		var t = $('input[name="gOptions.type"]:checked').val();
		preference = (t==='s'?"shortest":"fastest");
	}

	var url="https://api.openrouteservice.org/v2/directions/"+profile +"/json";
	
	if (focus) {
		consoleLog("computeRouteORS: from Cache");
		var cacheKey= getOptionsString() + "_" +  activeRoute.getCompressedPoints();
		url="pc.php?cache="+cacheKey+"&method=POST" +
		    "&url="+url+"&api_key="+orsKey;
	} else {
		consoleLog("computeORS: direct");
		url= url+"?api_key="+orsKey;
	}
	
	// coordinates
	var coords= '';
	for (var i = 0; i < rvps.length-1; i++) {
	    coords = coords + "[" + rvps[i].lng+','+rvps[i].lat +'],';
	}
	coords = '"coordinates": [' + coords + "[" + rvps[i].lng+','+rvps[i].lat+ ']]';
	// route options	
	// [k|m][f|s|p|b][h|x][t|x][f|x]   options = ksxxf
	units = (document.getElementById("gOptions.uom").value === "k")?"km":"mi"; // k (km) or m (mi)
	

	var avoidances  = '';
	var avoidancesArray = new Array();
	if (!document.getElementById('gOptions.highways').checked && !bikeOrFoot) {
		avoidancesArray.push('highways');
	}
	if (!document.getElementById('gOptions.tolls').checked && !bikeOrFoot) {
		avoidancesArray.push('tollways');
	}
	if (!document.getElementById('gOptions.ferries').checked) {
		avoidancesArray.push('ferries');
	}
	if (avoidancesArray.length>0) {
		for(var i=0; i<avoidancesArray.length-1;i++) {
			avoidances = avoidances+ '"' + avoidancesArray[i]+'" , ';
		}
		avoidances = '"avoid_features": [' + avoidances+'"' +avoidancesArray[i]+'"]';
	}
	var options = '"options": {' + avoidances + '}';
	
	var postJson = '{'+coords+', '+options+', "preference": "'+preference+'", "units": "'+units+'", "instructions": "true", "elevation": "true" }';

	//consoleLog("ORS url:\n" + url);
	//consoleLog("ORS postJson:\n" + postJson);
	
	var computeStartTime = new Date().getTime();
	consoleLog(">>>> ORS Start Time " + computeStartTime );
	
	xAjax = $.ajax({
	    url: url,
	    dataType: 'json',
	    type: 'POST',
	    contentType:'application/json',
	    data: postJson,
	    timeout: 8000, 
	    success: function(json) {
			// consoleLog(JSON.stringify(json, undefined, 2));
			var d = new Date();
			consoleLog(">>>> ORS Calc Time: " + (d.getTime()-computeStartTime ) );
			consoleLog(json);
		        /*if (json.error.code !== 'undefined') {
				document.getElementById("gRoute").innerHTML = "Error: " + json.error;
			}*/
			
			if (typeof json.error !== 'undefined') {
				orsError(json.error);
				return;
			}

			consoleLog( 'total length in uom:'+json.routes[0].summary.distance);
			
			var lls = new Array(); // stores shapePoints as [lat,lng] couples array
			var sps =  trackEleDecompress(json.routes[0].geometry,5); // json.route.shape.shapePoints;
			
			// Elevation
			var ele = new Array(); // elevation for each point
			var maxEle = 0;
			var minEle = 50000; // it might fail for starships, note is minEle stays at 50000 it means no ele in track, see TrackCanvas.draw()
			var dist = new Array(); // distance of each point from start
			dist[0] = 0;

			var i=0;
			/*while(i < sps.length/2) {
			    lls[i] = [sps[i*2],sps[i*2+1]];
			    i++;
			}*/
			
			while(i < sps.length/3) {
			    lls[i] = [sps[i*3],sps[i*3+1]];
			    ele[i] = Math.round(sps[i*3+2]/100);
			    if (i>0) dist[i] = dist[i-1] + getDistance(lls[i-1], lls[i], ele[i-1], ele[i]);
			    if (ele[i]>maxEle)  { maxEle = ele[i]; }
			    if (ele[i]<minEle)  { minEle = ele[i]; }
			    i++;
			}
			consoleLog("Min Ele: "+ minEle);
			consoleLog("Total Distance: "+ dist[i-1]);

			
			var legs = new Array();
			var legsIdx = new Array();
			var llsIdx = 0;
			var legIdx = 0;
			for (var k=0; k< json.routes[0].segments.length;k++) { 
				var leg = json.routes[0].segments[k];
				consoleLog('Leg:'+k);
				legs[k] = new Leg(leg.distance, Math.round(leg.duration), false ); // unpaved is false since not supporte by ors, list of point not set
				// calculate which lls index matches with leg ends (suboptimal)
				var minDist = 1000; // mt
				for(llsIdx=legIdx; llsIdx<lls.length;llsIdx++) { // start form last one (but still suboptimal...)
					d =  getDistance(lls[llsIdx], [rvps[k+1].lat, rvps[k+1].lng], 0,0)
					if (d<minDist) { minDist = d; legIdx=llsIdx; }
				}
				// legIdx contains the lls index where thsi leg ends 
				legsIdx[k] = legIdx;
				//consoleLog("Leg: "+ k +" ends at point: " + legIdx);
			}
			activeRoute.setLegs(legs);
			activeRoute.setLegsIdx(legsIdx);
			activeRoute.routeFormattedTime = formatTime(Math.round(json.routes[0].summary.duration));
			activeRoute.routeDistance = json.routes[0].summary.distance; // in UOM
			
			//createRoutePoly(lls);
			
			var track = new Track("::activeRoute", lls);
			track.setEle(ele);
			track.setDist(dist);
			track.setMaxEle(maxEle);
			track.setMinEle(minEle);
			track.draw();
			
			activeRoute.track = track;
			
			refreshRouteInfo(); // redraw Route Info Panelso it shows updated time&distance 
			computeDone();

			if (focus) activeRoute.focus(); 
			
		},
		  error: function(jqXHR, textStatus, errorThrown) {
			consoleLog("ORS Error - textStatus: "+textStatus +" - errorThrown: " + errorThrown);
			//alert(jqXHR.responseText);
			//processingError();
			  
			//var responseJson = JSON.parse(jqXHR.responseText); // fails if not a proper json which is the case whent iemout occours  !!!
			// consoleLog(jqXHR);
			var json = jqXHR.responseJSON;
			//consoleLog(json.error.code);
			//consoleLog(json.error.message);
			orsError(json.error);
			/*if (json.error.code == "2010") {
				var msg = json.error.message;
				var pointIdx = parseInt(msg.substring(0,msg.indexOf(':')).slice(-2))+1;
				alert(translations["route.errPointNotOnStreet"] +  pointIdx);
			} */
			  /*
			if ( responseJson.error.code == 2004 ) { errorThrown = translations["compute.errorMaxLenghDyn"]
			} else if ( errorThrown === "Bad Request" ) { errorThrown = translations["compute.errorBadRequest"]; 
			} else if ( errorThrown === "timeout" ) { errorThrown = translations["compute.errorTimeout"]; 		  
			} else if ( errorThrown === "Internal Server Error" ) { errorThrown = translations["compute.errorInternalError"]; 
			} */
			
			document.getElementById("gRouteInfo").innerHTML = errorThrown;
			//alert(errorThrown);
			
		}
	});
			
   }

function ghError(err) {
	 orsError(err); // fixme, need to review all errors. In the meantmie the else catch them all
}

function orsError(err) {
	processingError();
	var msg = err.message;
	if (err.code == "2010") {
		var pointIdx = parseInt(msg.substring(0,msg.indexOf(':')).slice(-2))+1;
		alert(translations["route.errPointNotOnStreet"] +  pointIdx);
	} else { // 2004 route too long, 2009 two points not reachable (sea)
		alert(err.message); // FIXME: only in english
	}
}

