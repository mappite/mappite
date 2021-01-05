/*** GPX/ITN Export/Import ***/


/* Import GPX/ITN */
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
			parser = new DOMParser();
			xmlDoc = parser.parseFromString(reader.result,"text/xml");
			// x = xmlDoc.getElementsByTagName("rtept");
			//OK: x[0].attributes.getNamedItem("lat").value;
			//OK: x[0].getAttribute("lat")
			//ok. x[0].getElementsByTagName("name")[0].textContent
			points = xmlDoc.getElementsByTagName("rtept");
	
			if (points.length>0) { // it's a route!
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
			} else { // try with track
				points = xmlDoc.getElementsByTagName("trkpt");
				if (points.length>0) { // it's a track!
					isLoadSuccess = true;
					loadGpxTrack(points, file.name);
				}
			}
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

function loadGpxTrack(points, fileName) {
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
	if (typeof xmlDoc.getElementsByTagName("trk")[0].getElementsByTagName("name")[0] !== 'undefined') { // has name?
		trackName = xmlDoc.getElementsByTagName("trk")[0].getElementsByTagName("name")[0].textContent;
	} else { // use file name
		trackName = fileName.substring(0,fileName.length-4);
	}
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

/* GPX/ITN Export */

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
		} else if (sel === "spreadsheetCsv") { // // itn route
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

function exportGpx(type, ver) {
	var gpxXml = "";
	var time = new Date().toISOString(); 	
	consoleLog(time);
	var link = window.location.protocol+"/"+window.location.hostname+activeRoute.getUrl();
	link ="http://www.mappite.org";
	// Header and metadata
	if (ver == "1.1") {
		gpxXml += '<?xml version="1.0" encoding="UTF-8"?>';
		gpxXml += '\n<gpx version="1.1" creator="mappite.org" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">';
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
	csv += '"'+vps[0].name.replace('"',' ')+'","'+getLocaleDecimal(vps[0].lat,6)+'","'+getLocaleDecimal(vps[0].lng,6)+'","0","0","0","0"\r\n';
	
	// WORKS add function getLocale(n,decimals)
	legsTimeTotal = 0;
	legsDistanceTotal = 0;
	
	for (i = 1; i < vps.length; i++) {
		vp  =  activeRoute.viaPoints[i];
		leg = activeRoute.legs[i-1];
		legsTimeTotal     = legsTimeTotal+leg.time;
		legsDistanceTotal = legsDistanceTotal+leg.distance;
		csv += '"'+vps[i].name.replace('"',' ')+'","'+
		       getLocaleDecimal(vps[i].lat,6)+'","'+getLocaleDecimal(vps[i].lng,6)+'","'+
		       getLocaleDecimal(leg.distance,2)+'","'+formatTime(leg.time)+'","'+
		       getLocaleDecimal(legsDistanceTotal,2)+'","'+formatTime(legsTimeTotal)+'"\r\n';
	}

	return csv;
}
