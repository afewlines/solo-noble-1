import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


/**
 * Three helper functions.
 */
const THREEx = {
  /**
   * Initialize three.js environment.
   * Renderer, raycaster, camera, scene, objects.
   * @param {element} element - Base element for renderer
   * @param {boolean} controls - Whether to create camera controls or not
   * @return {Object} Loaded objects
   */
  loadThree(element, controls = true) {
    let payload = {
      renderer: this.createRenderer(element), // init renderer, set base things
      raycaster: new THREE.Raycaster(), // init raycaster
      ...this.createScene(element), // init scene, camera, light
    };

    payload.controls = controls ? this.addCameraControls(payload.camera, payload.renderer.domElement) : undefined;


    return payload;
  },
  /**
   * Initialize generic camera controls.
   * @param {THREE.Camera} camera - Base element for renderer
   * @param {element} element - Element to get mouse input from
   * @return {THREE.OrbitControls} Loaded controls
   */
  addCameraControls(camera, element) {
    let controls = new OrbitControls(camera, element);
    controls.minDistance = 3;
    controls.maxDistance = 30;
    controls.enablePan = false;
    controls.mouseButtons = {
      LEFT: null,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE
    }
    return controls;
  },
  /**
   * Initialize three.js renderer.
   * @param {element} el - Base element for renderer
   * @return {THREE.Renderer} Loaded renderer
   */
  createRenderer(el) {
    let renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    el.appendChild(renderer.domElement);
    console.log('THREE element set');

    return renderer;
  },
  /**
   * Initialize scene, camera, generic lights.
   * @param {element} el - Base element for renderer
   * @return {Object} Loaded objects
   */
  createScene(el) {
    let scene = new THREE.Scene();

    let camera = new THREE.PerspectiveCamera(
      75,
      el.clientWidth / el.clientHeight,
      0.05,
      1000,
    );
    camera.position.z = 6;
    camera.position.y = 10;
    camera.rotation.x = Math.PI / -3;

    let lightGlobal = new THREE.AmbientLight(0xffffff, 0.5);
    let light = new THREE.PointLight(0xffffff);
    light.position.set(-15, 5, 20);
    scene.add(lightGlobal);
    scene.add(light);

    return { scene: scene, camera: camera, lights: { ambient: lightGlobal, point1: light } };
  },
  /**
   * Initialize build simple scene for early versions.
   * Will eventually load pre-saved environments in future.
   * @param {THREE.Scene} scene - Active scene
   * @param {THREE.Texture} skyTexture - Texture for skydome
   * @return {Object} Loaded objects
   */
  initSimpleScene(scene, skyTexture) {
    // sky
    let sky = new THREE.Mesh(
      new THREE.SphereGeometry(200, 25, 25),
      new THREE.MeshBasicMaterial({
        map: skyTexture,
      }),
    );
    sky.material.side = THREE.BackSide;
    scene.add(sky);

    let gPlane = new THREE.PlaneGeometry(50, 50, 4, 4);
    let mPlane = new THREE.MeshToonMaterial({
      color: 0x403628,
    });
    let plane = new THREE.Mesh(gPlane, mPlane);
    plane.rotation.x = Math.PI / -2;
    scene.add(plane);
    return { sky: sky, plane: plane };
  },
  /**
   * Add Boards, Pegs, triggers to scene.
   * @param {THREE.Scene} scene - Active scene
   * @param {THREE.BufferedGeometry} geomBoard - Board mesh geometry
   * @param {THREE.Scene} matBoard - Board mesh material
   * @param {Object[]} spots - Hole/Peg spots
   * @param {THREE.BufferedGeometry} geomPeg - Peg mesh geometry
   * @param {THREE.Scene} matPeg - Peg mesh material
   * @return {Object} Loaded objects
   */
  addBoard(scene, geomBoard, matBoard, spots, geomPeg, matPeg) {
    let makePeg = (id, lx, ly) => {
      let peg = new THREE.Mesh(geomPeg, matPeg);
      peg.name = `peg${id}`;
      peg.position.set(lx, 0.5, ly);
      return peg;
    }

    let board = new THREE.Mesh(geomBoard, matBoard);
    let pegs = []; // pegs created
    let triggers = []; // click triggers created
    let temp = null;
    for (let spot of spots) {
      if (spot.id != null) {
        pegs.push(makePeg(spot.id, spot.pos.x, spot.pos.y));
      }
      temp = new THREE.Mesh(new THREE.PlaneGeometry());
      temp.position.set(spot.pos.x, 0.5, spot.pos.y);
      temp.rotateX(Math.PI / -2);
      temp.visible = false;
      temp.name = `hole${spot.holeId}`;
      triggers.push(temp)
    }

    scene.add(board);
    board.add(...pegs);
    board.add(...triggers);
    board.position.set(0, 0.5, 0);
    return { board: board, pegs: pegs, triggers: triggers };
  }
};

export { THREEx }