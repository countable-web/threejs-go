
var textureLoader = new THREE.TextureLoader();

var player = {
  lng: -74.0059, lat: 40.712
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

var kinds = {};

/*
address:44
alcohol:5
artwork:3
attraction:3
bank:5
bar:4
beach:2
bench:3
bicycle_repair_station:2
books:2
building:457
building_part:3
bus_stop:6
cafe:5
car_repair:5
cinema:2
clinic:3
clothes:3
college:4
commercial:2
convenience:2
courthouse:2
drinking_water:4
fast_food:11
fence:21
fitness:2
florist:2
footway:4
gate:2
government:3
grass:12
greengrocer:2
hedge:18
hotel:2
kindergarten:2
level_crossing:16
major_road:46
mall:2
military:2
mini_roundabout:2
minor_road:253
monument:4
museum:3
park:10
parking:25
path:168
pedestrian:18
pharmacy:3
pier:4
pitch:12
place_of_worship:2
platform:3
playground:13
police:2
post_box:5
post_office:2
power_pole:3
pub:2
rail:48
railway:8
residential:16
restaurant:20
retail:8
river:5
riverbank:15
school:3
scrub:2
station:3
subway_entrance:2
supermarket:3
toilets:4
townhall:2
traffic_signals:3
tree:11
viewpoint:2
waste_basket:2
*/

FEATURE_INFO = {
  address: {
    color: 0xFFFFFF
  },
  path: {
    width: 3
  },
  minor_road: {
    width: 6
  },
  major_road: {
    width: 9
  },
  pedestrian: {
    color: 0xFFFFFF
  },
  playground: {
    height: 10,
    color: 0xFFFF00,
    opacity: 0.5
  },
  tree: {
    color: 0x00FF00,
    height: 40,
    width: 3
  },
  grass: {
    color: 0x00FF00,
    height: 0.7
  },
  hedge: {
    color: 0x006600,
    height: 8
  },
  park: {
    color: 0x008800,
    opacity: 0.8,
    height: 0.6
  },
  forest: {
    color: 0x008800,
    opacity: 0.8,
    height: 4
  },
  pitch: {
    color: 0x88FF88,
    height: 0.8
  },
  parking: {
    color: 0x555555,
    opacity: 0.8,
    height: 0.2
  },
  fence: {
    color: 0xFF0000,
    height: 9
  },
  railway: {
    color: 0x888800,
    height: 1.5
  },
  retail: {
    height: 0.8,
    color: 0xCC44CC
  },
  military: {
    color: 0x448800
  },
  place_of_worship: {
    color: 0x000000
  },
  residential: {
    color: 0xCC8800
  },
  commercial: {
    color:0x880088
  }

}

var scene_objects = [];

/*
var cobble_tex = {
  specularMap: textureLoader.load('textures/cobblestone/specular.png'),
  normalMap: textureLoader.load('textures/cobblestone/normal.jpg'),
  map: textureLoader.load('textures/cobblestone/diffuse.jpg'),
  displacementMap: textureLoader.load('textures/cobblestone/height.png')
};

for (var k in cobble_tex) {

  var texture = cobble_tex[k];
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set( 40, 40 );
}
*/

var add_geojson = function(opts){

  opts.geojson.features.forEach(function(feature) {

    feature.dataset = opts.dataset;

    var kind_prop = function(property) {
      var key='kind';
      if (feature.properties && feature.properties.kind === 'building') {
        key='landuse_kind';
        if (property === 'height') return 'a'; // use area to estimate height for all buildings.
      }
      return (
        feature.properties &&
        feature.properties[key] && 
        FEATURE_INFO[feature.properties[key]] &&
        FEATURE_INFO[feature.properties[key]][property]) || opts[property];
    };

    // tally kinds.
    kinds[feature.properties.kind] = kinds[feature.properties.kind] || 1;
    kinds[feature.properties.kind] ++;

    if (feature.geometry.type === 'LineString' || feature.geometry.type === 'Point' || feature.geometry.type === 'MultiLineString') {
      var width = kind_prop('width') || 1;
      var buf = turf.buffer(feature, width, 'meters');
      feature.geometry = buf.geometry;
    }
    var shape = new THREE.Shape();
    if (feature.geometry.type === 'MultiPolygon') {
      var coords = feature.geometry.coordinates[0][0]; // TODO: all coords.
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
      var height = kind_prop('height');
    }

    var extrudeSettings = {
      steps: 1,
      amount: height || 1,
      bevelEnabled: false
    };

    var geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
    geometry.rotateX( - Math.PI / 2 );

    var opacity = kind_prop('opacity') || 1;

    /*if (opts.dataset === 'buildings') {
      var material = new THREE.MeshPhongMaterial({
        specularMap: cobble_tex.specularMap,
        normalMap: cobble_tex.normalMap,
        map: cobble_tex.map,
        displacementMap: cobble_tex.displacementMap
      });
    } else {*/
      var material = new THREE.MeshLambertMaterial({
        color: kind_prop('color'),
        opacity: opacity,
        transparent: (opacity < 1)
      });
    //}
    var mesh = new THREE.Mesh( geometry, material ) ;
    scene.add( mesh );
    mesh.feature = feature;
    scene_objects.push(mesh);

    var name = feature.name || feature.properties.name;

    if (name){
      var spos = toScreenPosition(mesh, camera);
    }

  });
}
