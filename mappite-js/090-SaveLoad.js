/*** Save / Load and refresh list of Routes ***/

/* FUNCTION: saveRoute() 
 * Called when a user saves a route.
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
	consoleLog("rfn: " + routeFullName);
	consoleLog("charAt(0): " + routeFullName.charAt(0));
	
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
	} else { // real route save
		if (activeRoute == null) { alert(translations["route.createBeforeSaving"] ); return; }
		
		routeNameAndTags = routeNameAndTags.map(function (e) { return e.trim(); }); // trim all elements
		
		var routeName = routeNameAndTags[0];
		consoleLog("saveRoute(): tags array: " + routeNameAndTags);
		activeRoute.setName(routeName);
		var key = "gRoute|"+routeName;
		var routeUrl = activeRoute.getUrl();
		
		
		// local storage save incl. tags // ugly duplicate code shall refactor
		if (localStorage.getItem(key)) { // route exists
			if (window.confirm(translations["saveLoad.sureOverwriteSavedRoute"])) {
				// cloud save
				if (getCookie("enrolled") === "yes") {
					saveRouteCloud(routeName,routeUrl); // spin the icon, save on cloud, reset icon
				} 
				localStorage.setItem("gRoute|"+routeName , routeUrl);
				//if (routeNameAndTags.length > 1) // no!  if all tags are removed we need to make sure we clean up gTag|tagName
				saveRouteTags(routeNameAndTags);
			}
		} else {
			// cloud save
			if (getCookie("enrolled") === "yes") saveRouteCloud(routeName,routeUrl); // spin the icon, save on cloud, reset icon
			localStorage.setItem("gRoute|"+routeName , routeUrl);
			if (routeNameAndTags.length > 1 || ($("#gTags").val() !=="all" )) { // saveTags also if a tag is selected
				saveRouteTags(routeNameAndTags);
			}
		}
		
		// Show warning every some days if not enrolled
		if (getCookie("enrolled") != "yes") {
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
	refreshSavedRoutes() ; // actually we shall ignore cloud since we just saved locally but we woudl miss the cloud icon...
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

/* FUNCTION: onDeleteSaved
 * Called by user when deleting a route. 
 * Input: index of localstorage key to remove
 * This removes also route name from tags. 
 * NOTE: DELETION IS VIA LOCALSTORAGE KEY INDEX GENERATED BY refreshSavedRoutes() 
 *  	 NO OTHER METHODS SHOULD REMOVE ITEMS FROM THE LOCAL STORAGE OTHERWISE WRONG STUFF COULD BE DELETED
 */
function onDeleteSaved(i) {
	// "Sure to remove saved route?"
	if (window.confirm(translations["saveLoad.sureDeleteSavedRoute"] )) {
		consoleLog("-1 removing route tags");
		var key = localStorage.key(i);
		var routeName = key.substring(7);

		if (getCookie("enrolled") === "yes") {
			deleteRouteCloud(routeName);
		}

		saveRouteTags([ key.replace("gRoute|","") ]); // remove route's tags if...
		localStorage.removeItem(key); // remove route
		refreshSavedRoutes(false); // do not resync with cloud since we may still be deleting...
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


/* FUNCTION: loadRoute
 * INPUT: mappite url (full url or just location search), initiateMap true or false
 * Load a route from a mappite URL, withotu refreshing the page
 * NOTE: Current active route is lost without any warning
 */
function loadRoute(url) {
	var curMapLayer = document.getElementById("gOptions.mapLayer").value;
	if (activeRoute != null) activeRoute.forceClean();
	
	var names = getParameterByName("names",url).split("|"); // array with viapoints names
	var name = getParameterByName("name",url); // route name
	var sps = trackDecompress(getParameterByName("viapoints",url),5);
	var options = getParameterByName("options",url); 
	setOptionsString(options);
	
	var newMapLayer = document.getElementById("gOptions.mapLayer").value;
	if (newMapLayer !== curMapLayer) {
		// consoleLog("Changing Map Layer");
		onMapLayersChange();
	}
		
	var i=0;
	var firstPoint = "";
	while(i < sps.length/2) {
		var id = "vp_"+i;
		vp = new ViaPoint(sps[i*2].toFixed(6),sps[i*2+1].toFixed(6),names[i+1], "vp_"+ (i)); // note there is an extra | in names so it starts from 1...

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
	viaPointId = i;

	activeRoute.setName(name); // redoundant
	document.getElementById("sRouteName").value = activeRoute.name;
	activeRoute.redrawAndFocus(); // look in cache also
	
}

/* FUNCTION: refreshSavedRoutes()
 * Create list of saved routes in #gSaved div, with links to load/delete, and refresh tags in #gTags select element.
 * NOTE: see note in onDeleteSaved() comment
 */
function refreshSavedRoutes(cloudSync) {
	consoleLog( "in refreshSavedRoutes()"); 	
	
	if (cloudSync == null) cloudSync = true;
	
	// FIXME: refreshSavedRoutesHtml() shoudl be removed from within refreshCloudRoutes()
	// and this IF ELSE  reworked
	if ( cloudSync && getCookie("enrolled") === "yes") {
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
		if (localStorage.key(i).indexOf("gRoute") == 0 ) { // it's a route
			var key = localStorage.key(i);
			routeName = key.substring(7); // gRoute|routeName
			//consoleLog("route name to check: " + key.replace("gRoute|","") );
			// if (ALL Targs or Route name has the Tag) AND (sayt is empty or sayt matche teh route name) add
			if ( (allTags || routeNamesInTag.indexOf(key.replace("gRoute|",""))>-1 )
				&& (sayt == "" || routeName.toLowerCase().indexOf(sayt)>-1 ) ) {
				var val= localStorage.getItem(key); // url
				consoleLog( "route found: " + routeName);//key, localStorage.getItem(key)); 
				// see note in onDeleteSaved() comment
				cloudTag = "";
				if (val.substring(0,2) === "C_") { 
					val = val.substring(2)
					cloudTag = "<img src='./scripts/images/cloud.svg' width='18' height='18'>";
				}

				routeNamesAndHTML.push({name: routeName, html: "<a class='gactions' href='javascript:onDeleteSaved(\""+i+"\")'>&#215;</a>&nbsp;&nbsp;"+
					               "<a class='glinks' href='javascript:loadRoute(\""+escapeHTML(val)+"\")'>"+routeName+"</a>"+cloudTag+"<br/>"});
				
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
