/* mappite -  Copyright 2015+ gspeed / Enrico Liboni / info@mappite.org

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see http://www.gnu.org/licenses/
*/

/*** Global Vars ***/

// mappite version (release date), click on "i" in bottom left panel to display version number in bottom right attribute area
var mversion = __mversion__; 
var LOG_ENABLED = true;
MAPPITE_SERVER = "graphs"; // graphs|routing

var map;  // The Leaflet Map
var curL; // Current Layer
var curA; // Current Attribution
var headerCls, iconCtrl; // Header (top left) and Icon (top right) classes 
var selection; // FIXME: check if used by geocoder.js (?)

var scale; // scale gadget shown in map

var circleLocate; // circle used by geolocation to show  position with approx error
var markerLocate; // marker used by geolocation to show  position
var isLocate = false; // state if geolocateion is acive or not

var mapIcons ={ fuel: [], mountainPasses: [], viewPoint: [], supermarket: [], wikipedia: [], camping: []};

var legsIsCumulative = false; // states if to show cumulative leg time/distance or just leg time/distance

// Markers
var marker;

var markersCluster = L.markerClusterGroup({
			maxClusterRadius: 0, // FIXME: 0 means disabled, actually we don't use this since it does not deplay nicely 
			showCoverageOnHover: true,
			iconCreateFunction: function (cluster) {
				return L.icon({ iconUrl: "./icons/marker-circlePlus.png" });
			}
		});

var markers = {}; // contains all route markers or potential route markers with their id as key
var routeMilestonesGroup = new L.LayerGroup(); // circles that appears at each given segment

var geoResultsNames = {};  // contains all markers geoResults names  with their id as key


// Route
var activeRoute; // The active Route object containing viapoints
var routesList = [];
	
var viaPointId = 0; // unique index of each viaPoint showed on screen 
	
var insertPointAt = -1; // by default insert new via point at the end of the current route
var MAX_ROUTE_POINTS = 50; // max numbers of points in a route
	
// Tracks
var trackCanvas;// 
var trackCircleMarker; // cirleMarker that apperas on track when mouseover canvas
var activeTrack; // the one selected (red)
var tracksList = [];

