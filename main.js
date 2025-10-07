import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

const canvas = document.querySelector("#experience");
const statusLabel = document.querySelector("#status");
const resetButton = document.querySelector("#reset");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x040508);
scene.fog = new THREE.FogExp2(0x040508, 0.045);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(4, 3, 6);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 3;
controls.maxDistance = 12;

const hemiLight = new THREE.HemisphereLight(0x66aaff, 0x111111, 0.8);
scene.add(hemiLight);

const keyLight = new THREE.SpotLight(0x77ddff, 3.2, 20, Math.PI / 6, 0.25, 1);
keyLight.position.set(2.5, 5, 2);
keyLight.target.position.set(0, 0, 0);
scene.add(keyLight, keyLight.target);

const rimLight = new THREE.SpotLight(0x4af0c9, 2.3, 25, Math.PI / 6, 0.35, 1);
rimLight.position.set(-3, 5, -4);
rimLight.target.position.set(0, 0, 0);
scene.add(rimLight, rimLight.target);

const vaultGroup = new THREE.Group();
scene.add(vaultGroup);

const vaultDoor = new THREE.Mesh(
  new THREE.CylinderGeometry(2.2, 2.3, 0.45, 48, 1, true, 0, Math.PI * 2),
  new THREE.MeshStandardMaterial({
    color: 0x1b2535,
    metalness: 0.6,
    roughness: 0.25,
    side: THREE.DoubleSide,
  })
);
vaultDoor.rotation.z = Math.PI / 2;
vaultDoor.position.set(0, 1.15, 0);
vaultGroup.add(vaultDoor);

const vaultFrame = new THREE.Mesh(
  new THREE.TorusGeometry(2.45, 0.18, 40, 100),
  new THREE.MeshStandardMaterial({
    color: 0x101625,
    metalness: 0.8,
    roughness: 0.35,
  })
);
vaultFrame.position.set(0, 1.15, 0);
vaultFrame.rotation.x = Math.PI / 2;
vaultGroup.add(vaultFrame);

const glowMaterial = new THREE.MeshBasicMaterial({
  color: 0x48d8ff,
  transparent: true,
  opacity: 0.12,
});
const glow = new THREE.Mesh(
  new THREE.SphereGeometry(2.5, 40, 40),
  glowMaterial
);
glow.position.copy(vaultFrame.position);
vaultGroup.add(glow);

const planeGeometry = new THREE.CircleGeometry(6.5, 80);
const planeMaterial = new THREE.MeshStandardMaterial({
  color: 0x020305,
  metalness: 0.5,
  roughness: 0.8,
  emissive: 0x11111f,
  emissiveIntensity: 0.35,
});
const ground = new THREE.Mesh(planeGeometry, planeMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const areaLight = new THREE.RectAreaLight(0x47c7ff, 3.2, 5, 5);
areaLight.position.set(0, 5.5, 0);
areaLight.lookAt(0, 0, 0);
scene.add(areaLight);

const loader = new GLTFLoader();
const rgbeLoader = new RGBELoader();

let lockModel;
let encryptedFiles = [];
const mixers = [];

async function loadEnvironment() {
  try {
    const hdrTexture = await rgbeLoader.loadAsync(
      "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/artist_workshop_2k.hdr"
    );
    hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = hdrTexture;
  } catch (error) {
    console.warn("Failed to load HDR environment", error);
  }
}

function createVaultLock() {
  const group = new THREE.Group();

  const lockMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a2a3a,
    metalness: 0.85,
    roughness: 0.18,
    emissive: 0x0a1f33,
    emissiveIntensity: 0.6,
  });

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.92, 1.4, 64, 1, true),
    lockMaterial
  );
  body.rotation.z = Math.PI / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const capMaterial = new THREE.MeshStandardMaterial({
    color: 0x243f5a,
    metalness: 0.9,
    roughness: 0.25,
    emissive: 0x071524,
    emissiveIntensity: 0.45,
  });

  const caps = new THREE.Group();
  const capGeometry = new THREE.CircleGeometry(0.85, 64);
  const positiveZ = new THREE.Mesh(capGeometry, capMaterial);
  positiveZ.position.set(0.7, 0, 0);
  const negativeZ = new THREE.Mesh(capGeometry, capMaterial);
  negativeZ.position.set(-0.7, 0, 0);
  negativeZ.rotation.y = Math.PI;
  positiveZ.rotation.y = Math.PI;
  caps.add(positiveZ, negativeZ);
  group.add(caps);

  const shackleMaterial = new THREE.MeshStandardMaterial({
    color: 0xb1dcff,
    metalness: 1,
    roughness: 0.08,
  });
  const shackle = new THREE.Mesh(
    new THREE.TorusGeometry(0.85, 0.13, 32, 100, Math.PI),
    shackleMaterial
  );
  shackle.rotation.y = Math.PI / 2;
  shackle.rotation.z = Math.PI;
  shackle.position.set(0, 0.8, 0);
  shackle.castShadow = true;
  shackle.receiveShadow = true;
  group.add(shackle);

  const slotMaterial = new THREE.MeshStandardMaterial({
    color: 0x03111c,
    emissive: 0x091a28,
    emissiveIntensity: 0.7,
  });
  const slot = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.22, 0.4),
    slotMaterial
  );
  slot.position.set(0.9, -0.1, 0);
  group.add(slot);

  const indicatorMaterial = new THREE.MeshBasicMaterial({ color: 0x42f5c5 });
  const indicator = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.9, 32),
    indicatorMaterial
  );
  indicator.position.set(0.92, 0.25, 0);
  indicator.rotation.z = Math.PI / 2;
  group.add(indicator);

  group.scale.setScalar(1.6);
  group.position.set(0, 1.35, 0.4);

  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

