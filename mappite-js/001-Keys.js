/* External Providers Keys */

/* Mappite uses a number of external providers,
 * some of them requires registration and provides a
 * key to use on http requests, requests are usually free
 * up to a certain threshold.
 */

// to setup a dev environment register and generate your key
// at least for OpenRouteService


// OperRouteService 
//  Usage: Routing - 100-Routing.js
var orsKey = "__orsKey__";
// Mapquest
//  Usage: Routing - 100-Routing.js
//         Reverse Lookup - see 040-MapFunctions.js
//  *warning* functionality stops after threshold
var mapquestKey= "__mapquestKey__"; // dev __mapquestKeyDev__
// Mapbox
//  Usage: map tiles - 030-Map.js, index.html
//  *warning* these gets expensive above free threshold
var mapboxKey = "__mapboxKey__";
// Protomaps:
//   https://protomaps.com/dashboard
var protomapsKey = "__protomapsKey__";

// Other services do not requires keys:
//
// Nominatim (https://nominatim.openstreetmap.org) - Default Reverse Lookup, Fallback Search
// OSRM (https://router.project-osrm.org) - Fallback Reverse Lookup for Nominatim
// Stamen - map tiles
// opentopomap  - map tiles
// geonames - get geolocated  wikipedia articles
// photon (https://photon.komoot.io) - Default Search (030-Map.js)
// extreme-ip-lookup (https://extreme-ip-lookup.com) - High Level geolocalization to display default map center (see index.html)
//
// graphhopper - Europe Routing
//   mappite uses a slighly modified version fo graphhopper for most routing in Europe

