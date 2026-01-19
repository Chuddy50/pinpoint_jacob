// ModelEditor.jsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'; // used for saving 3d models
import { useAuth } from "../contexts/AuthContext"

const ModelEditor = ({ modelUrl, initialMaterial = 'cotton', onBack }) => {

  const { user } = useAuth();

  // track the currently used material so when we save, we can store what they have selected for that model
  const [currentMaterial, setCurrentMaterial] = React.useState(initialMaterial);

  // refs to persist threeJS objects across renders
  // div element that holds the canvas
  const containerRef = useRef(null);  
  // three.js scene
  const sceneRef = useRef(null); 
  // three.js camera
  const cameraRef = useRef(null);
  // three.js renderer
  const rendererRef = useRef(null);
  // OrbitControls for mouse interaction
  const controlsRef = useRef(null);
  // animation loop ID for cleanup
  const animationIdRef = useRef(null);

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

    const loader = new GLTFLoader();  //gltf loader loads .glb and .gltf files
    loader.load(
      url, 
      (gltf) => {

        console.log("Model loaded successfully: ", url);

        // get the scene from the loaded 3d model
        const model = gltf.scene;
        
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

        if(initialMaterial !== 'cotton') {
          changeMaterial(initialMaterial)
        }

      },
      (progress) => {
        console.log("Loading progress: ", (progress.loaded / progress.total * 100).toFixed(2) + '%');
      },
      (error) => {
        console.log('Error loading model:', url);
        console.log('Error details: ', error);
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


  const handleSave = async () => {
    const designName = prompt("Enter a name for this design:")
    if(!designName) return;

    //export the current scene as a .glb file
    const exporter = new GLTFExporter();
    exporter.parse(
      sceneRef.current,
      async(gltf) => {
        //convert to blob
        const blob = new Blob([gltf], { type: 'model/gltf-binary' });

        const formData = new FormData();
        formData.append('file', blob, `${designName}.glb`);
        formData.append('name', designName);
        formData.append('material', currentMaterial);


        try {
          const response = await fetch(`http://localhost:8000/designs/save/${user.user_id}`, {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            alert('Design saved successfully')
          } else {
            alert('Failed to save design')
          }

        } catch (error) {
          alert('Error saving design: ' + error)
          console.log('Error saving design: ', error)
        }
      },
      { binary: true }
    );
  };


  // return the layout for the threeJS div + controls for customization
  return (
    <div>
      {/* back + save button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px' }}>
        <button onClick={onBack}>Back</button>
        <button onClick={handleSave}>Save Design</button>
      </div>

      {/* container div where three.js canvas will be inserted */}
      <div ref={containerRef} style={{ width: '100%', height: '80vh' }} />

      {/* color + material controls */}
      <div>
        <h3>Customize</h3>

        {/* preset colors */}
        <div>
          <label>Quick Colors:</label>
          <div>
            {presetColors.map(color => (
              <button 
                key={color.hex} 
                onClick={() => changeColor(color.hex)} 
                style={{ background: color.hex, width: '40px', height: '40px'}}
              />
            ))}
          </div>
        </div>

        {/* custom color picker */}
        <div>
          <label>Custom Color:</label>
          <input
            type='color'
            defaultValue = '#808080'
            onChange={(e) => changeColor(e.target.value)}
          />
        </div>

        {/* material type */}
        <div>
          <label>Material Type:</label>
          <select onChange={(e) => changeMaterial(e.target.value)} value={currentMaterial}>
            <option value='cotton'>Cotton</option>
            <option value='denim'>Denim</option>
            <option value='polyester'>Polyester</option>
            <option value='leather'>Leather</option>
            <option value='silk'>Silk</option>
          </select>
        </div>

      </div>

    </div>
  );
};

export default ModelEditor;