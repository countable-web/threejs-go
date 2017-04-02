
var camera, scene, renderer, controls;

var init = function() {
  /* Standard THREE.JS stuff */
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.x = 10;
  camera.position.y = 65;
  camera.position.z = 100;

  scene = new THREE.Scene();

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
  renderer.setClearColor( 0x000066 );
  document.body.appendChild( renderer.domElement );

  // Fog to obscure distant tiling.
  scene.fog = new THREE.FogExp2( 0x0066, 0.003 );

  // first person controls.
  //controls = new THREE.PointerLockControls( camera );
  // if (is_mobile) {
  //   deviceorientation_controls = new THREE.DeviceOrientationControls(camera);
  // }
  controls = new THREE.OrbitControls( camera );
  controls.minDistance = 100;
  controls.maxDistance = 200;
  controls.enableDamping = true;
  controls.dampingFactor = .25;
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI*.4;   
  controls.target = new THREE.Vector3(0,0,0);

  scene.add( camera);

  onWindowResize = function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }
  onWindowResize();
  window.addEventListener( 'resize', onWindowResize, false );

  init_ground()
}

var init_ground = function(){

  // Ground.
  var geometry = new THREE.PlaneBufferGeometry( 3000, 3000);
  geometry.rotateX( - Math.PI / 2 );
  var material = new THREE.MeshPhongMaterial( {color: 0x00AA33, side: THREE.DoubleSide} );
  var plane = new THREE.Mesh( geometry, material );
  scene.add( plane );
}

init();

// AR Stuff

var styles = {
  buildings: {
    color: 0xDD3300,
    height_scale: 0.01
  },
  roads: {
      color: 0xFFDD00,
      height: 0.2
  },
  path: {
    width: 2
  },
  minor_road: {
    width: 3
  },
  major_road: {
    width: 4
  },
  highway: {
    width: 5
  },
};

var ar_world = new ARTHREE.ARWorld({
});

var ar_geo = new ARTHREE.ARMapzenGeography({
  styles: styles,
  lat: 41.886811,
  lng: -87.626186,
  minimap: true,
  layers: ['buildings','roads','water','landuse']
});

var mcds = [
  {
    lat: 41.883662,
    lng: -87.626041
  },
  {
    lat: 41.884704,
    lng: -87.629247
  },
  {
    lat: 41.886972,
    lng: -87.623054
  }
];

var outlets = [];

var material = new THREE.MeshLambertMaterial( {
  //emissive: 0xFFFF00,
  color: 0xFFDD00,
  fog: false
} );

var loader = new THREE.OBJLoader();
loader.load( 'mcdo_arc.obj', function ( object ) {
  object.traverse( function ( child ) {
    if ( child instanceof THREE.Mesh ) {
      child.material = material;
    }
  } );


  mcds.forEach(function(point){
    var outlet = object.clone();
    outlet.rotateX(Math.PI/2);
    outlet.scale.set(1.3,1.3,1.3);
    outlet.position.y = 5;
    coords = ar_geo.to_scene_coords([point.lng, point.lat]);
    outlet.position.x = coords[0];
    outlet.position.z = coords[1];
    scene.add( outlet );
    outlets.push(outlet)
  });
});

function animate() {
  requestAnimationFrame( animate );
  controls.update();
  renderer.render( scene, camera );
  outlets.forEach(function(outlet){
    outlet.rotateZ(.03);
  });
}

animate();
