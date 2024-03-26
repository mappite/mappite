/*** Icons actions (when click on right bar) ***/

/*
How to add a new Layer:
prepare the icons svg files:
	name.svg
	name-gray.svg
	namePlus.svg
add imgs in index.html with id "name"
add callback functions on click in index.html
add proper function showName() in 060-Layers.js
add array item in 000-GlobalVas.js
add proper translation in en.json/it.json etc
 */

/* FUNCTION: addJsonNode
 * add a node to the route. Used by getGeonamesNodes and getOverpassNodes
 * Node must have: name, lat, lon
 * Optional: elevation
 */
function addJsonNode(node,e) {
	//consoleLog("Adding  node"+node.name+" to route");
	var label =  node.name;
	if (node.elevation) label = label + " ("+node.elevation+"mt)"; 
	var vpjs = new ViaPoint(node.lat, node.lon, label);
	addViaPoint(vpjs);
	activeRoute.redraw();
	addMarkerToMap(vpjs); 
}

/* FUNCTION: getGeonamesNodes
 * Used by showGeonamesWikipedia() function only 
 * but coudl be reused for other services
 */
function getGeonamesNodes(id, service, query) {
	$("#"+id).attr("src", "icons/spinner.svg");
	/* use proxy since geonames.org would not support https */
	$.ajax({
	    url:'proxy.php?url=http://api.geonames.org/'+service+'&'+ query,
	    dataType: 'json',
	    type: 'GET',
	    async: true,
	    crossDomain: true
	}).done(function(json) {
		//consoleLog(JSON.stringify(json, undefined, 2)); // print whole object
		consoleLog( "Geonames Elements:" + json.geonames.length);
		icon="./icons/"+id+".svg";
		var iconPlus="./icons/"+id+"Plus.svg";
		if (json.geonames.length == 0) {
			alert(translations["overpass.noResults"]);
		} else {
			var oPassmarkers = L.markerClusterGroup({
						maxClusterRadius: 40,
						showCoverageOnHover: true,
						iconCreateFunction: function (cluster) {
							return L.icon({ iconUrl: iconPlus, iconSize: [20, 20] });
						}
					});
			for (var k=0; k< json.geonames.length;k++) { 
				if (k>50) {alert(translations["overpass.overLimit"]); break;}
				var elem = json.geonames[k];
				// converto to std element
				elem.name = elem.title;
				elem.lon  = elem.lng;
				// end convert
				var label =  "<b>" + elem.name + "</b>";
				if (elem.elevation) label = label + "<br/> ("+elem.elevation+"mt)"; 
				if (elem.wikipediaUrl) label = label + " <a href='http://"+elem.wikipediaUrl+"' target='_blank'>Wikipedia</a>";
				if (elem.thumbnailImg) label = label + " <br/><img src='"+elem.thumbnailImg+"'>";
				cm = L.marker(L.latLng(elem.lat,elem.lon), {icon: L.icon({ iconUrl: icon, iconSize: [20, 20] })});
				//cm.addTo(map).bindPopup(label+"<br/><div class='gsmall'>"+rightClickText+ " " + translations["popup.add"] +"</div>", {offset: L.point(0,-13)}); // also doubleclick
				cm.bindPopup(label+"<br/><div class='gsmall'>"+rightClickText+ " " + translations["popup.add"] +"</div>", {offset: L.point(0,-13)}); // also doubleclick
				cm.on('contextmenu dblclick', L.bind(addJsonNode, this, elem) ); // dblclick does not work since 1st click is consumed by popup...
				//mapIcons[id].push(cm);
				oPassmarkers.addLayer(cm); 
			}
			map.addLayer(oPassmarkers);
			mapIcons[id].push(oPassmarkers);
		}
		// reset icon
		$("#"+id).attr("src", icon);
	}).fail(function(err) {
	    consoleLog("Geonames Error: " + err);
	});
}

/* FUNCTION: showGeonamesWikipedia
 * show Wikipedia geotagged articles on visible area
 */
function showGeonamesWikipedia() {
	// http://api.geonames.org/wikipediaBoundingBoxJSON?north=46.56&south=46.44&east=11.99&west=11.60&username=gspeed&lang=IT
	// query = 'wikipediaBoundingBoxJSON?north='+bbox.getNorth()+'&south='+bbox.getSouth()+'&east='+bbox.getEast()+'&west='+bbox.getWest()+'&username=gspeed&lang='+langCode;
	// http://www.mappite.org/proxy.php?url=http://api.geonames.org/wikipediaBoundingBoxJSON&north=46.56&south=46.44&east=11.99&west=11.60&username=gspeed&lang=IT
	service = 'wikipediaBoundingBoxJSON';
	query = 'north='+bbox.getNorth()+'&south='+bbox.getSouth()+'&east='+bbox.getEast()+'&west='+bbox.getWest()+'&username=gspeed&lang='+langCode;
	getGeonamesNodes('wikipedia',service, query);
}
	
	
/** Overpass **/

