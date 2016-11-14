var camera, scene, renderer, raycaster, touch_raycaster, INTERSECTED;


init();
animate();



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

  var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
  directionalLight.position.set( 1, 1, 1 );
  scene.add( directionalLight );

  var geometry = new THREE.PlaneBufferGeometry( 3000, 3000);
  geometry.rotateX( - Math.PI / 2 );
  var material = new THREE.MeshPhongMaterial( {color: 0x888888, side: THREE.DoubleSide} );
  var plane = new THREE.Mesh( geometry, material );
  scene.add( plane );

  scene.fog = new THREE.FogExp2( 0xccddee, 0.0025 );

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight ); 
  renderer.setClearColor( 0xddeeff );

  document.body.appendChild( renderer.domElement );

  controls = new THREE.PointerLockControls( camera );
  scene.add( controls.getObject() );

  raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );
  touch_raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 1, 0, 0 ), 0, 25 );

  onFontLoad(function(){
    for (var i=0;i<100;i++) {

      var sdf = writeSDF("abcdefg\njfdaskjf\nkdjlas");
      sdf.position.z = Math.random()*300-150;
      sdf.position.x = Math.random()*300-150;
      sdf.position.y = Math.random()*300-150;
      scene.add(sdf);
    }
  });
  
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

    // touching stuff.
    var vector = new THREE.Vector3(); // create once and reuse it!
    camera.getWorldDirection( vector );
    touch_raycaster.ray.origin.copy( controls.getObject().position );
    touch_raycaster.ray.direction = vector;

    var intersects = touch_raycaster.intersectObjects( scene.children );
    if ( intersects.length > 0 ) {

      if ( INTERSECTED != intersects[ 0 ].object ) {
        if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
        INTERSECTED = intersects[ 0 ].object;
        INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
        INTERSECTED.material.emissive.setHex( 0xff0000 );
        console.log(INTERSECTED.feature);
      }
    } else {
      if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
      INTERSECTED = null;
    }

    //standing on stuff.
    raycaster.ray.origin.copy( controls.getObject().position );
    raycaster.ray.origin.y -= 5;
    var intersections = raycaster.intersectObjects( scene_objects );
    var isOnObject = intersections.length > 0;

    var time = performance.now();
    var delta = ( time - prevTime ) / 1000;
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 10.0 * delta; // 100.0 = mass
    if ( moveForward ) {
      if (INTERSECTED) {
        if (velocity.y < 1000)
        velocity.y += 1.5 * 9.8 * 10.0 * delta;
      } else {
        velocity.z -= 400.0 * delta;
      }
    }
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

    player.lng = player.start_lng + cam.position.x / world.scale;
    player.lat = player.start_lat - cam.position.z / world.scale;

    if ( cam.position.y < 5 ) {
      velocity.y = 0;
      controls.getObject().position.y = 5;
      canJump = true;
    }
    prevTime = time;
  }

  renderer.render( scene, camera );
}
