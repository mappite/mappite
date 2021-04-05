/*** Track, TrackCanvas object and Tracks management functions ***/

/**  
 * CLASS: Track
 **/
var Track = L.Class.extend({
    initialize: function (name, lls) { // a viapoint and a name
	this.name = name;
	this.lls = lls;
	this.trackPoly = L.polyline(lls, {color: 'blue', opacity: 0.6, interactive: true});
	this.trackPoly.mpActive = false;
	this.ele = [];
	this.dist = [];
	this.maxEle = 0;
	this.minEle = 0; // defaulted to 50000 mt during import if no elevation info in track
	// events
	this.trackPoly.on('mouseover',function(e) { 
		e.target.setStyle({color: 'red', opacity: 0.8});
	});
	this.trackPoly.on('mouseout',function(e) { 
		if (e.target.mpActive)  {  
			e.target.setStyle({color: 'red', opacity: 0.6});
		} else { 
			e.target.setStyle({color: 'blue', opacity: 0.4});
		}
	});
	// 
	// this.trackPoly.on('contextmenu',function(e) { map.removeLayer(e.target);}); 

    },
    
    setActive: function(b) {
	if (b) {
		this.trackPoly.mpActive = true;
		this.trackPoly.setStyle({color: 'red', opacity: 0.6});
		this.trackPoly.toggleTooltip();
		map.fitBounds(this.trackPoly.getBounds()); 	
		if (typeof activeTrack != 'undefined' && activeTrack.name !== this.name) { // deactivate previous active, except if itself...
			activeTrack.setActive(false); 
			activeTrack.trackPoly.closeTooltip(); // close tolltips to avoid overlaps
		} else {
			toggleDiv("gCanvas"); // show/hide canvas if click is on itself
		}
		activeTrack = this; // set this one as active
		if (typeof trackCanvas == 'undefined')  { trackCanvas = new TrackCanvas(); }// trackCanvas not initialized yet
		trackCanvas.setTrack(this); // set this track in canvas and draw it	
		
	} else {
		this.trackPoly.mpActive = false;
		this.trackPoly.setStyle({color: 'blue', opacity: 0.4});
	}
    },
    
    remove: function() {
	map.removeLayer(this.trackPoly);  
	if (activeTrack.name === this.name) {
		consoleLog("active track removed, so... hiding canvas: style.display=" + document.getElementById("gCanvas").style.display);
		document.getElementById("gCanvas").style.display = "none";
	}    
    },

    setName: function(name) {
	this.name = name;    
    },
    setEle: function(ele) {
	this.ele = ele;    
    },
    setDist: function(dist) {
	this.dist = dist;    
    },
    setMaxEle: function(el) {
	this.maxEle = el;    
    },
    setMinEle: function(el) {
	this.minEle = el;    
    },

    draw: function () { // draw the track on map and altitude canvas
	distance = this.dist[this.dist.length-1]; // total distance in km
	trkPopupText = this.name;
	    
	trkPopupText = "<b>"+trkPopupText + "</b><br/> "+ translations["track.totLength"]+": "+ formatUom(distance, 2, "km"); /// PENDING UOM   
	if (this.maxEle >0) {trkPopupText = trkPopupText + "<br/> "+ translations["track.maxEle"]+": " + formatUom(this.maxEle, 0, "mt")} /// PENDING UOM distance
	// show
	this.trackPoly.addTo(map);
	this.trackPoly.bindTooltip(trkPopupText); //, {sticky: true});
	// activate
	this.setActive(true); // enable (i.e. color, center, tooltip in map and draw altitude in canvas)

	//this.trackPoly.bindPopup(trkPopupText).addTo(map);
	//this.trackPoly.openPopup(); //lls[0]);
	
	// removing click event: it's difficult to catch teh line an dprevent to draw a route on it
	/*var trk = this; // Note: it mustbe declared as var otherwise...
	this.trackPoly.on('click',  function(e) {	// note "this" is not the track
		// draw this one in canvas:
		consoleLog("track on click, setting trk.name: " + trk.name );
		trk.setActive(true);

		/*
		// get closest point index in poly
		minDist = 1000; 
		idx = -1; // it will contain the lls point index closer to e.latLng 
		for ( var i = 0; i < trk.lls.length; i++ ) {
			d = e.latlng.distanceTo(trk.lls[i]);
			if (d<minDist) { minDist = d; idx=i; }
		}
		consoleLog("elevation: " + trk.ele[idx] );
		consoleLog("distance: " + trk.dist[idx] );
		trackCanvas.drawMarker(trk.dist[idx]*400/trk.dist[trk.dist.length-1]); // 400 should be dynamic!!
		*/
		/*
		if (typeof trackCircleMarker !== 'undefined')  { map.removeLayer(trackCircleMarker);}
		trackCircleMarker = L.circleMarker(trk.lls[idx]);
		trackCircleMarker.bindPopup("Ele: " +Math.round(trk.ele[idx])+ "mt<br/>Dist: "+trk.dist[idx].toFixed(2) + "km<br/>").addTo(map);
		trackCircleMarker.openPopup();
			
	} );	*/	

   }
});

