/*** Helpers functions ***/

function consoleLog(str) {
	if (LOG_ENABLED) console.log(str);
}

/* detect if touch device */
function isTouchDevice(){
    return typeof window.ontouchstart !== 'undefined';
}

/* detect if mobile device */
function isMobile() {
    return navigator.userAgent.match(/Android|iPhone|Opera Mini|IEMobile/i); // |iPad|iPod
}

/* detect if IE is in use, GPX export does not work */
function isIE() {
  userAgent =  navigator.userAgent;
  return userAgent.indexOf("MSIE ") > -1 || userAgent.indexOf("Trident/") > -1 || userAgent.indexOf("Edge/") > -1;
}

/* get cookie */
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';'); // FIXME: we ignore path
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return null;
} 

function setCookie(cname, cvalue, expireDays) {
    var d = new Date();
    d.setTime(d.getTime() + (expireDays*24*60*60*1000));
    var expires = "expires="+d.toUTCString(); // expires in UTC Time
    //console.log("Settgin cookie expire: " + expires);
    document.cookie = cname + "=" + cvalue + "; " + expires;
}


function formatTime(t){ // format time in sec to "xd hh:mi:ss" where xd is optional and x is number of days
    var d = Math.floor(t/86400),
        h = ('0'+Math.floor(t/3600) % 24).slice(-2),
        m = ('0'+Math.floor(t/60)%60).slice(-2),
        s = ('0' + t % 60).slice(-2);
    return (d>0?d+'d ':'')+(h>0?h+':':'00:')+(m>0?m+':':'00:')+(t>60?s:s+'s');
}

function escapeHTML(s) { // slash is escaped to avoud \\u to be interpreted as an unicode char in js
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;').replace(/>/g,'&gt;').replace(/'/g,'&#39;').replace(/\\/g,'\\\\');
}

/*
 * Format, convert, and rounds to precision digits
 * Input: value number, precision int, uom can be "km" or "mt"
 * Returnd: NNNuom,  convert NNN from km/mt to mi/ft  if imperial UOM is selected
 */
function formatUom(value, precision, uom) {
	if (document.getElementById("gOptions.uom").value!=="k") { // imperial
		convertFactorMi = 0.621371; // km to mi
		convertFactorFt = 3.28084; // mt to ft
		value = value * (( uom === "km" )? convertFactorMi: convertFactorFt); 
		uom = ( uom === "km" )? "mi" : "ft";
	}
	return ((precision === 0 ) ? Math.round(value) : value.toFixed(2)) + uom
}

/* FUNCTION: warnIfNoName
 * used by shortenUrl() and whatsAppShare() to warn route has no name
 */
function warnIfNoName() {
 if (activeRoute.name != routeDefaultName) {
	return true;
 } else {
	return window.confirm(translations["route.noName"]);
 }
}


/* FUNCTION getDistance()
 *  Calculate distance among two points considering elevation 
 *   Used when loading gpx tracks to calculate track lenght
 *   Used by ComputeRoute methods to find track closest point to viapoint
 */
function getDistance(coords1, coords2, ele1, ele2) { // in meters 
  // haversine distance - credits https://stackoverflow.com/questions/14560999/using-the-haversine-formula-in-javascript
  function toRad(x) {
    return x * Math.PI / 180;
  }

  var lat1 = coords1[0];
  var lon1 = coords1[1];

  var lat2 = coords2[0];
  var lon2 = coords2[1];

  var R = 6371; //km

  var x1 = lat2 - lat1;
  var dLat = toRad(x1);
  var x2 = lon2 - lon1;
  var dLon = toRad(x2)
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;

  //if(isMiles) d /= 1.60934;
  
  h = Math.abs(ele1- ele2)/1000; // in km

  return Math.sqrt(d*d+h*h);
}

/* FUNCTION: getSegments
 * Input: ll[], distance in current uom
 * returns an array containing the ll indexes at given distance
 */
/*function getSegments (lls, d) { // lls = activeRoute.routePoly.getLatLngs();
	var idx[]; 		
	var dist[0] = 0;
	var segment = 0;
	for(var i = 1; i<lls.length;i++) {
		dist[i] =  dist[i-1]+getDistance([lls[i].lat,lls[i].lng], [lls[i-1].lat,lls[i-1].lng], 0,0);
		if (dist[i]>=d) { // we reached the first point after d
			idx[segment++]=i;
			// add dot
			d = d*(segment+1);
		}
	}
	return idx;
} 
see createRoutePoly and update to add a dot at each idx or include this there. update
any map.removeLayer(activeRoute.routePoly); to remove the dots
*/


/* FUNCTION: getParameterByName
 * Input: parameter_name, (url)
 * get the parametere value from an url or location.search is url is not provided
 */
function getParameterByName(name, src) {
    if (  typeof src == 'undefined' ) {
	src = location.search;
    } else {
	src = src.substr(src.indexOf("?") ); // ? must be included to regex below to work
    }
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(src);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}




