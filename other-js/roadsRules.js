/* Leaflet */

var styleParams = {
  background: "#cccccc",
  earth: "#e0e0e0",
  park_a: "#cfddd5",
  park_b: "#9cd3b4",
  hospital: "#e4dad9",
  industrial: "#d1dde1",
  school: "#e4ded7",
  wood_a: "#d0ded0",
  wood_b: "#a0d9a0",
  pedestrian: "#e3e0d4",
  scrub_a: "#cedcd7",
  scrub_b: "#99d2bb",
  glacier: "#f7f7f7",
  bare_rock: "#d7d7d7",
  sand: "#F7EDD1", //"#e2e0d7",
  beach: "#e8e4d0",
  aerodrome: "#dadbdf",
  runway: "#e9e9ed",
  water: "#75cef0", //"#80deea",
  pier: "#e0e0e0",
  zoo: "#c6dcdc",
  military: "#f4d3ce", // "#f3e2dc", //"#dcdcdc",
	
  tunnel_other_casing: "#e0e0e0",
  tunnel_minor_casing: "#e0e0e0",
  tunnel_link_casing: "#e0e0e0",
  tunnel_medium_casing: "#e0e0e0",
  tunnel_major_casing: "#e0e0e0",
  tunnel_highway_casing: "#e0e0e0",
  tunnel_other: "#d5d5d5",
  tunnel_minor: "#d5d5d5",
  tunnel_link: "#d5d5d5",
  tunnel_medium: "#d5d5d5",
  tunnel_major: "#d5d5d5",
  tunnel_highway: "#d5d5d5",


  transit_pier: "#e0e0e0",
  buildings: "#cccccc",
  ////////////////////////////////////////////////////
  // my https://www.w3schools.com/colors/colors_picker.asp 938a8d
  highwayCasing: "#AC8331", //"#FFC3C3",
  majorRoadCasing: "#AC8331",
  mediumRoadCasing: "#999999", //"#FFCE8E",
  minorRoadCasing: "#cccccc",
  highway: "#FFA35C",
  majorRoad: "#F2D163",
  mediumRoad: "#f3f3f3", //"#FFF2C8",
  minorRoad: "#fdfdfd",
  // light
  minor_service_casing: "#e0e0e0",
  minor_casing: "#e0e0e0",
  link_casing: "#e0e0e0",
  medium_casing: "#e0e0e0",
  major_casing_late: "#e0e0e0",
  highway_casing_late: "#e0e0e0",
  other: "#ebebeb",
  minor_service: "#ebebeb",
  minor_a: "#ebebeb",
  minor_b: "#ffffff",
  link: "#ffffff",
  //medium: "#f5f5f5",
  major_casing_early: "#e0e0e0",
  //major: "#ffffff",
  highway_casing_early: "#e0e0e0",
  //highway: "#ffffff",
  ferry: "#0000FF",
  // track brown
  track:"#cda24c",
  naturalPoi: "#AC8331",
  ////////////////////////////////////////////////////
  railway: "#a7b1b3",
  boundaries: "#adadad",
  waterway_label: "#ffffff",

  bridges_other_casing: "#e0e0e0",
  bridges_minor_casing: "#e0e0e0",
  bridges_link_casing: "#e0e0e0",
  bridges_medium_casing: "#e0e0e0",
  bridges_major_casing: "#e0e0e0",
  bridges_highway_casing: "#e0e0e0",
  bridges_other: "#ebebeb",
  bridges_minor: "#ffffff",
  bridges_link: "#ffffff",
  bridges_medium: "#f0eded",
  bridges_major: "#f5f5f5",
  bridges_highway: "#ffffff",

  roads_label_minor: "#91888b",
  roads_label_minor_halo: "#ffffff",
  roads_label_major: "#776e71", //"#938a8d",
  roads_label_major_halo: "#ffffff",
  ocean_label: "#ffffff",
  peak_label: "#7e9aa0",
  subplace_label: "#8f8f8f",
  subplace_label_halo: "#e0e0e0",
  city_circle: "#ffffff",
  city_circle_stroke: "#a3a3a3",
  city_label: "#5c5c5c",
  city_label_halo: "#e0e0e0",
  state_label: "#b3b3b3",
  state_label_halo: "#e0e0e0",
  country_label: "#a3a3a3",
  inc: 0
};

