var camera, scene, renderer, controls;

/* global THREE */

// Force to always be daytime for now.
THREE.is_daytime = (new Date()).getHours() > 6 && (new Date()).getHours() < 19;

var update_environment = function () {
    var color;
    sky.visible = false;
    if (THREE.current_weather === "snow") {
        particleSystem.visible = true;
        particleSystem.material = snow_material;
        color = 0xdef1f7;
        precip_velocity = -1;
        if (THREE.is_daytime) {
            sky.visible = true;
        }
    } else if (THREE.current_weather === "rain") {
        precip_velocity = -4;
        particleSystem.visible = true;
        color = 0xdef1f7;
        particleSystem.material = rain_material;
        if (THREE.is_daytime) {
            sky.visible = true;
        }
    } else if (THREE.current_weather === "cloudy") {
        particleSystem.visible = false;
        color = 0xdef1f7;
        if (THREE.is_daytime) {
            sky.visible = true;
        }
    } else if (THREE.current_weather === "sun") {
        particleSystem.visible = false;
        color = 0x90fefa
    } else {
        console.error('invalid weather: ', THREE.current_weather)
    }

    var pCount = 500;
    while (pCount--) {
        var particle = precip.vertices[pCount];
        particle.velocity.y = precip_velocity;
    }

    document.querySelectorAll(".active").forEach(function (el) {
        el.className = '';
    })
    document.querySelector('[data-value="' + THREE.current_weather + '"]').className = 'active';
    document.querySelector('[data-value="' + (THREE.is_daytime ? "day" : "night") + '"]').className = 'active';

    if (THREE.is_daytime) {
        day_light.visible = true
        day_directionalLight2.visible = true
        day_directionalLight3.visible = (THREE.current_weather === "sun")
        night_light.visible = false
        night_directionalLight2.visible = false
    } else {
        color = 0x000066;
        day_light.visible = false
        day_directionalLight2.visible = false
        day_directionalLight3.visible = false
        night_light.visible = true
        night_directionalLight2.visible = true
    }
    console.log(color);
    renderer.setClearColor(color);
    scene.fog = new THREE.FogExp2(color, 0.0025);
}

var set_weather = function (weather) {
    THREE.current_weather = weather;
    update_environment()
}

var set_night = function () {
    THREE.is_daytime = false;
    update_environment();
}
var set_day = function () {
    THREE.is_daytime = true;
    update_environment()
}

var day_light, day_directionalLight, day_directionalLight2, day_directionalLight3;
var night_light, night_directionalLight2;
var init = function () {
    /* Standard THREE.JS stuff */
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.x = 10;
    camera.position.y = 85;
    camera.position.z = 150;

    scene = new THREE.Scene();

    day_light = new THREE.HemisphereLight(0xffffee, 0x777788, 0.75);
    day_light.position.set(0.5, 1, 0.75);
    scene.add(day_light);
    day_directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    day_directionalLight.position.set(1000, 1000, 1000);
    scene.add(day_directionalLight);
    day_directionalLight3 = new THREE.DirectionalLight(0xffff88, 0.8);
    day_directionalLight3.position.set(1000, 1000, -1000);
    scene.add(day_directionalLight3);
    day_directionalLight2 = new THREE.DirectionalLight(0xffffdd, 0.4);
    day_directionalLight2.position.set(-1000, 1000, 1000);
    scene.add(day_directionalLight2);
    night_light = new THREE.HemisphereLight(0xaaaaff, 0x777788, 0.75);
    night_light.position.set(0.5, 1, 0.75);
    scene.add(night_light);
    night_directionalLight2 = new THREE.DirectionalLight(0xccccff, 0.7);
    night_directionalLight2.position.set(-1000, 1000, 1000);
    scene.add(night_directionalLight2);

    renderer = new THREE.WebGLRenderer();

    renderer.physicallyBasedShading = true;

    // Cineon matches our filmic mapping in our shaders, but makes lighting a bit flat, disabled.
    // renderer.toneMapping = THREE.ReinhardToneMapping;
    // renderer.toneMapping = THREE.CineonToneMapping;
    renderer.toneMapping = THREE.LinearToneMapping;
    // renderer.toneMapping = THREE.Uncharted2ToneMapping;
    // renderer.toneMappingExposure = 0.9;

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);

    if (!THREE.is_mobile) {
        //controls = new THREE.DragMouseControls(camera);
        //controls.orientation.y = 5.3; //+ Math.PI;
        //controls = new THREE.DeviceOrientationControls(camera);
        document.querySelector('.rotate-your-phone').style.display = 'none'
    }
    controls = new THREE.OrbitControls(camera);
    controls.minDistance = 100;
    controls.maxDistance = 200;
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI * 0.45;
    controls.minPolarAngle = Math.PI * 0.2;
    controls.target = new THREE.Vector3(0, 0, 0);

    scene.add(camera);

    var onWindowResize = function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    onWindowResize();
    window.addEventListener("resize", onWindowResize, false);

    init_skyball();


    init_ground();

    // init_burgers();

    navigator.geolocation.getCurrentPosition(init_geo, default_geo, {
        timeout: 5000
    });

    // init_geo({
    //     coords: {
    //         latitude: 49.2820,
    //         longitude: -123.1171
    //     }
    // });
};

