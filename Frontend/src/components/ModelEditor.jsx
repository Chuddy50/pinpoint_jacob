// ModelEditor.jsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const ModelEditor = ({ modelType, onBack }) => {

  console.log("ModelEditor render w/ modelType: ", modelType)

  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const modelRef = useRef(null);

  // Initialize Three.js scene
  useEffect(() => {

    console.log("use effect firing")

    if (!containerRef.current) return;

    const container = containerRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.05,
      100
    );
    camera.position.set(0, 1.2, 3);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controlsRef.current = controls;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 10, 7);
    scene.add(directional);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container && renderer.domElement){
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Load model when modelType changes
  useEffect(() => {
    if (!sceneRef.current || !modelType) return;

    // Remove old model if exists
    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
    }

    console.log("trying to load the model now: ", modelType)

    // Load new model
    const loader = new GLTFLoader();
    loader.load(
      `/models/${modelType}.glb`,
      (gltf) => {
        const model = gltf.scene;
        
        // Auto-scale and center
        const bbox = new THREE.Box3().setFromObject(model);
        const size = bbox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? (1.8 / maxDim) : 1.0;
        model.scale.set(scale, scale, scale);

        const center = bbox.getCenter(new THREE.Vector3());
        model.position.sub(center);

        sceneRef.current.add(model);
        modelRef.current = model;
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error);
      }
    );
  }, [modelType]);

  return (
    <div>
      <button onClick={onBack}>← Back to Selection</button>
      <div ref={containerRef} style={{ width: '100%', height: '80vh' }} />
    </div>
  );
};

export default ModelEditor;