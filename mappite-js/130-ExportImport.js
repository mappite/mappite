/*** GPX/ITN Export/Import ***/


/* File Import GPX/ITN */
function onImportChange(e) {
	var file = $("#JgImportFile")[0].files[0];
	consoleLog("Fiel Size: " + file.size);
	
	if (file.size > 1024*1024*100 ) {
		alert("File size limit is 100MB");
		return; // limit to 100MB
	}
	
	var reader = new FileReader();
	reader.onload = function(e) {
		
		consoleLog("File name: " + file.name);
		
		fileExt = file.name.toUpperCase().substring(file.name.length-3);
		var isLoadSuccess = false;
		if (fileExt === "GPX") {
			processingStart(); // FIXME: does not work...
			parser = new DOMParser();
			xmlDoc = parser.parseFromString(reader.result,"text/xml");
			// x = xmlDoc.getElementsByTagName("rtept");
			//OK: x[0].attributes.getNamedItem("lat").value;
			//OK: x[0].getAttribute("lat")
			//ok. x[0].getElementsByTagName("name")[0].textContent
			
			// route FIXME: this assumes one single route only
			var points = xmlDoc.getElementsByTagName("rtept");
			if (points.length>0) { // contains a route
				isLoadSuccess = true;
				if (points.length > MAX_ROUTE_POINTS && window.confirm(translations["saveLoad.maxViaPointsOnRouteImport"])) {	
					loadGpxTrack(points, file.name); // load as track
				} else {
					if (activeRoute == null || activeRoute.viaPoints.length <1) { // no existing route
						loadGpxRoute(points, file.name);
					} else if (window.confirm(translations["saveLoad.deleteCurrentRoute"])) {
						activeRoute.forceClean();
						loadGpxRoute(points, file.name);
					} else {
						if ( ((points.length+activeRoute.viaPoints.length) < MAX_ROUTE_POINTS) 
						     && window.confirm(translations["saveLoad.appendToCurrentRoute"])) {
							loadGpxRoute(points, file.name);
						}
						// do nothing
					}
				}
			} 
			
			// tracks
			var trk = xmlDoc.getElementsByTagName("trk");
			for (var i = 0; i < trk.length; i++) {
				var trkname = trk[i].getElementsByTagName("name")[0].textContent;
				consoleLog("*** trkname: " +trkname)
				var trksegs = trk[i].getElementsByTagName("trkseg");
				for (var j = 0; j < trksegs.length; j++) {
					consoleLog("*** segment " + j)
					isLoadSuccess = true;
					points = trksegs[j].getElementsByTagName("trkpt");
					if (points.length>0) {loadGpxTrack(points, trkname);}
				}
			}
			
			// wpt
			points = xmlDoc.getElementsByTagName("wpt");
			if (points.length>0) { // waypoints
				isLoadSuccess = true;
				loadGpxWaypoints(points, file.name);
			}
			processingEnd();
			
		} else if (fileExt === "ITN") {
			fileText = reader.result;
			consoleLog("the file:\n" +fileText)
			fileLines = fileText.split("\n");
			//fileLines = fileText.split("[\r\n]/g");
			consoleLog("file lines:\n" +fileLines.length )
			for (i = 0; i < fileLines.length; i++) {
				lineItems = fileLines[i].split("|"); // [0] = lon, [1] = lat, [2] = name, [3] = type
				// recreate route
				var id = "vp_"+i;
				vp = new ViaPoint(Number(lineItems[1]) /100000,
						  Number(lineItems[0]) /100000,
						  lineItems[2], id); 
				addViaPoint(vp);
				addMarkerToMap(vp);
				if (lineItems[3] == 2) break; // last point 
				if (activeRoute.viaPoints.length> MAX_ROUTE_POINTS-1) { 
					alert(translations["saveLoad.maxViaPointsReached"] ); 
					break;
				}
			}
			activeRoute.setName(file.name.substring(0,file.name.length-4));
			document.getElementById("sRouteName").value = activeRoute.name;
			activeRoute.redrawAndFocus(); // look in cache also...
			isLoadSuccess = true;
		}
		if (!isLoadSuccess) {alert(translations["saveLoad.failedLoad"] )}
	}
	reader.readAsText(file);  
}

