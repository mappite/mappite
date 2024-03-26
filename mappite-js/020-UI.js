/*** UI functions ***/

// called by index.html body onresize and on document ready events
function onResize() { 
	consoleLog("onResize()");
	// this just resize the track canvas
	var canvasSize = (window.innerWidth>700)?600:window.innerWidth-68; // set max to 600 to leave some space tomove the mouse without hovering the canvas...
	document.getElementById('gCanvas').width  = canvasSize ;	
	var ctx = document.getElementById('mCanvas').getContext("2d");
	ctx.canvas.width  = canvasSize ;
	if (typeof activeTrack != "undefined" ) activeTrack.setActive(true); // redraw
}

// toggle an element display style from block to none and viceversa
function toggleDiv(id) { 
	var display = document.getElementById(id).style.display; // this returns the element display, not the class one
	document.getElementById(id).style.display = ( display === "block")?"none":"block";
}

function showHiddenDiv(id) {
	document.getElementById(id).removeAttribute('style'); // actuall class display style will take over
}
function hideDiv(id) {
	document.getElementById(id).style.display = "none";
}
function switchDivs(id1, id2) {
	hideDiv(id1);
	showHiddenDiv(id2);
}

// FIXME: I can't belive there is not a cleaner way...
// uncheck id if elem is checked
function onCheckUnCheck(elem, id) {
	if (elem.checked) document.getElementById(id).checked = false;
}
// check id if elem is checked
function onCheckCheck(elem, id) {
	if (elem.checked) document.getElementById(id).checked = true;
}
// uncheck id if elem is unchecked
function onUnCheckUnCheck(elem, id) {
	if (!elem.checked) document.getElementById(id).checked = false;
}

// toggle an element witdh
function toggleIconPanelWidth() { 
	var id = "sPanel";
	var w = document.getElementById(id).style.width;
	if (w == "60px") {
		document.getElementById(id).style.width = "30px";
		$( ".leaflet-control-geocoder").css('min-width',30);
	} else { // width 30px or unset
		document.getElementById(id).style.width = "60px";
		$( ".leaflet-control-geocoder").css('min-width',60);
	}
}


// toggle which div to show in gpanel when user clicks on icons
function togglegPanel(id) { 
	var divs = [ "gRoute","gOptions","gExport","gSaveLoad", "gCloud", "gShowInfo"];
	for(var i = 0; i< divs.length;i++) {
		document.getElementById(divs[i]).style.display = (id===divs[i])?"block":"none";
	}
	if (activeRoute != null && id === "gExport") { 
		$( "#gExportNameBox" ).prepend($("#sRouteName"));
		refreshExportPanel(); // show a fresh export link everytime user get to Export gpanel
	} else if  ( id === "gSaveLoad") {
		$( "#gSaveNameBox" ).prepend($("#sRouteName"));
	}
}

// Top Left Panel - welcome and other info
var HeaderCls = L.Class.extend({
    // options: { position: 'topleft'},
    toggle: function() {
	document.getElementById("gHeader").style.display = $( "#gHeader" ).is(":hidden")?"block":"none";
	if (!map.hasLayer(markersCluster)) { // add markers cluster if it was removed (showPoints)
		map.addLayer(markersCluster);
	}
    } ,
    hide:function() {
	    document.getElementById("gHeader").style.display = "none";
    } ,
    show:function() {
	    document.getElementById("gHeader").style.display = "block";
    }
});

// Top Right panel (Leaflet Control for Icons)
var IconCtrl = L.Control.extend({
    options: { position: 'topright'},
    onAdd: function (map) {
	var container = L.DomUtil.get("sPanel");
	/* moved to style 
	    this._container = container;
	    container.style["width"] = "30px";
	    container.style["min-height"] = "26px"; */
	L.DomEvent
            .addListener(container, 'click', L.DomEvent.stopPropagation)
            .addListener(container, 'click', L.DomEvent.preventDefault); 
	return container;
    },
    onZoom: function () { // enable/disable icons
	if (canGetOverpass()) {
		// set red
		$( "#sStar" ).css('color', '#DC614F');
		$(".sIcon").each(function(){$(this).attr("src", "./icons/"+this.id+".svg");});
	} else {
		// re-set gray
		$("#sStar" ).css('color', '#aaaaaa');
		$(".sIcon").each(function(){$(this).attr("src", "./icons/"+this.id+"-gray.svg");});
	}
	    
    }
});


