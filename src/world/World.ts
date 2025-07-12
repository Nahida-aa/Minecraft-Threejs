import * as THREE from 'three';
import { Block, type BlockKey } from './level/block/Block';
import { WORLD_DEPTH, WORLD_HEIGHT, WORLD_SIZE, WORLD_TOTAL_HEIGHT } from '../constants';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { RNG } from '../utils/rng';

export interface BlockState {
  key: BlockKey; // 方块的名称
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
  public setBlockStateAt(x: number, y: number, z: number, blockState: BlockState) {
    if (!this.isInBounds(x, y, z))return; // Do nothing if out of bounds
    this.blockStates[x][y][z] = blockState; // Set the block state at the specified coordinates
  }
  private initTerrainData() {
    this.blockStates = []; // Initialize the block states array
    for (let x = 0; x < WORLD_SIZE; x++) {
      this.blockStates[x] = [];
      for (let y = 0; y < WORLD_TOTAL_HEIGHT; y++) {
        this.blockStates[x][y] = [];
        for (let z = 0; z < WORLD_SIZE; z++) {
          this.blockStates[x][y][z] = { key: "air" }; // Initialize all positions to air block
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
            this.setBlockStateAt(x, y, z, { key: "grass" }); // Set grass block below the height
          } else if (y === height - 1) {
            this.setBlockStateAt(x, y, z, { key: "dirt" }); // Set dirt block at the height
          }  else if (0 < y && y < height ) {
            this.setBlockStateAt(x, y, z, { key: "stone" }); // Set stone block below the height
          } else if (y === 0) {
            this.setBlockStateAt(x, y, z, { key: "bedrock" }); // Set bedrock block at the bottom
          }
          else {
            this.setBlockStateAt(x, y, z, { key: "air" }); // Set air block above the height
          }
        }
      }
    }
  }
  private generateTerrain() {
    // 生成地形(放置方块)
    const matrix = new THREE.Matrix4(); // Create a new matrix for positioning
    for (let x = 0; x < WORLD_SIZE; x++) {
      for (let y = 0; y < (WORLD_HEIGHT+WORLD_DEPTH); y++) {
        for (let z = 0; z < WORLD_SIZE; z++) {
          const blockState = this.getBlockStateAt(x, y, z); // Get the block state at the current position
          const block = this.blocks.find(b => b.getName() === blockState.key); // Find the corresponding block
          if (block && blockState.key !== "air") { // If the block is not air
            const instanceMesh = block.getInstanceMesh(); // Get the instanced mesh of the block
            matrix.setPosition(x, y, z); // Set the position in the matrix
            instanceMesh.setMatrixAt(instanceMesh.count, matrix); // Set the matrix for each instance
            instanceMesh.count++; // Increment the count of instances
          }
        }
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
          const position = new THREE.Vector3(i, y, j); // Set the position of each block
          matrix.setPosition(position); // Set the position in the matrix
          instanceMesh.setMatrixAt(i * length + j, matrix); // Set the matrix for each instance
        }
      }
    }
  }
}