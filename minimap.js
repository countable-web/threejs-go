var minimap = L.map('mapid').setView([player.lat, player.lng], 17);

<<<<<<< HEAD

function setup_minimap(){
var minimap;
minimap = L.map('mapid').setView([player.lat, player.lng], 17);

L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
=======
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: ' '
>>>>>>> master
}).addTo(minimap);

var arrow_icon = L.divIcon({
    iconSize: [40, 40], // size of the icon
    className: 'arrow-marker',
    html: '<div class="arrow-marker-inner"></div>'
    });

var arrow_marker = L.marker([player.lat, player.lng], {icon: arrow_icon}).addTo(minimap);

setInterval(function(){
  // update the map arrow.
  var vector = controls.getObject().getWorldDirection();
  var theta = -Math.atan2(vector.x,vector.z) + Math.PI/2;
  $('.arrow-marker-inner').css({
    'transform': 'rotateZ(' + theta + 'rad)'
  });
  arrow_marker.setLatLng(new L.LatLng(player.lat, player.lng));
},100);

setInterval(function(){
  minimap.panTo(new L.LatLng(player.lat, player.lng), {animate: false});
}, 1000);
<<<<<<< HEAD

}
=======
>>>>>>> master