async function loadEncryptedBoxes() {
  encryptedFiles = [];
  const positions = [
    new THREE.Vector3(-2, 0.5, -1.2),
    new THREE.Vector3(2.4, 0.75, -0.8),
    new THREE.Vector3(-1.2, 0.4, 2.1),
    new THREE.Vector3(1.6, 0.9, 1.5),
  ];

  const promises = positions.map(async (position, index) => {
    const gltf = await loader.loadAsync("assets/Box.glb");
    const box = gltf.scene.children[0].clone();
    box.scale.setScalar(0.75 + Math.random() * 0.4);
    box.position.copy(position);
    box.rotation.y = Math.random() * Math.PI * 2;

    const pulseMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.53 + Math.random() * 0.1, 0.9, 0.55),
      metalness: 0.3,
      roughness: 0.4,
      emissive: 0x003f5c,
      emissiveIntensity: 0.8,
    });

    const glowShell = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.4, 1.4),
      new THREE.MeshBasicMaterial({
        color: 0x28d7ff,
        transparent: true,
        opacity: 0.15,
        depthWrite: false,
      })
    );
    glowShell.scale.multiplyScalar(box.scale.x);

    box.traverse((child) => {
      if (child.isMesh) {
        child.material = pulseMaterial;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const group = new THREE.Group();
    group.add(box, glowShell);
    group.userData = { index, state: "locked" };
    scene.add(group);

    encryptedFiles.push({
      group,
      pulseMaterial,
      glowShell,
      targetPosition: position.clone(),
    });
  });

  await Promise.all(promises);
}

