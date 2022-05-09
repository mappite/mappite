/*** Save / Load and refresh list of Routes ***/

/* FUNCTION: saveRoute() 
 * Called when a user saves current route.
 * Route Name format in #sRouteName element is "my route name #tag1 #tag2 ... #tagN".
 * if #sRouteName element starts with # assume it is a tag and delete the tag from all routes (a warning appears),
 * 	if a 2nd tag is specified, rename the former
 * Route tags are updated by calling saveRouteTags().
 * If a route is saved when filtering the list by a specific #tag, the tag is added to the route
 */
function saveRoute() {

	// Route Name is: "my route name #tag1 #tag2 ... #tagN"
	var routeFullName = document.getElementById("sRouteName").value; //.value.replace("|"," ").replace(","," ").split("#"); // | is a special char mappite use to separate items in local storage
	var routeNameAndTags = document.getElementById("sRouteName").value.replace("|"," ").replace(","," ").split("#"); // | is a special char mappite use to separate items in local storage
		
	if (routeFullName.charAt(0) === "#" ) { // first char is #: this for tag maintenance
		// routeNameAndTags[0] is empty...
		if (routeNameAndTags.length == 2) { // only one tag in list: remove it
			if (window.confirm(translations["saveLoad.sureRemoveTag"]+": "+routeFullName+" ?")) {	
				localStorage.removeItem("gTag|"+routeFullName.substring(1).trim());
			}
		} else { // replace first one with 2nd one
			newTagName = routeNameAndTags[2].trim();
			oldTagName = routeNameAndTags[1].trim();
			consoleLog("routeNameAndTags: "+ routeNameAndTags);
			if (window.confirm(translations["saveLoad.sureRenameTag"]+": "+oldTagName+" > "+newTagName+" ?")) {
				val = localStorage.getItem("gTag|"+oldTagName);
				if ( val != null) {
					//consoleLog("gTag|"+oldTagName+ ": "+ localStorage.getItem("gTag|"+oldTagName));
					localStorage.setItem("gTag|"+newTagName, val);
					localStorage.removeItem("gTag|"+oldTagName);
				}
			}
			
		}
	} else { // real route or POI save
		if (activeRoute == null) { alert(translations["route.createBeforeSaving"] ); return; }
		
		routeNameAndTags = routeNameAndTags.map(function (e) { return e.trim(); }); // trim all elements
		
		var routeName = routeNameAndTags[0]; // add gPoi| to route name if it is a POI
		//consoleLog("saveRoute(): tags array: " + routeNameAndTags);
		activeRoute.setName(routeName);
		
		routeName = (isPoiMode()?"gPoi|":"")+routeName; // add gPoi| to route name if it is a POI
		var key = "gRoute|"+routeName;

		consoleLog("saveRoute(): key: " + key);

		var routeUrl = activeRoute.getUrl();

		if (localStorage.getItem(key)) { // route exists
			if (!window.confirm(translations["saveLoad.sureOverwriteSavedRoute"])) { return; }
		}
		//consoleLog("Saving route");
		var urlPrefix = "";
		// Cloud Save
		if ( isEnrolled() ) {
			saveRouteCloud(routeName,routeUrl); // spin the icon, save on cloud, reset icon
			urlPrefix = "C_"; // FIXME: this should validate saveRouteCloud ended successfully
		} 
		
		// Local Storage Save
		// localStorage.setItem("gRoute|"+routeName , urlPrefix+routeUrl);
		localStorage.setItem(key , urlPrefix+routeUrl);
		
		// Save/update Tags in Local storage
		//if (routeNameAndTags.length > 1) // no!  if all tags are removed we need to make sure we clean up gTag|tagName
		saveRouteTags(routeNameAndTags);
		
		// save track gRTrack|
		if (!isPoiMode()) { // if not RoutePoi
			var uom = (document.getElementById("gOptions.uom").value==="k"?"km":"mi");
			var length = formatDecimal(activeRoute.routeDistance,2);
			var compressedTrack = activeRoute.getCompressedTrack();
			localStorage.setItem("gRTrack|"+routeName , length+"|"+uom+"|"+compressedTrack); // lenght|uom|encoded
		}
		
		// Show warning every some days if not enrolled
		if ( !isEnrolled() ) {
			consoleLog("saveRoute(): Checking for warning: ");
			var lastWarningTime = getCookie("notEnrolledWarningTime");
			if (lastWarningTime == null ) lastWarningTime = 0; // never set
			var todayTime = new Date().getTime(); 	
			if ( (todayTime-lastWarningTime)/1000/60/60/24 > 4 ) { // 4 days - useless since we set cooke expire in 4 days...
				setCookie("notEnrolledWarningTime", todayTime, 4);
				$( "#gPanelToggle" ).click(); // close it
				var msg = translations["cloud.unenrolledWarning"] + "<div class='clsEnroll' onClick=\"javascript:$( \'#gHeaderContent\' ).load(\'"+ enrollFile+"\');\">" +translations["cloud.enrollInvite"] + "</div>";
				$( "#gHeaderContent" ).html(msg); 
				headerCls.show();
			}
		}
		// update url with new name
		history.pushState(name, name, routeUrl);
	}
	refreshSavedRoutes() ;
}

