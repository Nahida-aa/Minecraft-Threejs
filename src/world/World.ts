import * as THREE from 'three';
import { Block, type BlockKey } from './level/block/Block';
import { WORLD_DEPTH, WORLD_HEIGHT, WORLD_SIZE, WORLD_TOTAL_HEIGHT } from '../constants';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { RNG } from '../utils/rng';
import type { instance } from 'three/tsl';
import { Vector3 } from 'three';

export interface BlockState {
  key: BlockKey; // 方块的名称
  instanceId: number|null; // 如果没有分配实例ID, 则为 说明这个方块存在于这个世界, 但由于被遮挡, 因此不需要渲染
}
export type BlockStates = BlockState[][][]

export class World {
  private scene: THREE.Scene; // Scene to hold all the 3D objects
  private blocks: Block[]; // Array to hold all the blocks
  private blockStates: BlockStates
  private generateParameters = {
    seed: 1, // Seed for random generation
    terrain: {
      scale: 30, // 貌似控制平坦程度
      magnitude: 0.5, // 貌似控制高度
      offset: 0.2 // 竖直偏移量
    }
  }

  constructor(scene: THREE.Scene) {
    this.scene = scene; // Initialize the scene
    this.blocks = []; // Initialize the blocks array
    this.blockStates = []; // Initialize the block states array
    this.initWorld(); 

    this.registerBlock('grass'); // Register the grass block
    this.registerBlock('dirt'); // Register the dirt block
    this.registerBlock("glass")
    this.registerBlock("stone"); // Register the stone block
    this.registerBlock("log"); 
    this.registerBlock("plank"); 
    this.registerBlock("bedrock"); // Register the bedrock block
    this.clearDefaultInstances(); // Clear default instances to avoid duplicates

    // init terrain data
    this.initTerrainData(); // Initialize the terrain data
    this.generateTerrainData(); // Generate the terrain data
    this.generateTerrain(); // Generate the terrain by placing blocks
  }

  private initWorld() {
    // 天空
    this.scene.background = new THREE.Color('#75bfef'); // Set a sky blue background color
    // 添加环境光(漫射)
    const environmentLight = new THREE.AmbientLight(0xeeeeee, 0.7); // Add ambient light to the scene
    this.scene.add(environmentLight); // Add the ambient light to the scene
    // add 太阳光(方向光)
    const sunLight = new THREE.DirectionalLight(0xffffff); // Create a directional light (sun)
    sunLight.position.set(5, 50, 40); // Set the position of the sun light
  
    const lightHelper = new THREE.DirectionalLightHelper(sunLight, 8, new THREE.Color("red")); // Optional: Add a helper to visualize the light
    this.scene.add(lightHelper); // Add the light helper to the scene
    this.scene.add(sunLight); // Add the sun light to the scene
  }

  // 注册
  private registerBlock(name: BlockKey) {
    const block = new Block(name); // Create a new block instance
    this.blocks.push(block); // Add the block to the blocks array
    this.scene.add(block.getInstanceMesh()); // Add the block's instanced mesh to the scene
  } 
  // 清除默认实例
  private clearDefaultInstances() {
    this.blocks.forEach(block => {
      block.getInstanceMesh().instanceMatrix = new THREE.InstancedBufferAttribute(new Float32Array(WORLD_SIZE * WORLD_SIZE * WORLD_TOTAL_HEIGHT * 16), 16); // Clear the instance matrix to avoid duplicates
    });
  }

