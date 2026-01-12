// ModelEditor.jsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const ModelEditor = ({ modelType, onBack }) => {
  // Refs to persist Three.js objects across renders

  // DOM element that holds the canvas
  const containerRef = useRef(null);  
  // Three.js scene
  const sceneRef = useRef(null); 
  // Three.js camera
  const cameraRef = useRef(null);
  // Three.js renderer
  const rendererRef = useRef(null);
  // OrbitControls for mouse interaction
  const controlsRef = useRef(null);
  // Animation loop ID for cleanup
  const animationIdRef = useRef(null);

  // Initialize Three.js scene, camera, renderer
  const initThree = (container) => {
    // Create scene with dark background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Create perspective camera (FOV, aspect ratio, near clip, far clip)
    const camera = new THREE.PerspectiveCamera(
      60, 
      container.clientWidth / container.clientHeight, 
      0.001, 
      100
    );
    camera.position.set(0, 1.2, 3); // Position camera away from origin
    cameraRef.current = camera;

    // Create WebGL renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement); // Add canvas to DOM
    rendererRef.current = renderer;

    // Setup orbit controls for rotating/zooming with mouse
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;  // Smooth camera movement
    controls.dampingFactor = 0.07;
    controlsRef.current = controls;
  };

  // Add lighting to the scene
  const setupLights = () => {
    // Ambient light for overall illumination
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    sceneRef.current.add(ambient);
    
    // Directional light for shadows and definition
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 10, 7);
    sceneRef.current.add(directional);
  };

  // Load the 3D model from file
  const loadModel = (modelPath) => {
    console.log('Loading:', modelPath);
    const loader = new GLTFLoader();
    loader.load(
      modelPath, 
      (gltf) => {
        const model = gltf.scene;
        
        // Auto-scale model to fit in view
        const bbox = new THREE.Box3().setFromObject(model);
        const size = bbox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? (1.8 / maxDim) : 1.0;
        model.scale.set(scale, scale, scale);
        
        // RECALCULATE bounding box AFTER scaling
        const newBbox = new THREE.Box3().setFromObject(model);
        const center = newBbox.getCenter(new THREE.Vector3());
        
        // Center the model at origin
        model.position.sub(center);
        
        sceneRef.current.add(model);
        console.log('Model added to scene');
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error);
      }
    );
  };

  // Animation loop - runs every frame
  const animate = () => {
    animationIdRef.current = requestAnimationFrame(animate);
    controlsRef.current?.update();  // Update camera controls
    rendererRef.current?.render(sceneRef.current, cameraRef.current); // Render scene
  };

  // Main effect - runs once when component mounts or modelType changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Store ref for cleanup
    const container = containerRef.current; 
    
    // Initialize Three.js environment
    initThree(container);
    setupLights();
    loadModel(`/models/${modelType}.glb`);
    animate();

    // Cleanup when component unmounts or modelType changes
    return () => {
      cancelAnimationFrame(animationIdRef.current); // Stop animation loop
      controlsRef.current?.dispose();  // Free controls
      rendererRef.current?.dispose();  // Free renderer
      if (container && rendererRef.current?.domElement) {
        container.removeChild(rendererRef.current.domElement); // Remove canvas from DOM
      }
    };
  }, [modelType]);

  return (
    <div>
      <button onClick={onBack}>Back</button>
      {/* Container div where Three.js canvas will be inserted */}
      <div ref={containerRef} style={{ width: '100%', height: '80vh' }} />
    </div>
  );
};

export default ModelEditor;