/* FUNCTION: getOverpassNodes
 * #query for nodes via overpass-api and highlights in map with #icon 
 * #id image changes to spinner during execution and resets to #icon once done
 */
function getOverpassNodes(id, query) {
	$("#"+id).attr("src", "icons/spinner.svg");
	//var url = 'https://overpass.kumi.systems/api/interpreter?data=' + '[out:json];' + query + 'out center;'; // 'https://overpass-api.de/api/ // https://overpass.kumi.systems/api/
	var url = 'https://overpass-api.de/api/interpreter?data=' + '[out:json];' + query + 'out center;'; // 'https://overpass-api.de/api/ // https://overpass.kumi.systems/api/
	//consoleLog( "Overpass query:\n" + url);
	$.ajax({
	    url: url,
	    dataType: 'json',
	    type: 'GET',
	    async: true,
	    crossDomain: true
	}).done(function(json) {
		//consoleLog(JSON.stringify(json, undefined, 2)); // print whole object
		icon="./icons/"+id+".svg";
		var iconPlus="./icons/"+id+"Plus.svg";
		consoleLog( "Overpass Elements:" + json.elements.length);
		if (json.elements.length == 0) {
			alert(translations["overpass.noResults"]);
		} else {		
			var oPassmarkers = L.markerClusterGroup({
						maxClusterRadius: 40,
						showCoverageOnHover: true,
						iconCreateFunction: function (cluster) {
							return L.icon({ iconUrl: iconPlus, iconSize: [20, 20] });
						}
					});
			
			for (var k=0; k< json.elements.length;k++) { 
				if (k>50) {alert(translations["overpass.overLimit"]); break;}
				var elem = json.elements[k];
				if (elem.tags!== undefined) {
					elem.name = (elem.tags.name||elem.tags["name:it"]||elem.tags.brand||elem.tags.operator);
					//consoleLog( "Namify node: " + elem.id +"=>"+ name);
					if ( elem.name === undefined) elem.name = translations["icons."+id];
					var label =  "<b>" + elem.name + "</b>";
					if (elem.tags.ele) {
						elem.elevation = elem.tags.ele; // convert to std elem
						label = label + "<br/> ("+elem.elevation+"mt)"; 
					}
					if (elem.tags.wikipedia) label = label + " <a href='http://en.wikipedia.org/wiki/"+escapeHTML(elem.tags.wikipedia)+"' target='_blank'>Wikipedia</a>";
					if (elem.type == "way") { // convert to std elem
						elem.lat=elem.center.lat;
						elem.lon=elem.center.lon;
					}
					cm = L.marker(L.latLng(elem.lat,elem.lon), {icon: L.icon({ iconUrl: icon, iconSize: [20, 20] })});
					//cm.addTo(map).bindPopup(label+"<br/><div class='gsmall'>"+rightClickText+ " " + translations["popup.add"] +"</div>", {offset: L.point(0,-13)}); // also doubleclick
					cm.bindPopup(label+"<br/><div class='gsmall'>"+rightClickText+ " " + translations["popup.add"] +"</div>", {offset: L.point(0,-13)}); // also doubleclick
					cm.on('contextmenu dblclick', L.bind(addJsonNode, this, elem) ); // dblclick does not work since 1st click is consumed by popup...
					// mapIcons[id].push(cm);
					oPassmarkers.addLayer(cm);
				}
			}
			map.addLayer(oPassmarkers);
			mapIcons[id].push(oPassmarkers);
		}
		
		// reset icon
		$("#"+id).attr("src", icon);
	}).fail(function(err) {
	    consoleLog("Overpass Error: " + err);
	});
};

/* FUNCTION: canGetMountainPasses
 * returns true if visible area is less than 0.3
 */
function canGetOverpass() {
	bbox = map.getBounds();
	area = Math.abs((bbox.getNorth()-bbox.getSouth())*(bbox.getWest()-bbox.getEast()));
	//consoleLog("Area: " + area);
	return (area<0.6)?true:false;
}
/* FUNCTION: getSwne
 * get current area box string "s,w,n,e"
 */
