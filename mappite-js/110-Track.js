/*** Track, TrackCanvas object and Tracks management functions ***/

/**  
 * CLASS: Track
 * 
 **/
var Track = L.Class.extend({
    initialize: function (name, lls) { // a viapoint and a name
	this.name = name;
	this.lls = lls;
	this.ele = [];
	this.dist = [];
	this.time = []; // secs from [0]
	this.maxEle = 0;
	this.minEle = 50000; // defaulted to 50000 mt if no elevation info
	this.activeRoute = (name == "::activeRoute")?true:false ; // state if this track is teh active route (green line) or a real track that has been loaded
	
	if (this.activeRoute ) {
		createActiveRouteTrack(lls);
	} else {
		// Create selected (imported) Track 
		this.trackPoly = L.polyline(lls, {color: 'blue', opacity: 0.6, interactive: true});
		this.trackPoly.mpActive = false;

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
		
		// add listener to add route point, this is to facilitate tracing a route over a track
		this.trackPoly.on("click",  function (e) {
			L.DomEvent.stopPropagation(e); // avoid the click to create another point
			// find the point of the track closer to e and add it to current route
			addRoutePoint(getClosestLatLng(this.getLatLngs(), e.latlng));	
		});
	}

    },
    setActive: function(b) {
	if (b) {
		if (!this.activeRoute) {
			this.trackPoly.mpActive = true;
			this.trackPoly.setStyle({color: 'red', opacity: 0.6});
			this.trackPoly.toggleTooltip();
			map.fitBounds(this.trackPoly.getBounds()); 	
			if (typeof activeTrack != 'undefined' && activeTrack.name !== this.name) { // deactivate previous active, except if itself...
				activeTrack.setActive(false); 
				// FIXME fails for route activeTrack.trackPoly.closeTooltip(); // close tolltips to avoid overlaps
			} else {
				toggleDiv("gCanvas"); // show/hide canvas if click is on itself
			}
		}
		activeTrack = this; // set this one as active
		if (typeof trackCanvas == 'undefined')  { trackCanvas = new TrackCanvas(); }// trackCanvas not initialized yet
		trackCanvas.setTrack(this); // set this track in canvas and draw it	
		
	} else {
		if (!this.activeRoute ) {
			this.trackPoly.mpActive = false;
			this.trackPoly.setStyle({color: 'blue', opacity: 0.4});
		}
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
    setTime: function(time) {
	this.time = time;    
    },    
    setMaxEle: function(el) {
	this.maxEle = el;    
    },
    setMinEle: function(el) {
	this.minEle = el;    
    },

    draw: function () { // draw the track on map and altitude canvas
	if ( !this.activeRoute ) {
		var distance = this.dist[this.dist.length-1]; // total distance in km
		var duration = this.time[this.time.length-1]; // duration in secs
		trkPopupText = this.name;
		    
		trkPopupText = "<b>"+trkPopupText + "</b><br/> "+ translations["track.totLength"]+": "+ formatUom(distance, 2, "km");
		if (this.maxEle >0) {trkPopupText = trkPopupText + "<br/> "+ translations["track.maxEle"]+": " + formatUom(this.maxEle, 0, "mt")} 
		if (duration >0) {trkPopupText = trkPopupText + "<br/> "+ translations["track.duration"]+": " + formatTime(duration)} 
		// show
		this.trackPoly.addTo(map);
		this.trackPoly.bindTooltip(trkPopupText); //, {sticky: true});
	}
	// activate
	this.setActive(true); // enable (i.e. color, center, tooltip in map and draw altitude in canvas	

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

/* FUNCTION: trackEleDecompress
 * decompress the encoded string with track&elevation returned by computeRoute
 */
function trackEleDecompress (encoded, precision) {
   precision = Math.pow(10, -precision);
   var len = encoded.length, index=0, lat=0, lng = 0, ele = 0, array = [];
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
      // ele
      shift = 0;
      result = 0;
      do {
         b = encoded.charCodeAt(index++) - 63;
         result |= (b & 0x1f) << shift;
         shift += 5;
      } while (b >= 0x20);
      var dele = ((result & 1) ? ~(result >> 1) : (result >> 1));
      ele += dele;
      array.push(lat * precision);
      array.push(lng * precision);
      array.push(ele);
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
	canvas = document.getElementById('mCanvas');
	this.ctx = canvas.getContext("2d");
	this.fontSize = 14;
	this.offsetX = 0;
	this.offsetIdx = 0;
	//this.ctx.fillStyle = "#838383";
	//this.ctx.font = 'bold ' + this.fontSize+ 'px "Open Sans"';
	
	canvas.addEventListener("contextmenu",  function (e) { // hide canvas on right click
		if (typeof trackCircleMarker !== 'undefined')  { map.removeLayer(trackCircleMarker);}
		hideDiv("gCanvas");
		e.preventDefault(); // prevent browser context menu
		// TODO: popup menu: cut from/to
	});
	    
	canvas.addEventListener("mousemove",  function (e) {
		//e.preventDefault();
		// redraw altitude line (background)
		trackCanvas.draw();
		// draw straight line on mouse position
		trackCanvas.drawMarker(e.offsetX);
		// draw straight line if offset was set (i.e. click on canvas)
		if (trackCanvas.offsetX != 0) {
			trackCanvas.drawMarker(trackCanvas.offsetX);
			trackCanvas.drawHLine(trackCanvas.offsetX, e.offsetX);
		}
		
		ctx = trackCanvas.ctx;
		var trk = trackCanvas.track;
		var trackLength = trk.dist[trk.dist.length-1];
		
		/* draw circle on map polyline
		 */
		var idx = trackCanvas.getPointIndex(e.offsetX);
		
		// draw cirle at idxs-th point in trackPoly
		if (typeof trackCircleMarker !== 'undefined')  { map.removeLayer(trackCircleMarker);}
		trackCircleMarker = L.circleMarker(trk.lls[idx]).addTo(map);
		//trackCircleMarker.bindPopup(text).addTo(map);
		
		// if trackCanvas.offsetX != 0 there is an offset to consider trackCanvas.offsetIdx
		var distance = trk.dist[idx];
		var time     = trk.time[idx];
		
		if (trackCanvas.offsetX != 0) { // calcualte distance and time from the offset
			distance = Math.abs(distance-trk.dist[trackCanvas.offsetIdx]);
			time     = Math.abs(time-trk.time[trackCanvas.offsetIdx]);
			
		}
		// add altitude/distance of current point in canvas
		var decimals = 0;
		if (trackLength < 10) decimals = 2; // show 2 decimals only in short tracks (10km)
		// don't show elevation if no elevation (minEle is defaul value) or offset is set
		var text = ((trk.minEle != 50000 && trackCanvas.offsetX == 0)?formatUom(trk.ele[idx],0, "m / "):("")) + formatUom(distance,decimals, "km"); /// PENDING UOM
		textWidth = ctx.measureText(text).width;
		// just before or just after straight line
		d = (e.offsetX>textWidth+20)?(e.offsetX-textWidth-20):(e.offsetX+10);
		var fontSize = trackCanvas.fontSize+2;
		trackCanvas.fillText(text,fontSize, d, fontSize*2);
		// add time just below (if not activeRoute and it is available from loaded gpx)
		if (!trk.activeRoute && trk.time[idx] != 0) {
			var text = formatTime(time);
			trackCanvas.fillText(text,fontSize, d, fontSize*3);
		}
		/*
		ctx.fillStyle = "RGBA(255, 255, 255, 0.8)";
		ctx.fillRect(d,trackCanvas.fontSize+2, textWidth,trackCanvas.fontSize );
		ctx.fillStyle = "#838383";
		ctx.fillText(text,d,trackCanvas.fontSize*2); 
		*/
	});
	
	canvas.addEventListener("mouseout",  function (e) {
		if (typeof trackCircleMarker !== 'undefined')  { map.removeLayer(trackCircleMarker);}
		trackCanvas.draw();
	});
	
	if (!isTouchDevice()) { // add click event on canvas only on PCs...
		canvas.addEventListener("click",  function (e) {
			if (typeof offsetTrackCircleMarker !== 'undefined')  { map.removeLayer(offsetTrackCircleMarker);}
			if (trackCanvas.offsetX != 0)  { 
				trackCanvas.offsetX = 0; 
			} else {
				trackCanvas.offsetX = e.offsetX; // x-distance in canvas pixel 
				trackCanvas.offsetIdx = trackCanvas.getPointIndex(e.offsetX); // offset point track index
				offsetTrackCircleMarker = L.circleMarker(trackCanvas.track.lls[trackCanvas.offsetIdx], { color: 'black', opacity: 0.8}).addTo(map);		
				
				// add listener to add route point, this is to facilitate tracing a route over a track
				offsetTrackCircleMarker.addEventListener("click",  function (e) {
					L.DomEvent.stopPropagation(e); // avoid the click to create another point
					addRoutePoint(this.getLatLng());
				});
			}
		});
	}
	
    },
    setTrack: function(trk) {
	document.getElementById("gCanvas").style.display = "block";
	this.track = trk;    
	// reset offset and remove offset circle
	trackCanvas.offsetX = 0; 
	if (typeof offsetTrackCircleMarker !== 'undefined')  { map.removeLayer(offsetTrackCircleMarker);}
	
	// consoleLog("setTrack in Canvas: " + trk.name);
	this.draw();
    },
    getPointIndex: function(offsetX) { /* returns the index of the track point corresponend to x offset in canvas */
	//   get distance from mouse position offset
	var trk = this.track;
	var trackLength = trk.dist[trk.dist.length-1];
	var d = offsetX * trackLength / W;
	
	// binary search on sorted array
	var lo = 0, idx = trk.dist.length - 1, m; // low , hi and mid
	while (lo < idx) {m = Math.round(lo+(idx -lo)/2);(d<trk.dist[m])?(idx=m-1):(lo=m+1);}
	
	return idx;
	    
    },
    drawMarker: function (offsetX) { /* draw straight line on altitude canvas */
	// this.draw(); // re-draw background
	this.ctx.beginPath();
	this.ctx.moveTo( offsetX, canvas.height);
	this.ctx.lineTo( offsetX, 0);
	this.ctx.strokeStyle = "#000000";
	this.ctx.lineWidth = 1; 
	this.ctx.stroke();   
    },
    drawHLine: function (x1, x2) { /* draw straight line on altitude canvas */
	// this.draw(); // re-draw background
	this.ctx.beginPath();
	this.ctx.moveTo( x1, canvas.height/4);
	this.ctx.lineTo( x2, canvas.height/4);
	this.ctx.strokeStyle = "#000000";
	this.ctx.lineWidth = 1; 
	this.ctx.stroke();   
    },
    fillText: function (text,fontSize, x,y) {
	var ctx = this.ctx
	ctx.fillStyle = "#838383";
	ctx.font = 'bold ' + fontSize+ 'px "Open Sans"';
	textWidth = ctx.measureText(text).width;
	ctx.fillStyle = "RGBA(255, 255, 255, 0.8)";
	ctx.fillRect(x,y-fontSize+2, textWidth,fontSize );
	ctx.fillStyle = "#838383";
	ctx.fillText(text,x,y); 
    },

    draw: function () { // draw the track in canvas background (static content)
	dist = this.track.dist;
	ele  = this.track.ele;
	M = this.track.maxEle;
	m = this.track.minEle; // defaulted to 50000 mt during import if no elevation info in track
	var ctx = this.ctx
	    
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
	//if (m == 50000) { ctx.setLineDash([5, 2]); // dash line for tracks with no elevation
	//} else { ctx.setLineDash([]); }
	
	if (this.track.activeRoute) {
		ctx.strokeStyle = "#DC614F"; // "#DC614F"
		ctx.lineWidth = 2; 
		ctx.setLineDash([]); // continuous
	} else {
		ctx.strokeStyle = "rgba(255,0,0,0.6)"; // "#DC614F"
		ctx.lineWidth = 2;
		ctx.setLineDash([6,2]);
	}
	ctx.stroke();
	
	// add distance label at 10 | 50 | 100 | 500 km or mi
	
	/*
		// check what is closed to 3 items
		var labelsAt = [10, 50, 100, 500, 1000, 5000];
		i = 0;
		var idx = 0;
		while ( maxDist > labelsAt[i] ) { idx = i++ }; // 600
		consoleLog("idx: " + idx);
		for(i=0;i<=idx;i++) { trackCanvas.fillText(formatUom(labelsAt[idx-1]*(i+1),0, "km"),trackCanvas.fontSize, labelsAt[idx-1]*(i+1)*W/maxDist , H); }
	*/
	

	// add 3 labels for dist at maxDist/4
	/*var ds = maxDist/4;
	var decimals = 0;
	if (ds <3) decimals = 2; // if track is less than 3km
	ctx.fillText("'"+formatUom(ds,decimals, "km"),ds*W/maxDist,H);
	ctx.fillText("'"+formatUom(ds*2,decimals, "km"),ds*2*W/maxDist,H);
	ctx.fillText("'"+formatUom(ds*3,decimals, "km"),ds*3*W/maxDist,H);	
	*/
	
	// add 2 labels for height (m and M)
	if (m != 50000) { 
		//ctx.fillText(formatUom(m,0, "m"),0,H); 
		//ctx.fillText(formatUom(M,0, "m"),0,this.fontSize);
		trackCanvas.fillText(formatUom(m,0, "m"),this.fontSize, 0,H); 
		trackCanvas.fillText(formatUom(M,0, "m"),this.fontSize, 0,this.fontSize); 
	} else {
		ctx.fillText(translations["track.noEle"],0,this.fontSize); 
	}
	    
    }

});



function createActiveRouteTrack(lls) {
	// disable&remove previous track for active route if it exists
	if (activeRoute.routePoly ) { 
		activeRoute.routePoly.off();
		map.removeLayer(activeRoute.routePoly);
		routeMilestonesGroup.clearLayers();
	}	
	// create new poliline
	routeColor = mapRouteColor[document.getElementById("gOptions.mapLayer").value];
	activeRoute.routePoly = L.polyline(lls, {color: routeColor, opacity: 0.8, weight: 4}).addTo(map);
	/* 
	 * Add a circle milestone on route each 100 km/miles 
	 */
	if ( !isTouchDevice()){ // no with touch devices since onmouseout would fail
		var d= 100; // default in uom (km/mi) - FIXME: need to allow user to set this on UI and save as a cookie
		var dist = []; // holds points total distance from start
		dist[0] = 0;
		//var segment = 0; // id of each route segment with lenght d
		var uom = (document.getElementById("gOptions.uom").value==="k"?"km":"mi");
		//var idx[]; // array with lls ids with circle
		for(var i = 1; i<lls.length;i++) {
			var ll = lls[i];
			dist[i] =  dist[i-1]+getDistance([lls[i][0],lls[i][1]], [lls[i-1][0],lls[i-1][1]], 0,0)*(uom=="km"?1:0.621371);
			if (dist[i]>=d) { // we reached the first route point after d
				//idx[segment++]=i;
				routeColor = mapRouteColor[document.getElementById("gOptions.mapLayer").value];
				var cm =   L.circleMarker(lls[i], {color: routeColor, fill: true, fillOpacity: 1, radius: 3}).bindTooltip(d + uom );
				cm.on('mouseover',function(e) { e.target.openTooltip(); });
				cm.on('mouseout' ,function(e) { e.target.closeTooltip();});			
				routeMilestonesGroup.addLayer(cm);
				d = d+100;
			}
		}
		routeMilestonesGroup.addTo(map);
	}
	
	/* 
	 * Events on polyline
	 */
	if (!isIE()) { 
		activeRoute.routePoly.on('mouseover',function(e) { 
			//consoleLog("mouseover");
			//e.target.setStyle({color: '#00EE00', opacity: 0.8, weight: 5});
			e.target.setStyle({color: routeColor, opacity: 1, weight: 5});
			});
		activeRoute.routePoly.on('mouseout',function(e) { 
			routeColor = mapRouteColor[document.getElementById("gOptions.mapLayer").value];
			e.target.setStyle({color: routeColor, opacity: 0.8, weight: 4});
			});
		activeRoute.routePoly.on('click', function (e) { // avoid click on line to be a click on map and generate a new point
			L.DomEvent.stopPropagation(e);
			//L.DomEvent.preventDefault(e);
		});
		if ( !isTouchDevice()) { // drag route - not on touch device since it's too hard to pick it
			var tmpMarker= new L.marker([0,0], {zIndexOffset: 1010, icon: L.icon({ iconUrl: routeIconsMap.get("##"), iconSize: [30, 40], iconAnchor: [15,40]})});
			// ;
			activeRoute.routePoly.on('mousedown', function (e) {
				map.dragging.disable();		
				// chrome need to disable click on map
				map.off('click');

				//pressTimer = window.setTimeout(function() { // DRAG BEGINS
					//consoleLog("200ms after mousedown");
				consoleLog("Down at:" + e.latlng );
				//console.log("legsIdx length :" + activeRoute.legsIdx.length );
				//console.log("legs length :" + activeRoute.legs.length );
				onDrag = true;

				var idx =  getPointLegIdx(e.latlng);

				//console.log("clicked point is in leg (start from 0): " + (idx));

				activeRoute.insertPointAt(idx+1);

				tmpMarker.setLatLng(e.latlng);
				map.addLayer(tmpMarker);
				map.on('mousemove', function (e) {
					  tmpMarker.setLatLng(e.latlng);
					});
				map.on('mouseup', function (e)  { // clear event 
					map.dragging.enable();
					map.removeEventListener('mousemove');
					map.removeEventListener('mouseup');
					map.removeLayer(tmpMarker);
					onMapClick(e);
					// chrome needs to renable but after a while
					// ref https://gis.stackexchange.com/questions/190049/leaflet-map-draggable-marker-events			
					setTimeout(function() {
						map.on(isTouchDevice()?'contextmenu':'click', onMapClick);
					      }, 100);
					consoleLog("Up at:" + e.latlng);
				});				   
				
			});
		}
	}
	
}