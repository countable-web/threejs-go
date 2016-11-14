var minimap = L.map('mapid').setView([player.lat, player.lng], 17);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
  maxZoom: 18,
  attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
  id: 'mapbox.streets'
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