
var camera, scene, renderer, controls;
var lat, lng;

var init = function() {
  /* Standard THREE.JS stuff */
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );

  scene = new THREE.Scene();

  var hour = (new Date()).getHours();
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
  renderer.setClearColor( 0xddeeff );
  scene.fog = new THREE.FogExp2( 0xddeeff, 0.0015 );
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
var init_ar = function(lat, lng){

  // AR Stuff

  ar_world = new THREE.ARWorld({
    camera: camera
  });

  ar_geo = new THREE.ARMapzenGeography({
    styles: styles,
    lat: lat,
    lng: lng,
    layers: ['buildings','roads','water','landuse']
  });

};

var fall_raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

var prevTime = performance.now();

var animate = function() {
  var time = performance.now();
  var delta = ( time - prevTime ) / 1000;

  requestAnimationFrame( animate );

  if (controls && controls.update) controls.update();

  ar_world.update();

  // touching stuff.
  //this.update_player_focus();

  //standing on stuff.
  /*
  fall_raycaster.ray.origin.copy( controls.getObject().position );
  fall_raycaster.ray.origin.y -= 5;

  var intersections = fall_raycaster.intersectObjects( params.feature_meshes ).filter(function(intersection){
    return !!intersection.object.feature;
  });

  var isOnObject = intersections.length > 0;
  */
  var isOnObject = true;

  // friction.
  controls.velocity.x -= controls.velocity.x * 10.0 * delta;
  controls.velocity.z -= controls.velocity.z * 10.0 * delta;
  
  // gravity
  controls.velocity.y -= 9.8 * 3.0 * delta;

  if ( controls.moveForward ) { 
    if (ar_world.touching && ar_world.touching.distance < 5) {
      controls.velocity.x = 0;
      controls.velocity.z = 0;
      controls.velocity.y = 1500 * delta;
      //velocity.y += 1.5 * 9.8 * 10.0 * delta;
    } else {
      controls.velocity.z -= 400.0 * delta;
    }
  }
  
  if ( controls.moveBackward ) controls.velocity.z += 400.0 * delta;
  if ( controls.moveLeft ) controls.velocity.x -= 400.0 * delta;
  if ( controls.moveRight ) controls.velocity.x += 400.0 * delta;

  if ( isOnObject === true ) {
    controls.velocity.y = Math.max( 0, controls.velocity.y );
    controls.canJump = true;
  }
  // no falling through the ground.
  if ( camera.position.y < 5 ) {
    controls.velocity.y = 0;
    camera.position.y = 5;
    controls.canJump = true;
  }

  // apply velocity to position dx/dt dy/dt dz/dt
  var proxy = controls.getObject();
  proxy.translateX( controls.velocity.x * delta );
  proxy.translateY( controls.velocity.y * delta );
  proxy.translateZ( controls.velocity.z * delta );

  renderer.render( scene, camera );

  prevTime = time;
}

init();

