var camera, scene, renderer, fall_raycaster, touch_raycaster, INTERSECTED;

function to_screen_position(obj, camera)
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

/**
 * create a shader material from shader programs/snippets.
 * @param fs_part just modifies vec3 color and float opacity.
 * @param vs_part just modifies mvPosition.
 */
function setup_shader(opts){
  return new THREE.ShaderMaterial( {
    transparent: true,
    uniforms: shader_uniforms,
    vertexShader: opts.vertex_shader ||
       "uniform float time;\n"
      +"varying vec3 worldPos;\n"
      +"void main()\n"
      +"{\n"
      +"  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n"
      +"  worldPos = position;\n"
      +opts.vs_part || ""
      +"  gl_Position = projectionMatrix * mvPosition;\n"
      +"}\n",
    fragmentShader: opts.fragment_shader ||
       "uniform vec2 resolution;\n"
      +"uniform float time;\n"
      +"varying vec3 worldPos;\n"
      +"void main(void)\n"
      +"{\n"
      +"  float opacity = 1.0;\n"
      +"  vec3 color = vec3(1.0,1.0,1.0);"
      +opts.fs_part || ""
      +"  gl_FragColor=vec4(color,opacity);\n"
      +"}\n",
  });
}

var feature_styles = {}; // global eature styling object.
function r3world(styles) {

  /* Standard THREE.JS stuff */
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
  scene = new THREE.Scene();

  var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
  light.position.set( 0.5, 1, 0.75 );
  scene.add( light );

  var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
  directionalLight.position.set( 1, 1, 1 );
  scene.add( directionalLight );
  

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight ); 
  renderer.setClearColor( 0xddeeff );
  document.body.appendChild( renderer.domElement );

  // Ground.
  var geometry = new THREE.PlaneBufferGeometry( 3000, 3000);
  geometry.rotateX( - Math.PI / 2 );
  var material = new THREE.MeshPhongMaterial( {color: 0x888888, side: THREE.DoubleSide} );
  var plane = new THREE.Mesh( geometry, material );
  scene.add( plane );

  onWindowResize();
  window.addEventListener( 'resize', onWindowResize, false );

  // Fog to obscure distant tiling.
  scene.fog = new THREE.FogExp2( 0xccddee, 0.005 );

  // first person controls.
  controls = new THREE.PointerLockControls( camera );
  // raycasters for collisions.
  scene.add( controls.getObject() );
  fall_raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );
  touch_raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 1, 0, 0 ), 0, 25 );

  // map feature styles.
  styles = styles || {};

  for (var k in DEFAULT_FEATURE_STYLES){
    feature_styles[k] = styles[k] || DEFAULT_FEATURE_STYLES[k]
  }

  for (var kind in feature_styles) {
    if (feature_styles[kind].fragment_shader || feature_styles[kind].vertex_shader) {
      feature_styles[kind].shader_material = setup_shader(feature_styles[kind]);
    }
  }

  animate();
}

function onWindowResize() {
  shader_uniforms.resolution.value.x = window.innerWidth;
  shader_uniforms.resolution.value.y = window.innerHeight;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

var getFeatureDesc = function(feat){
  return feat.name || feat.properties.name || feat.properties.address
    || (feat.dataset==='landuse' && feat.properties.landuse_kind)
    || (feat.properties.addr_street ? feat.properties.addr_street + ' - ' + feat.properties.addr_housenumber : null)
    || feat.properties.kind;
};

function clearIntersected(){
  if ( INTERSECTED ) {
    //INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
    scene.remove(INTERSECTED.sdf);
    if (INTERSECTED.feature.dataset == 'roads') INTERSECTED.scale.y -= .1;
    INTERSECTED = null;
  }
}

var update_player_focus = function() {

    // touching stuff.
    var vector = new THREE.Vector3(); // create once and reuse it!
    camera.getWorldDirection( vector );
    touch_raycaster.ray.origin.copy( controls.getObject().position );
    touch_raycaster.ray.origin.y -= 3;
    touch_raycaster.ray.direction = vector;

    // get closest object in target ray.
    var intersects = touch_raycaster.intersectObjects( scene.children );
    var closest = intersects.shift();
    while (closest && !closest.object.feature) closest = intersects.shift();

    if ( closest ) {

      if ( INTERSECTED !== closest.object ) {
        clearIntersected();

        INTERSECTED = closest.object;

        //INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
        //INTERSECTED.material.emissive.setHex( 0x333333 );  
        
        if (INTERSECTED.feature.dataset == 'roads') INTERSECTED.scale.y += .1;

        var desc = getFeatureDesc(INTERSECTED.feature);
        if (desc) {

          var sdf = writeSDF(desc);
          scene.add(sdf);
          INTERSECTED.sdf = sdf;
        }
      }
      INTERSECTED.distance = closest.distance;
    } else {
      clearIntersected();
    }
}

var shader_uniforms = {
  time:       { value: 1.0 },
  resolution: { value: new THREE.Vector2() }
};

var clock = new THREE.Clock();

function animate() {
  requestAnimationFrame( animate );
  var time = performance.now();
  var delta = ( time - prevTime ) / 1000;

  shader_uniforms.time.value += clock.getDelta() * 5;

  if ( controlsEnabled ) {

    update_player_focus();

    //standing on stuff.
    fall_raycaster.ray.origin.copy( controls.getObject().position );
    fall_raycaster.ray.origin.y -= 5;

    var intersections = fall_raycaster.intersectObjects( feature_meshes ).filter(function(intersection){
      return !!intersection.object.feature;
    });
    var isOnObject = intersections.length > 0;

    // friction.
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    // gravity
    velocity.y -= 9.8 * 3.0 * delta;

    if ( moveForward ) { 
      if (INTERSECTED && INTERSECTED.distance < 5) {
        velocity.x = 0;
        velocity.z = 0;
        velocity.y = 1500 * delta;
        //velocity.y += 1.5 * 9.8 * 10.0 * delta;
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

    // apply velocity to position dx/dt dy/dt dz/dt
    var cam = controls.getObject()
    cam.translateX( velocity.x * delta );
    cam.translateY( velocity.y * delta );
    cam.translateZ( velocity.z * delta );

    // keep latitude and longitude up to date for tile loading.
    player.lng = player.start_lng + cam.position.x / world.scale;
    player.lat = player.start_lat - cam.position.z / world.scale;

    // no falling through the ground.
    if ( cam.position.y < 5 ) {
      velocity.y = 0;
      controls.getObject().position.y = 5;
      canJump = true;
    }
    
    update_scene_label();

    prevTime = time;
  }

  renderer.render( scene, camera );
}

var update_scene_label = function(){

  if (INTERSECTED && INTERSECTED.sdf){
    var sdf = INTERSECTED.sdf;
    sdf.scale.set(0.01, 0.01, 0.01);
    
    //position
    var vector = new THREE.Vector3();
    vector.copy(camera.getWorldPosition())
    var offset = new THREE.Vector3();
    offset.copy(camera.getWorldDirection());
    offset.multiplyScalar(3);
    vector.add(offset);
    vector.multiplyScalar(0.2);
    sdf.position.multiplyScalar(0.8);
    sdf.position.add(vector);

    //rotation
    var vector2 = sdf.parent.worldToLocal( camera.getWorldPosition() );
    sdf.lookAt( vector2 );
    sdf.rotateX(Math.PI);      
  }

}

