
var textureLoader = new THREE.TextureLoader();

var player = {
  lng: -74.0159, lat: 40.712
//  lng: -122.9110, lat: 49.2065
};
var world = {
  scale: 200000
}
player.start_lng = player.lng, player.start_lat = player.lat;


var TILE_ZOOM = 17;

function long2tile(lon,zoom) {
  return (Math.floor((lon+180)/360*Math.pow(2,zoom)));
}
function lat2tile(lat,zoom) {
  return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)));
}
var MAP_CACHE = {};

setInterval(function(){
  load_tiles(player.lat, player.lng)
}, 1000);

var load_tile = (function(tx, ty) {
  MAP_CACHE[tx + '_' + ty] = 1;
  $.getJSON( "http://tile.mapzen.com/mapzen/vector/v1/all/" + TILE_ZOOM + "/" + tx + "/" + ty + ".json?api_key=" + MAPZEN_API_KEY,function( data ) {
    add_buildings(data.buildings);
    add_roads(data.roads);
    add_pois(data.pois);
    add_landuse(data.landuse);
    add_water(data.water);
  });
});

var load_tiles = function(lat, lng) {
  var tile_x0 = long2tile(lng, TILE_ZOOM);
  var tile_y0 = lat2tile(lat, TILE_ZOOM);
  for (var i=-1;i<=1;i++) {
    for (var j=-1;j<=1;j++) {
      var tile_x = tile_x0 + i;
      var tile_y = tile_y0 + j; 
      if (!MAP_CACHE[tile_x + '_' + tile_y]) {
        load_tile(tile_x, tile_y);
      }
    }
  }
};

var to_scene_coords = function(coord){
  return [(coord[0] - player.start_lng) * world.scale, (coord[1] - player.start_lat) * world.scale];
};

var add_buildings = function(geojson){
  add_geojson({
    geojson: geojson,
    color: 0x999999,
    dataset: 'buildings',
    height: 'a'
  })
};

var add_roads = function(geojson){
  add_geojson({
    geojson: geojson,
    color: 0x333333,
    dataset: 'roads',
    height: 1
  });
};

var add_pois = function(geojson){
  add_geojson({
    geojson: geojson,
    color: 0xFF0000,
    dataset: 'poi',
    height: 20
  });
}

var add_landuse = function(geojson){
  add_geojson({
    geojson: geojson,
    color: 0xFFFF00,
    dataset: 'landuse',
    height: 0.5
  });
}

var add_water = function(geojson){
  add_geojson({
    geojson: geojson,
    color: 0x6688FF,
    dataset: 'water',
    height: 0.1
  });
}



if (window.location.host === "countable-web.github.io") {

  navigator.geolocation.getCurrentPosition(function(position) {
    player.lat = position.coords.latitude;
    player.lng = position.coords.longitude;
    load_tiles(player.lat, player.lng);
  });
  
} else {
  load_tiles(player.lat, player.lng);
}

// count the kinds of featues we see.
var kinds = {};

// keep a reference to everything we add to the scene from map data.
var feature_meshes = [];

/*
var cobble_tex = {
  specularMap: textureLoader.load('textures/cobblestone/specular.png'),
  normalMap: textureLoader.load('textures/cobblestone/normal.jpg'),
  map: textureLoader.load('textures/cobblestone/diffuse.jpg'),
  displacementMap: textureLoader.load('textures/cobblestone/height.png')
};

for (var k izn cobble_tex) {

  var texture = cobble_tex[k];
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set( 40, 40 );
}
*/

/**
 * Takes a 2d geojson, converts it to a ThreeJS Geometry, and extrudes it to a height suitable for 3d viewing.
 */
var extrude_feature_shape = function(feature, opts){

    var shape = new THREE.Shape();

    // Buffer the linestrings so they have some thickness (uses turf.js)
    if (feature.geometry.type === 'LineString' || feature.geometry.type === 'Point' || feature.geometry.type === 'MultiLineString') {
      var width = get_feature_style_property('width') || 1;
      var buf = turf.buffer(feature, width, 'meters');
      feature.geometry = buf.geometry;
    }

    if (feature.geometry.type === 'MultiPolygon') {
      var coords = feature.geometry.coordinates[0][0]; // TODO: add all multipolygon coords.
    } else {
      var coords = feature.geometry.coordinates[0];
    }

    var point = to_scene_coords(coords[0]);
    shape.moveTo(point[0], point[1]);

    coords.slice(1).forEach(function(coord){
      var point = to_scene_coords(coord);
      shape.lineTo(point[0], point[1]);
    });
    var point = to_scene_coords(coords[0]);
    shape.lineTo(point[0], point[1]);

    if (opts.height === 'a') {
      var height = Math.sqrt(feature.properties.area);
    } else if (feature.properties.height) {
      var height = feature.properties.height;
    } else {
      var height = get_feature_style_property('height') || opts.height || 1;
    }

    var extrudeSettings = {
      steps: 10,
      amount: height || 1,
      bevelEnabled: false
    };

    var geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
    geometry.rotateX( - Math.PI / 2 );

    return geometry;

};


/**
 * get_feature_style_property(property)
 * Look up a style_property for a feature, like the color.
 * First consult the user defined styles, then default styles, then default for this feature set (building, road, etc).
 */
var get_feature_style_property = function(feature, property) {

  // The key to use for finding a property specific to this feature.
  // Many features have a 'kind' property that can be used for styling.
  var key='kind';
  if (feature.properties && feature.properties.kind === 'building') { // special case for buildings.
    key='landuse_kind'; // fall back to landuse if the building doesn't have a 'kind'
    if (property === 'height') return 'a'; // use area to estimate height for all buildings.
  }

  if (
    feature.properties &&
    feature.properties[key] && 
    feature_styles[feature.properties[key]] &&
    feature_styles[feature.properties[key]][property]
  ) {
    return feature_styles[feature.properties[key]][property]
  } else {
    return null;
  }
};


var _drawn = {}; // avoid duplicate renderings.
var add_geojson = function(opts){

  opts.geojson.features.forEach(function(feature) {

    if (_drawn[feature.properties.id]) return;// avoid duplicate renderings. features might show up in 2 tiles.
    _drawn[feature.properties.id] = true;

    feature.dataset = opts.dataset;
    dataset_style = feature_styles[opts.dataset] || {};

    // tally feature "kind" (descriptive tags). used for debugging/enumerating available features and building stylesheets.
    kinds[feature.properties.kind] = kinds[feature.properties.kind] || 1;
    kinds[feature.properties.kind] ++;

    var geometry = extrude_feature_shape(feature, opts);

    var opacity = get_feature_style_property('opacity') || opts.opacity || 1;
    var material;
    if (dataset_style.shader_material) {
      material = dataset_style.shader_material;
    } else {
      material = new THREE.MeshLambertMaterial({
        color: get_feature_style_property('color') || opts.color || 0xFFFFFF,
        opacity: opacity,
        transparent: (opacity < 1)
      });
    }
    material.polygonOffset = true;
    material.polygonOffsetFactor = Math.random() - 0.5; // TODO, a better z-fighting avoidance method.
    material.polygonOffsetUnits = 1;

    var mesh = new THREE.Mesh( geometry, material ) ;
    scene.add( mesh );
    mesh.feature = feature;
    feature_meshes.push(mesh);

    var name = feature.name || feature.properties.name;

    if (name){
      var spos = to_screen_position(mesh, camera);
    }

  });
}
