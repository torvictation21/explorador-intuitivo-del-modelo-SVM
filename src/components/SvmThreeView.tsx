import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Play,
  Pause,
  RotateCcw,
  Layers,
  Move3d,
} from 'lucide-react';
import type { DataPoint2D, KernelType, SvmModelState } from '../types/svm';
import { computeElevationZ } from '../lib/svmEngine';

interface SvmThreeViewProps {
  points: DataPoint2D[];
  model: SvmModelState;
  kernel: KernelType;
  highContrast: boolean;
}

type CameraPreset = 'ISO' | 'SIDE' | 'TOP';

const WORLD_SCALE = 1.05;
const MAX_HEIGHT = 3.4;
const RAW_ELEV_MAX = 2.8;

function getNormalizedElevation(x: number, y: number, kernel: KernelType): number {
  return Math.max(0, Math.min(1, computeElevationZ(x, y, kernel) / RAW_ELEV_MAX));
}

// Module-scoped scratch helpers to keep render loop GC-free
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _pointerNdc = new THREE.Vector2();

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function getCameraPresetVectors(preset: CameraPreset): { pos: [number, number, number]; target: [number, number, number] } {
  if (preset === 'SIDE') {
    return { pos: [0.1, 2.25, 12.4], target: [0, 1.5, 0] };
  }
  if (preset === 'TOP') {
    return { pos: [0.01, 13.8, 0.2], target: [0, 0.6, 0] };
  }
  return { pos: [8.4, 5.9, 9.2], target: [0, 1.45, 0] };
}

