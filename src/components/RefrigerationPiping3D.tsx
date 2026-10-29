import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  Play,
  Pause,
  RotateCcw,
  Eye,
  Sliders,
  Wind,
  Gauge,
  Flame,
  Snowflake,
  Info,
  Maximize2,
  ChevronRight,
  Zap,
  ArrowRight,
  Sparkles,
  Layers,
  Sun,
  Moon,
} from 'lucide-react';
import { CompanyBranding } from '../types/branding';
import { AppLanguage, TRANSLATIONS } from '../utils/i18n';
import {
  CameraPreset,
  DynamicCycleState,
  PhMeasurementPoint,
  PhPointId,
} from '../types/refrigeration3d';
import {
  calculateDynamicCycleFromFans,
  computeReciprocatingKinematics,
  getPhMeasurementPoints,
  ReciprocatingKinematics,
} from '../utils/refrigeration3dKinematics';
import { EducationalPipingSchematic } from './EducationalPipingSchematic';

interface RefrigerationPiping3DProps {
  branding?: CompanyBranding;
  language?: AppLanguage;
  onNavigateToPhCalc?: () => void;
}

export const RefrigerationPiping3D: React.FC<RefrigerationPiping3DProps> = ({
  branding,
  language = 'id',
  onNavigateToPhCalc,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniPhCanvasRef = useRef<HTMLCanvasElement>(null);

  // Simulation Controls State
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1.0); // 0.25x, 0.5x, 1x, 2x
  const [compressorRpm, setCompressorRpm] = useState<number>(1450);
  const [condenserFanRpm, setCondenserFanRpm] = useState<number>(1100);
  const [evaporatorFanRpm, setEvaporatorFanRpm] = useState<number>(1000);
  const [refrigerant, setRefrigerant] = useState<'R134a' | 'R404A' | 'R410A' | 'R22' | 'R32' | 'R448A'>('R134a');

  // Visual Display Toggles
  const [isCutawayMode, setIsCutawayMode] = useState<boolean>(false); // Solid black hermetic canister by default matching reference image
  const [showPipingFlow, setShowPipingFlow] = useState<boolean>(true);
  const [showAirflowVectors, setShowAirflowVectors] = useState<boolean>(true);
  const [showPointLabels, setShowPointLabels] = useState<boolean>(true);
  const [selectedPointId, setSelectedPointId] = useState<PhPointId | null>('point1');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('overview');
  const [showPDiagramCard, setShowPDiagramCard] = useState<boolean>(true);
  const [activeTabControls, setActiveTabControls] = useState<'simulation' | 'points' | 'diagnostics'>('simulation');
  const [viewMode, setViewMode] = useState<'schematic' | 'threejs'>('threejs'); // Default to 3D Orbit view requested by user
  const [studioTheme, setStudioTheme] = useState<'light' | 'dark'>('light'); // Default to light studio backdrop matching reference image

  // Internal Animation Values (stored in ref for smooth RAF)
  const animRef = useRef({
    crankAngle: 0,
    condenserFanAngle: 0,
    evaporatorFanAngle: 0,
    flowOffset: 0,
    airflowOffset: 0,
    targetCameraPos: new THREE.Vector3(0, 0, 7.2), // Direct 1:1 front view matching reference image
    targetCameraLookAt: new THREE.Vector3(0, 0, 0),
    currentCameraLookAt: new THREE.Vector3(0, 0, 0),
    isInteracting: false,
    orbitTheta: 0,
    orbitPhi: Math.PI / 2,
    orbitRadius: 7.2,
  });

  // Calculate live thermodynamic cycle state based on fan & compressor speeds
  const cycleState: DynamicCycleState = useMemo(() => {
    return calculateDynamicCycleFromFans(
      isRunning ? compressorRpm : 0,
      condenserFanRpm,
      evaporatorFanRpm,
      refrigerant
    );
  }, [isRunning, compressorRpm, condenserFanRpm, evaporatorFanRpm, refrigerant]);

  // Points metadata
  const measurementPoints: PhMeasurementPoint[] = useMemo(() => {
    return getPhMeasurementPoints(cycleState, language);
  }, [cycleState, language]);

  const activePoint = useMemo(() => {
    return measurementPoints.find((p) => p.id === selectedPointId) ?? measurementPoints[0];
  }, [measurementPoints, selectedPointId]);

  // Handle Camera Presets for symmetrical 4-quadrant layout
  const setCameraToPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    const anim = animRef.current;

    switch (preset) {
      case 'overview':
        // Reference 1:1 view framing all 4 components symmetrically
        anim.targetCameraPos.set(0, 0, 7.2);
        anim.targetCameraLookAt.set(0, 0, 0);
        break;
      case 'compressor':
        // Zoom on Top Center Hermetic Compressor
        anim.targetCameraPos.set(0, 2.1, 3.2);
        anim.targetCameraLookAt.set(0, 1.85, 0);
        setSelectedPointId('point1');
        break;
      case 'condenser':
        // Zoom on Right Finned Condenser & Badge #2
        anim.targetCameraPos.set(2.2, 0.2, 3.4);
        anim.targetCameraLookAt.set(2.2, 0, 0);
        setSelectedPointId('point2');
        break;
      case 'txv_filter':
        // Zoom on Bottom Brass TXV & Coiled Capillary Spiral
        anim.targetCameraPos.set(0, -1.6, 2.6);
        anim.targetCameraLookAt.set(0, -1.85, 0);
        setSelectedPointId('point3');
        break;
      case 'evaporator':
        // Zoom on Left Frosted Blue Evaporator Coil
        anim.targetCameraPos.set(-2.2, 0.2, 3.4);
        anim.targetCameraLookAt.set(-2.2, 0, 0);
        setSelectedPointId('point4');
        break;
      case 'top_down':
        // 3D Isometric Perspective View
        anim.targetCameraPos.set(3.2, 2.8, 5.8);
        anim.targetCameraLookAt.set(0, 0, 0);
        break;
    }
  };

  // --- THREE.JS SCENE INITIALIZATION & ANIMATION LOOP ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Helper: Create high-contrast text badge sprites for 3D annotations
    const createTextBadge = (text: string, bgColor = '#0f172a', textColor = '#ffffff', fontSize = 24) => {
      const cvs = document.createElement('canvas');
      cvs.width = 384;
      cvs.height = 84;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 384, 84);
        ctx.fillStyle = bgColor;
        if (ctx.roundRect) {
          ctx.roundRect(8, 8, 368, 68, 18);
        } else {
          ctx.rect(8, 8, 368, 68);
        }
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 192, 42);
      }
      const tex = new THREE.CanvasTexture(cvs);
      tex.needsUpdate = true;
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(1.4, 0.32, 1);
      return sprite;
    };

    // Helper: Circular badge (e.g. badge #2 matching reference image)
    const createCircleBadge = (numText: string, bgColor = '#2563eb', textColor = '#ffffff') => {
      const cvs = document.createElement('canvas');
      cvs.width = 128;
      cvs.height = 128;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 128, 128);
        ctx.beginPath();
        ctx.arc(64, 64, 56, 0, Math.PI * 2);
        ctx.fillStyle = bgColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.font = 'bold 62px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(numText, 64, 64);
      }
      const tex = new THREE.CanvasTexture(cvs);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(0.42, 0.42, 1);
      return sprite;
    };

    // Helper: Directional flow arrows along piping
    const createArrowSprite = (color = '#ef4444', direction: 'right' | 'left' | 'down' | 'up' = 'right') => {
      const cvs = document.createElement('canvas');
      cvs.width = 128;
      cvs.height = 64;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 128, 64);
        ctx.fillStyle = color;
        ctx.beginPath();
        if (direction === 'right') {
          ctx.moveTo(20, 18);
          ctx.lineTo(80, 18);
          ctx.lineTo(80, 8);
          ctx.lineTo(115, 32);
          ctx.lineTo(80, 56);
          ctx.lineTo(80, 46);
          ctx.lineTo(20, 46);
          ctx.closePath();
        } else if (direction === 'left') {
          ctx.moveTo(108, 18);
          ctx.lineTo(48, 18);
          ctx.lineTo(48, 8);
          ctx.lineTo(13, 32);
          ctx.lineTo(48, 56);
          ctx.lineTo(48, 46);
          ctx.lineTo(108, 46);
          ctx.closePath();
        } else if (direction === 'down') {
          ctx.moveTo(46, 10);
          ctx.lineTo(46, 70);
          ctx.lineTo(32, 70);
          ctx.lineTo(64, 115);
          ctx.lineTo(96, 70);
          ctx.lineTo(82, 70);
          ctx.lineTo(82, 10);
          ctx.closePath();
        } else {
          ctx.moveTo(46, 115);
          ctx.lineTo(46, 55);
          ctx.lineTo(32, 55);
          ctx.lineTo(64, 10);
          ctx.lineTo(96, 55);
          ctx.lineTo(82, 55);
          ctx.lineTo(82, 115);
          ctx.closePath();
        }
        ctx.fill();
      }
      const tex = new THREE.CanvasTexture(cvs);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(0.42, 0.21, 1);
      return sprite;
    };

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = studioTheme === 'light' ? 1.05 : 1.2;

    // Scene
    const scene = new THREE.Scene();
    const isLight = studioTheme === 'light';
    const bgColor = isLight ? 0xe7ecf2 : 0x0a0f1d;
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(bgColor, isLight ? 0.015 : 0.035);

    // Camera: Frontal 1:1 view matching reference image
    const camera = new THREE.PerspectiveCamera(
      42,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 7.2);

    // Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, isLight ? 1.15 : 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, isLight ? 2.2 : 1.8);
    keyLight.position.set(5, 7, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, isLight ? 1.2 : 0.9);
    fillLight.position.set(-6, 4, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, isLight ? 0.8 : 1.2);
    rimLight.position.set(0, 6, -5);
    scene.add(rimLight);

    const groundBounceLight = new THREE.DirectionalLight(0xf8fafc, 0.4);
    groundBounceLight.position.set(0, -6, 2);
    scene.add(groundBounceLight);

    // Subtle Ground Floor & Shadows
    const floorY = -2.6;
    const gridHelper = new THREE.GridHelper(
      16,
      32,
      isLight ? 0xc4cbd5 : 0x1e293b,
      isLight ? 0xdfe5ed : 0x0f172a
    );
    gridHelper.position.y = floorY;
    scene.add(gridHelper);

    // Soft Contact Shadows Underneath the 4 components
    const shadowGeo = new THREE.PlaneGeometry(1.6, 1.2);
    const shadowCvs = document.createElement('canvas');
    shadowCvs.width = 128;
    shadowCvs.height = 128;
    const sCtx = shadowCvs.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(64, 64, 5, 64, 64, 60);
      grad.addColorStop(0, isLight ? 'rgba(30, 41, 59, 0.35)' : 'rgba(0, 0, 0, 0.6)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCvs);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });

    // Place contact shadow discs under Compressor, Condenser, TXV, and Evaporator
    [
      [0, floorY + 0.01, 0, 1.5, 1.2],
      [2.2, floorY + 0.01, 0, 1.6, 0.9],
      [0, floorY + 0.01, 0, 1.0, 0.8],
      [-2.2, floorY + 0.01, 0, 1.6, 0.9],
    ].forEach(([x, y, z, sx, sz]) => {
      const sMesh = new THREE.Mesh(shadowGeo, shadowMat);
      sMesh.rotation.x = -Math.PI / 2;
      sMesh.position.set(x, y, z);
      sMesh.scale.set(sx, sz, 1);
      scene.add(sMesh);
    });

    // --- MATERIAL PALETTE ---
    // 1. High Gloss Black Enamel Hermetic Shell (matches reference image pot)
    const matGlossBlackShell = new THREE.MeshStandardMaterial({
      color: 0x14161a,
      metalness: 0.88,
      roughness: 0.22,
    });
    // 2. Cutaway / X-Ray Acrylic Shell (switches with isCutawayMode)
    const matCompShellCutaway = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.2,
      roughness: 0.1,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });
    // 3. Polished Chrome / Steel
    const matChrome = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.95,
      roughness: 0.1,
    });
    // 4. Machined Piston
    const matPiston = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.2,
    });
    // 5. Piston Rings
    const matPistonRings = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.95,
      roughness: 0.1,
    });
    // 6. Forged Bronze / Steel Conrod
    const matConrod = new THREE.MeshStandardMaterial({
      color: 0xca8a04,
      metalness: 0.82,
      roughness: 0.32,
    });
    // 7. Crankshaft
    const matCrankshaft = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.9,
      roughness: 0.25,
    });
    // 8. Authentic Shiny Copper
    const matCopper = new THREE.MeshStandardMaterial({
      color: 0xc87a3e,
      metalness: 0.9,
      roughness: 0.2,
    });
    // 9. Solid Forged Brass (TXV)
    const matBrass = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.88,
      roughness: 0.26,
    });
    // 10. Condenser Micro-Fins (Dark metallic radiator core)
    const matCondFins = new THREE.MeshStandardMaterial({
      color: 0x2e2926,
      metalness: 0.72,
      roughness: 0.45,
    });
    // 11. Galvanized Brackets
    const matGalvanized = new THREE.MeshStandardMaterial({
      color: 0xa8b2c1,
      metalness: 0.78,
      roughness: 0.35,
    });
    // 12. Frosted Blue Evaporator Coil Core
    const matEvapFrosted = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.55,
      roughness: 0.25,
    });
    // 13. Evaporator Casing
    const matEvapCasing = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.65,
      roughness: 0.38,
    });
    // 14. Reed Valves
    const matValveSuction = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.85,
      roughness: 0.2,
    });
    const matValveDischarge = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      metalness: 0.85,
      roughness: 0.2,
    });
    // 15. Piping Color Palette
    const matDischargePipe = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Red hot gas
      metalness: 0.75,
      roughness: 0.25,
    });
    const matLiquidPipe = new THREE.MeshStandardMaterial({
      color: 0xf97316, // Warm amber/copper liquid
      metalness: 0.8,
      roughness: 0.25,
    });
    const matExpansionPipe = new THREE.MeshStandardMaterial({
      color: 0x00d8f6, // Cold cyan flash gas mixture
      metalness: 0.75,
      roughness: 0.25,
    });
    const matSuctionPipe = new THREE.MeshStandardMaterial({
      color: 0x2563eb, // Superheated suction vapor royal blue
      metalness: 0.75,
      roughness: 0.25,
    });

    // ====================================================
    // COMPONENT 1: HERMETIC RECIPROCATING COMPRESSOR (TOP CENTER)
    // Position: (0, 1.85, 0) - Matches reference image canister pot
    // ====================================================
    const compressorGroup = new THREE.Group();
    compressorGroup.position.set(0, 1.85, 0);
    scene.add(compressorGroup);

    // --- SOLID BLACK HERMETIC POT SHELL ---
    const shellSolidGroup = new THREE.Group();
    compressorGroup.add(shellSolidGroup);

    // Upper Dome (Hemisphere)
    const compUpperDomeGeo = new THREE.SphereGeometry(0.55, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const compUpperDome = new THREE.Mesh(compUpperDomeGeo, matGlossBlackShell);
    compUpperDome.position.y = 0.32;
    compUpperDome.castShadow = true;
    shellSolidGroup.add(compUpperDome);

    // Middle Cylindrical Belly
    const compMidGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.64, 32);
    const compMid = new THREE.Mesh(compMidGeo, matGlossBlackShell);
    compMid.castShadow = true;
    shellSolidGroup.add(compMid);

    // Circumferential Weld Bead / Middle Seam Collar
    const compSeamGeo = new THREE.TorusGeometry(0.556, 0.02, 12, 36);
    const compSeam = new THREE.Mesh(compSeamGeo, matGlossBlackShell);
    compSeam.rotation.x = Math.PI / 2;
    shellSolidGroup.add(compSeam);

    // Lower Dome (Inverted Hemisphere)
    const compLowerDomeGeo = new THREE.SphereGeometry(0.55, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const compLowerDome = new THREE.Mesh(compLowerDomeGeo, matGlossBlackShell);
    compLowerDome.position.y = -0.32;
    compLowerDome.castShadow = true;
    shellSolidGroup.add(compLowerDome);

    // Top Welded Lifting Lug / Handle (matches reference image)
    const compHandleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.16, 0.85, 0),
      new THREE.Vector3(-0.14, 0.98, 0),
      new THREE.Vector3(0.14, 0.98, 0),
      new THREE.Vector3(0.16, 0.85, 0),
    ]);
    const compHandleGeo = new THREE.TubeGeometry(compHandleCurve, 16, 0.035, 8, false);
    const compHandleMesh = new THREE.Mesh(compHandleGeo, matGlossBlackShell);
    shellSolidGroup.add(compHandleMesh);

    // Terminal Junction Box on Left Side of Shell
    const termBoxGeo = new THREE.BoxGeometry(0.24, 0.34, 0.22);
    const termBox = new THREE.Mesh(termBoxGeo, matGlossBlackShell);
    termBox.position.set(-0.55, 0.1, 0.15);
    shellSolidGroup.add(termBox);

    // 4 Bottom Mounting Feet Brackets with Rubber Vibration Isolators
    const footPositions = [
      [-0.45, -0.68, 0.28],
      [0.45, -0.68, 0.28],
      [-0.45, -0.68, -0.28],
      [0.45, -0.68, -0.28],
    ];
    footPositions.forEach(([fx, fy, fz]) => {
      // Bracket Tab
      const tabGeo = new THREE.BoxGeometry(0.18, 0.06, 0.16);
      const tabMesh = new THREE.Mesh(tabGeo, matGlossBlackShell);
      tabMesh.position.set(fx, fy + 0.04, fz);
      shellSolidGroup.add(tabMesh);

      // Rubber grommet
      const rubberGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.08, 16);
      const matRubber = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });
      const rubberMesh = new THREE.Mesh(rubberGeo, matRubber);
      rubberMesh.position.set(fx, fy - 0.03, fz);
      shellSolidGroup.add(rubberMesh);

      // Bolt head
      const boltGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.05, 6);
      const boltMesh = new THREE.Mesh(boltGeo, matChrome);
      boltMesh.position.set(fx, fy + 0.08, fz);
      shellSolidGroup.add(boltMesh);
    });

    // Suction Port Stub (Left Side, connected to Suction Blue Line)
    const suctionPortStubGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.18, 16);
    const suctionPortStub = new THREE.Mesh(suctionPortStubGeo, matCopper);
    suctionPortStub.rotation.z = Math.PI / 2;
    suctionPortStub.position.set(-0.62, 0.05, 0);
    compressorGroup.add(suctionPortStub);

    // Discharge Port Stub (Right Side, connected to Discharge Red Line)
    const dischargePortStubGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.18, 16);
    const dischargePortStub = new THREE.Mesh(dischargePortStubGeo, matCopper);
    dischargePortStub.rotation.z = -Math.PI / 2;
    dischargePortStub.position.set(0.62, 0.05, 0);
    compressorGroup.add(dischargePortStub);

    // --- CUTAWAY / X-RAY SHELL (switches when isCutawayMode is active) ---
    const shellCutawayGroup = new THREE.Group();
    shellCutawayGroup.visible = false;
    compressorGroup.add(shellCutawayGroup);

    const cutawayCylGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.64, 32, 1, false, 0, Math.PI * 1.15);
    const cutawayCyl = new THREE.Mesh(cutawayCylGeo, matCompShellCutaway);
    shellCutawayGroup.add(cutawayCyl);

    const cutawayDomeGeo = new THREE.SphereGeometry(0.55, 32, 16, 0, Math.PI * 1.15, 0, Math.PI / 2);
    const cutawayDome = new THREE.Mesh(cutawayDomeGeo, matCompShellCutaway);
    cutawayDome.position.y = 0.32;
    shellCutawayGroup.add(cutawayDome);

    // --- INTERNAL RECIPROCATING MECHANISM (Animated) ---
    // Cylinder Sleeve
    const sleeveGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.9, 24, 1, true);
    const matSleeve = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.8,
      roughness: 0.25,
      side: THREE.DoubleSide,
    });
    const sleeveMesh = new THREE.Mesh(sleeveGeo, matSleeve);
    sleeveMesh.position.y = 0.25;
    compressorGroup.add(sleeveMesh);

    // Cylinder Head & Valve Plate
    const headGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.14, 24);
    const headMesh = new THREE.Mesh(headGeo, matChrome);
    headMesh.position.y = 0.76;
    compressorGroup.add(headMesh);

    // Suction & Discharge Reed Valves
    const suctionValveGeo = new THREE.BoxGeometry(0.1, 0.015, 0.05);
    const suctionValveMesh = new THREE.Mesh(suctionValveGeo, matValveSuction);
    suctionValveMesh.position.set(-0.12, 0.68, 0);
    compressorGroup.add(suctionValveMesh);

    const dischargeValveGeo = new THREE.BoxGeometry(0.1, 0.015, 0.05);
    const dischargeValveMesh = new THREE.Mesh(dischargeValveGeo, matValveDischarge);
    dischargeValveMesh.position.set(0.12, 0.7, 0);
    compressorGroup.add(dischargeValveMesh);

    // Crankshaft & Counterweights
    const CRANK_RADIUS = 0.22;
    const CONROD_LENGTH = 0.65;

    const crankGroup = new THREE.Group();
    crankGroup.position.set(0, -0.35, 0); // Crankshaft center
    compressorGroup.add(crankGroup);

    const shaftGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.65, 16);
    const shaftMesh = new THREE.Mesh(shaftGeo, matCrankshaft);
    shaftMesh.rotation.x = Math.PI / 2;
    crankGroup.add(shaftMesh);

    const webGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.1, 16, 1, false, 0, Math.PI);
    const webMesh1 = new THREE.Mesh(webGeo, matCrankshaft);
    webMesh1.rotation.y = -Math.PI / 2;
    webMesh1.position.z = -0.12;
    crankGroup.add(webMesh1);

    const webMesh2 = webMesh1.clone();
    webMesh2.position.z = 0.12;
    crankGroup.add(webMesh2);

    const crankpinGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.22, 16);
    const crankpinMesh = new THREE.Mesh(crankpinGeo, matChrome);
    crankpinMesh.rotation.x = Math.PI / 2;
    crankpinMesh.position.set(0, CRANK_RADIUS, 0);
    crankGroup.add(crankpinMesh);

    // Connecting Rod
    const conrodGroup = new THREE.Group();
    compressorGroup.add(conrodGroup);

    const bigEndGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.14, 16);
    const bigEndMesh = new THREE.Mesh(bigEndGeo, matConrod);
    bigEndMesh.rotation.x = Math.PI / 2;
    conrodGroup.add(bigEndMesh);

    const shankGeo = new THREE.BoxGeometry(0.065, CONROD_LENGTH, 0.06);
    const shankMesh = new THREE.Mesh(shankGeo, matConrod);
    shankMesh.position.y = CONROD_LENGTH / 2;
    conrodGroup.add(shankMesh);

    const smallEndGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.12, 16);
    const smallEndMesh = new THREE.Mesh(smallEndGeo, matConrod);
    smallEndMesh.rotation.x = Math.PI / 2;
    smallEndMesh.position.y = CONROD_LENGTH;
    conrodGroup.add(smallEndMesh);

    // Piston Assembly
    const pistonGroup = new THREE.Group();
    compressorGroup.add(pistonGroup);

    const pistonGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.32, 24);
    const pistonMesh = new THREE.Mesh(pistonGeo, matPiston);
    pistonGroup.add(pistonMesh);

    for (let r = 0; r < 3; r++) {
      const ringGeo = new THREE.TorusGeometry(0.292, 0.01, 8, 24);
      const ringMesh = new THREE.Mesh(ringGeo, matPistonRings);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = 0.08 - r * 0.05;
      pistonGroup.add(ringMesh);
    }

    const wristPinGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.45, 16);
    const wristPinMesh = new THREE.Mesh(wristPinGeo, matChrome);
    wristPinMesh.rotation.x = Math.PI / 2;
    pistonGroup.add(wristPinMesh);

    // Sump Oil Pool
    const oilGeo = new THREE.CylinderGeometry(0.48, 0.45, 0.18, 24);
    const matOil = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      metalness: 0.1,
      roughness: 0.1,
      transparent: true,
      opacity: 0.6,
    });
    const oilMesh = new THREE.Mesh(oilGeo, matOil);
    oilMesh.position.y = -0.45;
    compressorGroup.add(oilMesh);

    // ====================================================
    // COMPONENT 2: FINNED-TUBE CONDENSER (RIGHT SIDE)
    // Position: (2.2, 0, 0) - Matches reference image condenser
    // ====================================================
    const condenserGroup = new THREE.Group();
    condenserGroup.position.set(2.2, 0, 0);
    scene.add(condenserGroup);

    // Micro-Fin Radiator Core Block (Dark charcoal metallic)
    const condCoreGeo = new THREE.BoxGeometry(1.2, 1.8, 0.28);
    const condCore = new THREE.Mesh(condCoreGeo, matCondFins);
    condCore.castShadow = true;
    condenserGroup.add(condCore);

    // Galvanized Steel Mounting Side Brackets
    const leftBracketGeo = new THREE.BoxGeometry(0.06, 1.9, 0.32);
    const leftBracket = new THREE.Mesh(leftBracketGeo, matGalvanized);
    leftBracket.position.x = -0.63;
    condenserGroup.add(leftBracket);

    const rightBracket = leftBracket.clone();
    rightBracket.position.x = 0.63;
    condenserGroup.add(rightBracket);

    // Galvanized Mounting Tabs (Bottom & Top)
    [
      [-0.63, -0.95, 0],
      [0.63, -0.95, 0],
      [0.72, 0.35, 0],
    ].forEach(([tx, ty, tz]) => {
      const tabGeo = new THREE.BoxGeometry(0.14, 0.05, 0.12);
      const tab = new THREE.Mesh(tabGeo, matGalvanized);
      tab.position.set(tx, ty, tz);
      condenserGroup.add(tab);
    });

    // Serpentine Hairpin Return U-Bends along Left and Right Edges
    const numRows = 7;
    for (let r = 0; r < numRows; r++) {
      const yOffset = -0.7 + r * 0.23;

      // Right Side Copper Return U-bends
      const bendRightGeo = new THREE.TorusGeometry(0.08, 0.024, 8, 16, Math.PI);
      const bendRight = new THREE.Mesh(bendRightGeo, matCopper);
      bendRight.position.set(0.64, yOffset, 0);
      condenserGroup.add(bendRight);

      // Left Side Copper Return U-bends
      const bendLeft = bendRight.clone();
      bendLeft.rotation.z = Math.PI;
      bendLeft.position.set(-0.64, yOffset + 0.115, 0);
      condenserGroup.add(bendLeft);
    }

    // Top Inlet Header receiving hot discharge gas
    const condInletStubGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.18, 16);
    const condInletStub = new THREE.Mesh(condInletStubGeo, matCopper);
    condInletStub.position.set(-0.45, 0.98, 0);
    condenserGroup.add(condInletStub);

    // Bottom Outlet Header discharging liquid refrigerant
    const condOutletStubGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.18, 16);
    const condOutletStub = new THREE.Mesh(condOutletStubGeo, matCopper);
    condOutletStub.position.set(0.45, -0.98, 0);
    condenserGroup.add(condOutletStub);

    // Circular Blue Badge #2 (Matches reference image exact badge!)
    const badge2 = createCircleBadge('2', '#2563eb', '#ffffff');
    badge2.position.set(-0.15, -0.28, 0.22);
    condenserGroup.add(badge2);

    // Subtle Thermal Dissipation Pulsing Waves (Left & Right Arcs)
    const waveGroup = new THREE.Group();
    condenserGroup.add(waveGroup);

    const createWaveArc = (side: 'left' | 'right', radius: number) => {
      const curve = new THREE.EllipseCurve(
        side === 'left' ? -0.8 : 0.8,
        0,
        radius,
        radius * 1.4,
        side === 'left' ? Math.PI * 0.75 : -Math.PI * 0.25,
        side === 'left' ? Math.PI * 1.25 : Math.PI * 0.25,
        false,
        0
      );
      const pts = curve.getPoints(24);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: 0xf43f5e,
        transparent: true,
        opacity: 0.35,
        linewidth: 2,
      });
      return new THREE.Line(geo, mat);
    };

    const wave1 = createWaveArc('left', 0.3);
    const wave2 = createWaveArc('left', 0.45);
    const wave3 = createWaveArc('right', 0.3);
    const wave4 = createWaveArc('right', 0.45);
    waveGroup.add(wave1, wave2, wave3, wave4);

    // ====================================================
    // COMPONENT 3: THERMOSTATIC EXPANSION VALVE (TXV) (BOTTOM CENTER)
    // Position: (0, -1.85, 0) - Matches reference image TXV
    // ====================================================
    const txvGroup = new THREE.Group();
    txvGroup.position.set(0, -1.85, 0);
    scene.add(txvGroup);

    // Solid Forged Brass Hex Valve Body
    const txvBodyGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.32, 6);
    const txvBody = new THREE.Mesh(txvBodyGeo, matBrass);
    txvBody.castShadow = true;
    txvGroup.add(txvBody);

    // Left & Right Hex Union Compression Nuts
    const nutGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.14, 6);
    const nutRight = new THREE.Mesh(nutGeo, matBrass);
    nutRight.rotation.z = Math.PI / 2;
    nutRight.position.set(0.24, 0, 0);
    txvGroup.add(nutRight);

    const nutLeft = nutRight.clone();
    nutLeft.position.set(-0.24, 0, 0);
    txvGroup.add(nutLeft);

    // Bottom Superheat Adjustment Cap Spindle
    const capGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 16);
    const capMesh = new THREE.Mesh(capGeo, matBrass);
    capMesh.position.set(0, -0.24, 0);
    txvGroup.add(capMesh);

    // Top Stainless Diaphragm Power Head Dome
    const txvDomeGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.12, 24);
    const txvDome = new THREE.Mesh(txvDomeGeo, matChrome);
    txvDome.position.set(0, 0.2, 0);
    txvGroup.add(txvDome);

    // Distinctive Helical Coiled Copper Capillary Spiral (Matches reference image!)
    const spiralPoints: THREE.Vector3[] = [];
    const turns = 3.5;
    const totalPts = 50;
    for (let i = 0; i <= totalPts; i++) {
      const t = i / totalPts;
      const angle = t * turns * Math.PI * 2;
      const r = 0.21 - t * 0.04;
      const sx = Math.cos(angle) * r;
      const sy = 0.27 + t * 0.24; // Rises vertically from dome top
      const sz = Math.sin(angle) * r;
      spiralPoints.push(new THREE.Vector3(sx, sy, sz));
    }
    const spiralCurve = new THREE.CatmullRomCurve3(spiralPoints);
    const spiralGeo = new THREE.TubeGeometry(spiralCurve, 40, 0.016, 8, false);
    const spiralMesh = new THREE.Mesh(spiralGeo, matCopper);
    txvGroup.add(spiralMesh);

    // ====================================================
    // COMPONENT 4: FROSTED EVAPORATOR COIL (LEFT SIDE)
    // Position: (-2.2, 0, 0) - Matches reference image evaporator
    // ====================================================
    const evapGroup = new THREE.Group();
    evapGroup.position.set(-2.2, 0, 0);
    scene.add(evapGroup);

    // Aluminum Outer Frame Casing (Open front and back)
    const evapFrameGeo = new THREE.BoxGeometry(1.4, 1.8, 0.35);
    const evapFrame = new THREE.Mesh(evapFrameGeo, matEvapCasing);
    evapFrame.castShadow = true;
    evapGroup.add(evapFrame);

    // Inner Recessed Chamber (Dark backplate)
    const evapBackGeo = new THREE.BoxGeometry(1.28, 1.68, 0.04);
    const matBack = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const evapBack = new THREE.Mesh(evapBackGeo, matBack);
    evapBack.position.z = -0.14;
    evapGroup.add(evapBack);

    // Frosted Sky Blue Serpentine Tubes (Visible inside casing)
    const evapNumPasses = 8;
    for (let p = 0; p < evapNumPasses; p++) {
      const yPass = -0.65 + p * 0.19;
      // Horizontal blue tubes
      const tubeGeo = new THREE.CylinderGeometry(0.034, 0.034, 1.05, 16);
      const tubeMesh = new THREE.Mesh(tubeGeo, matEvapFrosted);
      tubeMesh.rotation.z = Math.PI / 2;
      tubeMesh.position.set(0, yPass, 0);
      evapGroup.add(tubeMesh);

      // Copper return bends on left edge
      if (p % 2 === 0 && p < evapNumPasses - 1) {
        const uBendGeo = new THREE.TorusGeometry(0.095, 0.03, 8, 16, Math.PI);
        const uBend = new THREE.Mesh(uBendGeo, matCopper);
        uBend.rotation.z = Math.PI;
        uBend.position.set(-0.525, yPass + 0.095, 0);
        evapGroup.add(uBend);
      }
      // Copper return bends on right edge
      if (p % 2 === 1 && p < evapNumPasses - 1) {
        const uBendGeo = new THREE.TorusGeometry(0.095, 0.03, 8, 16, Math.PI);
        const uBend = new THREE.Mesh(uBendGeo, matCopper);
        uBend.position.set(0.525, yPass + 0.095, 0);
        evapGroup.add(uBend);
      }
    }

    // Evaporator Bottom Inlet Stub (connected to Expansion Cyan Line)
    const evapInletStubGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.18, 16);
    const evapInletStub = new THREE.Mesh(evapInletStubGeo, matCopper);
    evapInletStub.position.set(0.5, -0.98, 0);
    evapGroup.add(evapInletStub);

    // Evaporator Top Outlet Stub (connected to Suction Blue Line)
    const evapOutletStubGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.18, 16);
    const evapOutletStub = new THREE.Mesh(evapOutletStubGeo, matCopper);
    evapOutletStub.position.set(0.5, 0.98, 0);
    evapGroup.add(evapOutletStub);

    // Gentle Chilly Mist / Frost Particles
    const coldParticleCount = 35;
    const coldParticleGeo = new THREE.BufferGeometry();
    const coldPositions = new Float32Array(coldParticleCount * 3);
    for (let i = 0; i < coldParticleCount; i++) {
      coldPositions[i * 3] = (Math.random() - 0.5) * 1.1;
      coldPositions[i * 3 + 1] = (Math.random() - 0.5) * 1.4;
      coldPositions[i * 3 + 2] = 0.15 + Math.random() * 0.45;
    }
    coldParticleGeo.setAttribute('position', new THREE.BufferAttribute(coldPositions, 3));
    const matColdMist = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.07,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const coldMistParticles = new THREE.Points(coldParticleGeo, matColdMist);
    evapGroup.add(coldMistParticles);

    // ====================================================
    // CLOSED RECTANGULAR PIPING CIRCUIT (MATCHES REFERENCE IMAGE)
    // ====================================================
    // 1. Hot Discharge Gas Pipe (Compressor Right -> Condenser Top Inlet) - RED
    const dischargeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.65, 1.85, 0),
      new THREE.Vector3(1.85, 1.85, 0),
      new THREE.Vector3(2.15, 1.72, 0),
      new THREE.Vector3(2.2, 1.45, 0),
      new THREE.Vector3(2.2, 0.98, 0),
    ]);
    const dischargePipeGeo = new THREE.TubeGeometry(dischargeCurve, 32, 0.046, 16, false);
    const dischargePipeMesh = new THREE.Mesh(dischargePipeGeo, matDischargePipe);
    scene.add(dischargePipeMesh);

    // 2. High-Pressure Liquid Line (Condenser Bottom Outlet -> TXV Right Inlet) - AMBER/ORANGE
    const liquidCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(2.2, -0.98, 0),
      new THREE.Vector3(2.2, -1.55, 0),
      new THREE.Vector3(2.15, -1.78, 0),
      new THREE.Vector3(1.85, -1.85, 0),
      new THREE.Vector3(0.35, -1.85, 0),
    ]);
    const liquidPipeGeo = new THREE.TubeGeometry(liquidCurve, 36, 0.038, 16, false);
    const liquidPipeMesh = new THREE.Mesh(liquidPipeGeo, matLiquidPipe);
    scene.add(liquidPipeMesh);

    // 3. Cold 2-Phase Expansion Line (TXV Left Outlet -> Evaporator Bottom Inlet) - CYAN
    const expansionCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.35, -1.85, 0),
      new THREE.Vector3(-1.85, -1.85, 0),
      new THREE.Vector3(-2.15, -1.78, 0),
      new THREE.Vector3(-2.2, -1.55, 0),
      new THREE.Vector3(-2.2, -0.98, 0),
    ]);
    const expansionPipeGeo = new THREE.TubeGeometry(expansionCurve, 36, 0.038, 16, false);
    const expansionPipeMesh = new THREE.Mesh(expansionPipeGeo, matExpansionPipe);
    scene.add(expansionPipeMesh);

    // 4. Cold Superheated Suction Line (Evaporator Top Outlet -> Compressor Left Inlet) - BLUE
    const suctionCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.2, 0.98, 0),
      new THREE.Vector3(-2.2, 1.45, 0),
      new THREE.Vector3(-2.15, 1.72, 0),
      new THREE.Vector3(-1.85, 1.85, 0),
      new THREE.Vector3(-0.65, 1.85, 0),
    ]);
    const suctionPipeGeo = new THREE.TubeGeometry(suctionCurve, 36, 0.054, 16, false);
    const suctionPipeMesh = new THREE.Mesh(suctionPipeGeo, matSuctionPipe);
    scene.add(suctionPipeMesh);

    // ====================================================
    // ANIMATED PARTICLES ALONG THE COMPLETE CLOSED LOOP
    // ====================================================
    const flowParticleCount = 80;
    const flowGeometry = new THREE.BufferGeometry();
    const flowPositions = new Float32Array(flowParticleCount * 3);
    const flowColors = new Float32Array(flowParticleCount * 3);

    // Continuous closed 360-degree loop:
    const fullLoopCurve = new THREE.CurvePath<THREE.Vector3>();
    fullLoopCurve.add(dischargeCurve);
    fullLoopCurve.add(new THREE.LineCurve3(new THREE.Vector3(2.2, 0.98, 0), new THREE.Vector3(2.2, -0.98, 0)));
    fullLoopCurve.add(liquidCurve);
    fullLoopCurve.add(new THREE.LineCurve3(new THREE.Vector3(0.35, -1.85, 0), new THREE.Vector3(-0.35, -1.85, 0)));
    fullLoopCurve.add(expansionCurve);
    fullLoopCurve.add(new THREE.LineCurve3(new THREE.Vector3(-2.2, -0.98, 0), new THREE.Vector3(-2.2, 0.98, 0)));
    fullLoopCurve.add(suctionCurve);
    fullLoopCurve.add(new THREE.LineCurve3(new THREE.Vector3(-0.65, 1.85, 0), new THREE.Vector3(0.65, 1.85, 0)));

    for (let i = 0; i < flowParticleCount; i++) {
      const u = i / flowParticleCount;
      const pt = fullLoopCurve.getPoint(u);
      flowPositions[i * 3] = pt.x;
      flowPositions[i * 3 + 1] = pt.y;
      flowPositions[i * 3 + 2] = pt.z;

      // Color coding based on loop quadrant
      if (u < 0.22) {
        // Red Hot Gas
        flowColors[i * 3] = 0.95;
        flowColors[i * 3 + 1] = 0.15;
        flowColors[i * 3 + 2] = 0.15;
      } else if (u < 0.48) {
        // Orange / Amber Liquid
        flowColors[i * 3] = 0.98;
        flowColors[i * 3 + 1] = 0.55;
        flowColors[i * 3 + 2] = 0.08;
      } else if (u < 0.74) {
        // Cyan Cold 2-Phase Flash Gas
        flowColors[i * 3] = 0.05;
        flowColors[i * 3 + 1] = 0.85;
        flowColors[i * 3 + 2] = 0.95;
      } else {
        // Deep Sky Blue Suction Vapor
        flowColors[i * 3] = 0.15;
        flowColors[i * 3 + 1] = 0.45;
        flowColors[i * 3 + 2] = 0.95;
      }
    }

    flowGeometry.setAttribute('position', new THREE.BufferAttribute(flowPositions, 3));
    flowGeometry.setAttribute('color', new THREE.BufferAttribute(flowColors, 3));

    const matFlowParticles = new THREE.PointsMaterial({
      size: 0.088,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const flowParticles = new THREE.Points(flowGeometry, matFlowParticles);
    scene.add(flowParticles);

    // ====================================================
    // 3D FLOATING TEXT LABELS & DIRECTION ARROWS
    // ====================================================
    const labelsGroup = new THREE.Group();
    scene.add(labelsGroup);

    // Title banner at top center
    const titleSprite = createTextBadge('Basic Compression Cycle', '#0f172a', '#38bdf8', 26);
    titleSprite.position.set(0.65, 2.7, 0);
    titleSprite.scale.set(1.9, 0.42, 1);
    labelsGroup.add(titleSprite);

    // Component name labels
    const labelCompressor = createTextBadge('Compressor', '#1e293b', '#f8fafc', 22);
    labelCompressor.position.set(0, 1.05, 0.7);
    labelsGroup.add(labelCompressor);

    const labelCondenser = createTextBadge('Condenser', '#1e293b', '#f8fafc', 22);
    labelCondenser.position.set(2.2, 1.25, 0.2);
    labelsGroup.add(labelCondenser);

    const labelTxv = createTextBadge('Expansion Valve', '#1e293b', '#f8fafc', 22);
    labelTxv.position.set(0, -2.4, 0.2);
    labelsGroup.add(labelTxv);

    const labelEvaporator = createTextBadge('Evaporator', '#1e293b', '#f8fafc', 22);
    labelEvaporator.position.set(-2.2, 1.25, 0.2);
    labelsGroup.add(labelEvaporator);

    // Flow Direction Arrows matching reference image
    // Top-Right: Red arrow pointing right
    const arrowTop1 = createArrowSprite('#ef4444', 'right');
    arrowTop1.position.set(1.4, 1.98, 0);
    labelsGroup.add(arrowTop1);

    // Right-Top: Red arrow pointing down into condenser
    const arrowDownCond = createArrowSprite('#ef4444', 'down');
    arrowDownCond.position.set(2.32, 1.35, 0);
    labelsGroup.add(arrowDownCond);

    // Bottom-Right: Amber arrow pointing left towards TXV
    const arrowBottom1 = createArrowSprite('#f97316', 'left');
    arrowBottom1.position.set(1.3, -1.98, 0);
    labelsGroup.add(arrowBottom1);

    // Bottom-Left: Cyan arrow pointing left towards Evaporator
    const arrowBottom2 = createArrowSprite('#00d8f6', 'left');
    arrowBottom2.position.set(-1.3, -1.98, 0);
    labelsGroup.add(arrowBottom2);

    // Left-Bottom: Cyan arrow pointing up into evaporator
    const arrowUpEvap = createArrowSprite('#00d8f6', 'up');
    arrowUpEvap.position.set(-2.32, -1.35, 0);
    labelsGroup.add(arrowUpEvap);

    // Top-Left: Blue arrow pointing right towards compressor suction
    const arrowTopLeft = createArrowSprite('#2563eb', 'right');
    arrowTopLeft.position.set(-1.4, 1.98, 0);
    labelsGroup.add(arrowTopLeft);

    // ====================================================
    // 3D MEASUREMENT POINT CALLOUT PINS (P1 to P5)
    // ====================================================
    const pinGroup = new THREE.Group();
    scene.add(pinGroup);

    const pinMeshes: { id: PhPointId; head: THREE.Mesh; halo: THREE.Mesh }[] = [];

    measurementPoints.forEach((point) => {
      const pinSubGroup = new THREE.Group();
      pinSubGroup.position.set(...point.position3D);

      // Pin Head (glowing sphere)
      const pinHeadGeo = new THREE.SphereGeometry(0.1, 16, 16);
      const matPinHead = new THREE.MeshBasicMaterial({ color: new THREE.Color(point.color) });
      const pinHead = new THREE.Mesh(pinHeadGeo, matPinHead);
      pinSubGroup.add(pinHead);

      // Outer Halo Ring
      const haloGeo = new THREE.RingGeometry(0.12, 0.17, 24);
      const matHalo = new THREE.MeshBasicMaterial({
        color: new THREE.Color(point.color),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const halo = new THREE.Mesh(haloGeo, matHalo);
      pinSubGroup.add(halo);

      // Chrome stem connecting to pipe
      const pinStemGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.22, 8);
      const pinStem = new THREE.Mesh(pinStemGeo, matChrome);
      pinStem.position.y = -0.15;
      pinSubGroup.add(pinStem);

      pinGroup.add(pinSubGroup);
      pinMeshes.push({ id: point.id, head: pinHead, halo });
    });

    // --- MOUSE & TOUCH ORBIT CONTROLS ---
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      animRef.current.isInteracting = true;

      // Raycast to check for clicks on measurement point pins
      const rect = canvas.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const intersects = raycaster.intersectObjects(pinMeshes.map((p) => p.head));

      if (intersects.length > 0) {
        const hit = pinMeshes.find((p) => p.head === intersects[0].object);
        if (hit) {
          setSelectedPointId(hit.id);
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      const anim = animRef.current;
      anim.orbitTheta -= deltaX * 0.007;
      anim.orbitPhi = Math.max(0.1, Math.min(Math.PI - 0.1, anim.orbitPhi - deltaY * 0.007));

      // Calculate camera position from spherical coords
      const r = anim.orbitRadius;
      anim.targetCameraPos.x = anim.targetCameraLookAt.x + r * Math.sin(anim.orbitPhi) * Math.sin(anim.orbitTheta);
      anim.targetCameraPos.y = anim.targetCameraLookAt.y + r * Math.cos(anim.orbitPhi);
      anim.targetCameraPos.z = anim.targetCameraLookAt.z + r * Math.sin(anim.orbitPhi) * Math.cos(anim.orbitTheta);
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const anim = animRef.current;
      anim.orbitRadius = Math.max(2.5, Math.min(14.0, anim.orbitRadius + e.deltaY * 0.005));

      const r = anim.orbitRadius;
      anim.targetCameraPos.x = anim.targetCameraLookAt.x + r * Math.sin(anim.orbitPhi) * Math.sin(anim.orbitTheta);
      anim.targetCameraPos.y = anim.targetCameraLookAt.y + r * Math.cos(anim.orbitPhi);
      anim.targetCameraPos.z = anim.targetCameraLookAt.z + r * Math.sin(anim.orbitPhi) * Math.cos(anim.orbitTheta);
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // Window Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !canvas) return;
      const width = containerRef.current.clientWidth;
      const height = Math.max(480, Math.min(760, window.innerHeight * 0.65));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // ====================================================
    // MAIN ANIMATION LOOP
    // ====================================================
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const dt = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      const anim = animRef.current;
      const effectiveSpeed = isRunning ? simSpeed : 0;

      // 1. Advance Compressor Crankshaft & Internal Kinematics
      if (isRunning && compressorRpm > 0) {
        const crankSpeedRadS = (compressorRpm / 60) * 2 * Math.PI * 0.35 * effectiveSpeed;
        anim.crankAngle = (anim.crankAngle + crankSpeedRadS * dt) % (2 * Math.PI);
      }

      const kin: ReciprocatingKinematics = computeReciprocatingKinematics(
        anim.crankAngle,
        cycleState.suctionPressureBar,
        cycleState.dischargePressureBar,
        CRANK_RADIUS,
        CONROD_LENGTH
      );

      // Rotate crankshaft counterweights
      crankGroup.rotation.z = -kin.crankAngleRad;

      // Articulate connecting rod
      conrodGroup.position.set(kin.conrodPivotX, -0.35 + kin.conrodPivotY, 0);
      conrodGroup.rotation.z = -kin.conrodAngleRad;

      // Reciprocate piston
      pistonGroup.position.set(0, -0.35 + kin.pistonDisplacementY, 0);

      // Reed valves flapper dynamic lift
      suctionValveMesh.position.y = 0.68 - kin.suctionValveLift * 0.035;
      suctionValveMesh.rotation.z = kin.suctionValveLift * 0.22;

      dischargeValveMesh.position.y = 0.7 + kin.dischargeValveLift * 0.045;
      dischargeValveMesh.rotation.z = -kin.dischargeValveLift * 0.22;

      // 2. Pulse Condenser Thermal Waves
      const wavePulse = 1.0 + Math.sin(time * 0.004) * 0.12;
      wave1.scale.set(wavePulse, wavePulse, 1);
      wave2.scale.set(wavePulse * 1.1, wavePulse * 1.1, 1);
      wave3.scale.set(wavePulse, wavePulse, 1);
      wave4.scale.set(wavePulse * 1.1, wavePulse * 1.1, 1);

      // 3. Float Cold Mist in Evaporator
      if (showAirflowVectors && isRunning) {
        const pos = coldParticleGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < coldParticleCount; i++) {
          pos[i * 3 + 2] += 0.3 * dt * effectiveSpeed;
          if (pos[i * 3 + 2] > 0.55) {
            pos[i * 3 + 2] = 0.15;
            pos[i * 3] = (Math.random() - 0.5) * 1.1;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 1.4;
          }
        }
        coldParticleGeo.attributes.position.needsUpdate = true;
      }

      // 4. Advance Refrigerant Piping Flow Particles
      if (showPipingFlow && isRunning && compressorRpm > 0) {
        anim.flowOffset = (anim.flowOffset + 0.1 * effectiveSpeed * dt) % 1.0;
        const positions = flowGeometry.attributes.position.array as Float32Array;

        for (let i = 0; i < flowParticleCount; i++) {
          const u = (i / flowParticleCount + anim.flowOffset) % 1.0;
          const pt = fullLoopCurve.getPoint(u);
          positions[i * 3] = pt.x;
          positions[i * 3 + 1] = pt.y;
          positions[i * 3 + 2] = pt.z;
        }
        flowGeometry.attributes.position.needsUpdate = true;
        flowParticles.visible = true;
      } else {
        flowParticles.visible = false;
      }

      // 5. Toggle Solid vs Cutaway Compressor Shell
      shellSolidGroup.visible = !isCutawayMode;
      shellCutawayGroup.visible = isCutawayMode;

      // 6. Pulse Selected Measurement Point Pin Halo
      pinMeshes.forEach((p) => {
        if (p.id === selectedPointId) {
          const s = 1.0 + Math.sin(time * 0.008) * 0.25;
          p.halo.scale.set(s, s, s);
        } else {
          p.halo.scale.set(1, 1, 1);
        }
      });

      // 7. Labels Visibility Toggle
      labelsGroup.visible = showPointLabels;

      // 8. Smooth Camera Damping / Interpolation
      camera.position.lerp(anim.targetCameraPos, 0.08);
      anim.currentCameraLookAt.lerp(anim.targetCameraLookAt, 0.08);
      camera.lookAt(anim.currentCameraLookAt);

      // Render
      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('wheel', handleWheel);

      renderer.dispose();
      scene.clear();
    };
  }, [
    isRunning,
    simSpeed,
    compressorRpm,
    condenserFanRpm,
    evaporatorFanRpm,
    isCutawayMode,
    showPipingFlow,
    showAirflowVectors,
    showPointLabels,
    selectedPointId,
    cycleState,
    viewMode,
    studioTheme,
  ]);

  // --- DRAW MINI 2D P-H DIAGRAM PREVIEW CANVAS ---
  useEffect(() => {
    const canvas = miniPhCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Padding
    const padL = 36;
    const padR = 15;
    const padT = 15;
    const padB = 24;

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = padL; x <= w - padR; x += 30) {
      ctx.moveTo(x, padT);
      ctx.lineTo(x, h - padB);
    }
    for (let y = padT; y <= h - padB; y += 22) {
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
    }
    ctx.stroke();

    // Saturation Dome (Approximate)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL + 10, h - padB);
    ctx.quadraticCurveTo(padL + 25, padT + 30, (w - padR + padL) / 2 - 10, padT + 12); // Critical point
    ctx.quadraticCurveTo(w - padR - 20, padT + 25, w - padR - 10, h - padB);
    ctx.stroke();

    // Scale mapping for Cycle:
    // P range: 1 bar to 22 bar (logarithmic or linear)
    // h range: 200 kJ/kg to 480 kJ/kg
    const minH = 200;
    const maxH = 480;
    const minP = 1.0;
    const maxP = 22.0;

    const mapX = (hVal: number) => padL + ((hVal - minH) / (maxH - minH)) * (w - padL - padR);
    const mapY = (pVal: number) => h - padB - ((Math.log(Math.max(1, pVal)) - Math.log(minP)) / (Math.log(maxP) - Math.log(minP))) * (h - padT - padB);

    // Coordinates of 4 state points
    const p1 = measurementPoints.find((p) => p.id === 'point1')!;
    const p2 = measurementPoints.find((p) => p.id === 'point2')!;
    const p3 = measurementPoints.find((p) => p.id === 'point3')!;
    const p4 = measurementPoints.find((p) => p.id === 'point4')!;

    const x1 = mapX(p1.enthalpyKjKg);
    const y1 = mapY(p1.pressureBar);

    const x2 = mapX(p2.enthalpyKjKg);
    const y2 = mapY(p2.pressureBar);

    const x3 = mapX(p3.enthalpyKjKg);
    const y3 = mapY(p3.pressureBar);

    const x4 = mapX(p4.enthalpyKjKg); // h4 = h3
    const y4 = mapY(p4.pressureBar);

    // Draw cycle polygon
    ctx.fillStyle = 'rgba(14, 165, 233, 0.12)';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();

    // Draw Cycle Lines with color matching
    // 1 -> 2 Compression (Red)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // 2 -> 3 Condensation (Amber / Blue)
    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();

    // 3 -> 4 Expansion (Cyan)
    ctx.strokeStyle = '#06b6d4';
    ctx.beginPath();
    ctx.moveTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.stroke();

    // 4 -> 1 Evaporation (Sky Blue)
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(x4, y4);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    // Draw State Point Dots
    const pointsData = [
      { id: 'point1', x: x1, y: y1, color: '#38bdf8', label: '1' },
      { id: 'point2', x: x2, y: y2, color: '#ef4444', label: '2' },
      { id: 'point3', x: x3, y: y3, color: '#2563eb', label: '3' },
      { id: 'point4', x: x4, y: y4, color: '#06b6d4', label: '4' },
    ];

    pointsData.forEach((pt) => {
      const isSelected = selectedPointId === pt.id;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isSelected ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(pt.label, pt.x + 6, pt.y - 4);
    });

    // Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px sans-serif';
    ctx.fillText('log P', 6, padT + 8);
    ctx.fillText('h (kJ/kg)', w - padR - 35, h - 6);
  }, [measurementPoints, selectedPointId]);

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                3D Mechanical & Thermodynamic Twin
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                P-H Point Measurement Simulator
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1.5 flex items-center gap-2">
              🧊 Animasi 3D Piping Siklus Refrigerasi & Kompresor Reciprocating
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
              Simulasi interaktif aliran freon dalam 5 komponen utama (1. Kompresor, 2. Kondenser, 3. Filter Drier, 4. TXV, 5. Evaporator). Gerakan piston & katup reed kompresor bergerak presisi sesuai kinematika slider-crank dan dinamika kecepatan fan.
            </p>
          </div>

          {/* Quick Action Navigation to P-H Calculator */}
          {onNavigateToPhCalc && (
            <button
              onClick={onNavigateToPhCalc}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-sky-600/25 transition cursor-pointer self-start lg:self-center"
            >
              <span>Buka Diagram P-h Lengkap</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Alert Banner if fan speeds are abnormal */}
        {cycleState.statusAlert && (
          <div
            className={`mt-4 p-3.5 rounded-xl border flex items-start gap-3 transition ${
              cycleState.statusAlert.level === 'critical'
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
            }`}
          >
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <p className="font-bold">{cycleState.statusAlert.message}</p>
              <p className="opacity-90 mt-0.5">{cycleState.statusAlert.advice}</p>
            </div>
          </div>
        )}

        {/* VIEW MODE SWITCHER TABS: SCHEMATIC (REFERENCE) vs 3D THREE.JS */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-700/80 shadow-inner">
            <button
              onClick={() => setViewMode('schematic')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'schematic'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🎨 Diagram Skematik Edukasi (Detail Sesuai Gambar Referensi)</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-400/20 text-emerald-300 uppercase font-black">
                Rekomendasi
              </span>
            </button>
            <button
              onClick={() => setViewMode('threejs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'threejs'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-950/40 ring-1 ring-sky-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🧊 Viewport 3D Three.js Orbit</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Simulasi aliran freon &amp; putaran kompresor aktif</span>
          </div>
        </div>
      </div>

      {/* VIEW 1: DETAILED EDUCATIONAL PIPING SCHEMATIC (MODELED AFTER USER REFERENCE IMAGE) */}
      {viewMode === 'schematic' && (
        <EducationalPipingSchematic
          cycleState={cycleState}
          measurementPoints={measurementPoints}
          isRunning={isRunning}
          onToggleRun={() => setIsRunning(!isRunning)}
          simSpeed={simSpeed}
          onChangeSimSpeed={setSimSpeed}
          condenserFanRpm={condenserFanRpm}
          onChangeCondenserFanRpm={setCondenserFanRpm}
          evaporatorFanRpm={evaporatorFanRpm}
          onChangeEvaporatorFanRpm={setEvaporatorFanRpm}
          compressorRpm={compressorRpm}
          onChangeCompressorRpm={setCompressorRpm}
          selectedPointId={selectedPointId}
          onSelectPoint={(id) => {
            setSelectedPointId(id);
            if (id === 'point1') setCameraToPreset('compressor');
            if (id === 'point2') setCameraToPreset('condenser');
            if (id === 'point3') setCameraToPreset('txv_filter');
            if (id === 'point4') setCameraToPreset('evaporator');
          }}
          language={language}
        />
      )}

      {/* VIEW 2: 3D THREE.JS VIEWPORT & ORBIT CONTROLS */}
      {viewMode === 'threejs' && (
        <>
          {/* 3D VIEWPORT CONTAINER */}
          <div
            ref={containerRef}
            className={`relative border rounded-3xl overflow-hidden select-none transition-colors duration-300 ${
              studioTheme === 'light'
                ? 'bg-slate-200/90 border-slate-300 shadow-2xl shadow-slate-300/50'
                : 'bg-slate-950 border-slate-800 shadow-2xl'
            }`}
            style={{ minHeight: '520px' }}
          >
        {/* Three.js Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-grab active:cursor-grabbing touch-none"
          style={{ minHeight: '520px', height: '62vh' }}
        />

        {/* TOP OVERLAY: MASTER RUN BUTTON, SPEED, X-RAY, & STUDIO THEME */}
        <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
          {/* RUN / PAUSE BUTTON */}
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xl transition cursor-pointer ${
              isRunning
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>RUNNING (PAUSE)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-200 animate-ping ml-0.5" />
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>MULAI RUN</span>
              </>
            )}
          </button>

          {/* SIMULATION SPEED */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-2.5 py-1.5 flex items-center gap-1 shadow-lg">
            <span className="text-[10px] font-semibold text-slate-400 mr-1 uppercase">Speed:</span>
            {[0.25, 0.5, 1.0, 2.0].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimSpeed(spd)}
                className={`px-2 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                  simSpeed === spd
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* CUTAWAY / X-RAY TOGGLE */}
          <button
            onClick={() => setIsCutawayMode(!isCutawayMode)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border backdrop-blur-md transition shadow-md cursor-pointer ${
              isCutawayMode
                ? 'bg-sky-500/20 border-sky-400/60 text-sky-300'
                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
            title="Lihat Piston & Bagian Dalam Kompresor"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isCutawayMode ? 'Mode X-Ray Kompresor ON' : 'Bodi Kompresor Solid'}</span>
          </button>

          {/* STUDIO THEME TOGGLE (Studio Light sesuai Gambar Referensi vs Studio Dark) */}
          <button
            onClick={() => setStudioTheme(studioTheme === 'light' ? 'dark' : 'light')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border backdrop-blur-md transition shadow-md cursor-pointer ${
              studioTheme === 'light'
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
            title="Ganti Tema Tampilan Studio 3D"
          >
            {studioTheme === 'light' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Studio Light (Ref)</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-sky-400" />
                <span>Studio Dark</span>
              </>
            )}
          </button>
        </div>

        {/* TOP RIGHT: CAMERA VIEW PRESET BUTTONS */}
        <div className="absolute top-4 right-4 z-20 hidden sm:flex flex-col gap-1.5 items-end">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1.5 flex flex-wrap gap-1 shadow-xl">
            {[
              { id: 'overview' as CameraPreset, label: '📷 1:1 Referensi' },
              { id: 'top_down' as CameraPreset, label: '📐 3D Isometric' },
              { id: 'compressor' as CameraPreset, label: '⚙️ Kompresor' },
              { id: 'condenser' as CameraPreset, label: '🌀 Kondenser' },
              { id: 'txv_filter' as CameraPreset, label: '🔍 TXV' },
              { id: 'evaporator' as CameraPreset, label: '❄️ Evaporator' },
            ].map((cam) => (
              <button
                key={cam.id}
                onClick={() => setCameraToPreset(cam.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  cameraPreset === cam.id
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {cam.label}
              </button>
            ))}
          </div>
        </div>

        {/* BOTTOM LEFT: FLOATING MINI P-H DIAGRAM CARD */}
        {showPDiagramCard && (
          <div className="absolute bottom-4 left-4 z-20 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-2xl max-w-[270px]">
            <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-sky-400" />
                Live Mini Diagram P-h
              </span>
              <button
                onClick={() => setShowPDiagramCard(false)}
                className="text-[10px] text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <canvas
              ref={miniPhCanvasRef}
              width={240}
              height={140}
              className="rounded-lg border border-slate-800 block mx-auto"
            />

            {/* Quick Measurement Values on Diagram */}
            <div className="grid grid-cols-2 gap-1.5 mt-2 text-[10px]">
              <div className="bg-slate-800/60 p-1.5 rounded">
                <span className="text-slate-400 block">P1 (Suction):</span>
                <span className="font-mono font-bold text-sky-400">
                  {cycleState.suctionPressureBar} bar / {cycleState.suctionTempC}°C
                </span>
              </div>
              <div className="bg-slate-800/60 p-1.5 rounded">
                <span className="text-slate-400 block">P2 (Discharge):</span>
                <span className="font-mono font-bold text-rose-400">
                  {cycleState.dischargePressureBar} bar / {cycleState.dischargeTempC}°C
                </span>
              </div>
              <div className="bg-slate-800/60 p-1.5 rounded">
                <span className="text-slate-400 block">P3 (Liquid T3):</span>
                <span className="font-mono font-bold text-blue-400">
                  {cycleState.liquidTempC}°C (SC: {cycleState.subcoolingK}K)
                </span>
              </div>
              <div className="bg-slate-800/60 p-1.5 rounded">
                <span className="text-slate-400 block">COP / EER:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {cycleState.cop} / {cycleState.eer}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM RIGHT: ACTIVE MEASUREMENT POINT INSPECTOR CARD */}
        {activePoint && (
          <div className="absolute bottom-4 right-4 z-20 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl max-w-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full ring-2 ring-white/30"
                  style={{ backgroundColor: activePoint.color }}
                />
                <span className="text-xs font-extrabold uppercase tracking-wide text-white">
                  {activePoint.tag}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                {activePoint.location}
              </span>
            </div>

            <h4 className="text-sm font-bold text-white mt-1">{activePoint.name}</h4>

            {/* Thermodynamic Readings at this Point */}
            <div className="grid grid-cols-3 gap-2 mt-2.5 py-2 px-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-center font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block">Tekanan P</span>
                <span className="text-xs font-bold text-white">{activePoint.pressureBar} bar</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Suhu T</span>
                <span className="text-xs font-bold text-white">{activePoint.temperatureC} °C</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Entalpi h</span>
                <span className="text-xs font-bold text-sky-400">
                  {Math.round(activePoint.enthalpyKjKg)} kJ/kg
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
              {activePoint.importance}
            </p>

            {/* Quick point switcher */}
            <div className="flex items-center justify-between gap-1 mt-3 pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold">Pilih Titik Ukur:</span>
              <div className="flex items-center gap-1">
                {measurementPoints.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPointId(p.id);
                      if (p.id === 'point1') setCameraToPreset('compressor');
                      if (p.id === 'point2') setCameraToPreset('condenser');
                      if (p.id === 'point3') setCameraToPreset('txv_filter');
                      if (p.id === 'point4') setCameraToPreset('evaporator');
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                      selectedPointId === p.id
                        ? 'bg-sky-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {p.id.replace('point', 'P')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* INTERACTIVE CONTROLS CONSOLE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* PANEL 1: CONDENSER & FAN SPEED SIMULATION */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">2. Kondenser & Fan Speed</h3>
                <p className="text-[11px] text-slate-400">Simulasi Pembuangan Kalor Gas Panas</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30">
              {condenserFanRpm} RPM
            </span>
          </div>

          {/* RPM Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
              <span>Kecepatan Fan Kondenser:</span>
              <span className="font-mono">{condenserFanRpm} RPM</span>
            </div>
            <input
              type="range"
              min="0"
              max="1500"
              step="50"
              value={condenserFanRpm}
              onChange={(e) => setCondenserFanRpm(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>0 (Mati)</span>
              <span>600 (Low)</span>
              <span>1100 (Nominal)</span>
              <span>1500 (Max)</span>
            </div>
          </div>

          {/* Quick RPM Presets */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: 'Mati', rpm: 0 },
              { label: 'Rendah', rpm: 600 },
              { label: 'Normal', rpm: 1100 },
              { label: 'Maks', rpm: 1500 },
            ].map((p) => (
              <button
                key={p.rpm}
                onClick={() => setCondenserFanRpm(p.rpm)}
                className={`py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  condenserFanRpm === p.rpm
                    ? 'bg-orange-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Thermodynamic Impact Card */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Tekanan Discharge (HP):</span>
              <span className="font-mono font-bold text-rose-400">{cycleState.dischargePressureBar} bar</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Temperatur Kondensasi (Tc):</span>
              <span className="font-mono font-bold text-orange-300">{cycleState.condTempC} °C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Subcooling (Point 3):</span>
              <span className="font-mono font-bold text-blue-400">{cycleState.subcoolingK} K</span>
            </div>
          </div>
        </div>

        {/* PANEL 2: RECIPROCATING COMPRESSOR CONTROLS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">1. Kompresor Reciprocating</h3>
                <p className="text-[11px] text-slate-400">Mekanisme Slider-Crank & Piston</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
              {isRunning ? compressorRpm : 0} RPM
            </span>
          </div>

          {/* Compressor RPM Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
              <span>Kecepatan Putaran Motor (RPM):</span>
              <span className="font-mono">{compressorRpm} RPM</span>
            </div>
            <input
              type="range"
              min="0"
              max="1800"
              step="50"
              value={compressorRpm}
              onChange={(e) => setCompressorRpm(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>0</span>
              <span>750</span>
              <span>1450 (4-Pole)</span>
              <span>1800</span>
            </div>
          </div>

          {/* Quick Compressor Presets */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: 'Stop', rpm: 0 },
              { label: '1450 RPM (50Hz)', rpm: 1450 },
              { label: '1750 RPM (60Hz)', rpm: 1750 },
            ].map((p) => (
              <button
                key={p.rpm}
                onClick={() => setCompressorRpm(p.rpm)}
                className={`py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  compressorRpm === p.rpm
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Internal Reciprocating Status Card */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Laju Aliran Massa Freon (mdot):</span>
              <span className="font-mono font-bold text-sky-400">{cycleState.massFlowKgS} kg/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Konversi Volumetrik Liquid:</span>
              <span className="font-mono font-bold text-emerald-400">{cycleState.massFlowLpm} LPM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Efisiensi Siklus COP / EER:</span>
              <span className="font-mono font-bold text-cyan-300">
                {cycleState.cop} / {cycleState.eer} Btu/Wh
              </span>
            </div>
          </div>
        </div>

        {/* PANEL 3: EVAPORATOR & FAN SPEED SIMULATION */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <Snowflake className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">5. Evaporator & Fan Speed</h3>
                <p className="text-[11px] text-slate-400">Simulasi Penyerapan Kalor Ruangan</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              {evaporatorFanRpm} RPM
            </span>
          </div>

          {/* Evaporator RPM Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
              <span>Kecepatan Fan Evaporator:</span>
              <span className="font-mono">{evaporatorFanRpm} RPM</span>
            </div>
            <input
              type="range"
              min="0"
              max="1400"
              step="50"
              value={evaporatorFanRpm}
              onChange={(e) => setEvaporatorFanRpm(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>0 (Mati)</span>
              <span>500 (Low)</span>
              <span>1000 (Nominal)</span>
              <span>1400 (Max)</span>
            </div>
          </div>

          {/* Quick RPM Presets */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: 'Mati', rpm: 0 },
              { label: 'Rendah', rpm: 500 },
              { label: 'Normal', rpm: 1000 },
              { label: 'Maks', rpm: 1400 },
            ].map((p) => (
              <button
                key={p.rpm}
                onClick={() => setEvaporatorFanRpm(p.rpm)}
                className={`py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  evaporatorFanRpm === p.rpm
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Thermodynamic Impact Card */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Tekanan Suction (LP):</span>
              <span className="font-mono font-bold text-sky-400">{cycleState.suctionPressureBar} bar</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Temperatur Evaporasi (Te):</span>
              <span className="font-mono font-bold text-cyan-300">{cycleState.evapTempC} °C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Superheat (Point 1):</span>
              <span className="font-mono font-bold text-emerald-400">{cycleState.superheatK} K</span>
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {/* EXPLANATORY TABLE: 5 POINT PENGUKURAN SIKLUS P-H */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-400" />
          Tabel Titik Pengukuran Fisik dan Kaitannya dengan Diagram P-h
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Titik Ukur</th>
                <th className="py-2.5 px-3">Komponen & Posisi Pipa</th>
                <th className="py-2.5 px-3">Instrumen Pengukur</th>
                <th className="py-2.5 px-3">Tekanan</th>
                <th className="py-2.5 px-3">Suhu</th>
                <th className="py-2.5 px-3">Fase Freon</th>
                <th className="py-2.5 px-3">Arti Penting pada Diagram P-h</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {measurementPoints.map((pt) => (
                <tr
                  key={pt.id}
                  onClick={() => {
                    setSelectedPointId(pt.id);
                    if (pt.id === 'point1') setCameraToPreset('compressor');
                    if (pt.id === 'point2') setCameraToPreset('condenser');
                    if (pt.id === 'point3') setCameraToPreset('txv_filter');
                    if (pt.id === 'point4') setCameraToPreset('evaporator');
                  }}
                  className={`hover:bg-slate-800/50 cursor-pointer transition ${
                    selectedPointId === pt.id ? 'bg-sky-950/40 font-semibold text-white' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono font-bold flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: pt.color }}
                    />
                    {pt.tag}
                  </td>
                  <td className="py-2.5 px-3">{pt.name}</td>
                  <td className="py-2.5 px-3 text-slate-400">{pt.location}</td>
                  <td className="py-2.5 px-3 font-mono">{pt.pressureBar} bar</td>
                  <td className="py-2.5 px-3 font-mono">{pt.temperatureC} °C</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      {pt.phase}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{pt.importance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
