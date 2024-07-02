import * as THREE from 'three';
import vertexShader from 'vertexShader';
import fragmentShader from 'fragmentShader';


const container = document.querySelector('.eye');

let config = {
    zoomLevel: 600,
    zoomLevelBounds: [ 300, 1000 ],
    shrink: 0,
    fstBaseColor: '#03565c',
    scdBaseColor: '#42cf44',
    midColor: '#f2aa00',
    vignette: .65,
    brightness: .6,
    darkness: .5,
};


class Animations {
    constructor() {
        this.playShrink = gsap.timeline({
            paused: true,
            onUpdate: () => {}})
            .timeScale(2)
            .to(viz.eyeShaderMaterial.uniforms.u_shrink, {
                duration: .5,
                value: -.9,
                ease: 'power2.out'
            })
            .to(viz.eyeShaderMaterial.uniforms.u_shrink, {
                duration: 3,
                value: 0,
                ease: 'power2.inOut'
            });

        this.eyeAppear = gsap.timeline({
            paused: true
        })
            .from(viz.eyeGroup.position, {
                duration: 2,
                y: 1000,
                ease: 'power4.out'
            })
            .from(viz.eyeGroup.rotation, {
                duration: 2,
                x: 25,
                z: 5,
                ease: 'power3.out'
            }, 0)
            .from(viz.shadowMesh.scale, {
                duration: 2,
                x: 2.5,
            }, 0)
    }

}

class Viz {

    constructor() {
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);
        this.scene = new THREE.Scene();
        this.eyeGroup = new THREE.Group();
        this.eyeRadius = 60;
        this.camera = new THREE.PerspectiveCamera(20, 500 / 400, 1, 10000);

        this.mouse = new THREE.Vector2(0, 0);
        this.setupScene();
        this.createEyeball();
        this.createShadow();
        this.render();
    }

    setupScene() {
        this.scene.background = new THREE.Color(0xffffff);
        this.setCameraPosition(config.zoomLevel);

        const ambientLight = new THREE.AmbientLight(0x999999, 0.7);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(-1, 1, 1);
        this.scene.add(directionalLight);
    }

    setCameraOffsetY() {
        this.camera.position.y = 5;
    }

    setCameraPosition(cp) {
        this.camera.position.z = cp;
        this.setCameraOffsetY();
        config.zoomLevel = cp;
    }

    createEyeball() {
        const eyeBallTexture = new THREE.TextureLoader().load('../assets/img/eyeball.jpg');
        const eyeAddonGeometry = new THREE.SphereGeometry(this.eyeRadius, 32, 32);
        const eyeAddonMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            emissive: 0x220000,
            opacity: .25,
            shininess: 100,
            transparent: true,
            map: eyeBallTexture
        });
        const eyeAddon = new THREE.Mesh(eyeAddonGeometry, eyeAddonMaterial);
        this.eyeGroup.add(eyeAddon);

        const eyeGeometry = new THREE.SphereGeometry(this.eyeRadius - .1, 32, 32);
        this.eyeShaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                u_shrink: { type: 'f', value: config.shrink },
                u_base_color_1: { type: 'v3', value: new THREE.Color(config.fstBaseColor) },
                u_base_color_2: { type: 'v3', value: new THREE.Color(config.scdBaseColor) },
                u_mid_color: { type: 'v3', value: new THREE.Color(config.midColor) },
                u_vignette: { type: 'f', value: config.vignette },
                u_brightness: { type: 'f', value: config.brightness },
                u_darkness: { type: 'f', value: config.darkness },
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
        });
        const eye = new THREE.Mesh(eyeGeometry, this.eyeShaderMaterial);
        eye.rotation.y = -Math.PI / 2;
        this.eyeGroup.add(eye);

        this.scene.add(this.eyeGroup);
    }
    // vertexShader: document.getElementById('vertexShader').textContent,
    // fragmentShader: document.getElementById('fragmentShader').textContent,
    createShadow() {
        const canvas = document.createElement('canvas');
        const canvasSize = canvas.width = canvas.height = this.eyeRadius * 2.5;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(canvasSize * .5, canvasSize * .5, 0, canvasSize * .5, canvasSize * .5, canvasSize * 0.4);
        gradient.addColorStop(0.2, 'rgba(210,210,210,1)');
        gradient.addColorStop(1, 'rgba(255,255,255,1)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        const shadowTexture = new THREE.CanvasTexture(canvas);
        const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture });
        const shadowGeo = new THREE.PlaneBufferGeometry(canvasSize, canvasSize, 1, 1);
        this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMaterial);
        this.shadowMesh.position.y = - 2 * this.eyeRadius;
        this.shadowMesh.rotation.x = - Math.PI / 2.05;
        this.scene.add(this.shadowMesh);
    }

    addCanvasEvents() {
        container.addEventListener('mousemove', (e) => {
            updateMousePosition(e.clientX, e.clientY, this);
        });
        function updateMousePosition(eX, eY, viz) {
            viz.mouse = {
                x: (eX - container.offsetLeft-viz.containerHalf.x) / (container.offsetWidth/2),
                y: (eY - container.offsetTop-viz.containerHalf.y) / viz.containerHalf.y
            };
        }
    }

    render() {
        this.eyeGroup.rotation.x += (this.mouse.y * 0.3 - this.eyeGroup.rotation.x) * .2;
        this.eyeGroup.rotation.y += (this.mouse.x * 0.6 - this.eyeGroup.rotation.y) * .2;
        this.renderer.render(this.scene, this.camera);
    }

    loop() {
        this.render();
        requestAnimationFrame(this.loop.bind(this));
    }

    updateSize() {
        this.containerHalf = { x: 500 / 2, y: 400 / 2 };
        this.renderer.setSize(500, 400);
        this.camera.aspect = 500 / 400;
        this.camera.updateProjectionMatrix();
        this.setCameraOffsetY();
    }
}

const viz = new Viz();
const animations = new Animations();

viz.updateSize();
viz.addCanvasEvents();

window.addEventListener('resize', () => viz.updateSize());
viz.loop();
animations.eyeAppear.play(0);