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

  
  window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

var getFeatureDesc = function(feat){
  return feat.name || feat.properties.name || feat.properties.address
    || (feat.dataset==='landuse' && feat.properties.landuse_kind) || feat.properties.kind;
};

function clearIntersected(){
  if ( INTERSECTED ) {
    INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
    scene.remove(INTERSECTED.sdf);
    if (INTERSECTED.feature.dataset == 'roads') INTERSECTED.scale.y -= .1;
    INTERSECTED = null;
  }
}

var vector;
function animate() {
  requestAnimationFrame( animate );

  if ( controlsEnabled ) {

    // touching stuff.
    vector = new THREE.Vector3(); // create once and reuse it!
    camera.getWorldDirection( vector );
    touch_raycaster.ray.origin.copy( controls.getObject().position );
    touch_raycaster.ray.origin.y -= 3;
    touch_raycaster.ray.direction = vector;

    var intersects = touch_raycaster.intersectObjects( scene.children );

    var closest = intersects.shift();
    while (closest && !closest.object.feature) closest = intersects.shift();

    if ( closest ) {

      if ( INTERSECTED != closest.object ) {
        clearIntersected();

        INTERSECTED = closest.object;

        INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
        INTERSECTED.material.emissive.setHex( 0x333333 );  
        
        if (INTERSECTED.feature.dataset == 'roads') INTERSECTED.scale.y += .1;

        console.log(closest, getFeatureDesc(INTERSECTED.feature));

        var desc = getFeatureDesc(INTERSECTED.feature);
        if (desc) {

          var sdf = writeSDF(desc);
          scene.add(sdf);
          INTERSECTED.sdf = sdf;
        }
      }
    } else {
      clearIntersected();
    }


    //standing on stuff.
    raycaster.ray.origin.copy( controls.getObject().position );
    raycaster.ray.origin.y -= 5;

    var intersections = raycaster.intersectObjects( scene_objects ).filter(function(obj){
      return !!obj.feature;
    });

    var isOnObject = intersections.length > 0;

    var time = performance.now();
    var delta = ( time - prevTime ) / 1000;
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 10.0 * delta; // 100.0 = mass
    if ( moveForward ) { 
      if (INTERSECTED && false) { //spidermode
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
    
    if (INTERSECTED && INTERSECTED.sdf){
      var sdf = INTERSECTED.sdf;
      sdf.scale.set(0.02, 0.02, 0.02);
      
      //position
      vector = new THREE.Vector3();
      vector.copy(camera.getWorldPosition())
      var offset = new THREE.Vector3();
      offset.copy(camera.getWorldDirection());
      offset.multiplyScalar(4);
      vector.add(offset);
      sdf.position.copy(vector);

      //rotation
      var vector2 = sdf.parent.worldToLocal( camera.getWorldPosition() );
      sdf.lookAt( vector2 );
      sdf.rotateX(Math.PI);      
    }  

    prevTime = time;
  }


  renderer.render( scene, camera );
}