export const SvmThreeView: React.FC<SvmThreeViewProps> = ({
  points,
  model,
  kernel,
  highContrast,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [elevationPercent, setElevationPercent] = useState<number>(100);
  const [cutHeightRatio, setCutHeightRatio] = useState<number>(0.48);
  const [isAnimatingMorph, setIsAnimatingMorph] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<CameraPreset>('ISO');
  const [dockExpanded, setDockExpanded] = useState<boolean>(true);
  const [hoveredPointInfo, setHoveredPointInfo] = useState<string | null>(null);

  // Refs bridging React controls into persistent Three.js scene without re-mounting WebGL
  const elevationRef = useRef<number>(1.0);
  const cutRatioRef = useRef<number>(0.48);
  const morphAnimatingRef = useRef<boolean>(false);
  const morphDirRef = useRef<number>(-1);
  const cameraLerpRef = useRef<{
    active: boolean;
    pos: THREE.Vector3;
    target: THREE.Vector3;
  }>({
    active: false,
    pos: new THREE.Vector3(8.4, 5.9, 9.2),
    target: new THREE.Vector3(0, 1.45, 0),
  });
  const requestRenderRef = useRef<() => void>(() => {});
  const rebuildDataRef = useRef<() => void>(() => {});
  const updateElevationRef = useRef<() => void>(() => {});

  const propsRef = useRef({ points, model, kernel, highContrast });
  propsRef.current = { points, model, kernel, highContrast };

  // Compute live separation stats above/below cutting plane so students immediately see the 3D trick work!
  const separationStats = useMemo(() => {
    const elev = elevationPercent / 100;
    const planeY = 0.08 + cutHeightRatio * MAX_HEIGHT * Math.max(0.15, elev);
    let blueAbove = 0;
    let blueTotal = 0;
    let orangeBelow = 0;
    let orangeTotal = 0;
    for (const pt of points) {
      const zNorm = getNormalizedElevation(pt.x, pt.y, kernel);
      const y3d = 0.16 + zNorm * MAX_HEIGHT * elev;
      if (pt.cls === 'A') {
        blueTotal++;
        if (y3d >= planeY) blueAbove++;
      } else {
        orangeTotal++;
        if (y3d < planeY) orangeBelow++;
      }
    }
    const cleanSplit =
      blueTotal > 0 &&
      orangeTotal > 0 &&
      ((blueAbove === blueTotal && orangeBelow === orangeTotal) ||
        (blueAbove === 0 && orangeBelow === 0));
    return { blueAbove, blueTotal, orangeBelow, orangeTotal, cleanSplit };
  }, [points, kernel, elevationPercent, cutHeightRatio]);

  // Keep refs in sync with UI sliders
  useEffect(() => {
    elevationRef.current = elevationPercent / 100;
    updateElevationRef.current();
    requestRenderRef.current();
  }, [elevationPercent]);

  useEffect(() => {
    cutRatioRef.current = cutHeightRatio;
    updateElevationRef.current();
    requestRenderRef.current();
  }, [cutHeightRatio]);

  useEffect(() => {
    morphAnimatingRef.current = isAnimatingMorph;
    if (isAnimatingMorph) {
      requestRenderRef.current();
    }
  }, [isAnimatingMorph]);

  // Rebuild data markers & terrain whenever dataset, kernel, model, or highContrast changes
  useEffect(() => {
    rebuildDataRef.current();
    requestRenderRef.current();
  }, [points, model, kernel, highContrast]);

  // Initialize Three.js WebGL scene once inside isolated mountRef
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);

    const scene = new THREE.Scene();
    const bgHex = propsRef.current.highContrast ? 0x000000 : 0x0b1224;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.022);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(8.4, 5.9, 9.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Environment Map (RoomEnvironment + PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    pmremGenerator.dispose();

    // Warm/Cool 3-Point Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xc7d2fe, 0x0f172a, 0.95);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.55);
    keyLight.position.set(6.5, 11.5, 7.5);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -7;
    keyLight.shadow.camera.right = 7;
    keyLight.shadow.camera.top = 7;
    keyLight.shadow.camera.bottom = -7;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.85);
    rimLight.position.set(-7, 5, -7);
    scene.add(rimLight);

    // OrbitControls — Full 360° free movement, tilt, zoom & pan
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.45, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.minDistance = 5.0;
    controls.maxDistance = 22.0;
    controls.minPolarAngle = 0.08;
    controls.maxPolarAngle = Math.PI - 0.12;
    controls.update();

    controls.addEventListener('start', () => {
      // Never fight user manual rotation
      cameraLerpRef.current.active = false;
    });

    // Base 2D Floor Platform + Grid + Axes
    const baseGroup = new THREE.Group();
    scene.add(baseGroup);

    const floorGeo = new THREE.PlaneGeometry(11.6, 11.6);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111a31,
      roughness: 0.88,
      metalness: 0.1,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.02;
    floorMesh.receiveShadow = true;
    baseGroup.add(floorMesh);

    const gridHelper = new THREE.GridHelper(11.2, 14, 0x3b82f6, 0x1e293b);
    gridHelper.position.y = 0.0;
    baseGroup.add(gridHelper);

    // Concentric subtle rings on 2D floor to anchor radial intuition
    const ringMat = new THREE.LineBasicMaterial({
      color: 0x475569,
      transparent: true,
      opacity: 0.55,
    });
    const floorRings: THREE.LineLoop[] = [];
    for (const r of [1.8, 3.4, 5.0]) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0.015, Math.sin(a) * r));
      }
      const rGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const loop = new THREE.LineLoop(rGeo, ringMat);
      baseGroup.add(loop);
      floorRings.push(loop);
    }

    // Topographic Kernel Surface (36x36 grid displaced smoothly in Y)
    const TERRAIN_SEG = 34;
    const terrainGeo = new THREE.PlaneGeometry(10.6, 10.6, TERRAIN_SEG, TERRAIN_SEG);
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
    const colorArray = new Float32Array(posAttr.count * 3);
    terrainGeo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.45,
      metalness: 0.15,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.renderOrder = 1;
    scene.add(terrainMesh);

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const terrainWire = new THREE.Mesh(terrainGeo, wireMat);
    terrainWire.position.y = 0.008;
    scene.add(terrainWire);

    // Luminous Emerald Cutting Hyperplane Sheet (3-part composite group)
    const cutPlaneGroup = new THREE.Group();
    scene.add(cutPlaneGroup);

    const sheetGeo = new THREE.PlaneGeometry(10.8, 10.8);
    const sheetMat = new THREE.MeshPhysicalMaterial({
      color: 0x10b981,
      emissive: 0x047857,
      emissiveIntensity: 0.35,
      roughness: 0.18,
      metalness: 0.1,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const sheetMesh = new THREE.Mesh(sheetGeo, sheetMat);
    sheetMesh.rotation.x = -Math.PI / 2;
    sheetMesh.renderOrder = 3;
    cutPlaneGroup.add(sheetMesh);

    const frameEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(10.8, 0.03, 10.8));
    const frameMat = new THREE.LineBasicMaterial({ color: 0x34d399 });
    const sheetBorder = new THREE.LineSegments(frameEdges, frameMat);
    cutPlaneGroup.add(sheetBorder);

    // Dynamic Data Markers Group (multi-part composite per point)
    const markersGroup = new THREE.Group();
    scene.add(markersGroup);

    // Shared geometries/materials for points (disposed on unmount)
    const sphereGeo = new THREE.SphereGeometry(0.24, 24, 18);
    const diamondGeo = new THREE.OctahedronGeometry(0.27, 0);
    const capRingGeo = new THREE.TorusGeometry(0.36, 0.032, 12, 32);
    const outerHaloGeo = new THREE.TorusGeometry(0.45, 0.018, 10, 32);
    const floorShadowGeo = new THREE.RingGeometry(0.06, 0.24, 20);
    const stemGeo = new THREE.CylinderGeometry(0.018, 0.018, 1, 8);
    stemGeo.translate(0, 0.5, 0);

    const blueMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.25,
      roughness: 0.22,
      metalness: 0.25,
    });
    const orangeMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xc2410c,
      emissiveIntensity: 0.25,
      roughness: 0.25,
      metalness: 0.2,
    });
    const violetRingMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 0.65,
      roughness: 0.2,
      metalness: 0.75,
    });
    const shadowDiscMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const stemBlueMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.55,
    });
    const stemOrangeMat = new THREE.MeshBasicMaterial({
      color: 0xfb923c,
      transparent: true,
      opacity: 0.55,
    });

    interface MarkerRecord {
      pt: DataPoint2D;
      isSV: boolean;
      zBase: number;
      headGroup: THREE.Group;
      stemMesh: THREE.Mesh;
      hitMesh: THREE.Mesh;
    }

    let markerRecords: MarkerRecord[] = [];
    let clickableMeshes: THREE.Object3D[] = [];
    let hoveredRecord: MarkerRecord | null = null;

    const updateTerrainAndHeights = () => {
      const { kernel: curKernel, highContrast: hc } = propsRef.current;
      const elev = elevationRef.current;
      const cutRatio = cutRatioRef.current;

      // Update scene background for high contrast mode
      const nextBg = hc ? 0x000000 : 0x0b1224;
      (scene.background as THREE.Color).setHex(nextBg);
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.setHex(nextBg);
      }
      floorMat.color.setHex(hc ? 0x050505 : 0x111a31);
      sheetMat.color.setHex(hc ? 0x4ade80 : 0x10b981);
      frameMat.color.setHex(hc ? 0xfacc15 : 0x34d399);
      wireMat.color.setHex(hc ? 0xfacc15 : 0x60a5fa);

      // Displace terrain mesh vertices smoothly by elevation factor
      const pos = terrainGeo.attributes.position as THREE.BufferAttribute;
      const col = terrainGeo.attributes.color as THREE.BufferAttribute;
      const tmpColor = new THREE.Color();
      const lowCol = new THREE.Color(hc ? 0xfb923c : 0xea580c);
      const midCol = new THREE.Color(hc ? 0x4ade80 : 0x10b981);
      const highCol = new THREE.Color(hc ? 0x38bdf8 : 0x3b82f6);

      for (let i = 0; i < pos.count; i++) {
        const wx = pos.getX(i);
        const wz = pos.getZ(i);
        const dataX = wx / WORLD_SCALE;
        const dataY = -wz / WORLD_SCALE;
        const zNorm = getNormalizedElevation(dataX, dataY, curKernel);
        const yVal = 0.02 + zNorm * MAX_HEIGHT * elev;
        pos.setY(i, yVal);

        const t = THREE.MathUtils.clamp(zNorm, 0, 1);
        if (t < 0.5) {
          tmpColor.copy(lowCol).lerp(midCol, t * 2);
        } else {
          tmpColor.copy(midCol).lerp(highCol, (t - 0.5) * 2);
        }
        col.setXYZ(i, tmpColor.r, tmpColor.g, tmpColor.b);
      }
      pos.needsUpdate = true;
      col.needsUpdate = true;
      terrainGeo.computeVertexNormals();

      // Update cutting sheet elevation
      const planeY = 0.08 + cutRatio * MAX_HEIGHT * Math.max(0.15, elev);
      cutPlaneGroup.position.y = planeY;

      // Update each point marker's 3D altitude and drop-stem length
      for (const rec of markerRecords) {
        const y3d = 0.16 + rec.zBase * MAX_HEIGHT * elev;
        rec.headGroup.position.y = y3d;
        rec.stemMesh.scale.y = Math.max(0.02, y3d);
        rec.stemMesh.visible = y3d > 0.18;
      }
    };

    const rebuildMarkers = () => {
      while (markersGroup.children.length > 0) {
        markersGroup.remove(markersGroup.children[0]);
      }
      markerRecords = [];
      clickableMeshes = [];
      hoveredRecord = null;

      const { points: curPts, model: curModel, kernel: curKernel } = propsRef.current;
      const svSet = new Set(curModel.supportVectorIds);

      for (const pt of curPts) {
        const wx = pt.x * WORLD_SCALE;
        const wz = -pt.y * WORLD_SCALE;
        const zBase = getNormalizedElevation(pt.x, pt.y, curKernel);
        const isSV = svSet.has(pt.id);

        const root = new THREE.Group();
        root.position.set(wx, 0, wz);

        // 1. Floor grounding ring
        const disc = new THREE.Mesh(floorShadowGeo, shadowDiscMat);
        disc.rotation.x = -Math.PI / 2;
        disc.position.y = 0.02;
        root.add(disc);

        // 2. Vertical laser drop-stem
        const stem = new THREE.Mesh(
          stemGeo,
          pt.cls === 'A' ? stemBlueMat : stemOrangeMat
        );
        root.add(stem);

        // 3. Elevated multi-part head group
        const headGroup = new THREE.Group();
        const bodyMesh = new THREE.Mesh(
          pt.cls === 'A' ? sphereGeo : diamondGeo,
          pt.cls === 'A' ? blueMat : orangeMat
        );
        bodyMesh.castShadow = !isSoftwareGl;
        bodyMesh.layers.enable(1);
        headGroup.add(bodyMesh);

        if (isSV) {
          const innerRing = new THREE.Mesh(capRingGeo, violetRingMat);
          innerRing.rotation.x = Math.PI / 2;
          headGroup.add(innerRing);

          const outerRing = new THREE.Mesh(outerHaloGeo, violetRingMat);
          outerRing.rotation.x = Math.PI / 2;
          headGroup.add(outerRing);
        }

        root.add(headGroup);
        markersGroup.add(root);

        const rec: MarkerRecord = {
          pt,
          isSV,
          zBase,
          headGroup,
          stemMesh: stem,
          hitMesh: bodyMesh,
        };
        bodyMesh.userData.record = rec;
        markerRecords.push(rec);
        clickableMeshes.push(bodyMesh);
      }

      updateTerrainAndHeights();
    };

    rebuildDataRef.current = rebuildMarkers;
    updateElevationRef.current = updateTerrainAndHeights;
    rebuildMarkers();

    // Raycasting for point hover tooltips (throttled to ~20Hz)
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    let lastRaycastMs = 0;

    const handlePointerMove = (ev: PointerEvent) => {
      const now = performance.now();
      if (now - lastRaycastMs < 48) return;
      lastRaycastMs = now;

      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      _pointerNdc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(_pointerNdc, camera);
      const hits = raycaster.intersectObjects(clickableMeshes, false);

      if (hoveredRecord) {
        hoveredRecord.headGroup.scale.setScalar(1.0);
        hoveredRecord = null;
      }

      if (hits.length > 0) {
        const rec = hits[0].object.userData.record as MarkerRecord | undefined;
        if (rec) {
          hoveredRecord = rec;
          rec.headGroup.scale.setScalar(1.24);
          const team = rec.pt.cls === 'A' ? 'Equipo Azul' : 'Equipo Naranja';
          const role = rec.isSV ? 'Punto Clave (Pilar)' : 'Punto Interior';
          const alt = (rec.zBase * MAX_HEIGHT * elevationRef.current).toFixed(2);
          setHoveredPointInfo(`${team} · ${role} · Altura 3D: ${alt}`);
          renderer.domElement.style.cursor = 'pointer';
          requestRender();
          return;
        }
      }

      setHoveredPointInfo(null);
      renderer.domElement.style.cursor = 'grab';
      requestRender();
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);

    // Coalesced on-demand renderer with software-WebGL fenceSync pacing (per threejs/SKILL.md)
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let disposed = false;
    let lastFrameTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function requestRender() {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame((now) => {
        if (disposed) return;
        const dt = Math.min(0.08, Math.max(0.001, (now - lastFrameTime) / 1000));
        lastFrameTime = now;
        renderDirty = false;

        let needsMoreFrames = false;

        // 1. Smooth camera preset transition (exponential damping)
        if (cameraLerpRef.current.active) {
          _targetCamPos.copy(cameraLerpRef.current.pos);
          _targetLookAt.copy(cameraLerpRef.current.target);
          const factor = 1 - Math.exp(-7 * dt);
          camera.position.lerp(_targetCamPos, factor);
          controls.target.lerp(_targetLookAt, factor);
          if (
            camera.position.distanceTo(_targetCamPos) < 0.04 &&
            controls.target.distanceTo(_targetLookAt) < 0.04
          ) {
            camera.position.copy(_targetCamPos);
            controls.target.copy(_targetLookAt);
            cameraLerpRef.current.active = false;
          } else {
            needsMoreFrames = true;
          }
        }

        // 2. Smooth 2D <-> 3D elevation animation when user presses "Animar"
        if (morphAnimatingRef.current) {
          const speed = 0.45;
          let nextVal = elevationRef.current + morphDirRef.current * speed * dt;
          if (nextVal <= 0) {
            nextVal = 0;
            morphDirRef.current = 1;
          } else if (nextVal >= 1) {
            nextVal = 1;
            morphDirRef.current = -1;
          }
          elevationRef.current = nextVal;
          updateTerrainAndHeights();
          setElevationPercent(Math.round(nextVal * 100));
          needsMoreFrames = true;
        }

        const controlsMoved = controls.update();
        if (controlsMoved && !isSoftwareGl) {
          needsMoreFrames = true;
        }

        renderer.render(scene, camera);

        const finish = () => {
          renderBusy = false;
          if (!disposed && (renderDirty || needsMoreFrames)) {
            requestRender();
          }
        };

        if (isSoftwareGl) {
          afterDraw(finish);
        } else {
          finish();
        }
      });
    }

    requestRenderRef.current = requestRender;
    controls.addEventListener('change', requestRender);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    requestRender();

    const resizeObserver = new ResizeObserver(() => {
      if (disposed || !container) return;
      const w = Math.max(container.clientWidth, 240);
      const h = Math.max(container.clientHeight, 240);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    });
    resizeObserver.observe(container);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      controls.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      ringMat.dispose();
      floorRings.forEach((l) => l.geometry.dispose());
      terrainGeo.dispose();
      terrainMat.dispose();
      wireMat.dispose();
      sheetGeo.dispose();
      sheetMat.dispose();
      frameEdges.dispose();
      frameMat.dispose();
      sphereGeo.dispose();
      diamondGeo.dispose();
      capRingGeo.dispose();
      outerHaloGeo.dispose();
      floorShadowGeo.dispose();
      stemGeo.dispose();
      blueMat.dispose();
      orangeMat.dispose();
      violetRingMat.dispose();
      shadowDiscMat.dispose();
      stemBlueMat.dispose();
      stemOrangeMat.dispose();
      envRT.dispose();
      renderer.dispose();
    };
  }, []);

  const jumpToPreset = (preset: CameraPreset) => {
    setActivePreset(preset);
    const { pos, target } = getCameraPresetVectors(preset);
    cameraLerpRef.current = {
      active: true,
      pos: new THREE.Vector3(...pos),
      target: new THREE.Vector3(...target),
    };
    requestRenderRef.current();
  };

  return (
    <div
      data-testid="svm-3d-viewport"
      className="relative w-full h-full bg-[#0b1224] select-none overflow-hidden"
    >
      {/* Dedicated isolated WebGL canvas container (zero sibling React mutations inside) */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Minimal Top-Left Info Pill (No backdrop-blur over WebGL!) */}
      <div className="pointer-events-none absolute top-3 left-3 max-w-[72%] bg-[#0f172a]/92 border border-[#334155] rounded-xl px-3 py-2 text-white shadow-md">
        <div className="flex items-center gap-1.5 font-display text-xs font-bold text-[#6ee7b7]">
          <Move3d className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Truco 3D · Arrastra para girar · Rueda para zoom</span>
        </div>
        <p className="text-[11px] text-[#e2e8f0] mt-0.5 leading-snug">
          {hoveredPointInfo
            ? hoveredPointInfo
            : separationStats.cleanSplit
              ? '¡Corte limpio! La lámina verde separa el equipo azul arriba del naranja abajo.'
              : `Arriba de la lámina: ${separationStats.blueAbove}/${separationStats.blueTotal} azules · Abajo: ${separationStats.orangeBelow}/${separationStats.orangeTotal} naranjas`}
        </p>
      </div>

      {/* Unified Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-[95%] max-w-[680px] flex flex-col items-center">
        <button
          type="button"
          onClick={() => setDockExpanded((v) => !v)}
          className="px-3 py-1 rounded-t-lg bg-[#0f172a]/95 border border-b-0 border-[#334155] text-[#cbd5e1] hover:text-white font-mono text-[10.5px] font-semibold inline-flex items-center gap-1 cursor-pointer"
        >
          {dockExpanded ? (
            <>
              <ChevronDown className="w-3 h-3" aria-hidden="true" />
              <span>Ocultar controles 3D</span>
            </>
          ) : (
            <>
              <ChevronUp className="w-3 h-3" aria-hidden="true" />
              <span>Mostrar controles 3D</span>
            </>
          )}
        </button>

        {dockExpanded && (
          <div className="w-full bg-[#0f172a]/95 border border-[#334155] rounded-xl px-3 py-2.5 text-white shadow-xl flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            {/* Elevation 2D -> 3D Morph Slider */}
            <div className="flex items-center gap-2 min-w-[180px] flex-1">
              <Layers className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" aria-hidden="true" />
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between text-[10.5px] font-mono">
                  <span className="text-[#cbd5e1]">Elevación 2D→3D</span>
                  <span className="text-[#38bdf8] font-bold tabular-nums">{elevationPercent}%</span>
                </div>
                <input
                  type="range"
                  aria-label="Elevación 2D a 3D"
                  min={0}
                  max={100}
                  step={2}
                  value={elevationPercent}
                  onChange={(e) => {
                    setIsAnimatingMorph(false);
                    setElevationPercent(Number(e.target.value));
                  }}
                  className="svm-slider w-full cursor-pointer mt-1"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsAnimatingMorph((v) => !v)}
                aria-label={isAnimatingMorph ? 'Pausar animación 3D' : 'Animar elevación 2D a 3D'}
                title={isAnimatingMorph ? 'Pausar' : 'Animar 2D → 3D'}
                className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                  isAnimatingMorph
                    ? 'bg-[#059669] border-[#34d399] text-white'
                    : 'bg-[#1e293b] border-[#475569] text-[#e2e8f0] hover:bg-[#334155]'
                }`}
              >
                {isAnimatingMorph ? (
                  <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                )}
              </button>
            </div>

            {/* Cutting Plane Height Slider */}
            <div className="flex items-center gap-2 min-w-[155px] flex-1">
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between text-[10.5px] font-mono">
                  <span className="text-[#cbd5e1]">Corte verde</span>
                  <span className="text-[#6ee7b7] font-bold tabular-nums">
                    {Math.round(cutHeightRatio * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  aria-label="Altura del plano de corte verde"
                  min={0.12}
                  max={0.85}
                  step={0.02}
                  value={cutHeightRatio}
                  onChange={(e) => setCutHeightRatio(Number(e.target.value))}
                  className="svm-slider w-full cursor-pointer mt-1"
                />
              </div>
            </div>

            {/* Camera Angle Presets */}
            <div className="flex items-center gap-1 shrink-0">
              <Eye className="w-3.5 h-3.5 text-[#94a3b8] mr-0.5 hidden sm:block" aria-hidden="true" />
              {(
                [
                  { id: 'ISO', label: '3D' },
                  { id: 'SIDE', label: 'De lado' },
                  { id: 'TOP', label: 'Arriba' },
                ] as const
              ).map((cam) => (
                <button
                  key={cam.id}
                  type="button"
                  onClick={() => jumpToPreset(cam.id)}
                  className={`px-2 py-1 rounded-md font-display text-[11px] font-semibold transition-colors cursor-pointer ${
                    activePreset === cam.id
                      ? 'bg-[#2563eb] text-white'
                      : 'bg-[#1e293b] text-[#cbd5e1] hover:bg-[#334155]'
                  }`}
                >
                  {cam.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setElevationPercent(100);
                  setCutHeightRatio(0.48);
                  setIsAnimatingMorph(false);
                  jumpToPreset('ISO');
                }}
                aria-label="Centrar cámara 3D"
                title="Centrar vista 3D"
                className="p-1 rounded-md bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
