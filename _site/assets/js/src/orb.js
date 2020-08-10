import * as THREE from '../node_modules/three/build/three.module.js';

import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';

var container, controls;
var camera, scene, renderer;

var cameraLimit = 12;
var randomSpread = 2;

var cameraCenter = new THREE.Vector3();
var cameraHorzLimit = 1;
var cameraVertLimit = 1;
var mouse = new THREE.Vector2(1, 1);

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
    var ambientLight = new THREE.AmbientLight( 0x32acb3 );
    scene.add( ambientLight );

    var ambientLight2 = new THREE.AmbientLight( 0x412475);
    ambientLight2.position.set( 1, 0, 1 ).normalize();
    // scene.add( ambientLight2 );
            
    var directionalLight = new THREE.DirectionalLight( 0xd4deff );
    directionalLight.position.set( 0, 1, 1 ).normalize();
    scene.add( directionalLight );
    
    var directionalLight2 = new THREE.DirectionalLight( 0xd4deff );
    directionalLight2.position.set( 0, 0, 1 ).normalize();
    // scene.add( directionalLight2 );

    var directionalLightBlue = new THREE.DirectionalLight( 0xb5fffe );
    directionalLightBlue.position.set( 1, 0, 1 ).normalize();
    scene.add( directionalLightBlue );	

    var directionalLightPink = new THREE.DirectionalLight( 0xf7b0ff );
    directionalLightPink.position.set( 0, 1, 1 ).normalize();
    scene.add( directionalLightPink );	

    var directionalLightPink2 = new THREE.DirectionalLight( 0xf7b0ff );
    directionalLightPink2.position.set( 1, 0, 0 ).normalize();
    // scene.add( directionalLightPink2 );	



    /**         LOAD TEXTURE        **/
    var urls = [ "assets/models/textures/sample_bg.png" ];
    var texture = new THREE.TextureLoader( "assets/models/textures/sample_bg.png" );
    var quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(), new THREE.MeshBasicMaterial({map: texture}));


    var transluscent = new THREE.MeshPhongMaterial( {
        color: 0x7442ff, 
        emissive: 0x7442ff,
        specular: 0xffffff, 
        shininess: 100, 
        // premultipliedAlpha: true,
        // opacity: 0.95,
        envMap: texture,
        shading: THREE.SmoothShading, 
        refractionRatio: 0.5, 
        reflectivity: 0.95 
    } );


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
                // update transluscent mesh
                if (child instanceof THREE.Mesh)
                {
                    child.material = transluscent;
                    child.castShadow = true;
                    child.receiveShadow = true;  
                    // child.visible = false;
                }

                // hide original cube
                if (child.name == "Cube")
                {
                    console.log(child.name);
                    orb = child;
                    // child.visible = true;
                }

                // translate shards
                if (child instanceof THREE.Object3D && child.name.includes("0"))
                {
                    console.log(child.name);
                    // child.visible = false;
                    let start = child.position.clone();
                    let move = getTrajectory();
                    let newTrajectory = {'object':child, 'start':start, 'move':move}
                    trajectories.push( newTrajectory );
                    // updateShards();
                }
            });

            console.log(trajectories);           

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
    console.log(controls);
    document.addEventListener('mousemove', function(event) {
        onDocumentMouseMove(event)
    });
    document.addEventListener('mousedown', function(event, controls) {
        onDocumentMouseMove(event)
    });
      

    render();
    animate();
}

function animate () {
    
    requestAnimationFrame( animate );

    updateShards();

    gemCells.rotation.x += 0.005;
    gemCells.rotation.y += 0.005;

    // controls.update();
    render();
	
}


function updateShards() {
    // console.log(trajectories[0]?.object?.position);
    for (var i = 0; i < trajectories.length; i++)
    {
        // getMouseDistance();
        var trigger = curveFunction(getMouseDistance());
        var mouseCont = document.querySelector('#mouse');
        // mouseCont.innerHTML = (mouse.x+mouse.y)/2;

        if (trigger < 0.0001)
        {
            // whole orb
            orb.visible = true;
        }
        else
        {
            // hide orb, show shards
            orb.visible = false;
            trajectories[i].object.visible = true;

            // move shards
            var translate = new THREE.Vector3();
            translate.add(trajectories[i].move);
            translate.multiplyScalar(trigger);
            translate.add(trajectories[i].start);
            trajectories[i].object.position.copy(translate);
        }
    }
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

//

function render() {
    renderer.render( scene, camera );
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

function getMouseDistance(){
    // var center = {'x':window.innerWidth/2, 'y':window.innerHeight/2 };

    // var totalDist = Math.sqrt(Math.pow((window.innerWidth-center.x), 2)+Math.pow((window.innerHeight-center.y), 2));
    var dist = Math.sqrt(Math.pow((mouse.x), 2)+Math.pow((mouse.y), 2));

    return dist;
}

function curveFunction(x){
    let exponent = -(Math.pow(x, 2))/activation;
    return Math.pow(Math.E, exponent);
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

