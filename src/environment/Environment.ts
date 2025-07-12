import { PerspectiveCamera, WebGLRenderer, Scene, AmbientLight } from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { WORLD_SIZE } from '../constants';

export class Environment {
  private renderer: WebGLRenderer; // WebGL renderer for rendering the scene
  private camera: PerspectiveCamera // Perspective camera for viewing the scene
  private scene: Scene // Scene object to hold all the 3D objects

  private stats: Stats

  constructor() {
    // Initialize the renderer with antialiasing for smoother edges
    this.renderer = new WebGLRenderer({ 
      antialias: true  // 抗锯齿
    });
    // Create a perspective camera with a field of view, aspect ratio, near and far clipping planes
    this.camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 
      1000 // far — Camera frustum far plane. Default 2000.
    ); // https://learnwebgl.brown37.net/08_projections/projections_perspective.html
    // Create a scene to hold all objects
    this.scene = new Scene();
    // Initialize stats for performance monitoring
    // 性能监控的统计信息
    this.stats = new Stats(); 

    this.initRenderer(); // Initialize the renderer
    this.initScene(); // Initialize the scene with objects, lights, etc.
    this.initCamera(); // Set the camera position
    this.initStats(); // Initialize stats for performance monitoring
    this.setupResizeListener(); // Set up a listener for window resize events
  }

  private initRenderer() {
    this.renderer.setSize(window.innerWidth, window.innerHeight); // Set the size of the renderer to the window dimensions
    document.body.appendChild(this.renderer.domElement); // Append the renderer's canvas to the document body
  }
  private initScene() {
    // Initialize the scene with any objects, lights, or cameras
    // This method can be extended to add objects to the scene
    
  }
  private initCamera() {
    this.camera.position.set(WORLD_SIZE-1, 30, WORLD_SIZE-1); // Set the camera position along the z-axis // 相机默认是看向z的负方向, 默认在原点
  }

  private initStats() {
    document.body.appendChild(this.stats.dom); // Append the stats DOM element to the document body
  }

  // 当窗口大小改变时，更新相机和渲染器的大小
  private setupResizeListener() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight; // Update camera aspect ratio // 更新相机的宽高
      this.camera.updateProjectionMatrix(); // Update camera projection matrix // 更新相机投影矩阵
      this.renderer.setSize(window.innerWidth, window.innerHeight); // Update renderer size // 更新渲染器的大小
    });
  }

  public render() {
    this.renderer.render(this.scene, this.camera); // Render the scene from the perspective of the camera
  }

  public getEssentials() {
    return {
      renderer: this.renderer,
      camera: this.camera,
      scene: this.scene,
      stats: this.stats,
    };
  }


}