function loadGpxTrack(points, trackName) {
	// Create a new polyline
	var lls = [];
	var ele = [];
	var maxEle = 0;
	var minEle = 50000; // it might fail for starships, note is minEle stays at 50000 it means no ele in track, see TrackCanvas.draw()
	var dist = [];
	dist[0] = 0;
	var distance = 0; // in km
	for (i = 0; i < points.length; i++) {
		lls[i]=[points[i].getAttribute("lat"),points[i].getAttribute("lon")];
		if (typeof points[i].getElementsByTagName("ele")[0] !== 'undefined') { // we have elevation
			//consoleLog("ele content: " + points[i].getElementsByTagName("ele")[0].textContent);
			ele[i] = Number(points[i].getElementsByTagName("ele")[0].textContent);
			if (ele[i]>maxEle) { maxEle = ele[i]; }
			if (ele[i]<minEle)  { minEle = ele[i]; }
		} else {
			ele[i] = 0;
		}
		if (i>0) {
			dist[i] = dist[i-1] + getDistance(lls[i-1], lls[i], ele[i-1], ele[i]);
			// we could compute dist at max elevation
		}
	}
	/*
	if (typeof xmlDoc.getElementsByTagName("trk")[0].getElementsByTagName("name")[0] !== 'undefined') { // has name?
		trackName = xmlDoc.getElementsByTagName("trk")[0].getElementsByTagName("name")[0].textContent;
	} else { // use file name
		trackName = fileName.substring(0,fileName.length-4);
	}*/
	var track = new Track(trackName, lls);
	track.setEle(ele);
	track.setDist(dist);
	track.setMaxEle(maxEle);
	track.setMinEle(minEle);
	track.draw(); // draw the track on map and refresh the canvas as well
	tracksList.push(track);
	refreshLoadedTracks();
	return true;	
}

function loadGpxRoute(points, fileName) {
	for (i = 0; i < points.length; i++) {
		// Create route or append to existing route
		var pointName;
		if ( typeof points[i].getElementsByTagName("name")[0] !== 'undefined') {
			pointName = points[i].getElementsByTagName("name")[0].textContent;
		} else {
			pointName = "Point " + (i+1);	
		}
		
		// var id = "vp_"+i;
		var id = "vp_"+viaPointId++; // viaPointId stores current route next point id!
		vp = new ViaPoint(points[i].getAttribute("lat"),
				  points[i].getAttribute("lon"),
				  pointName, 
				  id); 
		addViaPoint(vp);
		addMarkerToMap(vp);		
		
		if (activeRoute.viaPoints.length>MAX_ROUTE_POINTS-1) { 
			//alert(translations["saveLoad.maxViaPointsReached"] ); 
			break;
		}
		
	}
	var routeName;
	if ( typeof xmlDoc.getElementsByTagName("rte")[0].getElementsByTagName("name")[0] !== 'undefined') {
		routeName = xmlDoc.getElementsByTagName("rte")[0].getElementsByTagName("name")[0].textContent;
	} else {
		routeName = fileName.substring(0,fileName.length-4);
	}
	activeRoute.setName(routeName);
	document.getElementById("sRouteName").value = activeRoute.name;
	activeRoute.redrawAndFocus(); // look in cache also...
	return true;	
}

