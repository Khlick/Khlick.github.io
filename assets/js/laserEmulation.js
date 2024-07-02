// Laser Emulation
import * as THREE from 'three';
// import { OrbitControls } from 'three-addons';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// Set up the scene
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 5;
var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// Set up the laser beam
var laserMaterial = new THREE.LineBasicMaterial( { color: 0xff0000 } );
var laserPositions = [ 0, 0, 0, 0, 0, 0 ];
var laserGeometry = new THREE.BufferGeometry();
laserGeometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( laserPositions ), 3 ) );
var laserBeam = new THREE.Line( laserGeometry, laserMaterial );
scene.add( laserBeam );
var laserStartPoint = new THREE.Vector3( -2, 0, 0 );
var laserEndPosition = new THREE.Vector3( 2, 0, 0 );
var laserLight = new THREE.PointLight( 0xff0000, 1, 100 );
laserLight.position.set( laserStartPoint.x, laserStartPoint.y, laserStartPoint.z );
scene.add( laserLight );
var laserSpeed = 10;

// Set up the animation
var mixer = null;
var clock = new THREE.Clock();
var isAnimating = false;
var keyframes = [
    { intensity: 0, beamLength: 0 },
    { intensity: 1, beamLength: 1 },
    { intensity: 0, beamLength: 0 }
];
var trackNames = [ 'intensity', 'beamLength' ];
var clip = new THREE.AnimationClip( 'Action', 0.02, trackNames );
for ( var i = 0; i < keyframes.length; i++ ) {
    var keyframe = keyframes[i];
    var intensity = keyframe.intensity;
    var beamLength = keyframe.beamLength;
    var intensityTrack = new THREE.NumberKeyframeTrack( '.intensity', [ i * 0.01, ( i + 1 ) * 0.01 ], [ intensity, intensity ] );
    var beamLengthTrack = new THREE.NumberKeyframeTrack( '.beamLength', [ i * 0.01, ( i + 1 ) * 0.01 ], [ beamLength, beamLength ] );
    clip.tracks.push( intensityTrack, beamLengthTrack );
}
var animationAction = null;
var animationMixer = new THREE.AnimationMixer( laserLight );
animationAction = animationMixer.clipAction( clip );

// Set up the animation button
var animationButton = document.getElementById( 'laser-flash' );
var isAnimating = false;
var clock = new THREE.Clock();
animationButton.addEventListener( 'click', function() {
    if ( isAnimating ) {
        isAnimating = false;
        animationAction.stop();
    } else {
        isAnimating = true;
        animationAction.play();
    }
});

// Render loop
function animate() {
    requestAnimationFrame( animate );
    var delta = clock.getDelta();
    if ( mixer !== null ) {
        mixer.update( delta );
    }
    if ( isAnimating ) {
        var currentPosition = laserLight.position.clone();
        var nextPosition = currentPosition.add( new THREE.Vector3( laserSpeed * delta, 0, 0 ) );
        if ( nextPosition.x > laserEndPosition.x ) {
            isAnimating = false;
            animationAction.stop();
            laserBeam.visible = false;
        } else {
            laserBeam.visible = true;
            laserPositions[3] = nextPosition.x;
            laserPositions[4] = nextPosition.y;
            laserPositions[5] = nextPosition.z;
            laserGeometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( laserPositions ), 3 ) );
        }
    }
    renderer.render( scene, camera );
}
animate();
