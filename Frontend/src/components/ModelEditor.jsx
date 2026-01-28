// ModelEditor.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'; // used for saving 3d models
import { useAuth } from "../contexts/AuthContext"
import Notification from './Notification';
import ColorTab from './ColorTab';
import MaterialTab from './MaterialTab';
import ExportTab from './ExportTab';

const ModelEditor = ({ modelUrl, initialMaterial = 'cotton', onBack }) => {

  const { user } = useAuth();

  // tab state
  const [activeTab, setActiveTab] = useState('color');
  const [designName, setDesignName] = useState('');

  // notification state
  const [notification, setNotification] = useState({ message: '', type: '' }); // type: 'success' or 'error'

  // loading progress state
  const [loadingProgress, setLoadingProgress] = useState(0);

  // track the currently used material so when we save, we can store what they have selected for that model
  const [currentMaterial, setCurrentMaterial] = React.useState(initialMaterial);

  // refs to persist threeJS objects across renders
  const containerRef = useRef(null);  
  const sceneRef = useRef(null); 
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const animationIdRef = useRef(null);
  const modelRef = useRef(null); //ref to the clothing model itself, for export
  const colorPickerRef = useRef(null); // ref for color picker component

  // function to show notifications
  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
    // auto-hide after 3 seconds
    setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, 3000);
  };

  // initialize threeJS scene, camera, renderer. 
  const initThree = (container) => {
    // create scene with light gray background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // create perspective camera (fov, aspect ratio, near clip, far clip)
    const camera = new THREE.PerspectiveCamera(
      60, 
      container.clientWidth / container.clientHeight, 
      0.001, 
      100
    );

    // position camera away from origin
    // TODO: maybe wanna mess with this to determine the best angle ???
    camera.position.set(0, 1.2, 3);
    cameraRef.current = camera;

    // create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
     // add canvas to div element where it will be displayed
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // setup orbit controls for rotating and zooming with mouse / trackpad
    const controls = new OrbitControls(camera, renderer.domElement);
    // enableDamping = smooth camera movement, dampingFactor = momentum
    controls.enableDamping = true;  
    controls.dampingFactor = 0.07;
    controlsRef.current = controls;
  };

  // add lighting to the scene ( 2 lights, one ambient, and one directional)
  const setupLights = () => {
    // ambient light = no shadows and lights it all equally.
    // TODO: maybe we could use different lighting? for alpha phase this should be fine
    //         but as we add more 3d models and update this functionality this could be something to change
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    sceneRef.current.add(ambient);
    
    // directional light - this creates the shadows
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 10, 7);
    sceneRef.current.add(directional);
  };

  // load the 3d model from file
  const loadModel = (url) => {
    console.log('Loading url:', url);
    console.log('URL type: ', typeof url);

    // reset loading progress when starting to load
    setLoadingProgress(0);

    const loader = new GLTFLoader();  //gltf loader loads .glb and .gltf files
    loader.load(
      url, 
      (gltf) => {

        console.log("Model loaded successfully: ", url);

        // get the scene from the loaded 3d model
        const model = gltf.scene;

        // clear prev model if it exists
        if (modelRef.current){
          sceneRef.current.remove(modelRef.current);
        }
        
        // autoscale model to fit in view
        // - create bounding box around whole 3d model, use the size of that to determine the size of the 3d model
        // - determine if that is the scale we want and if not scale it to the desired size
        const boundingbox = new THREE.Box3().setFromObject(model);  
        const size = boundingbox.getSize(new THREE.Vector3());  
        const maxDim = Math.max(size.x, size.y, size.z);     
        const scale = maxDim > 0 ? (1.8 / maxDim) : 1.0;
        model.scale.set(scale, scale, scale);
        
        // recalculate bounding box after scaling
        //  - all downloaded models are different sizes so they when loaded onto the scene,
        //     they would all be different sizes, until recalculating after scaling
        const newBbox = new THREE.Box3().setFromObject(model);
        const center = newBbox.getCenter(new THREE.Vector3());
        
        // center the model at origin
        model.position.sub(center);
        
        sceneRef.current.add(model);
        //console.log('Model added to scene');

        //save a reference of the model
        modelRef.current = model;

        //apply saved material if loading a user saved design
        if(initialMaterial !== 'cotton') {
          changeMaterial(initialMaterial)
        }

        //set loading complete
        setLoadingProgress(100);

      },
      (progress) => {
        // update loading progress
        const percentComplete = (progress.loaded / progress.total * 100);
        setLoadingProgress(percentComplete);
        console.log("Loading progress: ", percentComplete.toFixed(2) + '%');
      },
      (error) => {
        console.log('Error loading model:', url);
        console.log('Error details: ', error);
        // reset loading on error
        setLoadingProgress(100);
      }
    );
  };

  // animation loop, runs every frame
  const animate = () => {
    animationIdRef.current = requestAnimationFrame(animate);
    // update camera controls
    controlsRef.current?.update();  
    // render scene
    rendererRef.current?.render(sceneRef.current, cameraRef.current); 
  };

  // function to traverse entire scene and changes the color of all mesh materials
  const changeColor = (hexColor) => {
    if (!sceneRef.current) return;

    sceneRef.current.traverse( (child) => {
      if(child.isMesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.color && m.color.set(hexColor));
        } else {
          child.material.color && child.material.color.set(hexColor);
        }
      }
    });
  };

  // function changes the roughness and metalness properties to simulate different fabrics
  const changeMaterial = (materialType) => {

    //update currently stored material
    setCurrentMaterial(materialType)

    if (!sceneRef.current) return;

    // to simulate fabric types, change:
    //   - roughness = how matte / rough
    //   - metalness = how light bounces off the surface
    // TODO: see if these values are correct, these are just some starting values to get it going
    const materialProps = {
      cotton: { roughness: 0.8, metalness: 0.02 }, 
      denim: { roughness: 0.9, metalness: 0.1 },   
      polyester: { roughness: 0.4, metalness: 0.25 },
      leather: { roughness: 0.25, metalness: 0.6 },
      silk: { roughness: 0.12, metalness: 0.4 },
    };

    const props = materialProps[materialType] || { roughness: 0.8, metalness: 0.2 };

    sceneRef.current.traverse( (child) => {
      if(child.isMesh){
        const applyProps = (m) => {
          if (m) {
            m.roughness = props.roughness;
            m.metalness = props.metalness;
          }
        };

        if (Array.isArray(child.material)) {
          child.material.forEach(applyProps);
        } else {
          applyProps(child.material);
        }

      }
    });
  };

  // array of preset colors w/ names and their hex colors
  const presetColors = [
    { hex: '#4169E1', name: 'Royal Blue' },
    { hex: '#DC143C', name: 'Crimson' },
    { hex: '#228B22', name: 'Forest Green' },
    { hex: '#000000', name: 'Black' },
    { hex: '#FFD700', name: 'Gold' },
    { hex: '#8B4513', name: 'Brown' },
    { hex: '#4B0082', name: 'Indigo' },
    { hex: '#808080', name: 'Grey' },
  ];

  // array of available materials
  const materials = ['cotton', 'denim', 'polyester', 'leather', 'silk'];

  // main effect, runs once when component mounts or modelType changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    // store ref for cleanup
    const container = containerRef.current; 
    
    // initialize three.js environment
    initThree(container);
    setupLights();
    loadModel(modelUrl);
    animate();

    // cleanup when component unmounts or modelType changes
    return () => {
      // stop animation loop
      cancelAnimationFrame(animationIdRef.current); 
      // free controls
      controlsRef.current?.dispose();  
      // free renderer
      rendererRef.current?.dispose();  
      if (container && rendererRef.current?.domElement) {
        // remove canvas from dom
        container.removeChild(rendererRef.current.domElement);
      }
    };
  }, [modelUrl]);

  // save the current 3d model design to supabase
  // - exports only the 3d model, not lights, camera, etc.
  const handleSave = async () => {
    if(!designName.trim()) {
      showNotification('Please enter a name for your design', 'error');
      return;
    }

    // Check if user is signed in
    if(!user) {
      showNotification('You must be signed in to save designs', 'error');
      return;
    }

    if(!modelRef.current){
      showNotification('No model to save', 'error');
      return;
    }

    //export the current scene as a .glb file
    const exporter = new GLTFExporter();
    exporter.parse(
      modelRef.current,
      async (result) => {
        let blob;
    
       //verify we got binary output (ArrayBuffer)
       // - if export fails, result is JSON object which fails
        if (result instanceof ArrayBuffer) {
          blob = new Blob([result], { type: 'model/gltf-binary' });
        } else {
          console.error('GLTFExporter returned non-binary output:', result);
          showNotification('Export failed: invalid GLB output', 'error');
          return;
        }
    
        console.log('GLB blob size:', blob.size);
    
        //send file and metadata to backend
        const formData = new FormData();
        formData.append('file', blob, `${designName}.glb`);
        formData.append('name', designName);
        formData.append('material', currentMaterial);
    
        try {
          const response = await fetch(
            `http://localhost:8000/designs/save/${user.user_id}`,
            {
              method: 'POST',
              body: formData,
            }
          );
    
          if (response.ok) {
            showNotification('Design saved successfully', 'success');
            setDesignName('');
          } else {
            showNotification('Failed to save design', 'error');
          }
        } catch (error) {
          console.error('Error saving design:', error);
          showNotification('Error saving design', 'error');
        }
      },
      (error) => {
        console.error('GLTFExporter error:', error);
      },
      { binary: true }
    );
  };

  // return the layout for the threeJS div + controls for customization
  return (
    <div className="h-screen flex bg-white">
      {/* 3d model viewer - full screen left */}
      <div className="flex-1 relative overflow-hidden">
        {/* back btn overlay */}
        <div className="absolute top-6 left-6 z-10">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white rounded-lg shadow-sm transition-all"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium text-slate-700">Back</span>
          </button>
        </div>

        {/* notification overlay */}
        <Notification message={notification.message} type={notification.type} />

        {/* loading overlay */}
        {loadingProgress < 100 && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 text-center">Loading Model</h3>
              
              {/* progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-3 mb-3 overflow-hidden">
                <div 
                  className="bg-slate-900 h-full transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              
              {/* progress Percentage */}
              <p className="text-center text-sm text-slate-600 font-medium">
                {loadingProgress.toFixed(0)}%
              </p>
            </div>
          </div>
        )}

        {/* container div where three.js canvas will be inserted */}
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Model editing tabs */}
      <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-2xl">
        {/* tab Navigation */}
        <div className="border-b border-slate-200 bg-slate-50">
          <div className="flex">
            {/* when a tab is clicked, update activeTab */}
            <button 
              onClick={() => setActiveTab('color')}
              className={`flex-1 px-4 py-4 text-sm font-medium transition-colors ${
                activeTab === 'color' 
                  ? 'text-slate-900 border-b-2 border-slate-900 bg-white' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
              }`}
            >
              Color
            </button>
            <button 
              onClick={() => setActiveTab('material')}
              className={`flex-1 px-4 py-4 text-sm font-medium transition-colors ${
                activeTab === 'material' 
                  ? 'text-slate-900 border-b-2 border-slate-900 bg-white' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
              }`}
            >
              Material
            </button>
            <button 
              onClick={() => setActiveTab('export')}
              className={`flex-1 px-4 py-4 text-sm font-medium transition-colors ${
                activeTab === 'export' 
                  ? 'text-slate-900 border-b-2 border-slate-900 bg-white' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
              }`}
            >
              Export
            </button>
          </div>
        </div>

        {/* tab content, based on waht activeTab is currntly set to */}
        <div className="flex-1 overflow-y-auto">
          {/* color Tab */}
          {activeTab === 'color' && (
            <ColorTab 
              presetColors={presetColors}
              onColorChange={changeColor}
              colorPickerRef={colorPickerRef}
            />
          )}

          {/* material Tab */}
          {activeTab === 'material' && (
            <MaterialTab 
              materials={materials}
              currentMaterial={currentMaterial}
              onMaterialChange={changeMaterial}
            />
          )}

          {/* export Tab */}
          {activeTab === 'export' && (
            <ExportTab 
              designName={designName}
              onDesignNameChange={setDesignName}
              currentMaterial={currentMaterial}
            />
          )}
        </div>

        {/* Save Button at Bottom (only show on export tab) */}
        {activeTab === 'export' && (
          <div className="p-6 border-t border-slate-200">
            <button 
              onClick={handleSave}
              className="w-full px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors shadow-sm"
            >
              Save Design
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelEditor;