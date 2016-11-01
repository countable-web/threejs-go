

var camera, scene, renderer, raycaster;


var CTR_X = -122.9110, CTR_Y = 49.2057, SCALE = 200000;
var ORIG_CTR_X = CTR_X, ORIG_CTR_Y = CTR_Y;

ZOOM = 16;

init();
animate();

var load_tile = function(lat, lng) {
  var tile_x = long2tile(lng, ZOOM);
  var tile_y = lat2tile(lat, ZOOM);
  console.log(tile_x, tile_y);
  $.getJSON( "http://tile.mapzen.com/mapzen/vector/v1/all/" + ZOOM + "/" + tile_x + "/" + tile_y + ".json?api_key=" + MAPZEN_API_KEY,function( data ) {
    add_buildings(data.buildings);
    add_roads(data.roads);
    add_pois(data.pois);
    add_landuse(data.landuse);
  });
}

var to_screen_coords = function(coord){
  return [(coord[0] - CTR_X) * SCALE, (coord[1] - CTR_Y) * SCALE];
}


var add_buildings = function(geojson){
  add_geojson({
    geojson: geojson,
    color: 0x999999,
    height: 'a'
  })
};

var add_roads = function(geojson){
  add_geojson({
    geojson: geojson,
    color: 0x333333,
    height: 1
  });
};

var add_pois = function(geojson){
  console.log(geojson);
  add_geojson({
    geojson: geojson,
    color: 0xFF0000,
    height: 20
  });
}

var add_landuse = function(geojson){
  console.log(geojson);
  add_geojson({
    geojson: geojson,
    color: 0xFFFF00,
    height: 2
  });
}

FEATURE_INFO = {
  path: 3,
  minor_road: 6,
  major_road: 9
}

function long2tile(lon,zoom) {
  return (Math.floor((lon+180)/360*Math.pow(2,zoom)));
}
function lat2tile(lat,zoom) {
  return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)));
}

setInterval(function(){
  // update the map arrow.
  var vector = controls.getObject().getWorldDirection();
  var theta = -Math.atan2(vector.x,vector.z) + Math.PI/2;
  $('.arrow-marker-inner').css({
    'transform': 'rotateZ(' + theta + 'rad)'
  });
  arrow_marker.setLatLng(new L.LatLng(CTR_Y, CTR_X));
},100);

MAP_CACHE = {};

setInterval(function(){
  
  minimap.panTo(new L.LatLng(CTR_Y, CTR_X), {animate: false});
}, 500);

load_tile(CTR_Y, CTR_X);

var add_geojson = function(opts){

  opts.geojson.features.forEach(function(feature){

    if (feature.geometry.type === 'LineString' || feature.geometry.type === 'Point' || feature.geometry.type === 'MultiLineString') {
      var width;
      if (FEATURE_INFO[feature.properties.kind]) width = FEATURE_INFO[feature.properties.kind];
      width = width || 1;
      feature = turf.buffer(feature, width, 'meters')
    }
    var shape = new THREE.Shape();
    if (feature.geometry.type === 'MultiPolygon') {
      var coords = feature.geometry.coordinates[0][0] // TODO: all coords.
    } else {
      var coords = feature.geometry.coordinates[0]
    }


    var point = to_screen_coords(coords[0]);
    shape.moveTo(point[0], point[1]);

    coords.slice(1).forEach(function(coord){
      var point = to_screen_coords(coord);
      shape.lineTo(point[0], point[1]);
    });

    var point = to_screen_coords(coords[0]);
    shape.lineTo(point[0], point[1]);

    //var length = 12, width = 8;

    /*shape.moveTo( 0,0 );
    shape.lineTo( length, width );
    shape.lineTo( length, 0 );
    shape.lineTo( 0, 0 );*/

    var extrudeSettings = {
      steps: 1,
      amount: (opts.height === 'a') ? Math.sqrt(feature.properties.area) : opts.height || 1,
      bevelEnabled: false
    };

    var geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
    geometry.rotateX( - Math.PI / 2 );

    var material = new THREE.MeshLambertMaterial( { color: typeof opts.color === 'undefined' ? 0x00ff00 : opts.color } );
    var mesh = new THREE.Mesh( geometry, material ) ;
    scene.add( mesh );

    var name = feature.name || feature.properties.name;

    if (name){
      var spos = toScreenPosition(mesh, camera);
    }

  });  
}


function toScreenPosition(obj, camera)
{
    var vector = new THREE.Vector3();

    var widthHalf = 0.5*renderer.context.canvas.width;
    var heightHalf = 0.5*renderer.context.canvas.height;

    obj.updateMatrixWorld();
    vector.setFromMatrixPosition(obj.matrixWorld);
    vector.project(camera);

    vector.x = ( vector.x * widthHalf ) + widthHalf;
    vector.y = - ( vector.y * heightHalf ) + heightHalf;

    return { 
        x: vector.x,
        y: vector.y
    };

};


function init() {

  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );

  scene = new THREE.Scene();

  var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
  light.position.set( 0.5, 1, 0.75 );
  scene.add( light );

  var geometry = new THREE.PlaneBufferGeometry( 3000, 3000);
  geometry.rotateX( - Math.PI / 2 );
  var material = new THREE.MeshPhongMaterial( {color: 0xCCCCCC, side: THREE.DoubleSide} );
  var plane = new THREE.Mesh( geometry, material );
  scene.add( plane );


  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight ); 
  document.body.appendChild( renderer.domElement );

  controls = new THREE.PointerLockControls( camera );
  scene.add( controls.getObject() );

  raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

  window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
  requestAnimationFrame( animate );

  if ( controlsEnabled ) {
    raycaster.ray.origin.copy( controls.getObject().position );
    raycaster.ray.origin.y -= 10;
    //var intersections = raycaster.intersectObjects( objects );
    var isOnObject = false; //intersections.length > 0;
    var time = performance.now();
    var delta = ( time - prevTime ) / 1000;
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
    if ( moveForward ) velocity.z -= 400.0 * delta;
    if ( moveBackward ) velocity.z += 400.0 * delta;
    if ( moveLeft ) velocity.x -= 400.0 * delta;
    if ( moveRight ) velocity.x += 400.0 * delta;
    if ( isOnObject === true ) {
      velocity.y = Math.max( 0, velocity.y );
      canJump = true;
    }
    var cam = controls.getObject()
    cam.translateX( velocity.x * delta );
    cam.translateY( velocity.y * delta );
    cam.translateZ( velocity.z * delta );

    CTR_X = ORIG_CTR_X + cam.position.x / SCALE;
    CTR_Y = ORIG_CTR_Y - cam.position.z / SCALE;

    if ( cam.position.y < 10 ) {
      velocity.y = 0;
      controls.getObject().position.y = 10;
      canJump = true;
    }
    prevTime = time;
  }

  renderer.render( scene, camera );
}
