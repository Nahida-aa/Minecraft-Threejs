import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Environment } from './environment/Environment';
import type { Mesh } from 'three';

const environment = new Environment(); // Assuming Environment is a custom class that sets up the scene, camera, and renderer
const { renderer, camera, scene } = environment.getEssentials(); // Get essentials from the Environment class

function addBlocks(scene: THREE.Scene, length: number) {
  const blocks: Mesh[] = [];
  for (let i = 0; i < length; i++) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshNormalMaterial();
    const block = new THREE.Mesh(geometry, material);
    
    // Randomly position the blocks within a certain range
    block.position.set(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20
    );
    
    blocks.push(block);
    scene.add(block);
  }
  return blocks;
}

const orbitControls = new OrbitControls( camera, renderer.domElement );

const blocks = addBlocks(scene, 100); // Add 100 blocks to the scene

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshNormalMaterial();
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5; // 相机默认是看向z的负方向, 默认在原点


function animate() {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  orbitControls.update(); // 更新控制器
  // renderer.render( scene, camera );
  environment.render(); // 渲染环境
}
/**
 * A build in function that can be used instead of requestAnimationFrame. For WebXR projects this function must be used.
 * 一个内置函数，可以替代 requestAnimationFrame。对于 WebXR 项目，必须使用此函数。
 * @param callback The function will be called every available frame. If `null` is passed it will stop any already ongoing animation.
 */
renderer.setAnimationLoop( animate );