/* FUNCTION: refreshLoadedTracks()
 * Refresh list of loaded tracks in in #gTracks div, 
 */
function refreshLoadedTracks() {
	consoleLog( "in refreshLoadedTracks()"); 	

	var trackListHtml = "";
	for (i=0;i<tracksList.length; i++){ 
		if (typeof tracksList[i] !== "undefined") trackListHtml = trackListHtml + "<a class='gactions' href='javascript:onDeleteTrack(\""+i+"\")'>&#215;</a>&nbsp;&nbsp;<a class='glinks' href='javascript:tracksList["+i+"].setActive(true)'>"+tracksList[i].name+"</a><br>";
	}
	document.getElementById("gTracks").innerHTML = "<span style='float: right;'>"+translations["saveLoad.tracks"]+"</span>" + trackListHtml; 
	// hide canvas if no available tracks
	if (tracksList.length == 0) {
		consoleLog( "No tracks, hiding canvas"); 	
		document.getElementById("gCanvas").style.display = "none"; //( trackListHtml === "")?"none":"block";
	}
}

/* FUNCTION: onDeleteTrack()
 * Remove Track from list and refresh list
 */
function onDeleteTrack(idx) {
	consoleLog("Removing track");
	//map.removeLayer(tracksList[idx].trackPoly); // note track object is not removed actually...   
	//toggleDiv("gCanvas"); // note canvas is not removed either... thsi does not work. and actually shoudl remove only if this is the active track,
	// this remove sucks
	tracksList[idx].remove(); // hide trackpoly, close canvas if current or last
	tracksList[idx] = null; // free memory hopefully
	delete tracksList[idx]; // = null;
	refreshLoadedTracks();
}
	
/* FUNCTIONS to save a track in localStorage - NOT USED
 */
function saveTrack(trackName, polyline) { // unused // Ele is lost
	// convert polyline to an array of  points, even are lats, odd are lng
	pa = [];	
	var lls=  polyline.getLatLngs();
	j=0;
	for (i = 0; i < lls.length; i++) {
		pa[j++] = lls[i].lat.toFixed(6);
		pa[j++] = lls[i].lng.toFixed(6);			
	}

	trackCompress(pa, 6); // note  point array is an [] of single points, even are lats, odd are lng
	localStorage.setItem("gTrack|"+trackName);
}

/* FUNCTIONS to load  a track to localStorage - NOT USED
 */
