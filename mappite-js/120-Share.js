/*** Social - url shortener, Whatsapp share, Google map share, facebook link, forum links etc ***/


function shortenUrl() {
	if (warnIfNoName()) {
		consoleLog("in shortenUrl"); 
		//var secure = (location.protocol == 'https:'?"secure=true&":"");
		//consoleLog("secure:" + secure);
		//var url = "./shortenUrl.php?"+secure+"url="+encodeURIComponent(activeRoute.getUrl().replace("?", "r.php?"));
		var url = "./su.php?url="+encodeURIComponent(activeRoute.getUrl().replace("?", "r.php?"));
		consoleLog("url:" + url);
		// http://www.mappite.org/alpha/su.php?s=4
		$.get(url, function(response) {
			//var shorturl = location.protocol+"//"+location.hostname + location.pathname+ response;
			var shorturl = location.protocol+"//mappite.org" + location.pathname+ response;
			consoleLog("shorturl:" + shorturl);
			$("#gShowInfo").html("<br><a href='"+shorturl+"' class='gaction'>"+shorturl+"</a><br><br><input type='text' size='22' value='"+shorturl+"' readonly>");
			togglegPanel("gShowInfo");
		}, "html").error(function(jqxhr, textStatus, error) {consoleLog("in shortenUrl: error" + error);});
	}
}

function whatsAppShare() {
	if (warnIfNoName()) {
		if ( isMobile() ) { // this will not work if wa is not installed...
			var url = "./su.php?url="+encodeURIComponent(activeRoute.getUrl().replace("?", "r.php?"));
			$.get(url, function(response) {
				var shorturl = location.protocol+"//mappite.org" + location.pathname+ response;
				var a = window.document.createElement('a');
				a.href = 'whatsapp://send?text='+shorturl+' '+activeRoute.name;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
			}, "html").error(function(jqxhr, textStatus, error) {consoleLog("in shortenUrl: error" + error);});
		} else {
			var url = "./su.php?url="+encodeURIComponent(activeRoute.getUrl().replace("?", "r.php?"));
			$.get(url, function(response) {
				var shorturl = location.protocol+"//mappite.org" + location.pathname+ response;
				var a = window.document.createElement('a');
				a.href = 'https://web.whatsapp.com/send?text='+shorturl+' '+activeRoute.name;
				a.target= '_blank';
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
			}, "html").error(function(jqxhr, textStatus, error) {consoleLog("in shortenUrl: error" + error);});
			// alert(translations["export.noWhatsApp"] ); 
		}
	}	
}

function googleMapsShare() {
	if (activeRoute == null) {
		alert(translations["route.noRoute"]);
		return;
	}
	/*
	Modal
	if route has breaks
		show radios 
			() all
			() first break
			() ... break
			() last break
			() last point
	googleMapsShare(breakId)
		if breakId = 0 as today
		else i = breakId (che sarà il precedente/primo punto) e nel ciclo sotto cì un breack quando vp.isStop||vp.isBreak
	*/
	
	var length = activeRoute.viaPoints.length;
	if (length >9) {
		alert(translations["export.gmapMaxPoints"]);
	}
	var vp = activeRoute.viaPoints[0];
	var gUrl =  "http://maps.google.com/maps?";
	
	gUrl =  gUrl + "daddr=" + vp.lat + "," + vp.lng;
	for (var i = 1; i < length; i++) {
		vp = activeRoute.viaPoints[i];
		gUrl =  gUrl + "+to:" + vp.lat + "," + vp.lng;
	}

	// highways/tools/ferries
	gUrl =  gUrl + "&dirflg=d";
	if (!document.getElementById('gOptions.highways').checked ) gUrl =  gUrl + ",h";
	if (!document.getElementById('gOptions.tolls').checked ) gUrl =  gUrl + ",t";
	if (!document.getElementById('gOptions.ferries').checked ) gUrl =  gUrl + ",f";
	consoleLog("Google Maps Url: " + gUrl);
	var a = window.document.createElement('a');
	a.href = gUrl;
	a.target= '_blank';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);

}