/*
function updateRule(id, symb) {
 	roadsPaintRules.forEach(function(o) {
	      if (o.id == id) {	
		    o.symbolizer = symb;   
	      }
	  }
	);
} */

function roadsPaintRules() { 
  return [
    {
      dataLayer: "earth",
      symbolizer: new protomapsL.PolygonSymbolizer({
        fill: styleParams.earth,
      }),
    },
    {
      dataLayer: "landuse",
      symbolizer: new protomapsL.PolygonSymbolizer({
        fill: (z, f) => {
          // return mix(styleParams.park_a, styleParams.park_b, Math.min(Math.max(z / 12.0, 12), 0));
          return styleParams.park_a;
        },
      }),
      filter: (z, f) => {
        const kind = f.props["pmap:kind"];
        return ["allotments", "village_green", "playground"].includes(kind);
      },
    },
    {
      // landuse_urban_green
      dataLayer: "landuse",
      symbolizer: new protomapsL.PolygonSymbolizer({
        fill: styleParams.park_b,
        opacity: 0.7,
      }),
      filter: (z, f) => {
        const kind = f.props["pmap:kind"];
        return [
          "national_park",
          "park",
          "cemetery",
          "protected_area",
          "nature_reserve",
          "forest",
          "golf_course",
        ].includes(kind);
      },
    },
    {
      dataLayer: "landuse",
      symbolizer: new protomapsL.PolygonSymbolizer({
        fill: styleParams.hospital,
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] === "hospital";
      },
    },
    {
      dataLayer: "landuse",
      symbolizer: new protomapsL.PolygonSymbolizer({
        fill: styleParams.industrial,
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] === "industrial";
      },
    },
    {
      dataLayer: "landuse",
      symbolizer: new protomapsL.PolygonSymbolizer({
        fill: styleParams.school,
      }),
      filter: (z, f) => {
        const kind = f.props["pmap:kind"];
        return ["school", "university", "college"].includes(kind);
      },
    },
    {
      dataLayer: "landuse",
      symbolizer: new protomapsL.PolygonSymbolizer({
        fill: styleParams.beach,
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] === "beach";
      },
    },
    {
      dataLayer: "landuse",
      symbolizer: new protomapsL.PolygonSymbolizer({
        fill: styleParams.zoo,
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] === "zoo";
      },
    },
    {
      dataLayer: "landuse",
      symbolizer: new protomapsL.PolygonSymbolizer({
        fill: styleParams.military,
      }),
      filter: (z, f) => {
        const kind = f.props["pmap:kind"];
        return ["military", "naval_base", "airfield"].includes(kind);
      },
    },
    {
      dataLayer: "natural",
      symbolizer: new protomapsL.PolygonSymbolizer({
        fill: (z, f) => {
          //return mix(styleParams.wood_a, styleParams.wood_b, Math.min(Math.max(z / 12.0, 12), 0));
	  return styleParams.wood_a;
        },
      }),
      filter: (z, f) => {
        const kind = f.props["pmap:kind"];
        return ["wood", "nature_reserve", "forest"].includes(kind);
      },
    },
    {
      dataLayer: "natural",
      symbolizer: new protomapsL.PolygonSymbolizer({
        fill: (z, f) => {
          //return protomapsL.mix(styleParams.scrub_a, styleParams.scrub_b, Math.min(Math.max(z / 12.0, 12), 0));
	  return styleParams.scrub_a;
        },
      }),
      filter: (z, f) => {
        const kind = f.props["pmap:kind"];
        return ["scrub", "grassland", "grass"].includes(kind);
      },
    },
    {
      dataLayer: "natural",
      symbolizer: new protomapsL.PolygonSymbolizer({
        fill: styleParams.scrub_b,
      }),
      filter: (z, f) => {
        const kind = f.props["pmap:kind"];
        return ["scrub", "grassland", "grass"].includes(kind);
      },
    },
    {
      dataLayer: "natural",
      symbolizer: new protomapsL.PolygonSymbolizer({
        fill: styleParams.bare_rock,
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] === "bare_rock";
      },
    },
    {
      dataLayer: "natural",
      symbolizer: new protomapsL.PolygonSymbolizer({
        fill: styleParams.glacier,
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] === "glacier";
      },
    },
    {
      dataLayer: "natural",
      symbolizer: new protomapsL.PolygonSymbolizer({
        fill: styleParams.sand,
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] === "sand";
      },
    },
    {
      dataLayer: "landuse",
      symbolizer: new protomapsL.PolygonSymbolizer({
        fill: styleParams.aerodrome,
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] === "aerodrome";
      },
    },
    {
      dataLayer: "water",
      symbolizer: new protomapsL.PolygonSymbolizer({
        fill: styleParams.water,
      }),
    },
    {
      // transit_runway
      dataLayer: "transit",
      symbolizer: new protomapsL.LineSymbolizer({
        color: styleParams.runway,
        width: (z, f) => {
          return protomapsL.exp(1.6, [
            [11, 0],
            [13, 4],
            [19, 30],
          ])(z);
        },
      }),
      filter: (z, f) => {
        return f.props["pmap:kind_detail"] === "runway";
      },
    },
    {
      // transit_taxiway
      dataLayer: "transit",
      symbolizer: new protomapsL.LineSymbolizer({
        color: styleParams.runway,
        width: (z, f) => {
          return protomapsL.exp(1.6, [
            [14, 0],
            [14.5, 1],
            [16, 6],
          ])(z);
        },
      }),
      filter: (z, f) => {
        return f.props["pmap:kind_detail"] === "taxiway";
      },
    },
    {
      // transit_pier
      dataLayer: "transit",
      symbolizer: new protomapsL.LineSymbolizer({
        color: styleParams.pier,
        width: (z, f) => {
          return protomapsL.exp(1.6, [
            [13, 0],
            [13.5, 0, 5],
            [21, 16],
          ])(z);
        },
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] === "pier";
      },
    },
    {
      // physical_line_river
      dataLayer: "physical_line",
      minzoom: 14,
      symbolizer: new protomapsL.LineSymbolizer({
        color: styleParams.water,
        width: (z, f) => {
          return protomapsL.exp(1.6, [
            [9, 0],
            [9.5, 1.0],
            [18, 12],
          ])(z);
        },
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] === "river";
      },
    },
    {
      // physical_line_river
      dataLayer: "physical_line",
      minzoom: 14,
      symbolizer: new protomapsL.LineSymbolizer({
        color: styleParams.water,
        width: 0.5,
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] === "stream";
      },
    },
    {
      dataLayer: "landuse",
      symbolizer: new protomapsL.PolygonSymbolizer({
        fill: styleParams.pedestrian,
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] === "pedestrian";
      },
    },
    {
      dataLayer: "landuse",
      symbolizer: new protomapsL.PolygonSymbolizer({
        fill: styleParams.pier,
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] === "pier";
      },
    },
    {
      dataLayer: "buildings",
      symbolizer: new protomapsL.PolygonSymbolizer({
        fill: styleParams.buildings,
        opacity: 0.5,
      }),
    },
    ////////////////// ROADS START ////////////////////////
    { 
      dataLayer: "roads",
      symbolizer: new protomapsL.LineSymbolizer({
        color: styleParams.highwayCasing,
        width: protomapsL.exp(1.4, [
          [5, 1],
          [11, 4],
          [16, 10],
          [20, 40],
        ]),
      }),
      filter: (z, f) => {
        return (f.props["pmap:kind"] == "highway" && f.props["pmap:kind_detail"] != "motorway_link");
      },
    },
    { 
      dataLayer: "roads",
      symbolizer: new protomapsL.LineSymbolizer({
        color: styleParams.highwayCasing,
        width: protomapsL.exp(1.4, [
          [8, 1],
          [11, 3],
          [16, 6],
          [20, 30],
        ]),
      }),
      filter: (z, f) => {
        return (f.props["pmap:kind"] == "highway" && f.props["pmap:kind_detail"] == "motorway_link");
      },
    },
    {
      dataLayer: "roads",
      symbolizer: new protomapsL.LineSymbolizer({
        color: styleParams.majorRoadCasing,
        width: protomapsL.exp(1.4, [
          [8, 1],
          [10, 1],
          [12, 4],
          [17, 8],
          [20, 22],
        ]),
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] == "major_road";
      },
    },
    {
      dataLayer: "roads",
      symbolizer: new protomapsL.LineSymbolizer({
        color: styleParams.mediumRoadCasing,
        width: protomapsL.exp(1.4, [
          [10, 1],
          [12, 2],
          [17, 6],
          [20, 18],
        ]),
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] == "medium_road";
      },
    },
    {
      dataLayer: "roads",
      symbolizer: new protomapsL.LineSymbolizer({
        color: styleParams.minorRoadCasing,
        width: protomapsL.exp(1.4, [
          [14, 2],
          [17, 5],
          [20, 15],
        ]),
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] == "minor_road";
      },
    },
    {
      dataLayer: "roads",
      symbolizer: new protomapsL.LineSymbolizer({
        color: styleParams.minorRoad,
        width: protomapsL.exp(1.4, [
          [14, 1],
          [17, 3],
          [20, 13],
        ]),
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] == "minor_road";
      },
    },
    {
      dataLayer: "roads",
      symbolizer: new protomapsL.LineSymbolizer({
        color: styleParams.mediumRoad,
        width: protomapsL.exp(1.4, [
          [10, 1.5],
          [12, 2],
          [17, 4],
          [20, 15],
        ]),
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] == "medium_road";
      },
    },
    {
      dataLayer: "roads",
      symbolizer: new protomapsL.LineSymbolizer({
        color: styleParams.majorRoad,
        width: protomapsL.exp(1.4, [
          [8, 1],
          [10, 2],
          [12, 4],
          [17, 6],
          [20, 20],
        ]),
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] == "major_road";
      },
    },
    {
      dataLayer: "roads",
      symbolizer: new protomapsL.LineSymbolizer({
        color: styleParams.highway,
        width: protomapsL.exp(1.4, [
          [5, .5],
          [11, 4],
          [16, 8],
          [20, 30],
        ]),
      }),
      filter: (z, f) => {
        return (f.props["pmap:kind"] == "highway" && f.props["pmap:kind_detail"] != "motorway_link");
      },
    },
    { 
      dataLayer: "roads",
      symbolizer: new protomapsL.LineSymbolizer({
        color: styleParams.highway,
        width: protomapsL.exp(1.4, [
          [8, 1],
          [11, 3],
          [16, 6],
          [20, 30],
        ]),
      }),
      filter: (z, f) => {
        return (f.props["pmap:kind"] == "highway" && f.props["pmap:kind_detail"] == "motorway_link");
      },
    },
    {
      dataLayer: "roads",
      symbolizer: new protomapsL.LineSymbolizer({
        color: styleParams.track, // "#cda24c", //"#AC8331",
        width: protomapsL.exp(1.4, [
          [14, 0.5],
          [17, 3],
          [20, 13],
        ]),
      }),
      filter: (z, f) => {
        return (f.props["pmap:kind"] == "path" && f.props["pmap:kind_detail"] == "track");
      },
    },
    ////////////////// ROADS END ////////////////////////
    {
      dataLayer: "boundaries",
      symbolizer: new protomapsL.LineSymbolizer({
        dash: [3, 2],
        color: styleParams.boundaries,
        width: 1,
      }),
      filter: (z, f) => {
        const minAdminLevel = f.props["pmap:min_admin_level"];
        return typeof minAdminLevel === "number" && minAdminLevel <= 2;
      },
    },
    {
      dataLayer: "transit",
      symbolizer: new protomapsL.LineSymbolizer({
        dash: [0.3, 0.75],
        color: styleParams.railway,
        dashWidth: (z, f) => {
          return protomapsL.exp(1.6, [
            [4, 0],
            [7, 0.15],
            [19, 9],
          ])(z);
        },
        opacity: 0.5,
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] === "rail";
      },
    },
    {
      dataLayer: "transit",
      symbolizer: new protomapsL.LineSymbolizer({
        dash: [0.3, 0.75],
        color: styleParams.ferry,
        dashWidth: (z, f) => {
          return protomapsL.exp(1.6, [
            [4, 0],
            [7, 0.15],
            [19, 9],
          ])(z);
        },
        opacity: 0.5,
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] === "other" &&  f.props["route"] === "ferry";
      },
    },
    {
      dataLayer: "boundaries",
      symbolizer: new protomapsL.LineSymbolizer({
        dash: [3, 2],
        color: styleParams.boundaries,
        width: 0.5,
      }),
      filter: (z, f) => {
        const minAdminLevel = f.props["pmap:min_admin_level"];
        return typeof minAdminLevel === "number" && minAdminLevel > 2;
      },
    },
  ];
 }
 
