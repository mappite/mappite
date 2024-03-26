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

var map;  // The Leaflet Map
var curL; // Current Layer
var curA; // Current Attribution
var headerCls, iconCtrl; // Header (top left) and Icon (top right) classes 
var selection; // FIXME: check if used by geocoder.js (?)

var currentMode  = 'gMode.car'; // see .gMode
var previousMode =  currentMode; // see .gMode

var scale; // scale gadget shown in map

var circleLocate; // circle used by geolocation to show  position with approx error
var markerLocate; // marker used by geolocation to show  position
var isLocate = false; // state if geolocateion is acive or not

var isProtomapsLoaded  = false;
var isProtomapsEnabled = false;

// maintain an array of Layers for each type
var mapIcons ={ fuel: [], mountainPasses: [], trackLayer: [], viewPoint: [], supermarket: [], wikipedia: [], camping: [], bar: [], picnic: [], drinkingWater: [], hotel: []};

var legsInfo = 0; // states if to show  leg time/distance (0) cumulative leg time/distance from last stop  (1) or last breaks&stop (2)

// Markers
var marker;

var markersCluster = L.markerClusterGroup({
			maxClusterRadius: 0, // FIXME: 0 means disabled, actually we don't use this on main markers since it does not display nicely 
			showCoverageOnHover: true,
			iconCreateFunction: function (cluster) {
				return L.icon({ iconUrl: "./icons/marker-circlePlus.png" });
			}
		});

var markers = {}; // contains all route markers or potential route markers with their id as key

var routeIconsMap = new Map();
routeIconsMap.set('##',   "./icons/viaPoint.svg"); 		// default
routeIconsMap.set('#s#',  "./icons/poiShaping.svg");	// shaping points
routeIconsMap.set('#B#',  "./icons/viaPoint-gray.svg");	// Break (within the day)
routeIconsMap.set('#Bv#', "./icons/viaPoint-viewPoint.svg");
routeIconsMap.set('#Bp#', "./icons/viaPoint-picnic.svg");
routeIconsMap.set('#Bb#', "./icons/viaPoint-bar.svg");
routeIconsMap.set('#Be#', "./icons/viaPoint-eat.svg");
routeIconsMap.set('#Bf#', "./icons/viaPoint-fuel.svg");
routeIconsMap.set('#S#',  "./icons/viaPoint-black.svg");	// Stop (for the day)
routeIconsMap.set('#Sc#', "./icons/viaPoint-camping.svg");
routeIconsMap.set('#Sh#', "./icons/viaPoint-hotel.svg");


// Custom POI
var iconPoi          = "./icons/poi-red.svg";
var iconPoiPlus      = "./icons/poi-redPlus.svg";
var iconPoiEdit      = "./icons/poi-red.svg";
var iconPoiSearch    = "./icons/poi-search.svg";
var poiMap = new Map(); // mantains map of visible POI lists


// Route
var activeRoute; // The active Route object containing viapoints
var routesTrackMap = new Map(); // mantains map of visible route tracks

var routeMilestonesGroup = new L.LayerGroup(); // circles that appears on route at each given segment

var geoResultsNames = {};  // contains all markers geoResults names  with their id as key


var viaPointId = 0; // unique index of each viaPoint showed on screen 
	
var insertPointAt = -1; // by default insert new via point at the end of the current route
var MAX_ROUTE_POINTS = 50; // max numbers of points in a route

var MAX_POI_POINTS = 100; // max number of poi in a poi list

// Internal Routing - set when internal routing is used, this requires
// to setup a graphhopper routing server.
// set 0,0,0,0 to disable

// see 100-Routing.js isInternalRoutingArea()

//var INTERNAL_ROUTING_LATS = [ [ 0,0,0,0] ]; // DISABLE 
var INTERNAL_ROUTING_LATS = [  // top, bottom, left, right 
	  [ 71.30, 37.79, -24.87, 44.03] // most eur
	, [38,34,20,35.5] // greece south cyprus
	, [38,35,11.5,16] // sicily
	, [38,36,-9,0] // south spain
	]; 

// where protomaps layer gest enabled
var PROTOMAPS_LATS = [
	//  [47.754, 45.468, 6.141, 14.777] // ALPS 1
	// , [46.529, 43.037, 5.603, 8.602 ] // ALPS 2
	  [ 71.30, 37.79, -24.87, 44.03] // most eur
	, [38,34,20,35.5] // greece south cyprus
	, [38,35,11.5,16] // sicily
	, [38,36,-9,0] // south spain
	, [-10.185, -44.00, 109.644, 155.830 ]
	, [49,32,-125,-94]
	, [46,32,-94,-82]
	, [32,28,-106,-82]
	, [42,25,-82,-70]
	, [45,42,-78,-67]
	, [27.333, 13.240, -18.501, 11.250]
	, [35.925, 27.333, -13.184, 11.250]
	, [37.614, 35.925, 0.132, 11.250]
        ];
// california
//	, [42.033, 33.651, -124.563, -119.993 ]
//	, [39.266, 32.55, -119.993, -113.972 ]


		
var PROTOMAPS_LATS_PROTOTILES = [ "europe", "europe", "europe", "europe", "australia","usa","usa","usa","usa","usa", "maghreb", "maghreb", "maghreb" ];

var MAPPITE_SERVER = "__mserver__"; // internal routing server (optional)
	
// Tracks
var trackCanvas;// 
var trackCircleMarker; // cirleMarker that apperas on track when mouseover canvas
var offsetTrackCircleMarker ; // cirleMarker that apperas on track when click on canvas 
var activeTrack; // the one selected (red)
var tracksList = [];

/* Array containing all keys for localstore items.
   This prevents issues with "The order of keys is user-agent defined, so you should not rely on it."
   if multiple mappite tabs are opened and user deletes/save items. */
var localStoragesKeys = [];

// ajax event that stores the route computation
var xAjax = null;

// contains all labels translations in current language
var translations = null; // set []; for dev... // null for prod otherwise lables do not load