function loadGpxWaypoints(points, fileName) {
	var iconDefault="./icons/wayPoints.svg";
	var iconPlusDefault="./icons/wayPointsPlus.svg";
	var wayPointsCG = L.markerClusterGroup({
		maxClusterRadius: 10, // default was 40
		showCoverageOnHover: true,
		iconCreateFunction: function (cluster) {
			return L.icon({ iconUrl: iconPlusDefault, iconSize: [20, 20] });
		}
	});
	for (i = 0; i < points.length; i++) {
		var elem = new Object();
		if ( typeof points[i].getElementsByTagName("name")[0] !== 'undefined') {
			elem.name = points[i].getElementsByTagName("name")[0].textContent;
		} else {
			elem.name = "Point " + (i+1);	
		}
		elem.lat = points[i].getAttribute("lat");
		elem.lon = points[i].getAttribute("lon");
		
		var icon = iconDefault;
		// detect symbol
		if (  typeof  points[i].getElementsByTagName("sym")[0] !== 'undefined') {
		   // <sym>Triangle, Blue</sym>
		   //var sym = points[i].getElementsByTagName("sym")[0].textContent.split(",");
		   //if (sym[0] == "MountainPasses") { icon="./icons/mountainPasses.svg"; }
		   var sym = points[i].getElementsByTagName("sym")[0].textContent;
		   if (sym == "Triangle, Red") { icon="./icons/mountainPasses.svg"; }
		} 
		if (  typeof  points[i].getElementsByTagName("cmt")[0] !== 'undefined') {
		   // natural=saddle
		   var cmt  = points[i].getElementsByTagName("cmt")[0].textContent;
		   if (cmt.indexOf("natural=saddle") !== -1) { icon="./icons/mountainPasses.svg"; }
		} 
		
		cm = L.marker(L.latLng(elem.lat,elem.lon), {icon: L.icon({ iconUrl: icon, iconSize: [20, 20] })});
		cm.bindPopup(elem.name+"<br/><div class='gsmall'>"+rightClickText+ " " + translations["popup.add"] +"</div>", {offset: L.point(0,-13)}); // also doubleclick

		cm.on('contextmenu dblclick', L.bind(addJsonNode, this, elem) ); // dblclick does not work since 1st click is consumed by popup...
		wayPointsCG.addLayer(cm); 
	
	}
	map.addLayer(wayPointsCG);
	//mapIcons[id].push(wayPointsCG); // FIXME: shoudl implement this to allow waypoint removal...

	return true;	
}

/* File Export */

function onExportClick(e) {
	if (isIE()) { 
		alert(translations["export.IEWarning"] ); 
		return;
	}
	if (activeRoute == null || activeRoute.viaPoints.length <1) { // check if at least one waypoint is defined
		alert(translations["export.noPoints"]);
		return;
	}
	var fileStream;
	var dataType = "application/gpx+xml"; // default 
	var ext = "gpx"; // default file extension
	var type = "rte";
	
	var sel = $( "#exportSelect" ).val();
	if (sel === "wpGpx") {  // gpx waypoints
		fileStream = exportGpx("waypoints");
		type ="wpt";
	} else if ( activeRoute.viaPoints.length > 1)  { // check if more than one waypoint is defined 
		if (sel === "routeGpx") { // gpx route
			fileStream = exportGpx("route","1.1");
		} else if (sel === "routeShpGpx") { // gpx route
			fileStream = exportGpx("routeShp","1.1");
		} else if (sel === "routeGpxOld") { // gpx route
			fileStream = exportGpx("route");
		} else if (sel === "routeItn") { // // itn route
			fileStream = exportItn();
			dataType ="application/itn";
			ext = "itn";
		} else if (sel === "trackGpx") { // gpx track
			fileStream = exportGpx("track");
			type ="trk";
		} else if (sel === "routeWpGpx") { // gpx route with waypoints
			fileStream = exportGpx("routeWp");
			type ="rtewp";
		} else if (sel === "spreadsheetCsv") { // csv route
			fileStream = exportCsv();
			dataType ="text/csv";
			ext = "csv";
		}
		
	} else {
		alert(translations["export.noRoute"]);
		return;
	}
	
	$( "#gPanelToggle" ).click(); // close it
	$( "#gHeaderContent" ).load( exportFile); 
	headerCls.show();
	
	try {
		consoleLog("trying to export...");
		var a = window.document.createElement('a');
		// safari does not like Blobs
		//a.href = window.URL.createObjectURL(new Blob([gpxXml], {type: 'application/gpx+xml'}));
		a.href = 'data:'+dataType+';charset=utf-8,' + encodeURIComponent(fileStream);
		a.download = activeRoute.name+'-'+type+'.'+ext;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		consoleLog("trying to ... done");
	} catch(e) {
		consoleLog("trying to ... error");
		alert("Error: " + e);
	}
}

