import * as THREE from 'three';
// import { OrbitControls } from 'three-addons';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import Stats from 'three/addons/libs/stats.module.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';



/**
 * NOTES:
 * 505nm light is: 0x00ff54
 */



/** FUNCTIONS **/
function circshift(arrayPar, step) {
  // step sign indicates direction, + -> right, - -> left
  const array = arrayPar.slice(0);
  let dir = Math.sign(step)>0;
  for(let i = 0; i < Math.abs(step); i++) {
      if(!dir)
          array.push(array.shift());
      else
          array.unshift(array.pop());
  }
  return array;
}

function remap(X, lo, hi) {
  return X.map(x => lo + (x - Math.min(...X)) / (Math.max(...X) - Math.min(...X)) * (hi - lo));
}

function getNextIndex (arr, target) {
  let inds = [...Array(arr.length)].map((v, i) => i);
  target = Array.isArray(target) ? Array.from(target) : Array.from([target]);
  return target.map(t=>inds[arr.indexOf(arr.reduce((a,b) => (t-a)>0?b:a))]);
};


const SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 1024;
const W = 800;
const H = 400;



const container = document.getElementById("osc-container");
const controls = document.getElementById("osc-controls");

const runbtn = document.createElement("button");
runbtn.classList.add = "osc";
runbtn.innerHTML = "Run";
runbtn.setAttribute("data-isrunning", 0);

const resetbtn = document.createElement("button");
resetbtn.classList.add = "osc";
resetbtn.innerHTML = "Reset";


controls.appendChild(runbtn);
controls.appendChild(resetbtn);



container.setAttribute("style", `width:${W}px;height:${H}px;`);
container.style.width = W + 'px';
container.style.height = H + 'px';

const DataLimit = [-200, 200];
const DataWidth = DataLimit.reduce((a, b) => b - a, 0);
const ViewLimit = [0.1, 1000];
const drawPoint = DataWidth * 0.99 + DataLimit[0];
const fadePoint = DataWidth * 0.01 + DataLimit[0];

// map time to data limit
// map 20 xPos -> 0.1 sec
const fs = 1000;
const dtdx = 20 / 0.1;
const duration = 2.5; // sec
const minInterval = 1.0 / 120; // redraw rate
const nsamples = fs * duration;
const time = [...Array(nsamples)].map((e, i) => i / fs);

// (vi-vsync)/vfps + tsync

// Set up scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); //new THREE.Color(0xf0f0f0);

// Setup Camera
const camera = new THREE.PerspectiveCamera(110, W/H, ...ViewLimit);

// Set up renderer
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(W, H);
container.appendChild(renderer.domElement);

// LIGHTS

const ambient = new THREE.AmbientLight( 0x444444 );
scene.add( ambient );

const light = new THREE.SpotLight( 0xffffff, 1, 0, Math.PI / 5, 0.3 );
light.position.set( 0, 1500, 1000 );
light.target.position.set( 0, 0, 0 );

light.castShadow = true;
light.shadow.camera.near = 1200;
light.shadow.camera.far = 2500;
light.shadow.bias = 0.0001;

light.shadow.mapSize.width = SHADOW_MAP_WIDTH;
light.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

scene.add(light);

// Orbit controls
const orbit = new OrbitControls(camera, renderer.domElement);

// Stats panel\
// const stats = new Stats();
// document.getElementById("info").appendChild(stats.dom);

// Add grids
// const xGrid = new THREE.GridHelper(100, 20);
// xGrid.color = new THREE.Color(0x000000);
const yGrid = new THREE.GridHelper(DataWidth, 10);
yGrid.rotation.x = -Math.PI / 2;
yGrid.color = new THREE.Color(0x00aa00);

scene.add(yGrid); //xGrid, yGrid);

// Setup planes -> probably remove these in favor or axes grids
const planeGeometry = new THREE.PlaneGeometry(DataWidth,DataWidth);
const planeMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color(0x1a1a1a)
});
const yPlane = new THREE.Mesh(planeGeometry, planeMaterial);
yPlane.position.y = 0;
yPlane.position.x = 0;
yPlane.position.z = -0.01;

scene.add(yPlane);

// Set up sphere
const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xff3300 });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

// Set up data line
const lineGeometry = new THREE.BufferGeometry();
const lineMaterial = new THREE.LineBasicMaterial({
  color: 0xfdfdfd,
  linewidth: 2
});

// Set up dataArray
const XValues = remap(time, -Math.ceil(duration * dtdx/2), Math.ceil(duration * dtdx/2)); //+drawPoint;
const dataArray = [...Array(nsamples)].map(
  (e, i) =>
    Math.random() * 2.5 + 10 * Math.E ** (-1 / 2 * ((i / (fs*0.5) - 1) / 0.1) ** 2)
); 
// add points to the line geometry
lineGeometry
  .setAttribute(
    'position', new THREE.BufferAttribute(new Float32Array(3 * nsamples),3)
);
for (let i = 0; i < nsamples; i++){
  lineGeometry.attributes.position.setXYZ(i, XValues[i], dataArray[i], Math.random() * 1.2);
}

