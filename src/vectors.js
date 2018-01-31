import format from 'date-fns/format';

import {
    VectorTile
} from '@mapbox/vector-tile';
import Protobuf from 'pbf';
import buffer from 'buffer/'; // note: the trailing slash is important!

export default function update() {};

function blobToBuffer(blob, cb) {
    if (typeof Blob === 'undefined' || !(blob instanceof Blob)) {
        throw new Error('first argument must be a Blob')
    }
    if (typeof cb !== 'function') {
        throw new Error('second argument must be a function')
    }

    var reader = new FileReader()

    function onLoadEnd(e) {
        reader.removeEventListener('loadend', onLoadEnd, false)
        if (e.error) cb(e.error)
        else cb(null, buffer.Buffer.from(reader.result))
    }

    reader.addEventListener('loadend', onLoadEnd, false)
    reader.readAsArrayBuffer(blob)
}

fetch("http://stage.countable.ca:8080/data/v3/2/1/1.pbf").then(function(response) {
    var b = response.blob();
    return b;
}).then(function(data) {
    console.log(data);
    //var geojson = geobuf.decode(new Pbf(data));
    blobToBuffer(data, function(err, buf) {
        if (err) throw err

        var tile = new VectorTile(new Protobuf(buf));
        console.log(tile);
    })

})
