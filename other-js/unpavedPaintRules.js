/* Leaflet */

var myDefaultStyleParams = {

  noAccessCasing: "#FF0000",
  yesAccessCasing: "#339900",
  highway:    "#FFC3C3",
  majorRoad:  "#795C34",
  mediumRoad: "#795C34", // 4B371C 7C4301 FFF2C8 663300 DC8331
  minorRoad:  "#795C34",
  track:      "#AC8331",
  trackBad:   "#AC8331", // it's dashed
  paved:      "#707070",
  boundaries: "#9e9e9e",
  mask:       "#dddddd"  // remove?
};


function myPaintRules() { 
  return [
    { // minor road (unpaved minour roads exists)
      dataLayer: "roads",
      symbolizer: new protomapsL.LineSymbolizer({
        color: myDefaultStyleParams.minorRoad,
        width: protomapsL.exp(1.4, [
	  [11, .5],
          [14, 4],
          [17, 6],
          [20, 10],
        ]),
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] == "minor_road";
      },
    },
    { // medium road (unpaved medium roads exists mainly in developing countries)
      dataLayer: "roads",
      symbolizer: new protomapsL.LineSymbolizer({
        color: myDefaultStyleParams.mediumRoad,
        width: protomapsL.exp(1.4, [
	  [11, 1],
          [14, 4],
          [17, 8],
          [20, 12],
        ]),
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] == "medium_road";
      },
    },
    { // major road (unpaved major road may exists in developing countries)
      dataLayer: "roads",
      symbolizer: new protomapsL.LineSymbolizer({
        color: myDefaultStyleParams.majorRoad,
        width: protomapsL.exp(1.4, [
	  [11, 1],
          [14, 6],
          [17, 10],
          [20, 14],
        ]),
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] == "major_road";
      },
    },
    { // highway (white unicorn may exist)
      dataLayer: "roads",
      symbolizer: new protomapsL.LineSymbolizer({
        color: myDefaultStyleParams.highway,
        width: protomapsL.exp(1.4, [
          [10, .5],
          [13, 2],
          [17, 4],
          [20, 12],
        ]),
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] == "highway";
      },
    },
    { // YES access  (this needs bigger than below to avoid being covered)
      // kind_detail[0,1,2,3] = tracktype, surface, access, motorVehicle (or motorcar or motorcycle)
      dataLayer: "roads",
      symbolizer: new protomapsL.LineSymbolizer({
        color: myDefaultStyleParams.yesAccessCasing, // casing
        width: protomapsL.exp(1.4, [
          [10, .5],
          [14, 3],
          [15, 6],
          [20, 10],
        ]),
      }),
      filter: (z, f) => {
	var kind_detail = f.props["pmap:kind_detail"].split("|");
        return ((f.props["pmap:kind"] == "track") && (kind_detail[2] == "yes" || kind_detail[3] == "yes" ));
      },
    },
    { // NO access (this needs bigger than below to avoid being covered)
      // kind_detail[0,1,2,3] = tracktype, surface, access, motor_vehicle (or motorcar or motorcycle)
      dataLayer: "roads",
      symbolizer: new protomapsL.LineSymbolizer({
        color: myDefaultStyleParams.noAccessCasing, // casing
        width: protomapsL.exp(1.4, [
          [10, 0],
          [14, 3],
          [17, 6],
          [20, 10],
        ]),
      }),
      filter: (z, f) => {
	var kind_detail = f.props["pmap:kind_detail"].split("|");
        return ( (  kind_detail[2] == "no" || kind_detail[2] == "private" || kind_detail[2] == "forestry" || 
	            kind_detail[3] == "no" || kind_detail[3] == "private" || kind_detail[3] == "forestry" ));
      },
    },
    { // unpaved ok road (track, minor, major etc)
      dataLayer: "roads",
      symbolizer: new protomapsL.LineSymbolizer({
        color: myDefaultStyleParams.track,
        width: protomapsL.exp(1.4, [
          [11, .5],
          [14, 2],
          [17, 4],
          [20, 8],
        ]),
      }),
      filter: (z, f) => {
	var kind_detail = f.props["pmap:kind_detail"].split("|");
        return (f.props["mappite:unpaved"] == "yes" && (kind_detail[0] != "grade4" && kind_detail[0] != "grade5" )  );
      },
    },
    { // unpaved bad road (track, minor, major etc)
      dataLayer: "roads",
      symbolizer: new protomapsL.LineSymbolizer({
        color: myDefaultStyleParams.trackBad,
	dash: [8,2],
        width: protomapsL.exp(1.4, [
          [11, .5],
          [14, 2],
          [17, 4],
          [20, 8],
        ]),
      }),
      filter: (z, f) => {
	var kind_detail = f.props["pmap:kind_detail"].split("|");
	      
        return (f.props["mappite:unpaved"] == "yes" && (kind_detail[0] == "grade4" || kind_detail[0] == "grade5" )  );
      },
    },
    { // paved road (track, minor, major etc)
      dataLayer: "roads",
      symbolizer: new protomapsL.LineSymbolizer({
        color: myDefaultStyleParams.paved,
        width: protomapsL.exp(1.4, [
          [11, .5],
          [14, 2],
          [17, 4],
          [20, 8],
        ]),
      }),
      filter: (z, f) => {
	var kind_detail = f.props["pmap:kind_detail"].split("|");
	      
        return (f.props["mappite:unpaved"] != "yes"  );
      },
    },
    {
      dataLayer: "mask",
      symbolizer: new protomapsL.PolygonSymbolizer({
        fill: myDefaultStyleParams.mask,
      }),
    },
  ];
 }
 