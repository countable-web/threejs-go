
var camera, scene, renderer, controls;
var is_day;
var lat, lng;

var init = function() {
  /* Standard THREE.JS stuff */
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.x = 10;
  camera.position.y = 85;
  camera.position.z = 150;

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
    controls = new THREE.OrbitControls( camera );
    controls.minDistance = 100;
    controls.maxDistance = 200;
    controls.enableDamping = true;
    controls.dampingFactor = .25;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI*.45;
    controls.minPolarAngle = Math.PI*.2;
    controls.target = new THREE.Vector3(0,0,0);
  }
  scene.add( camera);

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
  init_burgler();
  init_mcd();
  init_events();
  init_heart();
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

var init_burgers = function(){
  var textureLoader = new THREE.TextureLoader();
  var geometry = new THREE.PlaneGeometry( 25, 25, 1, 1);  
  var plane_tex = textureLoader.load("burger.png");
  var plane_material = new THREE.MeshBasicMaterial( {
    map: plane_tex,
    side: THREE.DoubleSide,
    transparent: true
  } );
  var plane = new THREE.Mesh( geometry, plane_material );
  plane.rotation.x = Math.PI/2;
  plane.position.y = 1;
  plane.position.x = 30;
  plane.position.z = -50;
  plane.renderOrder = 3;
  scene.add(plane);
  return plane;
}

var ar_world, ar_geo;
var init_ar = function(){

  // AR Stuff

  ar_world = new THREE.ARWorld({
    ground: true,
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

  controls.update();
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
