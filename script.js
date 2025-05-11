import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Global variables for Three.js scene
let scene, camera, renderer, controls, currentModel, animationFrameId;

// Function to initialize and manage the Three.js scene
function initThreeJSScene(gender, measurements) {
    // Use the #canvas-container div from index.html
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) {
        console.error("Canvas container (#canvas-container) not found for 3D scene!");
        return;
    }
    console.log(`Initializing 3D scene for ${gender} with measurements:`, measurements);

    // Clear previous scene and stop animation if any
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    if (renderer) {
        renderer.dispose(); // Dispose of the old renderer
    }
    canvasContainer.innerHTML = ''; // Clear previous canvas or placeholder text

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x282c34); // Darker background to match theme

    const containerWidth = canvasContainer.clientWidth;
    const containerHeight = canvasContainer.clientHeight;
    camera = new THREE.PerspectiveCamera(50, containerWidth / containerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 5.0); // Adjusted camera: further back and slightly higher

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    canvasContainer.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1.0, 0); // Adjust target to better center a full body
    controls.minDistance = 0.5;
    controls.maxDistance = 10; // Adjusted max distance
    controls.update();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Reduced ambient
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Slightly increased directional
    directionalLight.position.set(3, 5, 4);
    scene.add(directionalLight);

    // Model path based on gender
    const modelPath = (gender === 'woman') ? 'models/LowPolyWoman.glb' : 'models/LowPolyMan.glb';
    console.log("Loading model:", modelPath);

    const loader = new GLTFLoader();
    loader.load(
        modelPath,
        function (gltf) {
            if (currentModel) {
                scene.remove(currentModel);
                // Dispose of old model's geometries and materials if necessary
                currentModel.traverse(object => {
                    if (object.isMesh) {
                        object.geometry.dispose();
                        if (object.material.isMaterial) {
                            cleanMaterial(object.material);
                        } else {
                            // For an array of materials, traverse and dispose
                            for (const material of object.material) cleanMaterial(material);
                        }
                    }
                });
            }
            currentModel = gltf.scene;

            // --- Inspect for Morph Targets ---
            console.log("Inspecting model for morph targets:", modelPath);
            currentModel.traverse(function (object) {
                if (object.isMesh) {
                    console.log("  Mesh found:", object.name);
                    if (object.morphTargetDictionary) {
                        console.log("    Morph Target Dictionary:", object.morphTargetDictionary);
                    }
                    if (object.morphTargetInfluences) {
                        console.log("    Morph Target Influences:", object.morphTargetInfluences);
                    }
                    if (!object.morphTargetDictionary && !object.morphTargetInfluences) {
                        console.log("    No morph targets found on this mesh.");
                    }
                }
            });
            // --- End of Morph Target Inspection ---

            // --- Reference dimensions (in meters for unscaled model) ---
            // These might need to be specific to your GLB models if they are not 1 unit = 1 meter.
            // For now, assume a generic human reference for scaling logic.
            const referenceModelHeight = 1.75; // meters
            const referenceModelWaistCircumference = 0.85; // meters

            // Initial scale to make the model roughly human-sized if it's not already.
            // This might need adjustment based on your specific model's original scale.
            let initialScaleFactor = 1.0; 
            currentModel.scale.set(initialScaleFactor, initialScaleFactor, initialScaleFactor);

            // --- Apply non-uniform scaling based on measurements ---
            // We'll primarily use height and waist for now, as in previous logic.
            // Other measurements can be integrated for more complex morphing later.
            let scaleYFactor = 1.0;
            let scaleXZFactor = 1.0;

            if (measurements.height) {
                let heightInMeters = parseFloat(measurements.height) / 100; // Assuming cm input
                scaleYFactor = heightInMeters / referenceModelHeight;
            }

            if (measurements.waist) {
                let waistCircumferenceInMeters = parseFloat(measurements.waist) / 100; // Assuming cm input
                // Approximation: scaling XZ by ratio of circumferences
                scaleXZFactor = waistCircumferenceInMeters / referenceModelWaistCircumference;
            }
            
            // Apply combined scaling
            currentModel.scale.set(
                initialScaleFactor * scaleXZFactor, 
                initialScaleFactor * scaleYFactor, 
                initialScaleFactor * scaleXZFactor
            );
            console.log(`Applied scaling: YFactor=${scaleYFactor.toFixed(2)}, XZFactor=${scaleXZFactor.toFixed(2)} over initial ${initialScaleFactor}`);

            // --- Position model and Adjust Camera ---
            // First, get the actual height of the scaled model
            const box = new THREE.Box3().setFromObject(currentModel);
            const modelHeightScaled = box.getSize(new THREE.Vector3()).y;
            console.log(`Scaled model height: ${modelHeightScaled.toFixed(2)}m`);

            // Assuming model's internal origin/pivot is at its feet. Position feet at y=0 in the world.
            currentModel.position.y = 0; 

            scene.add(currentModel); // Add model to the scene
            
            // Dynamically adjust camera target and position for optimal framing
            if (modelHeightScaled > 0) { // Ensure modelHeightScaled is valid
                const modelCenterY = modelHeightScaled / 2;
                controls.target.set(0, modelCenterY, 0);        // Aim camera at the vertical center of the model
                camera.position.set(0, modelCenterY + 0.3, 5.5); // Position camera further back and slightly higher relative to center
                controls.update(); // Crucial: apply new target and position
            }
            
            const finalBox = new THREE.Box3().setFromObject(currentModel); 
            const finalSize = finalBox.getSize(new THREE.Vector3());
            console.log(`Model (${modelPath}) loaded. Final Scale: XZ=${currentModel.scale.x.toFixed(2)} Y=${currentModel.scale.y.toFixed(2)}, Final Size (WxHxD): ${finalSize.x.toFixed(2)}x${finalSize.y.toFixed(2)}x${finalSize.z.toFixed(2)}, Position y: ${currentModel.position.y.toFixed(2)}`);

            // Ensure animation loop starts/restarts
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            animate();
        },
        function (xhr) {
            console.log(`Model (${modelPath}) loading: ${((xhr.loaded / xhr.total) * 100).toFixed(0)}% loaded`);
        },
        function (error) {
            console.error('Error loading model (' + modelPath + '):', error);
            if(canvasContainer) canvasContainer.innerHTML = `<p style="color:red; text-align:center; padding-top: 20px;">Error loading <strong>${modelPath}</strong>. Check console and ensure model exists.</p>`;
        }
    );

    // Start animation loop if not already running (e.g. if it's the first load)
    if (!animationFrameId) {
        animate();
    }
}