function showPoints() { // check https://github.com/niklasvh/html2canvas
	if (activeRoute == null) {
		alert(translations["route.noRoute"]);
		return;
	}
	var uom = (document.getElementById("gOptions.uom").value==="k"?"km":"mi");
	var length = activeRoute.viaPoints.length;
	
	// get font size based on height
	var fontSize = 14;
	var h = $(window).height();
	if ( fontSize*length*2.6 > (h-45)) { // reeduce fontSize
		fontSize = (h-45)/(length*2.6);
	}

	var routePointsStr = '<img src="./mappiteLabel.png" width="100px"><div style="font: '+fontSize.toFixed(2)+'px Roboto,sans-serif;;"><br>'; // 50px = header / length*2 = number of lines
		
	
	if (activeRoute.name != routeDefaultName) routePointsStr = routePointsStr + "<b>"+activeRoute.name+"</b>";
	var uom = (document.getElementById("gOptions.uom").value==="k"?"km":"mi");
	routePointsStr = routePointsStr + " (" + Number(activeRoute.routeDistance).toFixed(2)+ uom + ")";
	
	for (var i = 0; i < length; i++) {
		var vp = activeRoute.viaPoints[i];
		var leg = activeRoute.legs[i];
		routePointsStr =  routePointsStr + "<br>" + (i+1)+". <span style='color: #1B76C8;'>" +escapeHTML(vp.name)+"</span><br>";
		if (length>1 && leg != null && i< length-1)  {
			routePointsStr = routePointsStr + "<span style='color: #838383;'>&nbsp;&nbsp; "+Number(leg.distance).toFixed(2)+ uom + " ("+ formatTime(leg.time) + ") </span>"	
		}
	}
	$( "#gHeaderContent" ).html(routePointsStr);
	$( "#gPanelToggle" ).click(); // close panel
	// document.getElementById("gHeaderHandler").style.display = "inline"; // show handle for drag
	document.getElementById("gCanvas").style.display = "none";
	headerCls.show();
	map.removeLayer(markersCluster);
	alertOnce("export.showPoints");
	
}

// refresh gPanel links (url, forum, facebookb etc) to point to current route
function refreshExportPanel() { 
	if (typeof activeRoute != "undefined") {
		consoleLog("in refreshExportPanel");
		var shortUrl = activeRoute.getUrl();
		var fullShortUrl = window.location.protocol+"//"+window.location.hostname+shortUrl;
		var uom = (document.getElementById("gOptions.uom").value==="k"?"km":"mi");
		// FIXME: "description" is not used, since "distance" is in URL, r.php just uses that
		var fullShortUrlFB = fullShortUrl.replace("/?", "/r.php?description="+Number(activeRoute.routeDistance).toFixed(2)+ uom+"&");
		var name = activeRoute.name;
		//Forum
		document.getElementById("gShareLinkForum1").value = "[url=\""+fullShortUrl+"\"]"+activeRoute.name+"[/url]";	
		document.getElementById("gShareLinkForum2").value = "[url]"+fullShortUrl+"[/url]";	
		// Html link
		document.getElementById("gShareLinkHref").href = shortUrl;
		// facebook
		$('meta[property="og:title"]').attr('content', name+" ("+Number(activeRoute.routeDistance).toFixed(2)+ uom+")"); 
		
		consoleLog("metaproperty og:title " + $('meta[property="og:title"]').attr("content"));
		//$('meta[property="og:site_name"]').attr('content', 'mappite - NEW  ogsite_name');
		if (typeof FB != "undefined") {
			consoleLog("FB url: " + fullShortUrlFB);
			document.getElementById("gFaceRouteDiv").innerHTML= '<fb:share-button  href="'+fullShortUrlFB +'" layout="button">Facebook</fb:share-button>';
			FB.XFBML.parse(); //document.getElementById("gFaceRouteDiv"));
		} else {
			consoleLog("Facebook FB object is not defined");
		}
	}
}