/*
 * LABELS 
 */
 
var nametags = ["name:en", "name"]; // ["name:en"] // ["name"+(lang==""?"":(":"+lang))]
 
function roadsLabelRules(lang) { 
  return [
{
      dataLayer: "roads",
      symbolizer: new protomapsL.LineLabelSymbolizer({
        labelProps: nametags,
        fill: styleParams.roads_label_minor,
        font: "400 12px sans-serif",
        width: 2,
        stroke: styleParams.roads_label_minor_halo,
      }),
      // TODO: sort by minzoom
      minzoom: 16,
      filter: (z, f) => {
        const kind = f.props["pmap:kind"];
        return ["minor_road", "other", "path"].includes(kind);
      },
    },
    {
      dataLayer: "roads",
      symbolizer: new protomapsL.LineLabelSymbolizer({
        labelProps: nametags,
        fill: styleParams.roads_label_major,
        font: "400 12px sans-serif",
        width: 2,
        stroke: styleParams.roads_label_major_halo,
      }),
      // TODO: sort by minzoom
      minzoom: 12,
      filter: (z, f) => {
        const kind = f.props["pmap:kind"];
        return ["highway", "major_road", "medium_road"].includes(kind);
      },
    },
    {
      dataLayer: "roads",
      symbolizer: new protomapsL.LineLabelSymbolizer({
        labelProps: nametags,
        fill: styleParams.roads_label_major,
        font: "400 12px sans-serif",
        width: 2,
        stroke: styleParams.roads_label_major_halo,
      }),
      // TODO: sort by minzoom
      minzoom: 12,
      filter: (z, f) => {
        const kind = f.props["pmap:kind"];
        return ["highway", "major_road", "medium_road"].includes(kind);
      },
    },
    {
      dataLayer: "roads",
      /*symbolizer: new protomapsL.ShieldSymbolizer({
                labelProps: ["ref"],
                font:"400 10px sans-serif",
                background:"#fff",
                padding:2,
	      //width: 2,
                fill:"#999"
        }), */
       symbolizer: new protomapsL.LineLabelSymbolizer({
        labelProps: ["ref"],
        fill:  "#1B76C8", //styleParams.roads_label_major, //"#3A4CA6", //
        font: "400 12px sans-serif",
        width: 2,
        stroke: styleParams.roads_label_major_halo,
      }),
      // TODO: sort by minzoom
      minzoom: 8,
      filter: (z, f) => {
	const kind = f.props["pmap:kind"];
	const ref = f.props["ref"];
        return (typeof ref === "string" && ["highway", "major_road", "medium_road"].includes(kind));
      },
    },
    {
      dataLayer: "physical_point",
      symbolizer: new protomapsL.CenteredTextSymbolizer({
        labelProps: nametags,
        fill: styleParams.ocean_label,
        lineHeight: 1.5,
        letterSpacing: 1,
        font: (z, f) => {
          const size = protomapsL.linear([
            [3, 10],
            [10, 12],
          ])(z);
          return `400 ${size}px sans-serif`;
        },
        textTransform: "uppercase",
      }),
      filter: (z, f) => {
        const kind = f.props["pmap:kind"];
        return ["ocean", "bay", "strait", "fjord"].includes(kind);
      },
    },
    {
      dataLayer: "physical_point",
      minzoom: 9,
      symbolizer: new protomapsL.CenteredTextSymbolizer({
        labelProps: nametags,
        fill: styleParams.ocean_label,
        lineHeight: 1.5,
        letterSpacing: 1,
        font: (z, f) => {
          const size = protomapsL.linear([
            [3, 0],
            [6, 12],
            [10, 12],
          ])(z);
          return `400 ${size}px sans-serif`;
        },
      }),
      filter: (z, f) => {
        const kind = f.props["pmap:kind"];
        return ["lake", "water"].includes(kind);
      },
    },
    {
      dataLayer: "physical_point",
      symbolizer: new protomapsL.CenteredTextSymbolizer({
        labelProps: nametags,
        fill: styleParams.ocean_label,
        lineHeight: 1.5,
        letterSpacing: 1,
        font: (z, f) => {
          const size = protomapsL.linear([
            [3, 0],
            [6, 12],
            [10, 12],
          ])(z);
          return `400 ${size}px sans-serif`;
        },
      }),
      filter: (z, f) => {
        const kind = f.props["pmap:kind"];
        return ["sea"].includes(kind);
      },
    },
    {
      dataLayer: "places",
      symbolizer: new protomapsL.CenteredTextSymbolizer({
        labelProps: (z, f) => {
          if (z < 6) {
            return ["name:short"];
          }
          return nametags;
        },
        fill: styleParams.state_label,
        stroke: styleParams.state_label_halo,
        width: 1,
        lineHeight: 1.5,
        font: (z, f) => {
          if (z < 6) return "400 16px sans-serif";
          return "400 12px sans-serif";
        },
        textTransform: "uppercase",
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] === "region";
      },
    },
    {
      dataLayer: "places",
      symbolizer: new protomapsL.CenteredTextSymbolizer({
        labelProps: nametags,
        fill: styleParams.country_label,
        lineHeight: 1.5,
        font: (z, f) => {
          if (z < 6) return "600 12px sans-serif";
          return "600 12px sans-serif";
        },
        textTransform: "uppercase",
      }),
      filter: (z, f) => {
        return f.props["pmap:kind"] === "country";
      },
    },
    {
      // places_locality // kind_details: town or city
      dataLayer: "places",
      minzoom: 9,
      symbolizer: new protomapsL.CenteredTextSymbolizer({
        labelProps: nametags,
        fill: styleParams.city_label,
        lineHeight: 1.5,
        font: (z, f) => {
          if (!f) return "400 12px sans-serif";
          const minZoom = f.props["pmap:min_zoom"];
          let weight = 400;
          if (minZoom && minZoom <= 5) {
            weight = 600;
          }
          let size = 11;
          const popRank = f.props["pmap:population_rank"];
          if (popRank && popRank > 9) {
            size = 14;
	    weight = 600;
          } else if (popRank && popRank > 7) {
	    weight = 600;
            size = 13;
          } 
          return `${weight} ${size}px sans-serif`;
        },
      }),
      sort: (a, b) => {
        const aRank = Number (a["pmap:population_rank"]);// getNumber(a, "pmap:population_rank");
        const bRank = Number (b["pmap:population_rank"]);// getNumber(b, "pmap:population_rank");
        return bRank - aRank;
      },
      filter: (z, f) => {
        return f.props["pmap:kind"] === "locality";
      },
    },
    {
      dataLayer: "places",
      maxzoom: 8,
      symbolizer: new protomapsL.GroupSymbolizer([
        new protomapsL.CircleSymbolizer({
          radius: 2,
          fill: styleParams.city_circle,
          stroke: styleParams.city_circle_stroke,
          width: 1.5,
        }),
        new protomapsL.OffsetTextSymbolizer({
          labelProps: nametags,
          fill: styleParams.city_label,
          stroke: styleParams.city_label_halo,
          width: 1,
          offsetX: 6,
          offsetY: 4.5,
          font: (z, f) => {
	    weight = 400;
	    const popRank = f.props["pmap:population_rank"];
	    if (popRank && popRank > 9) weight = 600;
            return `${weight} 12px sans-serif`;
          },
        }),
      ]),
      filter: (z, f) => {
        return f.props["pmap:kind"] === "locality";
      },
    },
   {
      dataLayer: "physical_point",
      minzoom: 10,
      symbolizer: new protomapsL.GroupSymbolizer([
        new protomapsL.CircleSymbolizer({
          radius: 2,
          fill: styleParams.naturalPoi,
          stroke: styleParams.city_circle_stroke,
          width: 1.5,
        }),
        new protomapsL.OffsetTextSymbolizer({
          labelProps: nametags,
          fill: styleParams.naturalPoi,
          stroke: styleParams.city_label_halo,
          width: 1,
          offsetX: 6,
          offsetY: 4.5,
          font: (z, f) => {
            return "400 12px sans-serif";
          },
        }),
      ]),
        
      filter: (z, f) => {
	if (f.props["name"] == "Piz Boè") console.log("* piz*");
        return f.props["pmap:kind"] === "peak";
      },
    }, 

  ];
 }
	 

console.log("*** roadRules loaded 2239");