import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import carnetCardUrl from '../../assets/about-identity/crops/carnet-card.png';
import dniCardUrl from '../../assets/about-identity/crops/dni-card.png';
import generalCardUrl from '../../assets/about-identity/crops/general-card.png';
import guestlistCardUrl from '../../assets/about-identity/crops/guestlist-card.png';
import passportCardUrl from '../../assets/about-identity/crops/passport-card.png';
import summerCardUrl from '../../assets/about-identity/crops/summer-card.png';

const CARD_ASPECT = 379 / 205;
const CARD_TEXTURE_URLS = [
  dniCardUrl,
  generalCardUrl,
  carnetCardUrl,
  summerCardUrl,
  passportCardUrl,
  guestlistCardUrl,
];
const SEGMENT_MS = 2025;
const HOLD_FRACTION = 0.16;
const ENVIRONMENT_ROTATION_SPEED = (Math.PI * 2) / 30000; // full rotation in 30s

export function IdentityPlaneScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mountElement = mountRef.current;
    if (mountElement == null) return;
    const mount = mountElement;

    let disposed = false;
    let frameId = 0;
    let resizeObserver: ResizeObserver | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let environment: THREE.Texture | null = null;
    let shadowTexture: THREE.Texture | null = null;
    let textures: THREE.Texture[] = [];
    let frontMaterial: THREE.MeshPhysicalMaterial | null = null;
    let backMaterial: THREE.MeshPhysicalMaterial | null = null;
    let hiddenFaceMaterial: THREE.MeshBasicMaterial | null = null;
    let edgeMaterial: THREE.MeshPhysicalMaterial | null = null;
    let faceGeometry: THREE.ShapeGeometry | null = null;
    let edgeGeometry: THREE.ExtrudeGeometry | null = null;
    let floatRig: THREE.Group | null = null;
    let tiltRig: THREE.Group | null = null;
    let spinRig: THREE.Group | null = null;
    let shadow: THREE.Sprite | null = null;
    let shadowMaterial: THREE.SpriteMaterial | null = null;

    void initialize();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();

      textures.forEach((texture) => texture.dispose());
      shadowTexture?.dispose();
      environment?.dispose();
      frontMaterial?.dispose();
      backMaterial?.dispose();
      hiddenFaceMaterial?.dispose();
      edgeMaterial?.dispose();
      faceGeometry?.dispose();
      edgeGeometry?.dispose();
      shadowMaterial?.dispose();
      renderer?.dispose();

      if (renderer && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };

    async function initialize() {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.22;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
      camera.position.set(0, 0.12, 13.2);

      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();
      const hdriTexture = await new RGBELoader().loadAsync('/ferndale_studio_07_1k.hdr');
      environment = pmremGenerator.fromEquirectangular(hdriTexture).texture;
      scene.environment = environment;
      hdriTexture.dispose();
      pmremGenerator.dispose();

      scene.add(new THREE.AmbientLight(0xffffff, 0.12));
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
      fillLight.position.set(0, -2, 6);
      scene.add(fillLight);

      floatRig = new THREE.Group();
      scene.add(floatRig);

      tiltRig = new THREE.Group();
      tiltRig.position.set(-0.08, 0.52, 0);
      tiltRig.rotation.set(-0.24, 0.22, -0.32);
      floatRig.add(tiltRig);

      spinRig = new THREE.Group();
      tiltRig.add(spinRig);

      textures = await createDocumentTextures(renderer.capabilities.getMaxAnisotropy());
      if (disposed) return;

      frontMaterial = createFaceMaterial(textures[0]);
      backMaterial = createFaceMaterial(textures[0]);
      hiddenFaceMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      edgeMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x12130d,
        roughness: 0.2,
        metalness: 0.1,
        clearcoat: 0.72,
        clearcoatRoughness: 0.18,
        envMapIntensity: 1.4,
      });

      const cardWidth = 4.7;
      const cardHeight = cardWidth / CARD_ASPECT;
      const cardDepth = 0.028;
      const cardRadius = 0.26;
      const cardShape = createRoundedCardShape(cardWidth, cardHeight, cardRadius);

      faceGeometry = createFaceGeometry(cardShape, cardWidth, cardHeight);
      edgeGeometry = createEdgeGeometry(cardShape, cardDepth);

      const frontMesh = new THREE.Mesh(faceGeometry, frontMaterial);
      frontMesh.position.z = cardDepth / 2 + 0.001;
      spinRig.add(frontMesh);

      const backMesh = new THREE.Mesh(faceGeometry, backMaterial);
      backMesh.position.z = -cardDepth / 2 - 0.001;
      backMesh.rotation.y = Math.PI;
      spinRig.add(backMesh);

      const edgeMesh = new THREE.Mesh(edgeGeometry, [hiddenFaceMaterial, edgeMaterial]);
      spinRig.add(edgeMesh);

      shadowTexture = createShadowTexture();
      shadowMaterial = new THREE.SpriteMaterial({
        map: shadowTexture,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      });
      shadow = new THREE.Sprite(shadowMaterial);
      shadow.position.set(-0.01, -1.9, -1.15);
      shadow.scale.set(5.2, 1.72, 1);
      scene.add(shadow);

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const startTime = performance.now();
      let textureIndex = 0;
      let segmentIndex = 0;
      let swappedThisTurn = false;

      const resize = () => {
        if (!renderer) return;
        const { width, height } = mount.getBoundingClientRect();
        if (!width || !height) return;

        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
      resize();

      const renderFrame = () => {
        frameId = window.requestAnimationFrame(renderFrame);
        if (
          !renderer ||
          !floatRig ||
          !tiltRig ||
          !spinRig ||
          !frontMaterial ||
          !backMaterial ||
          !shadow ||
          !shadowMaterial
        ) {
          return;
        }

        const elapsed = performance.now() - startTime;
        const bob = prefersReducedMotion ? 0 : Math.sin(elapsed * 0.0014) * 0.045;
        floatRig.position.y = bob;
        scene.environmentRotation.y = elapsed * ENVIRONMENT_ROTATION_SPEED;

        if (!prefersReducedMotion) {
          const currentSegment = Math.floor(elapsed / SEGMENT_MS);
          const segmentProgress = (elapsed % SEGMENT_MS) / SEGMENT_MS;
          const turnProgress = segmentProgress < HOLD_FRACTION
            ? 0
            : (segmentProgress - HOLD_FRACTION) / (1 - HOLD_FRACTION);
          const easedTurn = THREE.MathUtils.smootherstep(turnProgress, 0, 1);
          const angle = currentSegment * Math.PI + easedTurn * Math.PI;
          const edgeFactor = Math.abs(Math.sin(angle));

          if (currentSegment !== segmentIndex) {
            segmentIndex = currentSegment;
            swappedThisTurn = false;
          }

          spinRig.rotation.y = angle;
          tiltRig.rotation.x = -0.24 + Math.sin(turnProgress * Math.PI) * 0.035;
          tiltRig.rotation.y = 0.22 + Math.sin(elapsed * 0.00046) * 0.04;
          tiltRig.rotation.z = -0.32 + Math.sin(elapsed * 0.00072) * 0.016;

          shadow.position.x = -0.04 + Math.sin(elapsed * 0.00052) * 0.07;
          shadow.position.y = -1.9 + bob * 0.4;
          shadow.scale.set(5.2 - edgeFactor * 0.9, 1.72 - edgeFactor * 0.24, 1);
          shadowMaterial.opacity = 0.38 - edgeFactor * 0.1;
          shadowMaterial.rotation = -0.12 + Math.sin(elapsed * 0.00058) * 0.04;

          if (turnProgress > 0.5 && !swappedThisTurn) {
            textureIndex = (textureIndex + 1) % textures.length;
            frontMaterial.map = textures[textureIndex];
            frontMaterial.roughnessMap = textures[textureIndex];
            backMaterial.map = textures[textureIndex];
            backMaterial.roughnessMap = textures[textureIndex];
            frontMaterial.needsUpdate = true;
            backMaterial.needsUpdate = true;
            swappedThisTurn = true;
          }
        }

        renderer.render(scene, camera);
      };

      frameId = window.requestAnimationFrame(renderFrame);
    }
  }, []);

  return (
    <div className="ab-plane-scene" aria-hidden="true">
      <div className="ab-plane-scene__glow" />
      <div className="ab-plane-scene__canvas" ref={mountRef} />
    </div>
  );
}