/* FUNCTION: saveRouteTags
 * Save route tags or remove route from tags. 
 * Input: tags[] (strings array)
 * tags[0] is route name,  other items are tags
 * this removes the route name from tags that are not in the input (a warning appears)
 * localstorage key  "gTag|tagName" contains a pipe separated list of route names
 */
function saveRouteTags(tags) {
	
	//consoleLog("0 in saveRouteTags");
	routeName = tags[0];
	
	// add current selected tag to list if not in
	var selectedTag = $("#gTags").val();
	if ( ( selectedTag!=="all" ) && tags.indexOf(selectedTag) == -1 ) { // add
		tags.push(selectedTag);
	}
	

	// track if user agrees to remove existing tags for this route. 0 = pending to ask, 1= remove, -1 = keep
	var cleanRouteTags = 0; 	
	
	for (i = 0; i<localStorage.length; i++) {
		if (localStorage.key(i).indexOf("gTag") == 0 ) { // it's a gTag|tagname item containing | separated list of route names
			key = localStorage.key(i);
			consoleLog("1 key: " + key);
			tagname = key.replace("gTag|","");// get tagname in "gTag|tagname"
			consoleLog("2 tagname: " + tagname);
			if ( tags.indexOf(tagname) > 0 ) { // if this tagname is in route tags, (>0 and not >-1 since we skip route name at routeName)
				// check if route is in this gTag|tagname and add it if missed
				consoleLog("3a tagname is in route tags");
				routesValue = localStorage.getItem(key); // | separated list
				routes = routesValue.split("|");
				if ( routes.indexOf(routeName ) < 0 ) { // route is not there: add it
					localStorage.setItem(key, routesValue+"|"+routeName);
					consoleLog("4 route added to this tagname");
				} else {
					consoleLog("4 route already in this tagname, no changes");
				}

			} else {
				// check if route is in and remove it  
				consoleLog("3b tagname is NOT in route tags");

				routesValues = localStorage.getItem(localStorage.key(i)).split("|"); ; // | separated list
				idx = routesValues.indexOf(routeName);
				if ( idx  > -1 ) { // this tag contains the route, we shall remove
					consoleLog("3.5 this tag contains the route, we shall remove");
					if (cleanRouteTags == 0 ) {
						if (window.confirm(translations["saveLoad.keepRouteTags"])) {	
							cleanRouteTags = -1; // keep
						} else {
							cleanRouteTags = 1; // clean
						}
					}
					if (cleanRouteTags == 1) {
						consoleLog("3.7 removing...");
						routesValues.splice(idx , 1); // remove from array
						if (routesValues.length > 0) { // recreate gTag|tagname with new list of routes
							localStorage.setItem("gTag|"+tagname, routesValues.join("|")); 
							consoleLog("4 route name removed from tagname");
						} else { // delete gTag|tagname, tagname is not used by any route
							localStorage.removeItem("gTag|"+tagname);
							consoleLog("5 tagname is empty - removed");
						}
					}
				}

			}
			consoleLog("6 tagname ("+key+") final value: " + localStorage.getItem(key) );
			// remove 
			delete tags[tags.indexOf(tagname)]; // set tagname element in tags array to undefined  since gTag|tagname has been already consider (i.e. it exists)
		}
	}
	
	// loop over not-undefined tags and add them to localStorage
	for (i = 1; i<tags.length; i++) {
		if ( typeof tags[i] !== "undefined") {
			localStorage.setItem("gTag|"+tags[i], tags[0]);
			consoleLog("7 tagname created: gTag|"+tags[i] + " = " + localStorage.getItem("gTag|"+tags[i]));
		}
	}

}