var default_geo = function () {
    // new west
    if (window.location.host === "countable-web.github.io") {
        navigator.geolocation.getCurrentPosition(init_geo);
    } else {
        init_geo({
            coords: {
                latitude: 49.2820,
                longitude: -123.1171
            }
        });
        // init_geo({coords:{latitude: 49.20725849999999, longitude: -122.90213449999999}});
        // init_geo({coords:{latitude: 41.886811, longitude: -87.626186}});
    }
};

var init_geo = function (position) {
    var lat = position.coords.latitude;
    var lng = position.coords.longitude;
    fetch('https:///api.weatherstack.com/v1/current.json?access_key=5d23e8a87e9fc5d1270024af110ed75c&q=' + lat + ',' + lng)
        .then(function (response) {
            return response.json();
        })
        .then(function (result) {
            window._ar_position = position;
            init_ar(lat, lng);
            init_burgler();
            init_mcd(lat, lng);
            init_snow();
            init_heart();

            init_weather(result);

            animate();
        });
};


var init_weather = function (result) {
    console.log(JSON.stringify(result));
    var condition = result.current.condition.text.toLowerCase();
    var sentiment;
    if (condition.indexOf("cloud") > -1
        || condition.indexOf("overcast") > -1) {
        set_weather("cloudy")
        sentiment = "nice";
    } else if (condition.indexOf("rain") > -1
        || condition.indexOf("shower") > -1
        || condition.indexOf("ice") > -1) {
        sentiment = "danger";
        set_weather("rain")
    } else if (condition.indexOf("snow") > -1
        || condition.indexOf('blizzard') > -1) {
        sentiment = "danger";
        set_weather("snow")
    } else {
        sentiment = "nice";
        set_weather("sun")
    }
    var desc = "Weather at your location is " /*result.location.name + " is "*/ /*+ result.current.temp_c + " &deg;C and "*/ + condition + ". ";
    if (sentiment === "nice") {
        desc += "It's a nice day to visit a McDonald's! "
    } else {
        desc += "Drive safe and visit a McDonad's near you!"
    }
    document.getElementById("weather").innerHTML = desc;

}
var particleSystem;
var precip;
var precip_velocity = -4;
var snow_material, rain_material;
var init_snow = function () {

    precip = new THREE.Geometry();
    var vertices = [];
    var textureLoader = new THREE.TextureLoader();

    var sprite1 = textureLoader.load('disc.png');
    var rain_sprite = textureLoader.load('rain.png');

    for (var i = 0; i < 500; i++) {

        var x = Math.random() * 1000 - 500;
        var y = Math.random() * 500
        var z = Math.random() * 1000 - 500;
        particle = new THREE.Vector3(x, y, z);
        particle.velocity = {};
        particle.velocity.y = precip_velocity;
        precip.vertices.push(particle);

    }

    snow_material = new THREE.PointsMaterial({
        size: 10,
        sizeAttenuation: true,
        map: sprite1,
        alphaTest: 0.5,
        opacity: 0.85,
        transparent: true,
        fog: false
    });
    snow_material.color.setHSL(1, 1, 1);
    rain_material = new THREE.ParticleBasicMaterial({
        size: 10,
        transparent: true,
        opacity: 0.7,
        map: rain_sprite,
        //blending: THREE.MultiplyBlending,
        sizeAttenuation: true,
        opacity: 1,
        fog: false
    });
    //rain_material.color.setHSL(1, 0, 0.7);

    //var particles = new THREE.Points(geometry, mat);
    particleSystem = new THREE.PointCloud(precip, rain_material);

    // particleSystem.rotation.x = Math.random() * 1 - 0.5;
    // particleSystem.rotation.y = Math.random() * 1 - 0.5;
    // particleSystem.rotation.z = Math.random() * 1 - 0.5;

    scene.add(particleSystem);

}