  private isInBounds(x: number, y: number, z: number): boolean {
    return x >= 0 && x < WORLD_SIZE && y >= 0 && y < (WORLD_HEIGHT+WORLD_DEPTH) && z >= 0 && z < WORLD_SIZE; // Check if the coordinates are within bounds
  }
  public getBlockStateAt(x: number, y: number, z: number) {
    if (!this.isInBounds(x, y, z)) {
      return { key: "air" } as BlockState; // Return air block state if out of bounds
    }
    return this.blockStates[x][y][z]; // Return the block state at the specified coordinates
  }
  public setBlockStateBlockKeyAt(x: number, y: number, z: number, blockKey: BlockKey) {
    if (!this.isInBounds(x, y, z))return; // Do nothing if out of bounds
    this.blockStates[x][y][z].key = blockKey; // Set the block state at the specified coordinates
  }
  public getBlockStateInstanceIdAt(x: number, y: number, z: number) {
    if (!this.isInBounds(x, y, z)) return; // Return undefined if out of bounds
    const blockState = this.blockStates[x][y][z]; // Get the block state at the specified coordinates
    if (blockState) {
      return blockState.instanceId; // Return the instance ID of the block state
    }
  }
  public setBlockStateAt(x: number, y: number, z: number, blockState: BlockState) {
    if (!this.isInBounds(x, y, z))return; 
    this.blockStates[x][y][z] = blockState; 
  }
  public setBlockStateInstanceIdAt(x: number, y: number, z: number, instanceId: number|null) {
    if (!this.isInBounds(x, y, z)) return; // Do nothing if out of bounds
    const blockState = this.blockStates[x][y][z]; // Get the block state at the specified coordinates
    if (blockState && blockState.key != "air") {
      this.blockStates[x][y][z].instanceId = instanceId; // Set the instance ID for the block state at the specified coordinates
    }
  }
  private initTerrainData() {
    this.blockStates = []; // Initialize the block states array
    for (let x = 0; x < WORLD_SIZE; x++) {
      this.blockStates[x] = [];
      for (let y = 0; y < WORLD_TOTAL_HEIGHT; y++) {
        this.blockStates[x][y] = [];
        for (let z = 0; z < WORLD_SIZE; z++) {
          this.blockStates[x][y][z] = { key: "air", instanceId: null }; // Initialize all positions to air block
        }
      }
    }
  }
  // 生成地形数据, 噪声
  private generateTerrainData() {
    const rng = new RNG(this.generateParameters.seed); // Create a random number generator with the seed
    const noise = new SimplexNoise(rng); // Create a new Simplex noise instance
    for (let x = 0; x < WORLD_SIZE; x++) {
      for (let z = 0; z < WORLD_SIZE; z++) {
        const value = noise.noise(
          x / this.generateParameters.terrain.scale, 
          z / this.generateParameters.terrain.scale); // Generate noise value
        const scaledNoise = value * this.generateParameters.terrain.magnitude + this.generateParameters.terrain.offset; // Scale the noise value
        let height = Math.floor(scaledNoise * (WORLD_HEIGHT+WORLD_DEPTH)); // Calculate the height based on the noise value
        height = Math.max(0, Math.min(WORLD_TOTAL_HEIGHT, height)); // Clamp the height to be within bounds
        for (let y = 0; y < WORLD_TOTAL_HEIGHT; y++) {
          // console.log(`x: ${x}, y: ${y}, z: ${z}, height: ${height}`); // Log the coordinates and height for debugging
          if (y === height) {
            this.setBlockStateBlockKeyAt(x, y, z, "grass"); // Set grass block below the height
          } else if (y === height - 1) {
            this.setBlockStateBlockKeyAt(x, y, z, "dirt"); // Set dirt block at the height
          }  else if (0 < y && y < height ) {
            this.setBlockStateBlockKeyAt(x, y, z, "stone"); // Set stone block below the height
          } else if (y === 0) {
            this.setBlockStateBlockKeyAt(x, y, z, "bedrock"); // Set bedrock block at the bottom
          }
          else {
            this.setBlockStateBlockKeyAt(x, y, z, "air"); // Set air block above the height
          }
        }
      }
    }
  }
  // 生成地形(渲染方块)
  private generateTerrain() {
    const matrix = new THREE.Matrix4(); // Create a new matrix for positioning
    for (let x = 0; x < WORLD_SIZE; x++) {
      for (let y = 0; y < (WORLD_HEIGHT+WORLD_DEPTH); y++) {
        for (let z = 0; z < WORLD_SIZE; z++) {
          const blockState = this.getBlockStateAt(x, y, z); // Get the block state at the current position
          const block = this.blocks.find(b => b.getName() === blockState.key); // Find the corresponding block
          // 实现不放置 看不见的方块(空气,被挡住的)
          //
          if (block && blockState.key !== "air" && this.shouldRender(x, y, z)) {
            const instanceMesh = block.getInstanceMesh(); // Get the instanced mesh of the block
            const idx = instanceMesh.count; // Get the current count of instances
            matrix.setPosition(x, y, z); // Set the position in the matrix
            instanceMesh.setMatrixAt(idx, matrix); // Set the matrix for each instance
            this.setBlockStateInstanceIdAt(x, y, z, idx); // Update the block state with the new instance ID
            instanceMesh.count++; // Increment the count of instances
          }
        }
      }
    }
  }
  // 如果没有被遮挡, 就应该显示
  public shouldRender(x: number, y: number, z: number): boolean {
    const up = this.getBlockStateAt(x, y + 1, z).key === "air"; // Get the block state above
    const down = this.getBlockStateAt(x, y - 1, z).key === "air"; // Get the block state below
    const left = this.getBlockStateAt(x - 1, y, z).key === "air"; // Get the block state to the left
    const right = this.getBlockStateAt(x + 1, y, z).key === "air"; // Get the block state to the right
    const front = this.getBlockStateAt(x, y, z - 1).key === "air"; // Get the block state in front
    const back = this.getBlockStateAt(x, y, z + 1).key === "air"; // Get the block state behind
    // If any of the adjacent blocks are air, the block should be rendered
    return up || down || left || right || front || back; // Return true if any
  }
  public getAllBlockMesh() {
    return this.blocks.map(block => block.getInstanceMesh()); // Return all block meshes
  }
  // 玩家破坏方块
  public removeBlockState(block: THREE.Intersection<THREE.Object3D>) {
    if (block.object instanceof THREE.InstancedMesh) {
      if (block.distance > 10) return; 
      const instanceId = block.instanceId!; // 获取实例ID
      const breakMatrix = new THREE.Matrix4(); 
      block.object.getMatrixAt(instanceId, breakMatrix); 
      const breakPosition = new Vector3().setFromMatrixPosition(breakMatrix); 
      const lastMatrix = new THREE.Matrix4(); 
      block.object.getMatrixAt(block.object.count - 1, lastMatrix); 
      const lastPosition = new Vector3().setFromMatrixPosition(lastMatrix);

      this.setBlockStateAt(breakPosition.x, breakPosition.y, breakPosition.z, { key: "air", instanceId: null }); // Set the block state to air
      this.setBlockStateInstanceIdAt(lastPosition.x, lastPosition.y, lastPosition.z, instanceId); 
      block.object.setMatrixAt(instanceId, lastMatrix); 
      block.object.count--; 
      block.object.computeBoundingSphere();
      block.object.instanceMatrix.needsUpdate = true; 
      
      this.tryShowBlock(breakPosition.x-1, breakPosition.y, breakPosition.z); // Try to show surrounding blocks
      this.tryShowBlock(breakPosition.x+1, breakPosition.y, breakPosition.z); 
      this.tryShowBlock(breakPosition.x, breakPosition.y, breakPosition.z-1);
      this.tryShowBlock(breakPosition.x, breakPosition.y, breakPosition.z+1);
      this.tryShowBlock(breakPosition.x, breakPosition.y-1, breakPosition.z);
      this.tryShowBlock(breakPosition.x, breakPosition.y+1, breakPosition.z);
    }
  }

