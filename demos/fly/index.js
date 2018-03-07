var camera, scene, renderer, controls = null;

var init = function() {
    /* Standard THREE.JS stuff */
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.x = 0;
    camera.position.y = 1000;
    camera.position.z = 200;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    scene = new THREE.Scene();

    var light = new THREE.HemisphereLight(0xeeeeff, 0xffffff, 0.75);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(-1000, 1000, 1000);
    scene.add(directionalLight);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xddeeff);
    //scene.fog = new THREE.FogExp2( 0xddeeff, 0.0015 );

    document.body.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = true;
    controls.dampingFactor = 0.25;

    scene.add(camera);

    onWindowResize = function() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    onWindowResize();
    window.addEventListener('resize', onWindowResize, false);

    world_position = {
        coords: {
            latitude: 49.20725849999999,
            longitude: -122.90213449999999
        }
    };

    init_ar(world_position.coords.latitude, world_position.coords.longitude);
    animate();
};


var marker = new THREE.Object3D();
var init_geo = function(position) {};


var ar_world, ar_geo;
var init_ar = function(lat, lng) {

    // AR Stuff
    ar_world = new THREE.ARWorld({
        ground: true,
        camera: camera,
    });

    ar_geo = new THREE.ARMapzenGeography({
        styles: styles,
        marker: marker,
        lat: lat,
        lng: lng,
        layers: [
            //'buildings',
            'roads',
            'water',
            'landuse'
        ]
    });

};


var animate = function() {
    if (controls) {
        controls.update();
    }
    requestAnimationFrame(animate);
    ar_world.update();
    renderer.render(scene, camera);
}


init();