var init_ground = function () {
    // Ground.
    var textureLoader = new THREE.TextureLoader();

    var logo_tex = textureLoader.load("grass.jpg");
    logo_tex.wrapS = THREE.RepeatWrapping;
    logo_tex.wrapT = THREE.RepeatWrapping;
    logo_tex.repeat.set(40, 40);
    var geometry = new THREE.PlaneBufferGeometry(3000, 3000);
    geometry.rotateX(-Math.PI / 2);
    var material = new THREE.MeshPhongMaterial({
        color: 0x55aa00,
        // color: 0x448888,
        map: logo_tex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
    });

    var plane = new THREE.Mesh(geometry, material);
    plane.position.y = -2;
    scene.add(plane);
};

var init_burgers = function () {
    var textureLoader = new THREE.TextureLoader();
    var geometry = new THREE.PlaneGeometry(25, 25, 1, 1);
    var plane_tex = textureLoader.load("burger.png");
    var plane_material = new THREE.MeshBasicMaterial({
        map: plane_tex,
        side: THREE.DoubleSide,
        transparent: true
    });
    var plane = new THREE.Mesh(geometry, plane_material);
    plane.rotation.x = Math.PI / 2;
    plane.position.y = 1;
    plane.position.x = 30;
    plane.position.z = -50;
    plane.renderOrder = 3;
    scene.add(plane);
    return plane;
};

var ar_world, ar_geo;
var init_ar = function (lat, lng) {
    // AR Stuff

    ar_world = new THREE.ARWorld({
        camera: camera
    });

    ar_geo = new THREE.ARMapzenGeography({
        styles: styles,
        lat: lat,
        lng: lng,
        //layers: ["building"]
        layers: [
            "building",
            "road"
            /*"landcover",
            "landuse",
            "place",
            "poi"*/
        ]
    });
};

var outlet_material = new THREE.MeshLambertMaterial({
    // emissive: 0xFFFF00,
    color: 0xffdd00,
    fog: false
});

// shadow.
var shadow_material = new THREE.MeshLambertMaterial({
    color: 0x000000,
    opacity: 0.3,
    transparent: true
});

var outlets = [];
var init_mcd = function (lat, lng) {
    var mcds = [{
        lat: lat + 0.001,
        lng: lng + 0.002
    },
    {
        lat: lat - 0.0015,
        lng: lng + 0.0005
    },
    {
        lat: lat + 0.0015,
        lng: lng - 0.0015
    }
    ];

    var add_outlet = function (point, arc) {
        var outlet = arc.clone();
        outlet.rotateX(Math.PI / 2);
        outlet.scale.set(1.2, 1.2, 1.2);
        coords = ar_geo.ll_to_scene_coords([point.lng, point.lat]);
        outlet.position.x = coords[0];
        outlet.position.z = coords[1];
        outlet.position.y = 50;

        scene.add(outlet);
        outlets.push(outlet);
        outlet.cylinders = [];
        outlet.spheres = [];

        [
            [60, 1, 4]
        ].forEach(function (params) {
            var geometry = new THREE.CylinderGeometry(params[0], params[0], params[1], 32);
            var cylinder = new THREE.Mesh(geometry, shadow_material);
            cylinder.position.x = coords[0];
            cylinder.position.z = coords[1];
            cylinder.position.y = params[2];
            cylinder.renderOrder = 4;
            cylinder.start_position = cylinder.position.clone();
            scene.add(cylinder);
            outlet.cylinders.push(cylinder);
        });

        var geo = new THREE.SphereGeometry(15, 10, 10);
        var sphere = new THREE.Mesh(geo, outlet_material);
        sphere.position.x = coords[0];
        sphere.position.z = coords[1];
        sphere.position.y = 120;
        sphere.start_position = sphere.position.clone();
        outlet.spheres.push(sphere);
        scene.add(sphere);
    };

    var loader = new THREE.OBJLoader();
    loader.load("mcdo_arc_single.simplified.dec.obj", function (arc) {
        arc.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.material = outlet_material;
            }
        });

        mcds.forEach(function (p) {
            add_outlet(p, arc);
        });
    });
};