  // 玩家放置方块
  public placeBlockState(block: THREE.Intersection<THREE.Object3D>, newBlockKey: BlockKey) {
    // 1. 参数检查
    if (block.object instanceof THREE.InstancedMesh) {
      if (block.distance > 10) return; // 如果距离大于5, 则不放置方块
      const placeMatrix = new THREE.Matrix4(); // Create a new matrix for placing the block
      // 2. 获取放置位置
      block.object.getMatrixAt(block.instanceId!, placeMatrix); // 获得点击的位置
      const face = block.face!.normal // 获得交点的法线方向
      const placePos = new Vector3().setFromMatrixPosition(placeMatrix).add(face) // 获得放置位置
      // 3. 获得要摆放的方块的 mesh
      const placeBlock = this.blocks.find(b => b.getName() === newBlockKey); // Find the block to place
      if (placeBlock) {
        // 4. 设置放置位置的变换矩阵
        // 5. 更新要摆放的 mesh
        const placeMesh = placeBlock.getInstanceMesh(); // Get the instanced mesh of the block to place
        const index = placeMesh.count; // Get the current count of instances
        placeMesh.setMatrixAt(index, placeMatrix.setPosition(placePos)); // Set the matrix for the new instance
        placeMesh.count++; // Increment the count of instances
        // 6. 更新世界 方块 数据
        this.setBlockStateBlockKeyAt(Math.floor(placePos.x), Math.floor(placePos.y), Math.floor(placePos.z),  newBlockKey); // Set the block state at the placed position
        // 7. 隐藏周围的方块
        this.tryHideBlock(placePos.x-1, placePos.y, placePos.z); // Try to hide surrounding blocks
        this.tryHideBlock(placePos.x+1, placePos.y, placePos.z); // Try to hide surrounding blocks
        this.tryHideBlock(placePos.x, placePos.y, placePos.z-1); // Try to hide surrounding blocks
        this.tryHideBlock(placePos.x, placePos.y, placePos.z+1); // Try to hide surrounding blocks
        this.tryHideBlock(placePos.x, placePos.y-1, placePos.z); // Try to hide surrounding blocks
        this.tryHideBlock(placePos.x, placePos.y+1, placePos.z); // Try to hide surrounding blocks

        // 8. 告诉系统 该方块的碰撞箱(用于raycaster) 需要更新
        placeMesh.computeBoundingSphere(); // Update the bounding sphere for the instanced mesh
        placeMesh.instanceMatrix.needsUpdate = true; // Mark the instance matrix as needing update
      }
    }
  }
  // 用于在放置方块后尝试隐藏周围方块
  tryHideBlock(x: number, y: number, z: number) {
    const blockState = this.getBlockStateAt(x, y, z); // Get the block state at the specified coordinates
    if (blockState.key !== "air" && !this.shouldRender(x, y, z)) {
      this.hideBlock(x, y, z); // If the block is not air and should not be rendered, hide it
    }
  }