function createFaceMaterial(map: THREE.Texture) {
  const mat = new THREE.MeshPhysicalMaterial({
    map,
    roughnessMap: map,
    roughness: 0.55,
    metalness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 2.4,
  });

  mat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
  vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
  roughnessFactor *= 1.0 - texelRoughness.g;
#endif`,
    );
  };
  mat.customProgramCacheKey = () => 'invert-roughness';

  return mat;
}

async function createDocumentTextures(anisotropy: number) {
  const loader = new THREE.TextureLoader();

  return Promise.all(CARD_TEXTURE_URLS.map(async (url) => {
    const texture = await loader.loadAsync(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = anisotropy;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    return texture;
  }));
}


function createShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not create shadow texture context');
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const broad = ctx.createRadialGradient(512, 256, 28, 512, 256, 310);
  broad.addColorStop(0, 'rgba(0, 0, 0, 0.48)');
  broad.addColorStop(0.48, 'rgba(0, 0, 0, 0.2)');
  broad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = broad;
  ctx.beginPath();
  ctx.ellipse(512, 256, 420, 134, 0, 0, Math.PI * 2);
  ctx.fill();

  const core = ctx.createRadialGradient(512, 256, 0, 512, 256, 190);
  core.addColorStop(0, 'rgba(0, 0, 0, 0.42)');
  core.addColorStop(0.7, 'rgba(0, 0, 0, 0.1)');
  core.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.ellipse(512, 256, 270, 86, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createRoundedCardShape(width: number, height: number, radius: number) {
  const shape = new THREE.Shape();

  shape.moveTo(radius, 0);
  shape.lineTo(width - radius, 0);
  shape.quadraticCurveTo(width, 0, width, radius);
  shape.lineTo(width, height - radius);
  shape.quadraticCurveTo(width, height, width - radius, height);
  shape.lineTo(radius, height);
  shape.quadraticCurveTo(0, height, 0, height - radius);
  shape.lineTo(0, radius);
  shape.quadraticCurveTo(0, 0, radius, 0);

  return shape;
}

function createFaceGeometry(shape: THREE.Shape, width: number, height: number) {
  const geometry = new THREE.ShapeGeometry(shape, 24);
  geometry.center();
  normalizeFaceUvs(geometry, width, height);
  return geometry;
}

function createEdgeGeometry(shape: THREE.Shape, depth: number) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 24,
    steps: 1,
  });
  geometry.center();
  return geometry;
}

function normalizeFaceUvs(geometry: THREE.ShapeGeometry, width: number, height: number) {
  const position = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const u = (x + width / 2) / width;
    const v = (y + height / 2) / height;

    uv.setXY(index, u, v);
  }

  uv.needsUpdate = true;
}
