
var camera, scene, renderer, controls;
var is_day;
var lat, lng;

var init = function() {
  /* Standard THREE.JS stuff */
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );

  scene = new THREE.Scene();

  var hour = (new Date()).getHours();
  is_day = (hour > 7 && hour < 20);
  var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
  light.position.set( 0.5, 1, 0.75 );
  scene.add( light );

  var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
  directionalLight.position.set( 1000, 1000, 1000 );
  scene.add( directionalLight );

  var directionalLight2 = new THREE.DirectionalLight( 0xffffff, 0.5 );
  directionalLight2.position.set( -1000, 1000, 1000 );
  scene.add( directionalLight );

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight ); 
  if (is_day) {
    renderer.setClearColor( 0xddeeff );
    scene.fog = new THREE.FogExp2( 0xddeeff, 0.0015 );
  } else {
    // night.
    renderer.setClearColor( 0x000066 );
    scene.fog = new THREE.FogExp2( 0x000066, 0.0015 );
  }
  document.body.appendChild( renderer.domElement );

  if (THREE.is_mobile) {
    //controls = new THREE.DragMouseControls(camera);
    //controls.orientation.y = 5.3; //+ Math.PI;
    controls = new THREE.DeviceOrientationControls(camera);
  } else {
    controls = new THREE.WASDControls( camera );
  }
  scene.add( controls.getObject() );

  onWindowResize = function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }
  onWindowResize();
  window.addEventListener( 'resize', onWindowResize, false );

  init_ground();
  if (THREE.is_mobile || true) {
    init_geo({coords:{latitude: 49.20725849999999, longitude: -122.90213449999999}});
    // navigator.geolocation.getCurrentPosition(init_geo);
  } else {
    init_geo({coords:{latitude: 41.886811, longitude: -87.626186}});
  }

};

var init_geo = function(position) {
  lat = position.coords.latitude;
  lng = position.coords.longitude;
  init_ar();
  animate();
};

var init_ground = function(){
  // Ground.
  var geometry = new THREE.PlaneBufferGeometry( 3000, 3000);
  geometry.rotateX( - Math.PI / 2 );
  var material = new THREE.MeshPhongMaterial( {
    color: 0x55AA00,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  } );
  var plane = new THREE.Mesh( geometry, material );
  plane.position.y = -2;
  scene.add( plane );
}

var ar_world, ar_geo;
var init_ar = function(){

  // AR Stuff

  ar_world = new THREE.ARWorld({
    ground: true,
    gravity: true,
    camera: camera,
    controls: controls
  });

  ar_geo = new THREE.ARMapzenGeography({
    styles: styles,
    camera: camera,
    controls: controls,
    lat: lat,
    lng: lng,
    minimap: false,
    layers: ['buildings','roads','water','landuse']
  });

};


var prevTime = performance.now();

var animate = function() {
  var time = performance.now();
  var delta = ( time - prevTime ) / 1000;

  requestAnimationFrame( animate );

  if (controls.update) controls.update();
  if (THREE.is_mobile) {
    //orientationcontrols.updateAlphaOffsetAngle(controls.orientation.y);
  } else {
    //dragcontrols.update();
  }

  ar_world.update({
    feature_meshes: ar_geo.feature_meshes
  });

  renderer.render( scene, camera );

  prevTime = time;
}

init();