function loadTrack(trackName) { // unused
	cp = localStorage.getItem("gTrack|"+trackName);
	pa = trackDecompress(cp,6);
	
	// Create a new polyline // maybe better a function to call in import GPX track as well
	var lls = new Array();
	j = 0;
	for (i = 0; i < pa.length; i++) {
		lls[j++]=[pa[i++],pa[i]];
	}
	trackPoly = L.polyline(lls, {color: 'blue', opacity: 0.8}).addTo(map);		
	map.fitBounds(trackPoly.getBounds()); 	
}

/*  Encode/Decode lats (Google way as used by OSRM, Mapbox, Mapzen) - adapted from Mapbox*/

/* FUNCTION: trackDecompress
 * decompress the encoded string with track returned by computeRoute
 */
function trackDecompress (encoded, precision) {
   precision = Math.pow(10, -precision);
   var len = encoded.length, index=0, lat=0, lng = 0, array = [];
   while (index < len) {
      var b, shift = 0, result = 0;
      do {
         b = encoded.charCodeAt(index++) - 63;
         result |= (b & 0x1f) << shift;
         shift += 5;
      } while (b >= 0x20);
      var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      shift = 0;
      result = 0;
      do {
         b = encoded.charCodeAt(index++) - 63;
         result |= (b & 0x1f) << shift;
         shift += 5;
      } while (b >= 0x20);
      var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      array.push(lat * precision);
      array.push(lng * precision);
   }
   return array;
}

/* FUNCTION: trackCompress
 * compress list of points, used to compress also the list of route viapoints
 */
function trackCompress(points, precision) {
   var oldLat = 0, oldLng = 0, len = points.length, index = 0;
   var encoded = '';
   precision = Math.pow(10, precision);
   while (index < len) {
      //  Round to N decimal places
      var lat = Math.round(points[index++] * precision);
      var lng = Math.round(points[index++] * precision);

      //  Encode the differences between the points
      encoded += encodeNumber(lat - oldLat);
      encoded += encodeNumber(lng - oldLng);
      
      oldLat = lat;
      oldLng = lng;
   }
   return encoded;
}

function encodeNumber(num) {
   var num = num << 1;
   if (num < 0) {
      num = ~(num);
   }
   var encoded = '';
   while (num >= 0x20) {
      encoded += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
      num >>= 5;
   }
   encoded += String.fromCharCode(num + 63);
   return encoded;   
}


/**  
 * CLASS: TracksCanvas,
 * Purpose: display track altitude on mCanvas element. On mouseover show a marker on track with altitude&distance
 **/
