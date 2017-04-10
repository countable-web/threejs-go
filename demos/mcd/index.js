
var camera, scene, renderer, controls;

var init = function() {
  /* Standard THREE.JS stuff */
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.x = 10;
  camera.position.y = 85;
  camera.position.z = 150;

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
  scene.fog = new THREE.FogExp2( 0x0066, 0.0015 );

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
  controls.maxPolarAngle = Math.PI*.45;
  controls.minPolarAngle = Math.PI*.2;
  controls.target = new THREE.Vector3(0,0,0);

  scene.add( camera);

  onWindowResize = function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }
  onWindowResize();
  window.addEventListener( 'resize', onWindowResize, false );

  init_ground();
  init_ar();
  init_burgler();
  init_mcd();
  init_events();
};

var init_ground = function(){
  // Ground.
  var geometry = new THREE.PlaneBufferGeometry( 3000, 3000);
  geometry.rotateX( - Math.PI / 2 );
  var material = new THREE.MeshPhongMaterial( {color: 0x55AA00, side: THREE.DoubleSide} );
  var plane = new THREE.Mesh( geometry, material );
  plane.position.y = -1;
  scene.add( plane );
}

var ar_world, ar_geo;
var init_ar = function(){

  // AR Stuff

  var styles = {
    buildings: {
      color: 0x448800,
      height_scale: 0.1,
      //opacity: 0.3,
      extrude: 'rounded'
    },
    roads: {
        color: 0xDDAA00,
        height: 0.2,
        extrude: 'flat'
    },
    "McDonald's": {
      color: 0xffdd00,
      height_scale: 1
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

  ar_world = new ARTHREE.ARWorld({
    ground: true,
    camera: camera,
    controls: controls
  });

  ar_geo = new ARTHREE.ARMapzenGeography({
    styles: styles,
    camera: camera,
    controls: controls,
    lat: 41.886811,
    lng: -87.626186,
    minimap: false,
    layers: ['buildings','roads','water','landuse']
  });

};

var outlets = [];
var init_mcd = function(){


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


  var outlet_material = new THREE.MeshLambertMaterial( {
    //emissive: 0xFFFF00,
    color: 0xFFDD00,
    fog: false
  } );

  var deco_material = new THREE.MeshLambertMaterial( {
    fog: false,
    color: 0xffdd00
  } );

  var loader = new THREE.OBJLoader();
  loader.load( 'mcdo_arc_single.obj', function ( object ) {

    object.traverse( function ( child ) {
      if ( child instanceof THREE.Mesh ) {
        child.material = outlet_material;
      }
    } );


    mcds.forEach(function(point){
      var outlet = object.clone();
      outlet.rotateX(Math.PI/2);
      outlet.scale.set(1.2,1.2,1.2);
      outlet.position.y = 5;
      coords = ar_geo.to_scene_coords([point.lng, point.lat]);
      outlet.position.x = coords[0];
      outlet.position.z = coords[1];
      outlet.position.y = 90;
      scene.add( outlet );
      outlets.push(outlet);

      var geometry = new THREE.CylinderGeometry( 60, 60, 60, 32 );
      var cylinder = new THREE.Mesh( geometry, deco_material );
      cylinder.position.x = coords[0];
      cylinder.position.z = coords[1];
      cylinder.position.y = 0;
      scene.add( cylinder );

      var geometry2 = new THREE.CylinderGeometry( 20, 20, 10, 32 );
      var cylinder2 = new THREE.Mesh( geometry2, deco_material );
      cylinder2.position.x = coords[0];
      cylinder2.position.z = coords[1];
      cylinder2.position.y = 200;
      scene.add( cylinder2 );

      var geometry3 = new THREE.CylinderGeometry( 40, 40, 10, 32 );
      var cylinder3 = new THREE.Mesh( geometry3, deco_material );
      cylinder3.position.x = coords[0];
      cylinder3.position.z = coords[1];
      cylinder3.position.y = 150;
      scene.add( cylinder3 );

    });
  });
};


var init_events = function() {
  var button = document.getElementById('walk');
  button.addEventListener('mousedown', function(){
    ar_world.moveForward = true;
    button.className = 'depressed';
  });

  button.addEventListener('mouseup', function(){
    ar_world.moveForward = false;
    button.className = '';
  });
};


var init_burgler = function(){
  var texture = new THREE.Texture();

  var onProgress = function ( xhr ) {
    if ( xhr.lengthComputable ) {
      var percentComplete = xhr.loaded / xhr.total * 100;
      console.log( Math.round(percentComplete, 2) + '% downloaded' );
    }
  };

  var onError = function ( xhr ) {
  };


  var tloader = new THREE.ImageLoader( );
  tloader.load( 'hamburglar_diff.png', function ( image ) {

    texture.image = image;
    texture.needsUpdate = true;

  } );

  // model
  var burlgar;
  var loader = new THREE.OBJLoader( );
  loader.load( 'burglar.obj', function ( object ) {
    burglar = object;
    object.traverse( function ( child ) {

      if ( child instanceof THREE.Mesh ) {

        child.material.map = texture;
        child.material.side = THREE.DoubleSide;

        if (child.name.indexOf('hat')> -1) {
          console.log('hat')
          child.material = new THREE.MeshLambertMaterial( {
            color: 0x000000,
            side: THREE.DoubleSide
          } );
          child.scale.x = 2;
          child.scale.y = 2;
          child.scale.z = 2;
          child.position.y = 1;
        } else if (child.name.indexOf('iris') > -1) {
          console.log('riris')
          child.material = new THREE.MeshLambertMaterial( {
            color: 0x000000,
            side: THREE.DoubleSide,
            transparent: true
          } );
        } else if (child.name.indexOf('eyeball') > -1) {
          console.log('eye')
          child.material = new THREE.MeshLambertMaterial( {
            color: 0x000000,
            side: THREE.DoubleSide,
            transparent: true
          } );
          child.scale.x = 2;
          child.scale.y = 2;
          child.scale.z = 2;
          child.position.y = 1;
        } else {

        }
      }

    } );

    object.scale.x = 20;
    object.scale.y = 20;
    object.scale.z = 20;
    object.position.y = 0

    // shadow.
    var shadow_material = new THREE.MeshLambertMaterial( {
      color: 0x000000,
      opacity: 0.4,
      transparent: true
    } );
    var geometry4 = new THREE.CylinderGeometry( 13/20, 13/20, 1/20, 32 );
    var cylinder4 = new THREE.Mesh( geometry4, shadow_material );
    cylinder4.position.x = 0;
    cylinder4.position.z = 0;
    cylinder4.position.y = 0.01; //1/20;
    object.add( cylinder4 );

    scene.add( object );


  }, onProgress, onError );             
};


var animate = function() {
  requestAnimationFrame( animate );
  controls.update();
  ar_world.update({
    feature_meshes: ar_geo.feature_meshes
  });
  renderer.render( scene, camera );
  outlets.forEach(function(outlet){
    outlet.rotateZ(.03);
  });
  if (typeof burglar !== 'undefined'){
    burglar.position.x = controls.target.x;
    burglar.position.z = controls.target.z;
    burglar.rotation.y = camera.rotation.y;
  }
}


init();

var x = 0, y = 0;

var heartShape = new THREE.Shape();

heartShape.moveTo( x + 5, y + 5 );
heartShape.bezierCurveTo( x + 5, y + 5, x + 4, y, x, y );
heartShape.bezierCurveTo( x - 6, y, x - 6, y + 7,x - 6, y + 7 );
heartShape.bezierCurveTo( x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19 );
heartShape.bezierCurveTo( x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7 );
heartShape.bezierCurveTo( x + 16, y + 7, x + 16, y, x + 10, y );
heartShape.bezierCurveTo( x + 7, y, x + 5, y + 5, x + 5, y + 5 );

var geometry = new THREE.ShapeGeometry( heartShape );
var material = new THREE.MeshBasicMaterial( { color: 0xff4488 , side: THREE.DoubleSide} );
var mesh = new THREE.Mesh( geometry, material ) ;
mesh.position.y = 80;
mesh.rotation.z = Math.PI;
scene.add( mesh );

animate();