var burglar;
var init_burgler = function () {
    var texture = new THREE.Texture();

    var onProgress = function (xhr) {
        if (xhr.lengthComputable) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete, 2) + "% downloaded");
        }
    };

    var onError = function (xhr) { };

    var tloader = new THREE.ImageLoader();
    tloader.load("hamburglar_diff_small.png", function (image) {
        texture.image = image;
        texture.needsUpdate = true;
    });

    // model
    var burlgar;
    var loader = new THREE.OBJLoader();
    loader.load(
        "hamburglar_OBJ.simplified.obj",
        function (object) {
            burglar = object;
            object.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    child.material.map = texture;
                    child.material.side = THREE.DoubleSide;
                    child.material.shading = THREE.SmoothShading;
                }
            });

            object.position.y = 0;

            var geometry4 = new THREE.CylinderGeometry(17, 17, 3, 32);
            var cylinder4 = new THREE.Mesh(geometry4, shadow_material);
            cylinder4.position.x = 0;
            cylinder4.position.z = 0;
            cylinder4.position.y = 0; // 1/20;
            cylinder4.renderorder = 4;
            object.add(cylinder4);
            scene.add(object);
            burglar = object;
        },
        onProgress,
        onError
    );
};

var sky_texture = new THREE.TextureLoader().load("imgpsh_fullsize.png");
var sky;
var init_skyball = function () {
    var geometry = new THREE.SphereGeometry(5000, 60, 40);
    geometry.scale(-1, 1, 1);
    var material = new THREE.MeshBasicMaterial({
        map: sky_texture,
        fog: false
    });
    sky = new THREE.Mesh(geometry, material);
    scene.add(sky);
};

var heart;
init_heart = function () {
    var x = 0,
        y = 0;

    var heartShape = new THREE.Shape();

    heartShape.moveTo(x + 5, y + 5);
    heartShape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
    heartShape.bezierCurveTo(x - 6, y, x - 6, y + 7, x - 6, y + 7);
    heartShape.bezierCurveTo(x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19);
    heartShape.bezierCurveTo(x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7);
    heartShape.bezierCurveTo(x + 16, y + 7, x + 16, y, x + 10, y);
    heartShape.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5);

    var geometry = new THREE.ShapeGeometry(heartShape);
    var material = new THREE.MeshBasicMaterial({
        color: 0xff4400,
        side: THREE.DoubleSide
    });
    heart = new THREE.Mesh(geometry, material);
    heart.position.y = 60;
    heart.position.x = 5;
    heart.position.z = 0;
    heart.rotation.z = Math.PI;
    scene.add(heart);
};

function onClick(event) {
    return;
    //event.preventDefault();
    var mouse = new THREE.Vector2();
    mouse.x = event.clientX / window.innerWidth * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    ar_world.touch_raycaster.setFromCamera(mouse, camera);
    ar_world.updateSelection();
}
document.addEventListener("click", onClick);

