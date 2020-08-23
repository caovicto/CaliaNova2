import * as THREE from '../node_modules/three/build/three.module.js';

import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';

var container, controls;
var camera, scene, renderer;

var cameraLimit = 10;
var randomSpread = 3;

var cameraCenter = new THREE.Vector3();
var cameraHorzLimit = 1;
var cameraVertLimit = 1;
var mouse = new THREE.Vector2();

var gemCells;
var orb;
var trajectories= [];
var activation = 0.02;


init();
render();


function init() {
    container = document.querySelector('.orb');

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    scene = new THREE.Scene();
                
    /**         LOAD LIGHTING       **/
    // var light = new THREE.PointLight( 0xff0000, 1, 100 );
    // light.position.set( 50, 50, 50 );
    // scene.add( light );

    var ambientLight = new THREE.AmbientLight( 0xf1edff);
    // scene.add( ambientLight );

    var ambientLight2 = new THREE.AmbientLight( 0xffffff );
    ambientLight2.position.set( 1, 0, 1 ).normalize();
    // scene.add( ambientLight2 );
            
    var directionalLight = new THREE.DirectionalLight( 0xffffff );
    directionalLight.position.set( 0, 1, 1 ).normalize();
    scene.add( directionalLight );
    
    var directionalLight2 = new THREE.DirectionalLight( 0xF37B9A, );
    directionalLight2.position.set( 0, 0, 1 ).normalize();
    scene.add( directionalLight2 );

    var directionalLightBlue = new THREE.DirectionalLight( 0xb5fffe );
    directionalLightBlue.position.set( 1, 0, 1 ).normalize();
    // scene.add( directionalLightBlue );	

    var directionalLightPink = new THREE.DirectionalLight( 0xf7b0ff );
    directionalLightPink.position.set( 0, 1, 1 ).normalize();
    scene.add( directionalLightPink );	

    var directionalLightPink2 = new THREE.DirectionalLight( 0xf7b0ff );
    directionalLightPink2.position.set( 1, 0, 0 ).normalize();
    // scene.add( directionalLightPink2 );	

    /**         LOAD FOG            **/
    scene.fog = new THREE.Fog(0x4000ff);

    /**         LOAD TEXTURE        **/
    var loader = new THREE.CubeTextureLoader();
    loader.setPath( 'assets/models/textures/' );

    var texture = new THREE.TextureLoader().load( 'assets/models/textures/facet.jpg' );

    var gemTexture = new THREE.MeshPhongMaterial( {
        map: texture,
        color: 0x2f0787,
        combine: THREE.MixOperation,
        // specular: 0x07155c, 
        reflectivity: 90,
        // emissive: 0x1b0c4d, 
        // emissiveIntensity: 0.7,
        shininess: 50, 
        opacity: 0.8,         
        transparent: true 
    }); 


    /**         INITIALIZE LOADER       **/
    var loader = new GLTFLoader().setPath('assets/models/');

    loader.load(
        // resource URL
        'orb.glb',
        // called when the resource is loaded
        function ( gltf ) {
            // set and keep gemCells
            gemCells = gltf.scene;				
            gltf.scene.scale.set( 2, 2, 2 );			   
            gltf.scene.position.x = 0;				    //Position (x = right+ left-) 
            gltf.scene.position.y = 0;				    //Position (y = up+, down-)
            gltf.scene.position.z = 0;				    //Position (z = front +, back-)

            scene.add( gltf.scene );

            // loading debug
            // console.log(dumpObject(gltf.scene).join('\n'));

            // update children
            gemCells.traverse(function(child) {
                // update gemTexture mesh
                if (child instanceof THREE.Mesh)
                {
                    child.material = gemTexture;
                    child.castShadow = true;
                    child.receiveShadow = true;  
                }

                // hide original cube
                if (child.name == "Cube")
                {
                    orb = child;
                }

                // translate shards
                if (child instanceof THREE.Object3D && child.name.includes("0"))
                {
                    let start = child.position.clone();
                    let move = getTrajectory();
                    let newTrajectory = {'object':child, 'start':start, 'move':move}
                    trajectories.push( newTrajectory );
                }
            });     

            render();        

        },
        // called while loading is progressing
        function ( xhr ) {
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },
        // called when loading has errors
        function ( error ) {
            console.log( 'An error happened' );
        }
    );

    renderer = new THREE.WebGLRenderer( { 
        antialias: true,
        container,
        alpha: true,
    } );

    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild( renderer.domElement );                

    camera.position.z = cameraLimit;

    
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousemove', function(event) {
        onDocumentMouseMove(event)
    });
    document.querySelector("#orb-trigger").addEventListener('mouseenter', animateShatter, true);
    document.querySelector("#orb-trigger").addEventListener('mousedown', animateShatter, true);
    // document.querySelector("#orb-trigger").addEventListener('mouseout', animateMend, true);


    render();
    animate();
}



// ANIMATIONS

function animateShatter(){
    // var mouseCont = document.querySelector("#mouse");
    // mouseCont.innerHTML = "mouse enter";

    TweenMax.to( camera.position, 1, {
        ease: Power2.easeOut,
        z: cameraLimit*1.5
    });

    orb.visible = false;

    for (var i = 0; i < trajectories.length; i++)
    {
        TweenMax.to( trajectories[i].object.position, 1, {
            ease: Power2.easeOut,
			x: trajectories[i].move.x,  
			y: trajectories[i].move.y, 
			z: trajectories[i].move.z
        }).delay(0.5);
    }
    console.log(trajectories);
	
	// console.log(animationVars.rotation)
	
}

function animateMend(){
    var mouseCont = document.querySelector("#mouse");
    mouseCont.innerHTML = "mouse leave";
}


function animate () {  
    updateCamera();
    requestAnimationFrame( animate );

    gemCells.rotation.x += 0.005;
    gemCells.rotation.y += 0.005;

    render();
	
}

function render() {
    renderer.render( scene, camera );
}


// UPDATE FUNCTIONS

function updateCamera() {
    //offset the camera x/y based on the mouse's position in the window
    camera.position.x = cameraCenter.x + (cameraHorzLimit * mouse.x);
    camera.position.y = cameraCenter.y + (cameraVertLimit * mouse.y);
}


function onDocumentMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    render();
}



function getTrajectory() {
    let x = Math.random() * (cameraLimit/randomSpread); 
    x *= Math.floor(Math.random()*2) == 1 ? 1 : -1;
    let y = Math.random() * (cameraLimit/(randomSpread));
    y *= Math.floor(Math.random()*2) == 1 ? 1 : -1;
    let z = Math.random() * (cameraLimit/(randomSpread));
    z *= Math.floor(Math.random()*2) == 1 ? 1 : -1;

    return new THREE.Vector3(x, y, z);
}



function dumpObject(obj, lines = [], isLast = true, prefix = '') {
    const localPrefix = isLast ? '└─' : '├─';
    lines.push(`${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${obj.type}]`);
    const newPrefix = prefix + (isLast ? '  ' : '│ ');
    const lastNdx = obj.children.length - 1;
    obj.children.forEach((child, ndx) => {
      const isLast = ndx === lastNdx;
      dumpObject(child, lines, isLast, newPrefix);
    });
    return lines;
}

