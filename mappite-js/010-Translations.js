/*** Translations ***/


// Defaults
var langCode="en";
infoFile = "./lang/en-info.html"; 
saveFile = "./lang/en-save.html"; 
exportFile = "./lang/en-export.html"; 
enrollFile = "./lang/en-enroll.html"; 
enrollDoneFile = "./lang/en-enroll-done.html"; 
enrollExpiredFile = "./lang/en-enroll-expired.html"; 
enrolledFile = "./lang/en-enrolled.html"; 
clickText = "Click or Tap";
rightClickText = "Right-Click or Long-Tap";
doubleClickText = "Double-Click or Double-Tap";
routeDefaultName = "Route Name";
routeSearchDefaultName = "search"; // route name search as you type

// Apply translations to page ()
// called on document ready in index.html via getJSON method
var translate = function (jsdata) {
	translations = jsdata;
	console.log("*** translations[] is set");
	clickText = isTouchDevice()?translations["info.tapText"]:translations["info.clickText"];
	rightClickText = isTouchDevice()?translations["info.longTapText"]:translations[ "info.rightClickText"]; // "Long-Tap":"Right-Click";
	doubleClickText = isTouchDevice()?translations["info.doubleTapText"]:translations["info.doubleClickText"]; // "Double-Tap":"Double-Click";
	routeDefaultName = translations["route.defaultName"];
	routeSearchDefaultName = translations["route.sayt"];
	if (document.getElementById("sRouteName").value == "Route Name #tag") { // set only if default is found
		document.getElementById("sRouteName").value = routeDefaultName + " #tags";
	}
	if (routeSearchDefaultName != undefined) { // set if browser is reading updated lang file
		document.getElementById("gRouteSAYT").value  = routeSearchDefaultName;
	}
	$("[tkey]").each (function (index){
		var strTr = jsdata [$(this).attr ('tkey')];
	    $(this).html (strTr);
	});
	
	// FIXME: "translate" is not the proper place from a functional standpoint to check if user is enrolled
	//        however this guarantees translations are available before showing if one is enrolled or not
	if (isEnrolled()) {
		updateEnrolledInfo();
		refreshSavedRoutes();
	} else {
		// attempt to restore enrolled cookie from server
		// (ref. iOS https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)
		// this will invoke updateEnrolledInfo() and refreshSavedRoutes() only if it succeeds
		restoreEnrolled() ;
	}
}

function initTranslations() {
	var langs = ['en', 'it']; // supported languages
	langCode = navigator.language.substr (0, 2);
	console.log( "mappite lang " + langCode);
	if ($.inArray(langCode , langs) !== -1) {
		// mversion assure the page is not cached
		$.getJSON('./lang/'+langCode+'.json?ver='+mversion, translate);
		infoFile = "./lang/"+langCode+"-info.html"; 
		saveFile = "./lang/"+langCode+"-save.html"; 
		exportFile = "./lang/"+langCode+"-export.html";
		enrollFile = "./lang/"+langCode+"-enroll.html";
		enrollDoneFile = "./lang/"+langCode+"-enroll-done.html";
		enrollExpiredFile = "./lang/"+langCode+"-enroll-expired.html"; 
		enrolledFile = "./lang/"+langCode+"-enrolled.html";
	} else {
		console.log( "mappite lang DEFAULT");
		$.getJSON('./lang/en.json?ver='+mversion, translate);
	}
}

// return the promise when translations object has been initialized or after a timeout
// used in index.html to load a route from url only after transations are set
function ensureTranslationsAreSet(timeout) {
	var start = Date.now();
	return new Promise(translationAreSet);
	function translationAreSet(resolve, reject) {
		// this double check allows to define translations as an array
		// thus allowing to debug mappite from file:/// protocol
		if ( translations !== null) { //  && typeof translations === "object" ) { 
			//console.log("*** promise maintained!!!");
			resolve();
		} else if ((Date.now() - start) >= timeout) {
			//console.log("*** promise timeout");
			resolve(); // actually it shoudl reject but who cares, we'll proceed wihtout translations
		} else { // reevaluate in 50ms
			//console.log("*** reevaluate promise in 50ms");
			setTimeout(translationAreSet.bind(this, resolve, reject), 50);
		}
	}
}