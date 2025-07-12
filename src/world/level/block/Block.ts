import * as THREE from 'three';
import type { InstancedMesh } from "three";
import { WORLD_HEIGHT, WORLD_SIZE } from '../../../constants';
import { getMaterials } from '../../../textures/MaterialManager';

export type BlockKey = "grass" | "dirt" | "glass" | "stone" | "air" | "plank" | "log" | "bedrock" // 定义方块的类型

export class Block {
  private instanceMesh: InstancedMesh
  private name: BlockKey
  constructor(name: BlockKey) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = getMaterials(name);
    this.instanceMesh = new THREE.InstancedMesh(geometry, material, WORLD_SIZE*WORLD_SIZE); // 实例化网格 以节约性能
    this.instanceMesh.count = 0; // 初始化实例数量为0
    this.name = name; 
  }

  public getName(): BlockKey {
    return this.name; // 返回方块的名称
  }
  public getInstanceMesh(): InstancedMesh {
    return this.instanceMesh; // 返回实例化网格
  }
}