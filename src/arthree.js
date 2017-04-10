
ARTHREE = {};

/**
 *  Get browser viewport coords from a scene object.
 */
ARTHREE.to_screen_position = function(obj, camera)
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


ARTHREE.ARWorld = (function(opts){


  var fall_raycaster, INTERSECTED;

  ARTHREE.isMobile = function () {
    var check = false;
    (function (a) {
      if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) {
        check = true;
      }
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
  };

  ARTHREE.is_mobile = ARTHREE.isMobile();

  ARTHREE.onWindowResize = function() {
      shader_uniforms.resolution.value.x = window.innerWidth;
      shader_uniforms.resolution.value.y = window.innerHeight;
  };

  var ARWorld = function(opts) {

    this.opts = opts;

    if (!this.opts.camera){
      throw new Error("opts.camera is required.");
    }
    ARTHREE.onWindowResize();
    window.addEventListener( 'resize', ARTHREE.onWindowResize, false );


    // raycasters for collisions.
    fall_raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );
    this.touch_raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 1, 0, 0 ), 0, 25 );

  }

  var velocity = new THREE.Vector3();

  ARWorld.prototype.update = function(params) {
    var time = performance.now();
    var delta = ( time - prevTime ) / 1000;

    shader_uniforms.time.value += clock.getDelta() * 5;

    // touching stuff.
    this.update_player_focus();

    if ( this.opts.ground ) {

      //standing on stuff.
      fall_raycaster.ray.origin.copy( this.opts.camera.position );
      fall_raycaster.ray.origin.y -= 5;

      var intersections = fall_raycaster.intersectObjects( params.feature_meshes ).filter(function(intersection){
        return !!intersection.object.feature;
      });
      var isOnObject = intersections.length > 0;
    }

    // friction.
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    
    // gravity
    if (this.opts.gravity) {
      velocity.y -= 9.8 * 3.0 * delta;
    }

    if ( this.moveForward ) { 
      if (this.opts.collisions && INTERSECTED && INTERSECTED.distance < 5) {
        velocity.x = 0;
        velocity.z = 0;
        if (this.opts.gravity) {
          velocity.y = 1500 * delta;
        }
        //velocity.y += 1.5 * 9.8 * 10.0 * delta;
      } else {
        velocity.z -= 400.0 * delta;
      }
    }
    
    if ( this.moveBackward ) velocity.z += 400.0 * delta;
    if ( this.moveLeft ) velocity.x -= 400.0 * delta;
    if ( this.moveRight ) velocity.x += 400.0 * delta;

    if (this.opts.gravity) {
      if ( isOnObject === true ) {
        velocity.y = Math.max( 0, velocity.y );
        canJump = true;
      }
      // no falling through the ground.
      if ( this.opts.camera.position.y < 5 ) {
        velocity.y = 0;
        this.opts.camera.position.y = 5;
        canJump = true;
      }
      
    }

    // apply velocity to position dx/dt dy/dt dz/dt
    this.opts.camera.translateX( velocity.x * delta );
    this.opts.camera.translateY( velocity.y * delta );
    this.opts.camera.translateZ( velocity.z * delta );
    // apply velocity to position dx/dt dy/dt dz/dt
    this.opts.controls.target.x += velocity.x * delta;
    this.opts.controls.target.y += velocity.y * delta;
    this.opts.controls.target.z += velocity.z * delta;
    this.update_scene_label();

    prevTime = time;
    

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

  ARWorld.prototype.update_player_focus = function() {

      // touching stuff.
      if (controls) {
        var vector = new THREE.Vector3(); // create once and reuse it!
        this.opts.camera.getWorldDirection( vector );
        this.touch_raycaster.ray.origin.copy( this.opts.camera.position );
        this.touch_raycaster.ray.origin.y -= 3;
        this.touch_raycaster.ray.direction = vector;

        // get closest object in target ray.
        var intersects = this.touch_raycaster.intersectObjects( scene.children );
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

              var sdf = new ARTHREE.ARText(desc);
              scene.add(sdf.text);
              INTERSECTED.sdf = sdf;
            }
          }
          INTERSECTED.distance = closest.distance;
        } else {
          clearIntersected();
        }
      }
  }

  var shader_uniforms = {
    time:       { value: 1.0 },
    resolution: { value: new THREE.Vector2() }
  };

  var clock = new THREE.Clock();

  var prevTime = performance.now();

  ARWorld.prototype.update_scene_label = function(){

    if (INTERSECTED && INTERSECTED.sdf){
      var sdf = INTERSECTED.sdf;
      sdf.text.scale.set(0.01, 0.01, 0.01);
      
      //position
      var vector = new THREE.Vector3();
      vector.copy(this.opts.camera.getWorldPosition())
      var offset = new THREE.Vector3();
      offset.copy(this.opts.camera.getWorldDirection());
      offset.multiplyScalar(3);
      vector.add(offset);
      vector.multiplyScalar(0.2);
      sdf.text.position.multiplyScalar(0.8);
      sdf.text.position.add(vector);

      //rotation
      var vector2 = sdf.text.parent.worldToLocal( this.opts.camera.getWorldPosition() );
      sdf.text.lookAt( vector2 );
      sdf.text.rotateX(Math.PI);

    }

  };

  return ARWorld;

})();
