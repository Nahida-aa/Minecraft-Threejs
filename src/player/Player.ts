import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/Addons.js';
import type { World } from '../world/World';

type KeyCodes = 
  | 'KeyW' 
  | 'KeyS' 
  | 'KeyA' 
  | 'KeyD' 
  | 'Space' 
  | 'ShiftLeft';
type AcceptedKeyActions = 
  | 'moveForward' 
  | 'moveBackward' 
  | 'moveLeft' 
  | 'moveRight' 
  | 'jump' 
  | 'crouch';
export type KeyActionMap = {
  [key in KeyCodes]: AcceptedKeyActions;
};
const KEY_ACTION_MAP: KeyActionMap = {
  KeyW: 'moveForward', // 双击 'sprint'
  KeyS: 'moveBackward',
  KeyA: 'moveLeft',
  KeyD: 'moveRight',
  Space: 'jump', // 飞行状态下: 'flyUp'
  ShiftLeft: 'crouch', // 飞行状态下: 'flyDown',  
}

// 当前 KeyAction 状态
export type KeyActionState = {
  [key in AcceptedKeyActions]: boolean;
}
function getActionByKey(key: KeyCodes): AcceptedKeyActions {
  return KEY_ACTION_MAP[key];
}

type MouseCodes = 0| 1 | 2; // 0: left click, 1: middle click, 2: right click
type AcceptedMouseActions = "break" | "middleClick" | "put"; // break: break block, middleClick: place block, put: use item
export type MouseActionMap = {
  [key in MouseCodes]: AcceptedMouseActions;
};
const MOUSE_ACTION_MAP: MouseActionMap = {
  0: "break", // 左键: break 破坏
  1: "middleClick", // 中键: place block
  2: "put" // 右键: use item; put
}
function getActionByMouse(button: MouseCodes): AcceptedMouseActions {
  return MOUSE_ACTION_MAP[button];
}

export class Player {
  private fpvControls: PointerLockControls; // First-person view controls for the player 
  private camera: THREE.PerspectiveCamera; // fpvControls 没法直接控制上下移动 (飞行), 因此需要 camera
  private keyActionState: KeyActionState 
  private raycaster: THREE.Raycaster; // Raycaster for detecting blocks in the player's view
  
  private static SPEED = 0.2; // 移动速度
  world: World;

  constructor(camera: THREE.PerspectiveCamera, world: World, domElement: HTMLCanvasElement) {
    this.fpvControls = new PointerLockControls(camera, domElement); // 添加第一人称视角控制器
    this.camera = camera; // 保存相机引用
    this.raycaster = new THREE.Raycaster(); // 初始化光线投射器
    this.world = world; // 保存世界引用
    this.keyActionState = {
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false,
      jump: false,
      crouch: false
    }

    this.initFpvControls(); 
    this.initPositionControls()
    this.initBlockControls()
  }
  // private 是否可以被子类覆盖: protected
  private initFpvControls() {
    document.addEventListener("click", () => {
      if (this.fpvControls.isLocked === false) {
        this.fpvControls.lock(); // 锁定鼠标指针
      }
    });
  }
  private initPositionControls() {
    document.addEventListener('keydown', (event) => this.handleKeyDown(event)); // 监听键盘按下事件
    document.addEventListener('keyup', (event) => this.handleKeyUp(event)); // 监听键盘松开事件
  }
  private initBlockControls() {
    document.addEventListener("mousedown", (event) => this.handleMouseDown(event)); // 监听鼠标按下事件
    document.addEventListener("mouseup", (event) => this.handleMouseUp(event)); // 监听鼠标松开事件
  }
  private handleKeyDown(event: KeyboardEvent) {
    const action = getActionByKey(event.code as KeyCodes);
    if (action) {
      this.keyActionState[action] = true; // Set the action state to true when the key is pressed
    }
    console.log(`Key down: ${event.code}, Action: ${action}, State: ${this.keyActionState[action]}`);
  }
  private handleKeyUp(event: KeyboardEvent) {
    const action = getActionByKey(event.code as KeyCodes);
    if (action) {
      this.keyActionState[action] = false; // Set the action state to false when the key is released
    }
  }

  // 默认方法 修饰是 private, 但可以被子类覆盖
  handleMouseDown(event: MouseEvent) {
    const action = getActionByMouse(event.button as MouseCodes);
    // 不用状态机
    switch (action) {
      case "break": 
        console.log(`Mouse down: ${event.button}, Action: ${action}`);
        this.breakBlockState()
        break;
      case "middleClick":
      case "put":
        console.log(`Mouse down: ${event.button}, Action: ${action}`);
        break;
      default:
        break;
    }
  }
  handleMouseUp(event: MouseEvent) {
    const action = getActionByMouse(event.button as MouseCodes);
    
    switch (action) {
      case "break": // Fallthrough
        console.log(`Mouse up: ${event.button}, Action: ${action}`);
        
        break
      case "middleClick":
      case "put":
        console.log(`Mouse up: ${event.button}, Action: ${action}`);
        break;
      default:
        break;
    }
    
  }
  // 破坏方块 state, 发出破坏方块的信号, 这里不处理, 因为 World 才是管理方块的地方
  public breakBlockState() {
    // 1. 获取到现在世界上注册的所有 Block (不是 BlockState), 不是以 instancedMesh 中的某一个为对象, 不过不会很卡
    const meshs = this.world.getAllBlockMesh(); // 获取所有方块的实例化网格
    // 2. 使用 raycaster (光线投射器) 从相机位置发射一条射线, 检测目前准心指向哪个方块
    // 使用前需要先更新位置和方向
    this.raycaster.setFromCamera(
      new THREE.Vector2(0, 0),  // 屏幕中心点
      this.camera); // 设置光线投射器的起点和方向
    // 找到与射线相交的方块
    const intersects = this.raycaster.intersectObjects(meshs); // 检测与方块的交点
    // 3. 发出破坏哪个方块的信号
    if (intersects.length > 0) {
      console.log(intersects[0].point); // 输出交点位置
      // const intersectedObject = intersects[0].object; // 获取第一个交点的对象
      // const blockMesh = intersectedObject as THREE.InstancedMesh; // 强制转换为 InstancedMesh
      // const instanceIndex = intersects[0].instanceId; // 获取实例索引
      // // 3. 根据 intersectedObject 和 instanceIndex, 找到对应的 BlockState
      // const block = this.world.getBlockByInstanceMesh(blockMesh, instanceIndex); // 获取对应的 Block
      // if (block) {
    }
  }

  public update() {
    const { moveForward, moveBackward, moveLeft, moveRight, jump, crouch } = this.keyActionState;

    const velocity = new THREE.Vector3(
      moveRight ? 1 : moveLeft ? -1 : 0, // 左右方向
      jump ? 1 : crouch ? -1 : 0, // 上下方向
      moveBackward ? 1 : moveForward ? -1 : 0 // 前后方向
    ).normalize().multiplyScalar(Player.SPEED); // Normalize to get direction and multiply by speed

    this.fpvControls.moveForward(-velocity.z); // Move forward/backward
    this.fpvControls.moveRight(velocity.x); // Move left/right
    this.camera.position.y += velocity.y; // Move up/down
  }
}