// Show spinner icon when route is being calculated
function processingStart() {
	document.getElementById("gPanelToggle").innerHTML= "<img src='icons/spinner.svg'>";
}
// Re-set "<<" icon when route is done
function processingEnd(){
	document.getElementById("gPanelToggle").innerHTML = (!isgPanelVisible?"&raquo;":"&laquo;");
}
// Show ":(" if route calculation errors out
function processingError() {
	document.getElementById("gPanelToggle").innerHTML = ":(";
	//document.getElementById("gRoute").innerHTML = "Route Calculation Error, <br>try to move a bit the last or previous point...";
}

/* Bottom Left panel, reset "+" link color to red and set as green the one clicked by the user */ 
function addPointHereCss(el) {
	$('.gaddWayPoint').css('color', '#DC614F');
	// $('.gaddWayPoint').css('font-size', '22px');
	el.style.color= 'green';
	el.style.fontSize= '26px';
}

/* when click on a leg info (time/km) toggle among cumulative or per leg info */
function legsInfoToggle() {
	(legsInfo==2?legsInfo=0:legsInfo++)
	consoleLog("llegsInfo: " + legsInfo);
	refreshRouteInfo();
}

/* Triggered when Route Mode changes */
function onRouteModeClick (e){
	var id = e.currentTarget.id;
	if (currentMode === id) return; // user clicked on current selected mode, no changes
	
	if (id == 'gMode.poiEditor') {  // change to Poi Editor mode	
		setPoiMode();
	} else if ( isPoiMode() ) {     // change from Poi Editor mode ro a routing Mode
		exitPoiMode(id);
	} else {                        // change between car/bycicle/foot
		currentMode = id; // this must be before computeRoute
		if ( activeRoute != null && activeRoute.viaPoints.length >1) computeRoute(activeRoute.viaPoints, false); 
	}
	highlighMode();

}

function highlighMode() {
	// remove all highlights
	$(".gMode").attr('style','background-color: rgba(0, 0, 0, 0)');
	// highlight clicked button
	document.getElementById(currentMode).style.backgroundColor ='#398ee7';
}

/* Triggered when Route Options are updated (fastest, shortest, uom etc etc), to recalculate route */
function onRouteOptionsChange (){
	if ( activeRoute!= null && activeRoute.viaPoints.length >1 ) computeRoute(activeRoute.viaPoints, false);
	//scale.removeFrom(map);
	map.removeControl(scale); 
	var isMetricScale = (document.getElementById("gOptions.uom").value==="k"?true:false);
	scale = L.control.scale({ position: 'bottomright', metric: isMetricScale , imperial: !isMetricScale });
	scale.addTo(map);
	getOptionsString(); // re-builds options string and sets the browser cookie
	MODE = 'routing';	
}

