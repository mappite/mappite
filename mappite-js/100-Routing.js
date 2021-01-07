/*** Routing ***/


/* Internal Graphhopper routing Engine area - 202008 covers Europe*/
function isInternalRoutingArea(rvps) {
	// Ita alps
	//var lats = [ [ 47.369, 38.651, 5.845, 15.557]
	//                , [42,36.315,11.646,18.984]]; // top, bottom, left, right
	// Europe // top, bottom, left, right	
	var lats = [ [ 71.30, 37.79, -24.87, 44.03] // most eur
	                , [38,34,20,35.5] // greece south cyprus
			, [38,35,11.5,16] // sicily
			, [38,36,-9,0] // south spain
		]; 
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

/* Wrapper to select which provider to use */
function computeRoute(rvps, cacheAndfocus){
	//cacheAndfocus=false // DEV
	
	processingStart();

	var attrDir ;
	var routeType = $('input[name="gOptions.type"]:checked').val();  // s f b p
	if (isInternalRoutingArea(rvps)) {
		//if  ( (routeType === "f"||routeType === "s") && !document.getElementById('gOptions.ferries').checked && !document.getElementById('gOptions.highways').checked) {
		if  ( routeType === "f" && !document.getElementById('gOptions.ferries').checked && !document.getElementById('gOptions.highways').checked) {
			consoleLog("Using GH Speed Routing Engine");
			//computeRouteGFlex(rvps, cacheAndfocus);
			computeRouteGSpeed(rvps, cacheAndfocus);
			attrDir = attrs['graph_dir'];
		} else {
			// computeRouteMapQuest(rvps, cacheAndfocus);
			// attrDir = attrs['mapquest_dir'];
			computeRouteORS(rvps, cacheAndfocus);
			attrDir = attrs['ors_dir'];
		}
	} else {
		if (document.getElementById("gOptions.paved").value === "n" || rvps.length > 30 ) { // document.getElementById('gOptions.tolls').checked  ||
			consoleLog("Using MapQuest");
			computeRouteMapQuest(rvps, cacheAndfocus);
			attrDir = attrs['mapquest_dir'];
		} else {
			consoleLog("Using ORS");
			computeRouteORS(rvps, cacheAndfocus);
			attrDir = attrs['ors_dir'];
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
 * Input: ViaPoint[],boolean (true if map gets refocused on route)
 */
function computeRouteGSpeed(rvps, focus){
	
	var url="";

	if ( focus) {
		consoleLog("Looking if Cached");
		var cacheKey= getOptionsString() + "_" +  activeRoute.getCompressedPoints();
		url="pc.php?cache="+cacheKey+"&method=GET" +
		    "&url=https://"+MAPPITE_SERVER+".mappite.com/route/&"; 
	} else {
		consoleLog("Direct");
		url="https://"+MAPPITE_SERVER+".mappite.com/route/?";
	}
	
	queryString= '';
	for (var i = 0; i < rvps.length; i++) {
	    queryString = queryString + 'point='+rvps[i].lat+'%2C'+rvps[i].lng+'&';
	}

	// route options [k|m][f|s|p|b][h|x][t|x][f|x]   options = ksxxf
	uom = document.getElementById("gOptions.uom").value; // k (km) or m (miles)
	//queryString = queryString + 'elevation=false&locale=en-US&use_miles='+(uom=="m"?"true":"false")+'&';	
	queryString = queryString + 'elevation=false&locale=en-US&';	
	
	var uomFactor = 1;
	if (uom=="m") uomFactor = 1.609344; // convert to miles
	
	var routeType = $('input[name="gOptions.type"]');	
	switch(routeType.filter(':checked').val() ) {
	    case "s":
		queryString = queryString + 'weighting=shortest&'; // shortest";
		break;
	    case "p":
		alert("graphhopper - pedestrian unsupported now"); //"pedestrian"
		break;
	    case "b":
		alert("graphhopper - bicicle unsupported now"); //"bicycle";
		break;
	    default:
		queryString = queryString + 'weighting=fastest&'; // "fastest";
		//queryString = queryString + 'weighting=custom1&'; // "fastest";
	} 
	
	// avoidances is by veichle type
	if (document.getElementById('gOptions.highways').checked && document.getElementById('gOptions.tolls').checked) {
		queryString = queryString + 'vehicle=nomotorwaytollcar&'; 
	} else if (document.getElementById('gOptions.highways').checked) {
		queryString = queryString + 'vehicle=nomotorwaycar&';
	} else if (document.getElementById('gOptions.tolls').checked) {
		queryString = queryString + 'vehicle=notollcar&'; 
	} else {
		queryString = queryString + 'vehicle=car&'; // CH
		//queryString = queryString + 'vehicle=custom1&ch.disable=true'; // FLEX
	}

	consoleLog("queryString : " + queryString );
	
	var computeStartTime = new Date().getTime();
	consoleLog(">>>> GSPEED Start Time: " + computeStartTime );
	
	$.ajax({
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

		consoleLog("Distance KM: " + ghpath.distance);
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
		createRoutePoly(lls);

		activeRoute.refreshHtml(); // redraw Route div so it shows updated time&distance 
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
	
	var routeType = $('input[name="gOptions.type"]');	
	switch(routeType.filter(':checked').val() ) {
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

	
	$.ajax({
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

		activeRoute.refreshHtml(); // redraw Route div so it shows updated time&distance 
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
	var routeType = $('input[name="gOptions.type"]');	
	switch(routeType.filter(':checked').val() ) {
	    case "s":
		routeType = "shortest";
		break;
	    case "p":
		routeType = "pedestrian";
		break;
	    case "b":
		routeType = "bicycle";
		break;
	    default:
		routeType = "fastest";
	} 
	consoleLog("routeType: " + routeType);
	//routeType = (document.getElementById("gOptions.fastest").checked?"fastest":"shortest"); // also pedestrian, bycicle
	
	avoidances = (document.getElementById('gOptions.highways').checked?'"Limited Access"' : null);
	avoidances = (document.getElementById('gOptions.tolls').checked?((avoidances==null?'':avoidances+', ') +'"Toll Road"'):avoidances);
	avoidances = (document.getElementById('gOptions.ferries').checked?((avoidances==null?'':avoidances+', ') +'"Ferry"'):avoidances);
	//avoidances = avoidances + ", Approximate Seasonal Closure",
	consoleLog("avoidances: " + avoidances);
	optionsJSON = '"options": { "outShapeFormat": "cmp", "generalize":10,"routeType": "'+routeType+'", "doReverseGeocode": "false", "narrativeType": "none", "unit": "'+uom+'", "avoids": ['+ (avoidances!=null?avoidances:'') +'] }';
	
	// test JSON text with parser
	//data = JSON.parse("{"+locationsJSON+","+optionsJSON+"}");
	//url = "http://open.mapquestapi.com/directions/v2/route?key=Fmjtd|luu82902n0%2Cbx%3Do5-947l5w&from=44.24152,11.80391&to=44.25887,11.8284";

	var computeStartTime = new Date().getTime();
	consoleLog(">>>> MQ Start Time " + computeStartTime );

	$.ajax({
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

		createRoutePoly(lls);
		
		activeRoute.refreshHtml(); // redraw Route div so it shows updated time&distance 
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
	
	var costing = $('input[name="gOptions.type"]');	//  
	switch(costing.filter(':checked').val() ) {
	    case "s":
		profile = "driving-car";
		preference = "shortest";
		break;
	    case "p":
		profile = "foot-walking";
		preference = "fastest";
		bikeOrFoot = true;
		break;
	    case "b":
		profile = "cycling-regular";
		preference = "fastest";
		bikeOrFoot = true;
		break;
	    default:
		profile = "driving-car";
		preference = "fastest";
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
	if (document.getElementById('gOptions.highways').checked && !bikeOrFoot) {
		avoidancesArray.push('highways');
	}
	if (document.getElementById('gOptions.tolls').checked && !bikeOrFoot) {
		avoidancesArray.push('tollways');
	}
	if (document.getElementById('gOptions.ferries').checked) {
		avoidancesArray.push('ferries');
	}
	if (avoidancesArray.length>0) {
		for(var i=0; i<avoidancesArray.length-1;i++) {
			avoidances = avoidances+ '"' + avoidancesArray[i]+'" , ';
		}
		avoidances = '"avoid_features": [' + avoidances+'"' +avoidancesArray[i]+'"]';
	}
	var options = '"options": {' + avoidances + '}';
	
	var postJson = '{'+coords+', '+options+', "preference": "'+preference+'", "units": "'+units+'", "instructions": "true", "elevation": "false" }';

	//consoleLog("ORS url:\n" + url);
	//consoleLog("ORS postJson:\n" + postJson);
	
	var computeStartTime = new Date().getTime();
	consoleLog(">>>> ORS Start Time " + computeStartTime );
	
	$.ajax({
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
		    
		        if (json.error) {
				document.getElementById("gRoute").innerHTML = "Error: " + json.error;
			}

			consoleLog( 'total length in uom:'+json.routes[0].summary.distance);
			
			var lls = new Array(); // stores shapePoints as [lat,lng] couples array
			var sps =  trackDecompress(json.routes[0].geometry,5); // json.route.shape.shapePoints;
			var lls = new Array(); // stores shapePoints as [lat,lng] couples array
			var i=0;
			while(i < sps.length/2) {
			    lls[i] = [sps[i*2],sps[i*2+1]];
			    i++;
			}
			
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
			
			createRoutePoly(lls);
			activeRoute.refreshHtml(); // redraw Route div so it shows updated time&distance 
			computeDone();

			if (focus) activeRoute.focus(); 
			
		},
		  error: function(jqXHR, textStatus, errorThrown) {
			consoleLog("ORS Error - textStatus: "+textStatus +" - errorThrown: " + errorThrown);
			//alert(jqXHR.responseText);
			processingError();
			  
			//var responseJson = JSON.parse(jqXHR.responseText); // fails if not a proper json which is the case whent iemout occours  !!!
			consoleLog(jqXHR);
			
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