function getSwne() {
	bbox = map.getBounds();
	return bbox.getSouth()+','+bbox.getWest()+','+bbox.getNorth()+','+bbox.getEast();
}

/* FUNCTION: showMountainPasses
 * get mountain passes
 */
function showMountainPasses() {
	swne = getSwne();
	// allow passes on Track if .clickOnRoad = n
	highways = "primary|secondary|tertiary|trunk|service|unclassified" + ((document.getElementById("gOptions.clickOnRoad").value === "n")?"|track":"");
	query = 'node[mountain_pass=yes]('+swne+');' + 
		'way(bn)["highway"~"'+highways+'"];' + 
		'node(w)[mountain_pass=yes]('+swne+');';
	//getOverpassNodes('#opMountainPasses','icons/mountainPasses-red.svg',query);
	getOverpassNodes('mountainPasses',query);
}


/* FUNCTION: showViewPoint
 * get vie points close to highways

way["highway"~"primary|secondary|tertiary|trunk|service|unclassified"]({{bbox}})->.i;
node["tourism"="viewpoint"](around.i:150);
out;
*/
function showViewPoints() {
	swne = getSwne();
	// allow passes on Track if gOptions.clickOnRoad = n
	highways = "primary|secondary|tertiary|trunk|service|unclassified" + ((document.getElementById("gOptions.clickOnRoad").value === "n")?"|track":"");
	rangeMt = 50; // meters
	query = 'way["highway"~"'+highways+'"]('+swne+')->.i;' + 
		'node["tourism"="viewpoint"](around.i:'+rangeMt+');';
	getOverpassNodes('viewPoint',query);
}

/* FUNCTION: showFuels
 * get fuel stations
 */
function showFuels() {
	//query = '(way[amenity=fuel]('+getSwne()+');node[amenity=fuel]('+getSwne()+'));(._;>;);';
	query = '(way[amenity=fuel]('+getSwne()+');node[amenity=fuel]('+getSwne()+'););';
	getOverpassNodes('fuel',query);
}

/* FUNCTION: showCampings
 * get fuel stations
 */
function showCampings() {
	//query = '(way[amenity=fuel]('+getSwne()+');node[amenity=fuel]('+getSwne()+'));(._;>;);';
	query = '(way[tourism=camp_site]('+getSwne()+');node[tourism=camp_site]('+getSwne()+'););';
	getOverpassNodes('camping',query);
}

/* FUNCTION: showSupermarkets
 * get Supermarkets
 */
function showSupermarkets() {
	query = '(way[shop=supermarket]('+getSwne()+');node[shop=supermarket]('+getSwne()+'););';
	// query = 'node[shop=supermarket]('+getSwne()+');';
	getOverpassNodes('supermarket',query);
}

/* FUNCTION: showPicnic
 * get Picnic places
 */
function showPicnic() {
	// query = 'node[tourism=picnic_site]('+getSwne()+');'; // node[leisure=picnic_table]('+getSwne()+');';
	query = '(node[tourism=picnic_site]('+getSwne()+');node[leisure=picnic_table]('+getSwne()+'););';
	getOverpassNodes('picnic',query);
}

/* FUNCTION: showBars
 * get Bars
 */
function showBars() {
	query = '(way[amenity=cafe]('+getSwne()+');node[amenity=cafe]('+getSwne()+'););';
	getOverpassNodes('bar',query);
}

/* FUNCTION: show Hotels
 */

function showHotels() {
	query = '(way[tourism=hotel]('+getSwne()+');node[tourism=hotel]('+getSwne()+'););';
	getOverpassNodes('hotel',query);
}

/* FUNCTION: showDrinkingwater
 * get drinkingwater fountains
 */
function showDrinkingWater() {
	query = 'node[amenity=drinking_water]('+getSwne()+');';
	getOverpassNodes('drinkingWater',query);
}

/** Overpass... END **/

/** Protomaps Layers **/

/* FUNCTION: showProtomapsLayer
 * load protomaps js (if needed) and display the layer 
 */
function showProtomapsLayer(id) {
	if (isProtomapsEnabled) {
		removeLayers("trackLayer"); // remove and set isProtomapsEnabled false
	} else {
		icon="./icons/"+id+".svg";
		if (isProtomapsLoaded) { 
			enableProtomapsLayer(id); 
		} else {
			$("#"+id).attr("src", "icons/spinner.svg");
			// protomaps is now loaded by default:
			//$.getScript('https://unpkg.com/protomaps-leaflet@1.24.0/dist/protomaps-leaflet.min.js', function(){
			   $.getScript('./scripts/unpavedPaintRules.js', function(){
				console.log("protomaps loaded");	   
				isProtomapsLoaded = true;
				map.createPane('protomaps');
				map.getPane('protomaps').style.zIndex = 300;
				// reverse of map.on(... in 040-MapFunctions
				map.on(!isTouchDevice()?'contextmenu':'click', openProtomapPopUp)
				enableProtomapsLayer(id);
				$("#"+id).attr("src", icon);
			   });
			//});
		}
	}
}