// Helper function to clean up materials
function cleanMaterial(material) {
    material.dispose();
    // Dispose textures
    for (const key of Object.keys(material)) {
        const value = material[key];
        if (value && typeof value === 'object' && 'isTexture' in value) {
            value.dispose();
        }
    }
}


function animate() {
    animationFrameId = requestAnimationFrame(animate);
    if (controls) controls.update(); // Required if enableDamping is true
    if (renderer && scene && camera) renderer.render(scene, camera);
}

// Function to be called from index.html to trigger model generation
window.triggerModelGeneration = function() {
    console.log("triggerModelGeneration called from index.html");
    const measurementForm = document.getElementById('measurementForm');
    const genderSwitch = document.getElementById('genderSwitchInput');

    if (!measurementForm || !genderSwitch) {
        console.error('Measurement form or gender switch not found!');
        return;
    }

    const measurements = {};
    const measurementIds = [
        'height', 'weight', 'chest', 'underbust', 'waist', 
        'hips', 'sleeve', 'thigh', 'inseam', 'outseam'
    ];
    measurementIds.forEach(id => {
        const inputElement = document.getElementById(id);
        if (inputElement && inputElement.value !== '') {
            measurements[id] = inputElement.value; // Keep as string, will be parsed in initThreeJSScene
        }
    });

    const selectedGender = genderSwitch.checked ? 'woman' : 'man'; // 'woman' if checked, 'man' otherwise

    console.log("Collected for 3D model:", selectedGender, measurements);
    initThreeJSScene(selectedGender, measurements);
};

// Resize listener
window.addEventListener('resize', () => {
    if (camera && renderer) { 
        const canvasContainer = document.getElementById('canvas-container');
        if (!canvasContainer) return;

        const containerWidth = canvasContainer.clientWidth;
        const containerHeight = canvasContainer.clientHeight;

        if (containerWidth > 0 && containerHeight > 0) {
            camera.aspect = containerWidth / containerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(containerWidth, containerHeight);
        }
    }
});

// Remove old DOMContentLoaded listener and other specific logic not related to model viewing directly
// (e.g., form submit listeners, specific header/nav/scroll effects if they were only for old layout)
// The general sidebar toggle and auth UI updates are in index.html itself.

// For example, the old measurementsForm listener is no longer needed as 'generateModel' button in index.html handles it.
// document.addEventListener('DOMContentLoaded', () => { ... old form listener ... });

// Old header scroll, nav link smooth scroll, section fade-in effects might be kept if desired,
// but are not directly related to the 3D model generation.
// For clarity, I am focusing the script.js changes on the 3D model parts.
// If those effects are still wanted, they can remain or be re-integrated carefully.

// Retaining general effects that might still be relevant from the original script.js:
document.addEventListener('DOMContentLoaded', () => {
    // Header scroll effect (if header element exists)
    const header = document.querySelector('header.app-header'); // More specific selector
    if (header) { 
        window.addEventListener('scroll', () => {
            if (window.scrollY > 30) { // Adjust scroll threshold if needed
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // Section fade-in observer (if main sections for this exist)
    // This might need to be adapted if section IDs/classes have changed
    // For now, assuming it's general enough or index.html handles its own animations.
    // const sections = document.querySelectorAll('main section'); // Example
    // if (sections.length > 0) { 
    //     const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
    //     const observerCallback = (entries, observer) => {
    //         entries.forEach(entry => {
    //             if (entry.isIntersecting) {
    //                 entry.target.classList.add('fade-in');
    //                 observer.unobserve(entry.target);
    //             }
    //         });
    //     };
    //     const observer = new IntersectionObserver(observerCallback, observerOptions);
    //     sections.forEach(section => { observer.observe(section); });
    // }
});

// Make sure the models directory with LowPolyMan.glb and LowPolyWoman.glb exists
// and is served correctly by your Flask app if you are running it through Flask.
// If Flask serves static files from a 'static' folder, models might need to be in 'static/models/'.
// Current Flask setup (`app.py`) serves 'models/' from the root. Ensure path is correct.

console.log("script.js loaded and parsed. Global triggerModelGeneration is ready.");
// Ensure the DOM is ready before trying to access elements for things like header scroll
// The triggerModelGeneration is set on window, so it will be available globally once script loads.
// Specific element bindings like header scroll should be in DOMContentLoaded or similar.

// Note: The old 'DOMContentLoaded' listener that set up the measurementsForm event
// has been effectively replaced by making triggerModelGeneration global and having
// index.html call it.

// For example, the old measurementsForm listener is no longer needed as 'generateModel' button in index.html handles it.
// document.addEventListener('DOMContentLoaded', () => { ... old form listener ... }); 