/* build options string and set cookie, used when a checkbox/drop down element is changed */
function getOptionsString() {

	var s = document.getElementById("gOptions.uom").value; // k (km) or m (miles)
	if (s === "") s = "k";
	var routeType = "";
	switch( currentMode ) {
		case 'gMode.bicycle':   routeType = 'b'; break; // bike
		case 'gMode.walk':      routeType = 'p'; break; // pedestrian
		case 'gMode.poiEditor': routeType = 'o'; break; // pOi
		default:                routeType = $('input[name="gOptions.type"]:checked').val(); // f,s,x
	}
	if (routeType === "") s = "f"; // car fastest
	
	s = s + routeType +
		(!document.getElementById('gOptions.highways').checked?"h":"x") +
		(!document.getElementById('gOptions.tolls').checked?"t":"x") +
		(!document.getElementById('gOptions.ferries').checked?"f":"x");
	var m = "";
	switch(document.getElementById("gOptions.mapLayer").value) {
	    case "opentopo":   m = "m"; break;
	    case "mapquest":   m = "q"; break;
	    case "mapboxOut":  m = "u"; break;
	    case "mapboxSat":  m = "i"; break;
	    case "mapboxCust": m = "c"; break;
	    case "protomaps.l": m = "l"; break;
	    case "protomaps.d": m = "d"; break;
	    default:  m = "o";// osm
	} 	
	// pad with one more char for future usage
	//s += m+"-";
	s += m+(document.getElementById("gOptions.clickOnRoad").value==="n"?"n":"-"); // click Road/anywhere
	if (!isPoiMode()) { // don't set cookie for POI editor mode
		setCookie("options", s, 1825); // 5 yrs
		consoleLog("Setting Cookie: " + s);
	}
	return s;
}
/* Set checkbox/drop down element according to option string, used when loading a route and when accessing the site from cookie*/
function setOptionsString(s) {
	// [k|m][f|s|p|b|o|x][h|x][t|x][f|x][o|i|u|c|m|t][-|n]   options = kfxxxon
	document.getElementById('gOptions.uom').value = s[0];
	// note s[1] is 'o' for POI
	switch(s[1]) {
		case 'p':	currentMode = 'gMode.walk'; break;
		case 'b':	currentMode = 'gMode.bicycle'; break;
		case 'o':	currentMode = 'gMode.poiEditor'; break;
		default:	currentMode = 'gMode.car';
				document.getElementById('gOptions.fastest').checked  = (s[1]==='f');
				document.getElementById('gOptions.shortest').checked = (s[1]==='s');
				document.getElementById('gOptions.offroad').checked  = (s[1]==='x');
		
	}
	
	document.getElementById(currentMode).style.backgroundColor ='#398ee7';
	
	document.getElementById('gOptions.highways').checked = !(s[2]==="h");
	document.getElementById('gOptions.tolls').checked = !(s[3]==="t");
	document.getElementById('gOptions.ferries').checked = !(s[4]==="f");
	var mv = "";
	switch(s[5]) {
	    case "o": mv  = "osm"; break;
	    //case "q": mv  = "mapquest"; break; // discontinued from July 11, 2016, fallback on OSM
	    case "i": mv  = "mapboxSat"; break;
	    case "u": mv  = "mapboxOut"; break;
	    case "c": mv  = "mapboxCust"; break;
	    case "m": mv  = "opentopo"; break;
	    //case "s": mv  = "mapsurfer"; break; // discontinued May 2020, fallback on OSM
	    //case "s": mv  = "wikimedia"; break; // takes s from mapsurfer
	    //case "t": mv  = "stamen.terrain"; break; // discontinued Jan 2024, fallback on OSM
	    case "l": mv  = "protomaps.l"; break;
	    case "d": mv  = "protomaps.d"; break;
	    default: mv  = "osm"; // default to osm
	} 	
	document.getElementById("gOptions.mapLayer").value = mv;
	document.getElementById("gOptions.clickOnRoad").value = (s[6]==="n"?"n":"y");
}

/* Used to autoselect text field on click,  see index.html */
function onTextFieldClickSelect() {
	this.select();
}

/** Toast **/

function showToast(msg,autoDismiss,type) { // type: success, warning, etc see css
  console.log("showToast");
  var close = autoDismiss ? '' : '&times;'; // show "x" or not
  var toast = $('<div class="toast ' + type + '"><p>' + msg + '</p>' +
	        '<div class="close bigfont gray" onClick="$(this).parent().remove()">' + close + '</div>' +
	        '</div>');
  $('#toasts').append(toast);
  toast.addClass('show');
  
  if(autoDismiss){
      setTimeout(function(){
        toast.find('.close').click();
      }, 3000); // timout 3 secs
  }
}