/* FUNCTION: enableProtomapsLayer
 * display the layer 
 */
function enableProtomapsLayer(id) {
	// enable the layer closer to where we area
	console.log("in enableProtomapsLayer for id: " + id);
	var mc = map.getBounds().getCenter();
	var idx = isLatLngWithin( mc.lat, mc.lng, PROTOMAPS_LATS);
	if (idx) {
		var tilesName = PROTOMAPS_LATS_PROTOTILES[idx-1];
		console.log("toast for  " + tilesName);
		showToast("Enabled: " + tilesName.toUpperCase(), true,'');
						
		// first layer
		var l = protomapsL.leafletLayer({
			url:'https://www.mappite.org/vector/'+tilesName+'.pmtiles', 
			attribution: '<a href="https://protomaps.com">Protomaps</a>',
			paintRules: myPaintRules(), // FIXME: in unpavedPaintRules.js
			pane: 'protomaps'
		});
		map.addLayer(l);
		mapIcons[id].push(l);

		isProtomapsEnabled = true;
		alertOnce("prototype.warning");

		// FIXME: this will be valid only for some layers
		document.getElementById("gOptions.clickOnRoad").value = "n";
	} else {
		alert("Area not covered");
	}
}

function openProtomapPopUp(e) {
	var ll = e.latlng;
	if ( isProtomapsLoaded && isProtomapsEnabled ) {
		var layer = mapIcons["trackLayer"][0]; // FIXME
		var content = "";
		var unspecified = "<span style='color: gray;'>n/a</span>";
		//for (var [sourceName, results] of layer.queryFeatures(ll.lng,ll.lat)) {
		for (var [sourceName, results] of layer.queryTileFeaturesDebug(ll.lng,ll.lat,8) ) {
                     for (var result of results) {
		        var props = result.feature.props;
			var kind = props["pmap:kind"].replace("_", " ").toUpperCase();
			var kind_detail = props["pmap:kind_detail"].split("|");

			var osmId = props["osm:id"];
			content += "<div><b>Way: <a href='https://www.openstreetmap.org/way/"+osmId+"' target='_blank'>"+osmId+"</a></b></div>";
			content += "<div><b>"+ kind + "</b></div>";
			//content += "<div>Unpaved: " + props["mappite:unpaved"] + "</div>";
			content += "<div>Track Type: <a href='https://wiki.openstreetmap.org/wiki/Key:tracktype' target='_blank'>" + (kind_detail[0]=="?"?unspecified:kind_detail[0]) + "</a></div>";
			content += "<div>Surface: <a href='https://wiki.openstreetmap.org/wiki/Key:surface' target='_blank'>" + (kind_detail[1]=="?"?unspecified:kind_detail[1]) + "</a></div>";
			content += "<div>Access: <a href='https://wiki.openstreetmap.org/wiki/Key:access' target='_blank'>" + (kind_detail[2]=="?"?unspecified:kind_detail[2]) + "</a></div>";
			content += "<div>Motor Vehicle: <a href='https://wiki.openstreetmap.org/wiki/Key:motor%20vehicle'target='_blank'>" + (kind_detail[3]=="?"?unspecified:kind_detail[3]) + "</a></div>";
			console.log(props);
		     }

                }
		if (content !== "") {
			L.popup().setLatLng(ll)
			         .setContent('<div style="max-height:400px;padding-right:8px">' + content +  '</div>')
			         .openOn(layer._map);
		}
	}	
}

/** Protomaps End **/

/* FUNCTION: removeLayers
 * remove sIcon from map, id is one of fuel, supermarket, etc
 */
function removeLayers(id) {
	consoleLog("in remove Icons for " + id);

	if (id === "locate" ) {
		if (circleLocate != null) map.removeLayer(circleLocate  );
		if (markerLocate != null) map.removeLayer(markerLocate); 
		map.stopLocate();
		isLocate = false;
		consoleLog("StopLocate()");
		//alert("stoplocate Called");
	} else {
		while(mapIcons[id].length>0) { map.removeLayer(mapIcons[id].pop()); }		
		if (id === "trackLayer") isProtomapsEnabled = false;
	}
	
}