/* FUNCTION: deleteRouteId
 * Called by user when deleting a saved route. 
 * Input: index of localstorage key to remove
 * This removes also route name from tags and route in cloud (if any)
 * NOTE: DELETION IS VIA LOCALSTORAGE KEY INDEX GENERATED BY refreshSavedRoutes() 
 *  	 NO OTHER METHODS SHOULD REMOVE ITEMS FROM THE LOCAL STORAGE OTHERWISE WRONG STUFF COULD BE DELETED
 */
function deleteRouteId(idx) {
	var key = localStoragesKeys[idx]; //localStorage.key(idx);
	var routeName = key.substring(7);

	if (window.confirm(translations["saveLoad.sureDeleteSavedRoute"] +" \"" + routeName +"\"" )) {


		if ( isEnrolled() ) {
			deleteRouteCloud(routeName);
		}

		saveRouteTags([ key.replace("gRoute|","") ]); // remove route's tags if...
		localStorage.removeItem(key); // remove route
		
		localStorage.removeItem("gRTrack|"+routeName); // remove associated Route Track (if any)
		
		refreshSavedRoutes(false); // do not resync now with cloud since we may still be deleting...
	}
}

/* FUNCTION: getTags
 * get sorted array of available tags
 */
function getTags() {
	tagsArray = new Array();
	for (i = 0; i<localStorage.length; i++) {
		if (localStorage.key(i).indexOf("gTag") == 0 ) { // it's a tag list for given route
			tagsArray.push(localStorage.key(i).replace("gTag|",""))
		}
	}
	return tagsArray.sort()	
}

/* FUNCTION: showHideRouteTrackId
 * INPUT: localStorage index of saved route url
 * 
 */
function showHideRouteTrackId(idx) {
	var key = localStoragesKeys[idx]; // localStorage.key(idx);
	var routeName = key.substring(7);
	
	if (routesTrackMap.has(routeName)) { // if route track is shown on screen, turn off
		consoleLog("Removing Track for: " + routeName);
		map.removeLayer(routesTrackMap.get(routeName));
		routesTrackMap.delete(routeName);
		$("#geye_"+idx).attr("src", "./icons/eye-gray.svg");
	} else {	
		var rTrack  = localStorage.getItem("gRTrack|"+routeName);
		if (rTrack != null) { // route track exists
			var i = rTrack.indexOf("|");  // "distance|km|compressedTrack" or "distance|mi|compressedTrack"
			var distance = rTrack.substring(0,i);
			var uom = rTrack.substring((i+1),(i+3));
			var compressedTrack = rTrack.substring((i+4));
			consoleLog("Distance: " +distance + " Uom: "+ uom); //+ "\n track: " + compressedTrack);
			
			// check loadTrack(trackName) in tracks.js
			
			pa = trackDecompress(compressedTrack,5);
			var lls = new Array();
			j = 0;
			for (i = 0; i < pa.length; i++) {
				lls[j++]=[pa[i++],pa[i]];
			}
			trackPoly = L.polyline(lls, {color: 'blue', dashArray: '4', opacity: 0.6, weight: 3}).addTo(map);	
			trackPoly.bindTooltip("<b>"+routeName+"</b><br/> " + distance + uom).openTooltip();	
			
			trackPoly.on('mouseover',function(e) { 
				e.target.openTooltip();
				e.target.setStyle({color: 'red', dashArray: '',opacity: 0.7, weight: 4});				
			});
			trackPoly.on('mouseout' ,function(e) { 
				e.target.closeTooltip();
				e.target.setStyle({color: 'blue', dashArray: '4', opacity: 0.6, weight: 3});				
			});
			
			map.fitBounds(trackPoly.getBounds());
			$("#geye_"+idx).attr("src", "./icons/eye-green.svg");		
			
			consoleLog("Removing Track for: " + routeName);
			routesTrackMap.set(routeName,trackPoly);
			
		} else {
			alert(translations["saveLoad.saveFirst"]);
		}
	}
}