function exportGpx(type, ver) { // FIXME: this code needs refactory with a dedicated UI dialog
	var gpxXml = "";
	var time = new Date().toISOString(); 	
	consoleLog(time);
	var link = window.location.protocol+"/"+window.location.hostname+activeRoute.getUrl();
	link ="http://www.mappite.org";
	// Header and metadata
	if (ver == "1.1") {
		gpxXml += '<?xml version="1.0" encoding="UTF-8"?>';
		if ( type === "routeShp") { gpxXml += '\n<gpx version="1.1" creator="mappite.org" xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v2" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3" xmlns:trp="http://www.garmin.com/xmlschemas/TripExtensions/v1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v2 http://www.garmin.com/xmlschemas/TrackPointExtensionv2.xsd http://www.garmin.com/xmlschemas/TripExtensions/v1 http://www.garmin.com/xmlschemas/TripExtensionsv1.xsd">'; }
		else {gpxXml += '\n<gpx version="1.1" creator="mappite.org" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">';}
		gpxXml += '\n<metadata>';
		gpxXml += '\n<name>'+activeRoute.name+'</name>';
		gpxXml += '\n<author><name>mappite.org</name><link href="https://www.mappite.org"><text>mappite routes made easy thanks to openstreetmap and others</text></link></author>';
		// gpxXml += '\n<copyright author="OpenStreetMap contributors"/>';
		gpxXml += '\n<link href="'+link+'"><text>'+activeRoute.name+'</text></link>';
		gpxXml += '\n<time>'+time+'</time>';
		gpxXml += '\n</metadata>';
	} else { // assume 1.0 // FIXME: this will be the default for trxk as well
		gpxXml += '<?xml version="1.0" encoding="UTF-8"?>';
		gpxXml += '\n<gpx version="1.0" creator="mappite.org" xmlns="http://www.topografix.com/GPX/1/0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/0 http://www.topografix.com/GPX/1/0/gpx.xsd">';
		gpxXml += '\n<name>'+activeRoute.name+'</name>';
		gpxXml += '\n<author>mappite.org</author>';
		gpxXml += '\n<url>https://mappite.org</url>';
		gpxXml += '\n<time>'+time+'</time>';
	}

	if (type === "waypoints" || type === "routeWp") {
		// WayPoints
		var vps =  activeRoute.viaPoints;
		for (i = 0; i < vps.length; i++) {
			gpxXml += '\n<wpt lat="'+vps[i].lat+'" lon="'+vps[i].lng+'"><name>'+vps[i].name+'</name></wpt>';
		}
	}	
	if (type === "route" || type === "routeWp") {
		// Route
		var vps =  activeRoute.viaPoints;
		gpxXml += '\n<rte><name>'+activeRoute.name+'</name>';
		for (i = 0; i < vps.length; i++) {
			gpxXml += '\n<rtept lat="'+vps[i].lat+'" lon="'+vps[i].lng+'"><name>'+vps[i].name+'</name></rtept>';
		}
		gpxXml += '\n</rte>';
	}
	if (type === "track") {
		// Track
		// scroll 	activeRoute.routePoly.getLatLngs() tbd
		var lls=  activeRoute.routePoly.getLatLngs();
		gpxXml += '\n<trk><name>'+activeRoute.name+'</name><trkseg>';
		for (i = 0; i < lls.length; i++) {
			gpxXml += '\n<trkpt lat="'+lls[i].lat.toFixed(6)+'" lon="'+lls[i].lng.toFixed(6)+'"></trkpt>';
		}
		gpxXml += '\n</trkseg></trk>';
	}
	
	if (type === "routeShp") { // Experimental: Garmin extension, Route with shapepoints
		var uom = (document.getElementById("gOptions.uom").value==="k"?"km":"mi");
		var shpDistance = window.prompt(translations["export.gpxShapingPoint"]+" ("+uom+"): ","10");
		
		if (isNaN(shpDistance) || shpDistance < 1) { shpDistance = 10; alert("Number error, defaulting to 10"); }
		if ( uom === "mi") shpDistance = shpDistance/(0.621371);
		consoleLog("Shapingpoint ditance in km: " + shpDistance);
		
		var routeType = $('input[name="gOptions.type"]:checked').val();
		var vps =  activeRoute.viaPoints;
		gpxXml += '\n<rte><name>'+activeRoute.name+'</name>';
		gpxXml += "<extensions><trp:Trip><trp:TransportationMode>Motorcycling</trp:TransportationMode></trp:Trip></extensions>";
		
		var calcMode = (routeType=== "s"?"ShorterDistance":"FasterTime"); //FasterTime, CurvyRoads, Direct, ShorterDistance
		var wayPtTag = "<extensions><trp:ViaPoint><trp:CalculationMode>"+calcMode+"</trp:CalculationMode></trp:ViaPoint></extensions>";
		var shpPtTag = "<extensions><trp:ShapingPoint/></extensions>";
		
		var vps =  activeRoute.viaPoints;
		var lls =  activeRoute.routePoly.getLatLngs();
		var llsIdx= 1; // start from 2nd point to calculate distance from previous
		var distance = 0; // distance from previosu waypoint (start of leg)
		for (var i = 0; i < vps.length; i++) {
			gpxXml += '\n<rtept lat="'+vps[i].lat+'" lon="'+vps[i].lng+'">'+
			          '<name>'+ vps[i].name+'</name>'+wayPtTag+'</rtept>';
			consoleLog("Leg: " + i + " - llsIdx: " + llsIdx + " - activeRoute.legsIdx[i]: "+ activeRoute.legsIdx[i]);
			consoleLog("distance: " + distance);
			while (llsIdx < activeRoute.legsIdx[i]) { 
				distance = distance + getDistance([lls[llsIdx-1].lat,lls[llsIdx-1].lng], [lls[llsIdx].lat,lls[llsIdx].lng], 0,0);
				if (distance > shpDistance) { // add shapepoint
					consoleLog("Adding Shapepoint");
					gpxXml += '\n<rtept lat="'+lls[llsIdx].lat.toFixed(6)+'" lon="'+lls[llsIdx].lng.toFixed(6)+'">'+
						  '<name>'+translations["export.shapingPointName"]+'</name>'+shpPtTag+'</rtept>';
					distance = 0; // reset
				}
				llsIdx++;
			}
		}
		gpxXml += '\n</rte>';
	}

	gpxXml += '\n</gpx>';
	return gpxXml;
}