  hideBlock(x: number, y: number, z: number) {
    // 1. 获取要隐藏的方块
    const blockState = this.getBlockStateAt(x, y, z); // Get the block state at the specified coordinates
    const block = this.blocks.find(b => b.getName() === blockState.key); // Find the corresponding block
    // console.log(`Hiding block at (${x}, ${y}, ${z}) with key: ${blockState.key}`); // Log the hiding action
    // 2. 再次保证目标方块的状态 不是空气
    if (block && blockState.key !== "air") {
      // 3. 将 instancedMesh 中的最后一个实例 移动到 要隐藏的 instanceId 上, 再将 count 减一
      // instancedMesh: [{instanceId:0, block:0}, {1,1}, {2,2}, shouldHide:{3,3}, {4,4}, ..., {n,n}], count: n+1
      // <->, 交换方块的方法是交换 位置 (注: 无论交换位置还是交换id, 都是一样的)
      // [{0,0}, {1,1}, {2,2}, {3,n}, {4,4}, ..., {n-1,n-1}, {n}], count: n+1
      // count-1
      // [{0,0}, {1,1}, {2,2}, {3,n}, {4,4}, ..., {n-1,n-1}], count: n
      // 上面的方案是因为 block 都是一样的
      const instanceMesh = block.getInstanceMesh(); // Get the instanced mesh of the block
      const index = blockState.instanceId; // Get the instance ID from the block state
      // console.log(`Hiding block at (${x}, ${y}, ${z}) with instance ID: ${index}`); // Log the hiding action
      if (index !== null && index < instanceMesh.count) {
        const lastIndex = instanceMesh.count - 1; // Get the last index of the instances
        const lastMatrix = new THREE.Matrix4(); // Create a new matrix for the last instance
        instanceMesh.getMatrixAt(lastIndex, lastMatrix); // 通过 idx 获取最后一个实例的矩阵
        const lastPosition = new Vector3().applyMatrix4(lastMatrix); // Get the position of the last instance
        // 最后一个方块移动到 要隐藏的方块位置
        instanceMesh.setMatrixAt(index, lastMatrix); // Set the matrix of the instance to
        this.setBlockStateInstanceIdAt(lastPosition.x, lastPosition.y, lastPosition.z, index); // Update the block state with the new instance ID
        instanceMesh.count--; // Decrement the count of instances

        // 告诉系统 该方块的碰撞箱(用于raycaster) 需要更新
        instanceMesh.computeBoundingSphere()
        instanceMesh.instanceMatrix.needsUpdate = true; // Mark the instance matrix as needing update
        this.setBlockStateInstanceIdAt(x, y, z, null); // Clear the instance ID for the hidden block state
      }
    }
  }
  tryShowBlock(x: number, y: number, z: number) {
    const blockState = this.getBlockStateAt(x, y, z); 
    if (blockState.key !== "air" && this.shouldRender(x, y, z) && this.getBlockStateInstanceIdAt(x,y,z)===null) { 
      const block = this.blocks.find(b => b.getName() === "grass"); // Find a block to show (e.g., grass)
      if (block) {
        const instanceMesh = block.getInstanceMesh(); // Get the instanced mesh of the block
        const idx = instanceMesh.count; // Get the current count of instances
        const matrix = new THREE.Matrix4().setPosition(x, y, z); // Create a matrix for the position
        instanceMesh.setMatrixAt(idx, matrix); // Set the matrix for the new instance
        this.setBlockStateInstanceIdAt(x, y, z, idx); // Update the block state with the new instance ID
        instanceMesh.count++; // Increment the count of instances
        instanceMesh.computeBoundingSphere(); // Update the bounding sphere for the instanced mesh
        instanceMesh.instanceMatrix.needsUpdate = true; // Mark the instance matrix as needing update
      }
    }
  }
  // test
  public generateBlocks(length: number, blockKey: BlockKey, y: number = 0) {
    // console.log(`Generating blocks of type ${blockKey} at y=${y} with length=${length}`); // Log the generation parameters
    const block = this.blocks.find(b => b.getName() === blockKey); // Find the block by its name
    if (block) {
      const instanceMesh = block.getInstanceMesh(); // Get the instanced mesh of the block
      const matrix = new THREE.Matrix4(); // Create a new matrix for positioning
      for (let i = 0; i < length; i++) {
        for (let j = 0; j < length; j++) {
          // 设置每个实例的变换矩阵
          matrix.setPosition(i, y, j); // Set the position in the matrix
          instanceMesh.setMatrixAt(i * length + j, matrix); // Set the matrix for each instance
        }
      }
    }
  }
}