
var camera, scene, renderer, controls;

THREE.is_daytime = true;

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
  if (THREE.is_daytime) {
    renderer.setClearColor( 0xddeeff );
    scene.fog = new THREE.FogExp2( 0xddeeff, 0.0015 );
  } else {
    // night.
    renderer.setClearColor( 0x000066 );
    scene.fog = new THREE.FogExp2( 0x000066, 0.0015 );
  }
  document.body.appendChild( renderer.domElement );

  /*if (THREE.is_mobile) {
    //controls = new THREE.DragMouseControls(camera);
    //controls.orientation.y = 5.3; //+ Math.PI;
    controls = new THREE.DeviceOrientationControls(camera);
  } else {*/
    controls = new THREE.OrbitControls( camera );
    controls.minDistance = 100;
    controls.maxDistance = 200;
    controls.enableDamping = true;
    controls.dampingFactor = .25;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI*.45;
    controls.minPolarAngle = Math.PI*.2;
    controls.target = new THREE.Vector3(0,0,0);
  //}
  scene.add( camera);

  onWindowResize = function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }
  onWindowResize();
  window.addEventListener( 'resize', onWindowResize, false );

  if (THREE.is_daytime) {
    init_skyball();
  }
  init_ground();

  //init_burgers();

  if (THREE.is_mobile) {
    alert('mob');
    navigator.geolocation.getCurrentPosition(init_geo);
  } else {
    init_geo({coords:{latitude: 49.20725849999999, longitude: -122.90213449999999}});
    //init_geo({coords:{latitude: 41.886811, longitude: -87.626186}});
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
    color: 0x448888,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1
  } );
  var plane = new THREE.Mesh( geometry, material );
  plane.position.y = -3;
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
  });

  ar_geo = new THREE.ARMapzenGeography({
    styles: styles,
    lat: lat,
    lng: lng,
    layers: ['buildings','roads','water','landuse']
  });

};



var outlet_material = new THREE.MeshLambertMaterial( {
  //emissive: 0xFFFF00,
  color: 0xFFDD00,
  fog: false
} );

// shadow.
var shadow_material = new THREE.MeshLambertMaterial( {
  color: 0x000000,
  opacity: 0.3,
  transparent: true
} );

var outlets = [];
var init_mcd = function(){


  var mcds = [
    {
      lat: lat + .0015,
      lng: lng + .0015
    },
    {
      lat: lat - .0015,
      lng: lng + .0015
    },
    {
      lat: lat + .0015,
      lng: lng - .0015
    }
  ];

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
      coords = ar_geo.to_scene_coords([point.lng, point.lat]);
      outlet.position.x = coords[0];
      outlet.position.z = coords[1];
      outlet.position.y = 50;

      scene.add( outlet );
      outlets.push(outlet);
      outlet.cylinders = [];
      outlet.spheres = [];

      [
        [60,1,4]
      ].forEach(function(params){
        var geometry = new THREE.CylinderGeometry( params[0], params[0], params[1], 32 );
        var cylinder = new THREE.Mesh( geometry, shadow_material );
        cylinder.position.x = coords[0];
        cylinder.position.z = coords[1];
        cylinder.position.y = params[2];
        cylinder.renderOrder = 4;
        cylinder.start_position = cylinder.position.clone();
        scene.add( cylinder );
        outlet.cylinders.push(cylinder);
      });

      var geo = new THREE.SphereGeometry( 15, 10, 10);
      var sphere = new THREE.Mesh( geo, outlet_material );
      sphere.position.x = coords[0];
      sphere.position.z = coords[1];
      sphere.position.y = 120;
      sphere.start_position = sphere.position.clone();
      outlet.spheres.push(sphere);
      scene.add(sphere);

    });
  });
};