// construct the line
const line = new THREE.Line(lineGeometry, lineMaterial);
line.frustumCulled = false;
line.computeLineDistances();

// Set up animation loop
const clock = new THREE.Clock();

let currentIndex = 0;
let runningIndex = 0;
let delta = 0;

const init = () => {
  currentIndex = 0;
  runningIndex = 0;
  
  if (sphere.parent === scene) {
    scene.remove(sphere);
  }
  if (line.parent === scene) {
    scene.remove(line);
  }
  
  // Update camera position
  camera.position.z = 70;
  camera.position.y = 0;
  camera.position.x = 0;

  orbit.update();
  orbit.saveState();

  // set onclick for double click
  document.addEventListener("dblclick", (e) => {
    // Update camera position
    orbit.reset();
  });
  // Render scene
  renderer.render(scene, camera);
}

const animate = () => {
  requestAnimationFrame(animate);

  // interrupt if status is set to not-run
  let isrun = runbtn.getAttribute("data-isrunning");
  
  // Update current time and index
  delta += clock.getDelta();
  
  if (delta >= minInterval && isrun === "1") { 
    delta = delta % minInterval;
    // determine how many frames should have passed in this delta
    let thisDelta = Math.floor(delta * fs);
    if (runningIndex+thisDelta >= nsamples) {
      runningIndex = nsamples; // prevent long runs filling memory with huge int
    } else {
      runningIndex += thisDelta;
    }

    currentIndex += thisDelta % nsamples;

    /**
     * Idea: circle shift the x and y points of the data showing only the size of the view buffer.
     *  newIndex increments until getNextIndex(newX,datalimit[0]) > 0
     
    let ofst = XValues[currentIndex] - drawPoint;
    let randVal = Math.random()*2;
    let newX = XValues.map(x => x - ofst);
    let indRange = getNextIndex(newX, [DataLimit[0], drawPoint]);
    let nRender = indRange.reduce((a, b) => b - a, 0);
    
    // circle shift newX, and newData

    // set new index
    */
    // Until runningIndex >= nsamples, just grow the render width and shift by drawPoint
    
    
    let ofst,newX,newY,thisIndex;

    if (runningIndex < nsamples) {
      ofst = XValues[currentIndex] - drawPoint;
      newX = XValues.map(x => x - ofst);
      newY = dataArray.slice(0); // shallow copy
      thisIndex = currentIndex;
    } else {
      ofst = XValues[nsamples - 1] - drawPoint;
      newX = XValues.map(x => x - ofst);
      newY = circshift(dataArray, -currentIndex);
      thisIndex = nsamples - 1;

    }
    let indRange = getNextIndex(newX, [fadePoint, drawPoint]);
    let nRender = indRange.reduce((a, b) => b - a, 0);
    let randVal = Math.random() * 1.2;
    // Update sphere position
    sphere.position.set(newX[thisIndex], newY[thisIndex], randVal);
    
    // Update line position
    for (let i = 0; i < nsamples; i++){
      lineGeometry.attributes.position.setXYZ(
        i,
        newX[i],
        newY[i],
        i === thisIndex ? randVal : Math.random()*1.2
      );
    }
    
    lineGeometry.setDrawRange(indRange[0], nRender);

    lineGeometry.computeBoundingBox();
    lineGeometry.computeBoundingSphere();
    lineGeometry.attributes.position.needsUpdate = true;
    
    // stats.update();
  }
  // Render scene
  renderer.render(scene, camera);
  orbit.update();
  
};

// Start animation loop
init();
animate();



function runFcn(e) {
  let isrun = runbtn.getAttribute("data-isrunning");
  if (isrun === "1") {
    runbtn.setAttribute("data-isrunning", "0");
    clock.running = false;
    runbtn.innerHTML = "Run";
  } else {
    // show drawing elements
    if (sphere.parent !== scene) {
      scene.add(sphere);
    }
    if (line.parent !== scene) {
      scene.add(line);
    }
    runbtn.setAttribute("data-isrunning", 1);
    animate();
    clock.start();
    runbtn.innerHTML = "Stop";    
  }
}
runbtn.addEventListener('click', runFcn);

function resetFcn(e) {
  let isrun = runbtn.getAttribute("data-isrunning");
  if (isrun === "1") {
    runFcn([]);
  }
  init();
  renderer.render(scene, camera);
}
resetbtn.addEventListener('click', resetFcn);

/**
 * Need to setup 3 functions for startup, run and handle animations;
 * makeWorld() -> create all the elements and add them to the scene
 * initialize() -> move elements to the initial locations
 * animate() -> handle animations: for not just loop forever, eventually, I'll need this to have multiple steps.
 * 
 * My idea is to have a dropdown with flash strength based on  R~I parameters, then simulate a flash depending on the model, rod, rbc, etc., and illicit an appropriate response. Implement Reingruber model in JS.
 */

