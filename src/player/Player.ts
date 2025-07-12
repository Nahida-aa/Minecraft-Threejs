import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/Addons.js';

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

export class Player {
  private fpvControls: PointerLockControls; // First-person view controls for the player 
  private camera: THREE.PerspectiveCamera; // fpvControls 没法直接控制上下移动 (飞行), 因此需要 camera
  private keyActionState: KeyActionState 
  private static SPEED = 0.2; // 移动速度

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLCanvasElement) {
    this.fpvControls = new PointerLockControls(camera, domElement); // 添加第一人称视角控制器

    this.camera = camera; // 保存相机引用
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
  handleMouseUp(event: MouseEvent) {
    throw new Error('Method not implemented.');
  }
  handleMouseDown(event: MouseEvent) {
    throw new Error('Method not implemented.');
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