/* FUNCTION: loadRouteId
 * INPUT: localStorage index of saved route url
 * Invoked when a user clicks on a saved route
 * NOTE: Current active route is lost without any warning
 */
function loadRouteId(idx) {
	if (isPoiMode() ) { // can't open new stuff in POI editor mode
		alert(translations["poi.cannotLoadNew"]);
		return;
	}
	var key = localStoragesKeys[idx]; // localStorage.key(idx);
	var url = localStorage.getItem(key);
	if (url.substring(0,2) === "C_") { // it's saved in cloud as well
	    url = url.substring(2);
	}
	loadRoute(url);
}
	
/* FUNCTION: loadRoute
 * INPUT: url
 * Invoked from index.html and from loadRouteId
 */
function loadRoute(url) {
	consoleLog("Loading route url:" + url);
	var curMapLayer = document.getElementById("gOptions.mapLayer").value;
	
	var names = getParameterByName("names",url).split("|"); // array with viapoints names
	var name = getParameterByName("name",url); // route name
	var sps = trackDecompress(getParameterByName("viapoints",url),5);
	var options = getParameterByName("options",url); 
	
	var newMapLayer = document.getElementById("gOptions.mapLayer").value;
	if (newMapLayer !== curMapLayer) {
		// consoleLog("Changing Map Layer");
		onMapLayersChange();
	}

	if (options.charAt(1) != 'o') { // if not a POI list
		if (activeRoute != null) {
			consoleLog("*** loadRoute forceClean");
			activeRoute.forceClean(); // FIXME: shoudl prompt a confirm box
		}
		setOptionsString(options); // set options to drive calculation
		
		var i=0;
		var firstPoint = "";
		while(i < sps.length/2) {

			vp = new ViaPoint(sps[i*2].toFixed(6),sps[i*2+1].toFixed(6),names[i+1]); // note there is an extra | in names so it starts from 1...

			if (i==0)  { firstPoint = vp.getLatLngStr() ;}

			if (i==0 && activeRoute != null) { // initialize a new active route
				activeRoute = new Route(vp,routeDefaultName);  
			} else {
				addViaPoint(vp);
				
				if ( sps.length/2>1 && i == (sps.length/2-1) && firstPoint  == vp.getLatLngStr() )  { // more than one point && last point && matches first: it is  a loop!
					consoleLog("loadRoute: is a LOOP");
					activeRoute.closedLoop = true; 
				} 
			}
			if ( !activeRoute.closedLoop )  { addMarkerToMap(vp);} // add unless this is last point of a closed loop
			i++;
		}

		activeRoute.setName(name); // redoundant
		document.getElementById("sRouteName").value = activeRoute.name;
		activeRoute.redrawAndFocus(); // look in cache also
	} else { // it's a poi, build poiCluster and add to poiMap, don't setOptionsString		
		var poiCluster = L.markerClusterGroup({
			maxClusterRadius: 10, // default was 40
			showCoverageOnHover: true,
			iconCreateFunction: function (cluster) {
				return L.icon({ iconUrl: "./icons/poiPlus.svg", iconSize: [20, 20] });
			}
		});

		var i=0;
		var firstPoint = "";
		while(i < sps.length/2) {
			poiCluster.addLayer(createPoiMarker(sps[i*2].toFixed(6), sps[i*2+1].toFixed(6), names[i+1], iconPoi));
			i++;
		}
		
		poiMap.set(name,poiCluster);
		map.addLayer(poiCluster);
		// focus		
		map.fitBounds(poiCluster.getBounds());
	
	}
	
}