var TrackCanvas = L.Class.extend({
    initialize: function () { 
	//toggleDiv("gCanvas"); // show div
	canvas = document.getElementById('mCanvas');
	this.ctx = canvas.getContext("2d");
	this.ctx.font = "12px Arial";
	
	canvas.addEventListener("contextmenu",  function (e) {
		toggleDiv("gCanvas");
		// popup menu: taglia fin qui / taglia da qui
	});
	    
	canvas.addEventListener("mousemove",  function (e) {
		//e.preventDefault();
		// redraw altitude line (background)
		trackCanvas.draw();
		// draw straight line on mouse position
		trackCanvas.drawMarker(e.offsetX);
		// draw circle on map polyline 
		//   get distance from mouse pisition offset
		var trk = trackCanvas.track;
		var d = e.offsetX * trk.dist[trk.dist.length-1] / W;
		
		// lookup on track line
		/*for ( var idx = 0; idx < trk.dist.length; idx++ ) { // linear search should be replaced by binary O(ln) solution
			if (d<trk.dist[idx]) { break; }
		}*/
		// binary search on sorted array
		var lo = 0, idx = trk.dist.length - 1, m; // low , hi and mid
		while (lo < idx) {m = Math.round(lo+(idx -lo)/2);(d<trk.dist[m])?(idx=m-1):(lo=m+1);}
		
		//consoleLog("idx:"+ idx);
		// draw cirle at idxs-th point in trackPoly
		if (typeof trackCircleMarker !== 'undefined')  { map.removeLayer(trackCircleMarker);}
		trackCircleMarker = L.circleMarker(trk.lls[idx]);
		
		// var popupText = ((trk.minEle != 50000)?(translations["track.ele"]+": " +Math.round(trk.ele[idx])+ "mt<br/>"):("")) + translations["track.distance"]+": "+trk.dist[idx].toFixed(2) + "km<br/>"; /// PENDING UOM
		var popupText = ((trk.minEle != 50000)?(translations["track.ele"]+": " +formatUom(trk.ele[idx],0, "mt")+ "<br/>"):("")) + translations["track.distance"]+": "+ formatUom(trk.dist[idx],2, "km") + "<br/>"; /// PENDING UOM
		consoleLog(popupText);
		trackCircleMarker.bindPopup(popupText).addTo(map);
		//trackCircleMarker.openPopup();
	});
   },
    
    setTrack: function(trk) {
	document.getElementById("gCanvas").style.display = "block";
	this.track = trk;    
	consoleLog("setTrack in Canvas: " + trk.name);
	this.draw();
    },
    
    drawMarker: function (offsetX) { /* draw straight line on altitude canvas */
	this.draw(); // re-draw background
	this.ctx.beginPath();
	this.ctx.moveTo( offsetX, canvas.height);
	this.ctx.lineTo( offsetX, 0);
	this.ctx.strokeStyle = "#000000";
	this.ctx.stroke();   
    },

    draw: function () { // draw the track in canvas
	dist = this.track.dist;
	ele  = this.track.ele;
	M = this.track.maxEle;
	m = this.track.minEle; // defaulted to 50000 mt during import if no elevation info in track
	ctx = this.ctx
	    
	ctx.beginPath()
	W = ctx.canvas.width;
	H = ctx.canvas.height;
	ctx.clearRect(0, 0, W, H);
	ctx.moveTo(0, H-(ele[0]-m)*H/(M-m)); // 0, h
	maxDist = dist[dist.length-1];
	oldX = -1; // track x in canvas
	for(i=1; i<dist.length ;i++) {
		// ctx.lineTo(dist[i]*W/maxDist, H-(ele[i-1]+ele[i]+ele[i+1]-m*3)/3*H/(M-m)); // avg over prev and next point to smooth peaks
		// ctx.lineTo(dist[i]*W/maxDist, H-(ele[i]-m)*H/(M-m)); 
		// the aboves creates spikes at the very same distance dist[i]*W/maxDist, let's avoid to draw vertical lines:
		newX = Math.round(dist[i]*W/maxDist);
		if (oldX != newX) {
			ctx.lineTo(newX, H-(ele[i-1]+ele[i]+ele[i+1]-m*3)/3*H/(M-m)); // avg over prev and next point to smooth peaks
			oldX = newX;
		}
	}
	if (m == 50000) { ctx.setLineDash([5, 2]); // dash line for tracks with no elevation
	} else { ctx.setLineDash([]); }
	
	ctx.strokeStyle = "rgba(255,0,0,0.6)"; // "#DC614F"
	ctx.lineWidth = 2;
	ctx.stroke();

	// add 3 labels for dist at maxDist/4
	var ds = maxDist/4;
	var decimals = 0;
	if (ds <3) decimals = 2; // if track is less than 3km
	ctx.fillText("'"+formatUom(ds,decimals, "km"),ds*W/maxDist,H);
	ctx.fillText("'"+formatUom(ds*2,decimals, "km"),ds*2*W/maxDist,H);
	ctx.fillText("'"+formatUom(ds*3,decimals, "km"),ds*3*W/maxDist,H);	
	// add 2 labels for height (m and M)
	if (m != 50000) { 
		ctx.fillText("."+formatUom(m,0, "mt"),0,H); 
		ctx.fillText("'"+formatUom(M,0, "mt"),0,0+12); // +12 is font size
	} else {
		ctx.fillText(translations["track.noEle"],0,0+12); 
	}
	    
    }

});
