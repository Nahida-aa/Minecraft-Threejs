import { PerspectiveCamera, WebGLRenderer, Scene } from 'three';

export class Environment {
  private renderer: WebGLRenderer; // WebGL renderer for rendering the scene
  private camera: PerspectiveCamera // Perspective camera for viewing the scene
  private scene: Scene // Scene object to hold all the 3D objects

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

    this.initRenderer(); // Initialize the renderer
    this.initScene(); // Initialize the scene with objects, lights, etc.
    this.initCamera(); // Set the camera position
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
    this.camera.position.z = 5; // Set the camera position along the z-axis
  }

  public render() {
    this.renderer.render(this.scene, this.camera); // Render the scene from the perspective of the camera
  }

  public getEssentials() {
    return {
      renderer: this.renderer,
      camera: this.camera,
      scene: this.scene
    };
  }
}