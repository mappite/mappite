/*** Translations ***/

var translations; 
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
	// Enrolled: update call to action and display change pwd input
	if (getCookie("enrolled") === "yes") {
		// update enroll button in header
		document.getElementById("gHeaderEnroll").innerHTML=  "<span style='color: #1B76C8'>" + translations["cloud.enrolled"] +"<span>";
		// update text in cloud tab gEnroll pane (wipe everything)
		document.getElementById("gEnroll").innerHTML=  translations["cloud.enrolled"];
		// update JgEnrollButton label in cloud tab to show unenroll
		document.getElementById("JgEnrollButton").innerHTML=  translations["cloud.unenroll"];
		// set file to load on header when one clicks on .clsEnroll
		enrollFile = enrolledFile;
	}
}