var updateParticles;
var init_burger_flies = function () {
    /* Particles, from example here -
     * https://codepen.io/antishow/post/three-js-particles
     */
    var tau = Math.PI * 2;
    var mode;
    var pointCloud;

    THREE.ImageUtils.crossOrigin = "";

    var SETTINGS = [{
        name: "Burger Flies",
        particleCount: 50,
        material: new THREE.PointCloudMaterial({
            size: 16,
            map: THREE.ImageUtils.loadTexture("burger.png"),
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthTest: false
        }),
        initialize: function () {
            camera.position.y = 50;
            camera.position.z = 200;

            pointCloud.sortParticles = true;
        },
        spawnBehavior: function (index) {
            var x, y, z;
            var halfWidth = window.innerWidth / 2;

            x = Math.random() * window.innerWidth - halfWidth;
            y = Math.random() * window.innerWidth - halfWidth;
            z = Math.random() * window.innerWidth - halfWidth;
            var v = new THREE.Vector3(x, y, z);
            v.velocity = new THREE.Vector3(0, 0, 0);

            return v;
        },
        frameBehavior: function (particle, index) {
            function push() {
                return Math.random() * 0.125 - 0.0625;
            }

            particle.add(particle.velocity);
            particle.velocity.add(new THREE.Vector3(push(), push(), push()));
            particle.velocity.add(new THREE.Vector3(particle.x, particle.y, particle.z).multiplyScalar(-
                0.00001));
        },
        sceneFrameBehavior: null
    }];

    var mode;

    function setMode(_mode) {
        mode = _mode;
        scene.remove(pointCloud);

        var points = createPoints(mode.spawnBehavior);
        var material = mode.material;

        pointCloud = new THREE.PointCloud(points, material);

        if (mode.initialize && typeof mode.initialize === "function") {
            mode.initialize();
        }
        scene.add(pointCloud);
    }

    function createPoints(spawnBehavior) {
        var ret = new THREE.Geometry();

        for (var i = 0; i < mode.particleCount; i++) {
            ret.vertices.push(spawnBehavior(i));
        }

        return ret;
    }

    updateParticles = function () {
        if (!mode) return;
        if (mode.sceneFrameBehavior && typeof mode.sceneFrameBehavior === "function") {
            mode.sceneFrameBehavior();
        }
        if (mode.frameBehavior && typeof mode.frameBehavior === "function") {
            pointCloud.geometry.vertices.forEach(mode.frameBehavior);
            pointCloud.geometry.verticesNeedUpdate = true;
            pointCloud.geometry.colorsNeedUpdate = true;
        }
    };
    setMode(SETTINGS[SETTINGS.length - 1]);
};

/* global performance */
var prevTime = performance.now();

var animate = function () {
    var time = performance.now();
    // var delta = (time - prevTime) / 1000

    requestAnimationFrame(animate);
    //if (typeof updateParticles !== "undefined") updateParticles();
    /*
    ar_geo.feature_meshes.forEach(function(fm){
        if (fm.feature.layername == 'buildings') {
            fm.scale.y = Math.cos(time/500 + (fm.feature.properties.area || 0)) + 1.5;
        }
    });
    */


    controls.update();

    if (typeof burglar !== "undefined") {
        // burglar.translateX(1);
        // burglar.translateZ(1);
        // controls.target = burglar.position.clone();
    }

    ar_world.update();

    outlets.forEach(function (outlet) {
        outlet.rotateZ(0.015);
        outlet.cylinders.forEach(function (cylinder, i) {
            // cylinder.position.y = cylinder.start_position.y + (i+1) * 2 * Math.cos(time/200/(i+1));
        });
        outlet.spheres.forEach(function (sphere, i) {
            sphere.position.y = sphere.start_position.y + (i + 1) * 2 * Math.cos(time / 200 / (i +
                1));
            sphere.scale.y = Math.cos(time / 600 / (i + 1));
            sphere.scale.z = Math.cos(time / 600 / (i + 1));
            sphere.scale.x = Math.cos(time / 600 / (i + 1));
        });
    });


    var pCount = 500;
    while (pCount--) {
        var particle = precip.vertices[pCount];
        if (particle.y < -100) {
            particle.y = 200;
        }

        particle.y += particle.velocity.y;
    }
    precip.verticesNeedUpdate = true;

    if (typeof burglar !== "undefined") {
        burglar.scale.x = 0.6 + 0.06 * Math.sin(time / 500);
        burglar.scale.z = 0.6 + 0.06 * Math.sin(time / 500);
        burglar.scale.y = 0.6 + 0.03 * Math.cos(time / 500);
    }

    if (heart) {

        var sc = 1 - 0.1 * Math.cos(time / 200);
        heart.position.y = 65 + Math.cos(time / 1500) * 5;
        heart.position.x = 5 - Math.cos(time / 200);
        heart.scale.x = sc;
        heart.scale.y = sc;
        heart.scale.z = sc;

    }
    renderer.render(scene, camera);

    prevTime = time;
};

init();
