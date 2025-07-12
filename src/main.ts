import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Environment } from './environment/Environment';
import { InstancedMesh, Matrix4, MeshLambertMaterial, Vector3, type Mesh } from 'three';
import { PointerLockControls } from 'three/examples/jsm/Addons.js';
import { World } from './world/World';
import { Player } from './player/Player';
import { WORLD_DEPTH, WORLD_SIZE } from './constants';

const environment = new Environment(); // Assuming Environment is a custom class that sets up the scene, camera, and renderer
const { renderer, camera, scene, stats } = environment.getEssentials(); // Get essentials from the Environment class

const world = new World(scene); // Initialize the world with the scene
// world.generateBlocks(WORLD_SIZE, "bedrock", 0); // Generate bedrock blocks at the bottom layer

const player = new Player(camera, renderer.domElement); // Initialize the player with the camera and renderer's DOM element
// const orbitControls = new OrbitControls( camera, renderer.domElement ); // 

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshNormalMaterial();
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

function animate() {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  // orbitControls.update(); // 更新控制器
  // fpvControls.update(); // 更新控制器
  player.update(); 
  stats.update(); // 更新性能监控
  // renderer.render( scene, camera );
  environment.render(); // 渲染环境
}

/**
 * A build in function that can be used instead of requestAnimationFrame. For WebXR projects this function must be used.
 * 一个内置函数，可以替代 requestAnimationFrame。对于 WebXR 项目，必须使用此函数。
 * @param callback The function will be called every available frame. If `null` is passed it will stop any already ongoing animation.
 */
renderer.setAnimationLoop( animate );