var init_events = function() {
  var button = document.getElementById('walk');
  /*button.addEventListener('mousedown', function(){
    ar_world.moveForward = true;
    button.className = 'depressed';
  });

  button.addEventListener('mouseup', function(){
    ar_world.moveForward = false;
    button.className = '';
  });*/

  button.addEventListener('click', function(){
    navigator.geolocation.getCurrentPosition(function(position) {
      ar_geo.player.lat = position.coords.latitude;
      ar_geo.player.lng = position.coords.longitude;
      ar_geo.player.start_lng = ar_geo.player.lng, ar_geo.player.start_lat = ar_geo.player.lat;
      load_tiles(ar_geo.player.lat, ar_geo.player.lng);
    });
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
  tloader.load( 'hamburglar_diff_small.png', function ( image ) {

    texture.image = image;
    texture.needsUpdate = true;

  } );

  // model
  var burlgar;
  var loader = new THREE.OBJLoader( );
  loader.load( 'hamburglar_OBJ.obj', function ( object ) {
    burglar = object;
    object.traverse( function ( child ) {

      if ( child instanceof THREE.Mesh ) {

        child.material.map = texture;
        child.material.side = THREE.DoubleSide;
        child.material.shading = THREE.SmoothShading;
      }

    } );

    object.position.y = 0;

    var geometry4 = new THREE.CylinderGeometry( 17, 17, 1, 32 );
    var cylinder4 = new THREE.Mesh( geometry4, shadow_material );
    cylinder4.position.x = 0;
    cylinder4.position.z = 0;
    cylinder4.position.y = 4; //1/20;
    cylinder4.renderorder = 4;
    object.add( cylinder4 );
    scene.add( object );

  }, onProgress, onError );             
};

var init_skyball = function(){
  var geometry = new THREE.SphereGeometry( 5000, 60, 40 );
  geometry.scale( - 1, 1, 1 );
  var material = new THREE.MeshBasicMaterial( {
    map: new THREE.TextureLoader().load( 'imgpsh_fullsize.png' ),
    fog: false
  } );
  mesh = new THREE.Mesh( geometry, material );
  scene.add( mesh );
};

var prevTime = performance.now();

var animate = function() {
  var time = performance.now();
  var delta = ( time - prevTime ) / 1000;

  requestAnimationFrame( animate );

  /*
  ar_geo.feature_meshes.forEach(function(fm){
    if (fm.feature.layername == 'buildings') {
      fm.scale.y = Math.cos(time/500 + (fm.feature.properties.area || 0)) + 1.5;
    }
  });
  */

  controls.update();

  ar_world.update();

  outlets.forEach(function(outlet){
    outlet.rotateZ(.015);
    outlet.cylinders.forEach(function(cylinder, i){
      //cylinder.position.y = cylinder.start_position.y + (i+1) * 2 * Math.cos(time/200/(i+1));
    })
    outlet.spheres.forEach(function(sphere, i){
      sphere.position.y = sphere.start_position.y + (i+1) * 2 * Math.cos(time/200/(i+1));
      sphere.scale.y=Math.cos(time/600/(i+1));
      sphere.scale.z=Math.cos(time/600/(i+1));
      sphere.scale.x=Math.cos(time/600/(i+1));
      /*sphere.position.x = sphere.start_position.x + Math.cos(time/300) * (Math.sin(time/500) * 3 + 6)
      sphere.position.z = sphere.start_position.z + Math.sin(time/300) * (Math.sin(time/500) * 3 + 6)*/
    })
  });

  if (typeof burglar !== 'undefined'){
    burglar.scale.x = .6 + .06 * Math.sin(time/500);
    burglar.scale.z = .6 + .06 * Math.sin(time/500);
    burglar.scale.y = .6 + .03 * Math.cos(time/500);
  }

  heart.position.y = 65 + Math.cos(time/1500) * 5;
  heart.scale.x = (1 - 0.1*Math.cos(time/200) );
  heart.scale.y = (1 - 0.1*Math.cos(time/200) );
  heart.scale.z = (1 - 0.1*Math.cos(time/200) );

  renderer.render( scene, camera );

  prevTime = time;
}

var heart;
init_heart = function(){
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
  var material = new THREE.MeshBasicMaterial( { color: 0xff4400 , side: THREE.DoubleSide} );
  heart = new THREE.Mesh( geometry, material ) ;
  heart.position.y = 60;
  heart.position.x = 5;
  heart.position.z = 0;
  heart.rotation.z = Math.PI;
  scene.add( heart );
}

function onClick( event ) {
  event.preventDefault();
  var mouse = new THREE.Vector2();
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  ar_world.touch_raycaster.setFromCamera( mouse, camera );
  ar_world.updateSelection();
}
document.addEventListener( 'click', onClick );

if (window.location.host === "countable-web.github.io") {

}

init();