/* FUNCTION: refreshSavedRoutes()
 * Create list of saved routes in #gSaved div, with links to load/delete, and refresh tags in #gTags select element.
 * If enrolled, load routes from cloud
 * NOTE: see note in deleteRouteId() comment
 */
function refreshSavedRoutes(cloudSync) {
	consoleLog( "in refreshSavedRoutes()"); 	
	
	if (cloudSync == null) cloudSync = true;
	
	// FIXME: refreshSavedRoutesHtml() shoudl be removed from within refreshCloudRoutes()
	// and this IF ELSE  reworked
	if ( cloudSync && isEnrolled() ) {
		// get routes from cloud
		// save in local storage // this overwrites current routes
		consoleLog("Enrolled!!!");
		refreshCloudRoutes();
	} else {
		// call refreshSavedRoutesHtml
		consoleLog("Not enrolled or cloudSync is " +cloudSync);
		refreshSavedRoutesHtml();	
	}
	 
}

function onRouteSearchAsYouType() {
	refreshSavedRoutesHtml();
}

function refreshSavedRoutesHtml() {
	// sayt = serch as you type string
	sayt = "";
	if ($( "#gRouteSAYT" ).val() != routeSearchDefaultName) { 
		sayt = $( "#gRouteSAYT" ).val().trim().toLowerCase();
	}
	
	consoleLog( "in refreshSavedRoutesHtml()"); 	
	tag = document.getElementById("gTags").value;
	allTags = (tag==="all")?true:false;
	consoleLog("tag: " + tag +  " - allTags: " + allTags ); 	
	
	// rebuild tag list, note this happens whenever a route is saved or deleted to refresh the list of available tags
	$("#gTags").empty();
	
	var allTagsText  = "All Tags";
	if (typeof translations !== "undefined") { // check if not undefined to avoid issues at startup
		allTagsText = translations["saveLoad.allTags"];
	} 

	$("#gTags").append(new Option(allTagsText, "all")); 
	tags = getTags();
	for (i=0;i<tags.length; i++){ 
		$("#gTags").append(new Option(tags[i], tags[i]));//, (tags[i]===tag?true:false)));
	}
	// force the selection of selected tag...
	$('#gTags option[value="'+tag+'"]').attr("selected", "selected");
	
	// rebuild route names list according to tag filter (if set), with x to delete and link to load the route
	routeNamesInTag = []; // empty (if allTags==true) or it contains all routes to display in for the selected tag
	if (!allTags) { 
		routeNamesInTag = localStorage.getItem( "gTag|"+tag).split("|"); 
		//consoleLog("routeNamesInTag: " + routeNamesInTag ); 	
	}
	var routeNamesAndHTML = []; //new array containing {name: "route_name", html: "<html code with link>"}, this is to then sort by route name...
	for (i=0;i<localStorage.length;i++) {
		if (localStorage.key(i).indexOf("gRoute") == 0 ) { // it's a route or a poi
			var key = localStorage.key(i);

			// keep reference to key in an array, localStorage key index is user-agend defined (i.e. do not rely on it)
			localStoragesKeys[i] = key;
			
			routeName = key.substring(7); // gRoute|routeName or gRoute|gPoi|routeName
			//consoleLog("route name to check: " + key.replace("gRoute|","") );
			// if (ALL Targs or Route name has the Tag) AND (sayt is empty or sayt matche teh route name) add
			if ( (allTags || routeNamesInTag.indexOf(key.replace("gRoute|",""))>-1 )
				&& (sayt == "" || routeName.toLowerCase().indexOf(sayt)>-1 ) ) {
				var val= localStorage.getItem(key); // url
				// consoleLog( "local item found: ("+i+") " + routeName);//key, localStorage.getItem(key)); 
				
					var cloudImg= "";
				if (val.substring(0,2) === "C_") { 
					//val = val.substring(2);
					cloudImg= "<img src='./scripts/images/cloud-gray.svg' width='18' height='18'>";
				}
								
				if (routeName.indexOf("gPoi|") == 0) { // it's a POI
					routeName = routeName.substring(5); // gPoi|routeName
					var poiColor = (poiMap.has(routeName)?"green":"gray"); // green if shown on map
					var poiImg = "<img id='gpoi_"+i+"' src='./icons/poi-"+poiColor +".svg' width='17' height='17'>";
					/*routeNamesAndHTML.push({name: routeName, html: "<a class='gactions' href='javascript:deleteRouteId(\""+i+"\")'>&#215;</a>&nbsp;"+
							       "<a class='gactions' href='javascript:showHidePoiId(\""+i+"\")'>"+poiImg+"</a>&nbsp;" +
							       "<a class='glinks' href='javascript:editPoiId(\""+i+"\")'>"+routeName+"</a>&nbsp;"+
								cloudImg+"<br/>"}); */
								
					routeNamesAndHTML.push({name: routeName, html: "<a class='gactions' href='javascript:deleteRouteId(\""+i+"\")'>&#215;</a>&nbsp;"+
							       "<a class='glinks' href='javascript:editPoiId(\""+i+"\")'><img src='./icons/wrench-gray.svg' alt='Edit' width='17' height='17'></a>&nbsp;"+
							       "<a class='glinks' href='javascript:showHidePoiId(\""+i+"\")'>"+poiImg+"&nbsp;"+routeName +"</a>&nbsp;" + 
								cloudImg+"<br/>"});
								
								
					
				} else { // it's a Route
					// if it is displayed green, if is available gray. If not available,red
					var eyeColor = (routesTrackMap.has(routeName)?"green":(!localStorage.getItem("gRTrack|"+routeName)?"grayno":"gray"));
					var eyeImg =  "<img id='geye_"+i+"' src='./icons/eye-"+eyeColor+".svg' width='17' height='17'>";
					
					routeNamesAndHTML.push({name: routeName, html: "<a class='gactions' href='javascript:deleteRouteId(\""+i+"\")'>&#215;</a>&nbsp;"+
							       "<a class='gactions' href='javascript:showHideRouteTrackId(\""+i+"\")'>"+eyeImg+"</a>&nbsp;" +
							       "<a class='glinks' href='javascript:loadRouteId(\""+i+"\")'>"+routeName+"</a>&nbsp;"+
								cloudImg+"<br/>"});
				}
				
			}
		}
	}
	
	document.getElementById("gSaved").innerHTML = sortedRoutesHtml(routeNamesAndHTML); 
	 
}

// FUNCTION: sortedRoutesHtml
//	input: an associative array with a "name" label which value should be sorted to and "html" value to concatnate
// 	returns the concatenated html sorted by name values
function sortedRoutesHtml(namesArray) {
	// https://stackoverflow.com/questions/9229645/remove-duplicate-values-from-js-array
	namesArray.sort(function(a,b) { aa= a.name.toUpperCase(); bb= b.name.toUpperCase(); return (aa===bb?0:(aa<bb?-1:1)); } );
		
	var sr = "";
	for (i=0;i<namesArray.length;i++){
	  sr= sr + namesArray[i].html;
	}
	return sr;
}
