# threejs-go

Augmented reality, powered by real world map data near you.

![Image of McDonald's Demo](https://github.com/countable-web/threejs-go/blob/gh-pages/assets/screengrab.png)

Three.js Go is a library built on Three.js and Mapzen's OSM based vector tiles, for generating 3d geometry that approximates the real world, based on map data. The project was inspired by Pokemon Go, which launched a year ago, and the disappointment in the absence of other apps which make use of the player's location. In case it's a lack of tooling, this library may help with the groundwork for these kinds of applicaton.

## Examples

  * [McDonald's Demo](https://countable-web.github.io/threejs-go/demos/mcd/)
  * [Low Altitude Flight Sim](https://countable-web.github.io/threejs-go/demos/fly/) (currently broken, coming soon)
  * [First Person Superhero Sim](https://countable-web.github.io/threejs-go/demos/fps/) (incomplete)

## Installation
Clone the project.

```
git clone https://github.com/countable-web/threejs-go.git
cd threejs-go
```

To view the demos, run with any webserver (like python)
```
npm build
npm run dev
```

This will serve your app locally and auto-build client deps with [rollup](https://rollupjs.org/).

Browse to `localhost:5000`.

For further work, it's suggested you try extending one of the Demos since they're standard Three.js applications, you can do anything you'd normally do in Three.js

## Documentation

### THREE.ARWorld(option)
Includes various environment / utilities for map based AR. Your scene camera should be passed as a parameter.
```
new THREE.ARWorld({
    camera: camera
});
```

### THREE.ARMapzenGeography(options)
Loads the actual Three.js mesh objects into your scene, with geometry generated from the actual geography around a location. Arguments:

*options.layers* This includes roads, water, buildings, etc. See Mapzen's [layers](https://mapzen.com/documentation/vector-tiles/layers/#places) for details on what you can load.

*options.styles* See the defaults here. Styles should be a similarly formatted object, which will override these defaults. Styles, like CSS will override based on specificity. A style for `courthouse:` will therefore override the more general style for `buildings:` shoudl there be a conflict. Styles are looked up using the following properties to match against:

1. The feature's `name` attribute, ie) McDonald's
2. The feature's `kind_detail` attribute, ie) Restaurant
3. The feature's `kind` attribute, ie) Commercial
4. The feature's layer name, ie) Buildings

```
new THREE.ARMapzenGeography({
    styles: {}, // A style map which controls how geometry is rendered.
    lat: lat, // The latitude to load geometry around.
    lng: lng, // The longitude to load gemoetry around.
    layers: ['buildings','roads','water','landuse'] // Which layers to include.
});
```

### THREE.is_daytime
This boolean is populated, indicating whether it's daytime or not in case you want to base any lighting effects on that.

### THREE.is_mobile
This boolean is populated, indicating whether you have a mobile device, in order to use DeviceOrientationControls for an immersive experience (such as Google Cardboard view).

### Acknowledgements

  * Thanks to [Animatic](http://www.animaticmedia.com/) for demo assets.
  * Thanks to [Countable](http://countable.ca) for letting me work on this!
  * Thanks to [Mapzen](https://mapzen.com) for tiles.
  * Thanks to [Codrops](https://tympanus.net/codrops/) for some clip art.