function exportItn() {
	var vps =  activeRoute.viaPoints;
	
	var itn = itnCoord(vps[0].lng)+'|'+itnCoord(vps[0].lat)+'|'+vps[0].name+'|4|\n'; // start
	for (i = 1; i < vps.length-1; i++) {
		itn += itnCoord(vps[i].lng)+'|'+itnCoord(vps[i].lat)+'|'+vps[i].name+'|0|\n'; // via
	}
	itn += itnCoord(vps[i].lng)+'|'+itnCoord(vps[i].lat)+'|'+vps[i].name+'|2|\n'; // end
	return itn;
}
function itnCoord(l) { // convert from std lat/lng format to tom tom one...
	return Math.round(l*100000);
}

function exportCsv() { // https://tools.ietf.org/html/rfc4180 + numbers use locale decimal separator
	var vps = activeRoute.viaPoints;
	var uom = (document.getElementById("gOptions.uom").value==="k"?"km":"mi");
	var csv = '"Name","Lng","Lat","Distance ('+uom+')","Time","Tot Distance ('+uom+')","Tot Time"\r\n';
	csv += '"'+vps[0].name.replace('"',' ')+'","'+formatDecimal(vps[0].lat,6)+'","'+formatDecimal(vps[0].lng,6)+'","0","0","0","0"\r\n';
	
	legsTimeTotal = 0;
	legsDistanceTotal = 0;
	
	for (i = 1; i < vps.length; i++) {
		vp  =  activeRoute.viaPoints[i];
		leg = activeRoute.legs[i-1];
		legsTimeTotal     = legsTimeTotal+leg.time;
		legsDistanceTotal = legsDistanceTotal+leg.distance;
		csv += '"'+vps[i].name.replace('"',' ')+'","'+
		       formatDecimal(vps[i].lat,6)+'","'+formatDecimal(vps[i].lng,6)+'","'+
		       formatDecimal(leg.distance,2)+'","'+formatTime(leg.time)+'","'+
		       formatDecimal(legsDistanceTotal,2)+'","'+formatTime(legsTimeTotal)+'"\r\n';
	}

	return csv;
}