function createDataFlowParticles() {
  const particleCount = 600;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const speeds = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.3 + Math.random() * 1.4;
    const height = Math.random() * 2.8;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = height;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    speeds[i] = 0.25 + Math.random() * 0.4;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("speed", new THREE.BufferAttribute(speeds, 1));

  const material = new THREE.PointsMaterial({
    size: 0.045,
    color: 0x48d8ff,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.userData = { basePositions: positions.slice(), time: 0 };
  vaultGroup.add(points);

  return points;
}

const dataParticles = createDataFlowParticles();

function pulseGlow(delta) {
  encryptedFiles.forEach(({ pulseMaterial, glowShell }, index) => {
    const time = performance.now() * 0.001 + index * 0.5;
    const pulse = (Math.sin(time * 2) + 1) * 0.4 + 0.6;
    pulseMaterial.emissiveIntensity = 0.8 + pulse * 0.3;
    glowShell.material.opacity = 0.12 + pulse * 0.1;
  });

  if (dataParticles) {
    dataParticles.rotation.y += delta * 0.15;
    const positions = dataParticles.geometry.attributes.position.array;
    const speeds = dataParticles.geometry.attributes.speed.array;
    for (let i = 0; i < positions.length / 3; i++) {
      positions[i * 3 + 1] += speeds[i] * delta;
      if (positions[i * 3 + 1] > 3.5) {
        positions[i * 3 + 1] = Math.random() * 0.5;
      }
    }
    dataParticles.geometry.attributes.position.needsUpdate = true;
  }
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hoveredFile = null;
let activeAnimation = null;

function onPointerMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function updateHover() {
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(
    encryptedFiles.map(({ group }) => group),
    true
  );
  if (intersects.length > 0) {
    const object = intersects[0].object;
    const parentGroup = object.parent.isGroup
      ? object.parent
      : object.parent.parent;
    if (parentGroup !== hoveredFile) {
      hoveredFile = parentGroup;
      document.body.style.cursor = "pointer";
      statusLabel.textContent = "Status: Encrypted file ready";
    }
  } else if (hoveredFile) {
    hoveredFile = null;
    document.body.style.cursor = "default";
    statusLabel.textContent = "Status: Idle";
  }
}

function triggerDecryptionAnimation(targetGroup) {
  if (!targetGroup || activeAnimation) return;
  const fileData = encryptedFiles.find(({ group }) => group === targetGroup);
  if (!fileData || fileData.group.userData.state !== "locked") return;

  fileData.group.userData.state = "unlocking";
  statusLabel.textContent = "Status: Decrypting...";

  const duration = 2.4;
  let elapsed = 0;
  const startPosition = fileData.group.position.clone();
  const targetPosition = new THREE.Vector3(0, 1.4, 0.3);

  const startScale = fileData.group.scale.clone();
  const startOpacity = fileData.glowShell.material.opacity;

  activeAnimation = function (delta) {
    elapsed += delta;
    const t = Math.min(elapsed / duration, 1);
    const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    fileData.group.position.lerpVectors(startPosition, targetPosition, easeT);
    fileData.group.scale.setScalar(
      THREE.MathUtils.lerp(startScale.x, 0.35, easeT)
    );
    fileData.glowShell.material.opacity = THREE.MathUtils.lerp(
      startOpacity,
      0.25,
      easeT
    );

    const rotationSpeed = THREE.MathUtils.lerp(0.4, 2.5, easeT);
    fileData.group.rotation.y += rotationSpeed * delta;

    if (easeT > 0.92 && lockModel) {
      lockModel.rotation.y = Math.sin(elapsed * 4) * 0.2;
      lockModel.position.z = 0.4 + Math.sin(elapsed * 3) * 0.08;
    }

    if (t >= 1) {
      fileData.group.userData.state = "unlocked";
      activeAnimation = null;
      statusLabel.textContent = "Status: Access granted";
      setTimeout(() => {
        statusLabel.textContent = "Status: Idle";
      }, 2500);
    }
  };
}

function resetScene() {
  if (!encryptedFiles.length) return;
  activeAnimation = null;

  encryptedFiles.forEach((fileData) => {
    fileData.group.userData.state = "locked";
    fileData.group.position.copy(fileData.targetPosition);
    fileData.group.scale.setScalar(1);
    fileData.group.rotation.set(0, Math.random() * Math.PI * 2, 0);
    fileData.glowShell.material.opacity = 0.18;
  });

  if (lockModel) {
    lockModel.rotation.set(0, 0, 0);
    lockModel.position.set(0, 1.4, 0.4);
  }

  statusLabel.textContent = "Status: Idle";
}

async function init() {
  await loadEnvironment();
  lockModel = createVaultLock();
  vaultGroup.add(lockModel);
  await loadEncryptedBoxes();
  resetScene();
}

canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("click", (event) => {
  if (!hoveredFile) return;
  triggerDecryptionAnimation(hoveredFile);
});

resetButton.addEventListener("click", () => {
  resetScene();
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(0.05, controls.getDelta ? controls.getDelta() : 0.016);
  controls.update();
  pulseGlow(delta);
  updateHover();
  if (activeAnimation) activeAnimation(delta);
  renderer.render(scene, camera);
}

init().then(() => {
  animate();
});
