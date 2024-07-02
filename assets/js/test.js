// test
// requires:
// https://d3js.org/topojson.v1.min.js
// https://d3js.org/d3.v4.min.js
// assets: data/locations.json
const width = 960;
const height = 500;
const config = {
  speed: 0.02,
  verticalTilt: -20,
  horizontalTilt: 0
}
let locations = [];
const svg = d3.select('svg')
  .attr('width', width/1.5)
  .attr('height', "auto")
  .attr('viewBox', `0 0 ${width} ${height}`);
const markerGroup = svg.append('g');
const projection = d3.geoOrthographic();
const initialScale = projection.scale();
const path = d3.geoPath().projection(projection);
const center = [width / 2, height / 2];

drawGlobe();
drawGraticule();
enableRotation();

function drawGlobe() {
  d3.queue()
    .defer(d3.json, '../assets/data/world-110m.json')
    .defer(d3.json, '../assets/data/locations.json')
    .await((error, worldData, locationData) => {
      svg.selectAll(".segment")
        .data(topojson.feature(worldData, worldData.objects.countries).features)
        .enter().append("path")
        .attr("class", "segment")
        .attr("d", path)
        .style("stroke", "#888")
        .style("stroke-width", "1px")
        .style("fill", (d, i) => '#e5e5e5')
        .style("opacity", ".6");
      locations = locationData;
      drawMarkers();
    });
}

function drawGraticule() {
  const graticule = d3.geoGraticule()
    .step([10, 10]);

  svg.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", path)
    .style("fill", "#fff")
    .style("stroke", "#ccc");
}

function enableRotation() {
  d3.timer(function (elapsed) {
    projection.rotate([config.speed * elapsed - 120, config.verticalTilt, config.horizontalTilt]);
    svg.selectAll("path").attr("d", path);
    drawMarkers();
  });
}

function drawMarkers() {
  const markers = markerGroup.selectAll('circle')
    .data(locations);
  markers
    .enter()
    .append('circle')
    .merge(markers)
    .attr('cx', d => projection([d.longitude, d.latitude])[0])
    .attr('cy', d => projection([d.longitude, d.latitude])[1])
    .attr('fill', d => {
      const coordinate = [d.longitude, d.latitude];
      gdistance = d3.geoDistance(coordinate, projection.invert(center));
      return gdistance > 1.57 ? 'none' : 'steelblue';
    })
    .attr('r', 7);

  markerGroup.each(function () {
    this.parentNode.appendChild(this);
  });
}