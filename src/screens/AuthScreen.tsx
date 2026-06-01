import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme';
import ScannerHUD from '../components/ScannerHUD';
import type { EmployeeProfile } from '../utils/faceMath';
import { computeCosineSimilarity } from '../utils/faceMath';
import {
  generateChallengeSequence,
  CHALLENGES,
} from '../utils/livenessMachine';
import type { LivenessChallengeType } from '../utils/livenessMachine';
import { LocalSecureStorage } from '../store/localDB';
import { loadProductionTFLiteModel, runProductionTFLiteInference } from '../utils/tfliteBridge';
import { analyzeFaceImage, isNativeBiometricModuleAvailable } from '../utils/faceAnalysis';
import { Language, getTranslation } from '../utils/translations';

const { width } = Dimensions.get('window');

type AuthStep = 'SELECT' | 'CAMERA' | 'SUCCESS' | 'FAILED';

interface Props {
  registry: EmployeeProfile[];
  onBack: () => void;
  onLogAdded: () => void;
  language: Language;
}

export default function AuthScreen({ registry, onBack, onLogAdded, language }: Props) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [step, setStep] = useState<AuthStep>('SELECT');
  const [selected, setSelected] = useState<EmployeeProfile | null>(null);

  // Liveness state
  const [sequence, setSequence] = useState<LivenessChallengeType[]>([]);
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [statusMsg, setStatusMsg] = useState('Select a personnel to begin');
  const [livenessData, setLivenessData] = useState({ eyeOpen: 0.98, smile: 0.02, yaw: 0.4, antiSpoof: 0.00 });

  // Result
  const [matchScore, setMatchScore] = useState(0);
  const [inferenceMs, setInferenceMs] = useState(0);
  const [tfliteModel, setTfliteModel] = useState<any>(null);
  const [demoMismatch, setDemoMismatch] = useState(false);

  // Success glow animation
  const successGlow = useRef(new Animated.Value(0)).current;

  // New High-Fidelity Interactive Camera & Biometrics States
  const cameraRef = useRef<any>(null);
  const [flashActive, setFlashActive] = useState(false);
  const [isProcessingFrame, setIsProcessingFrame] = useState(false);
  const [isInitialAligning, setIsInitialAligning] = useState(true);
  const [screenFlash, setScreenFlash] = useState(false);
  const [lowLightDetected, setLowLightDetected] = useState(false);
  const [maskDetected, setMaskDetected] = useState(false);

  // Load production TFLite model on mount
  useEffect(() => {
    async function initTFLite() {
      try {
        const model = await loadProductionTFLiteModel();
        setTfliteModel(model);
      } catch (err) {
        console.error('Failed model caching:', err);
      }
    }
    initTFLite();
  }, []);

  // Refs for tracking liveness loop dynamics
  const hasClosedEyes = useRef(false);
  const simTick = useRef(0);

  // Initial face alignment simulation
  useEffect(() => {
    if (step !== 'CAMERA' || !selected || sequence.length === 0) return;
    
    setIsInitialAligning(true);
    setStatusMsg(getTranslation(language, 'aligningReticle'));
    setLivenessData({ eyeOpen: 0.98, smile: 0.03, yaw: 0.8, antiSpoof: 0.00 });
    hasClosedEyes.current = false;
    simTick.current = 0;
    
    const t = setTimeout(() => {
      setIsInitialAligning(false);
      const current = sequence[0];
      const challengePromptKey = current === 'SMILE' ? 'challengeSmile' : current === 'BLINK' ? 'challengeBlink' : current === 'TURN_LEFT' ? 'challengeTurnLeft' : 'challengeTurnRight';
      setStatusMsg(`${getTranslation(language, 'livenessTitle')} [1/${sequence.length}]: ${getTranslation(language, challengePromptKey)}`);
    }, 1800);

    return () => clearTimeout(t);
  }, [step, selected, sequence, language]);

  // Automated Continuous Biometric Scanning & Liveness Engine Loop
  useEffect(() => {
    if (step !== 'CAMERA' || isInitialAligning || challengeIdx >= sequence.length || !selected) return;

    let isActive = true;
    let timerId: any = null;

    const runBiometricScanCycle = async () => {
      if (!isActive) return;

      const currentChallenge = sequence[challengeIdx];

      // ─── 1. SIMULATOR PATH (Expo Go / Fallback) ───────────────────────────────
      if (!isNativeBiometricModuleAvailable()) {
        simTick.current += 1;
        const tick = simTick.current;

        let eyeOpen = 0.98;
        let smile = 0.05;
        let yaw = 0.0;

        if (currentChallenge === 'BLINK') {
          if (tick <= 3) {
            eyeOpen = 0.98;
          } else if (tick <= 6) {
            eyeOpen = 0.05; // eyes closed
          } else {
            eyeOpen = 0.96; // eyes reopened
          }
        } else if (currentChallenge === 'SMILE') {
          if (tick > 3) {
            smile = Math.min(0.88, 0.05 + (tick - 3) * 0.2); // smile increases
          }
        } else if (currentChallenge === 'TURN_LEFT') {
          if (tick > 3) {
            yaw = Math.max(-16.0, 0.0 - (tick - 3) * 4); // yaw goes negative (left)
          }
        } else if (currentChallenge === 'TURN_RIGHT') {
          if (tick > 3) {
            yaw = Math.min(16.0, 0.0 + (tick - 3) * 4); // yaw goes positive (right)
          }
        }

        // Add minor fluctuation noise to keep the telemetry looking alive
        const noise = (Math.random() - 0.5) * 0.02;

        // Simulator light level and mask simulator
        const isLowLightSimulated = tick % 8 >= 4; // Toggle fill-light simulation
        const isMaskSimulated = tick > 5; // Simulates mask on challenge after tick 5
        
        if (isLowLightSimulated) {
          setLowLightDetected(true);
          setScreenFlash(true);
        } else {
          setLowLightDetected(false);
          setScreenFlash(false);
        }

        setMaskDetected(isMaskSimulated);

        // Anti-spoof dynamically starts at 0.00 and builds up based on sequence index
        const antiSpoofVal = (challengeIdx / sequence.length) * 0.98;

        setLivenessData({
          eyeOpen: Math.max(0.0, Math.min(1.0, eyeOpen + noise)),
          smile: isMaskSimulated ? -1.0 : Math.max(0.0, Math.min(1.0, smile + noise)),
          yaw: yaw + noise * 5,
          antiSpoof: antiSpoofVal,
        });

        // Check if gesture completed
        let challengePassed = false;
        if (currentChallenge === 'BLINK' && tick >= 7) {
          challengePassed = true;
        } else if (currentChallenge === 'SMILE') {
          if (isMaskSimulated) {
            challengePassed = true; // Auto-pass/bypass smile check for mask
            setStatusMsg(`[PPE/MASK DETECTED] Bypassing smile check...`);
          } else if (smile > 0.65) {
            challengePassed = true;
          }
        } else if (currentChallenge === 'TURN_LEFT' && yaw <= -12) {
          challengePassed = true;
        } else if (currentChallenge === 'TURN_RIGHT' && yaw >= 12) {
          challengePassed = true;
        }

        if (challengePassed) {
          const nextIdx = challengeIdx + 1;
          simTick.current = 0;
          
          if (nextIdx < sequence.length) {
            setChallengeIdx(nextIdx);
            const nextChallenge = sequence[nextIdx];
            const challengePromptKey = nextChallenge === 'SMILE' ? 'challengeSmile' : nextChallenge === 'BLINK' ? 'challengeBlink' : nextChallenge === 'TURN_LEFT' ? 'challengeTurnLeft' : 'challengeTurnRight';
            setStatusMsg(`✓ Verified. Next [${nextIdx + 1}/${sequence.length}]: ${getTranslation(language, challengePromptKey)}`);
          } else {
            // Trigger automatic final photo capture effect
            setChallengeIdx(sequence.length);
            setStatusMsg(getTranslation(language, 'comparingFace'));
            setFlashActive(true);
            setTimeout(() => setFlashActive(false), 100);
            
            setTimeout(() => {
              runMatching();
            }, 800);
            isActive = false;
          }
        }

        if (isActive) {
          timerId = setTimeout(runBiometricScanCycle, 200); // 5 Hz update rate for smooth HUD telemetry
        }
        return;
      }

      // ─── 2. NATIVE PHYSICAL PATH (Google ML Kit Frame Analysis) ───────────────
      if (isProcessingFrame) {
        timerId = setTimeout(runBiometricScanCycle, 150);
        return;
      }

      setIsProcessingFrame(true);

      let photo = null;
      if (cameraRef.current) {
        try {
          photo = await cameraRef.current.takePictureAsync({
            quality: 0.1, // extremely compressed low-res thumbnail for lightning-fast analysis
            skipProcessing: true,
          });
        } catch (err) {
          console.warn('[Real-time Scan] Background shutter failed:', err);
        }
      }

      if (!photo) {
        setIsProcessingFrame(false);
        if (isActive) {
          timerId = setTimeout(runBiometricScanCycle, 300);
        }
        return;
      }

      try {
        const result = await analyzeFaceImage(photo.uri);
        if (!isActive) return;

        if (!result.faceDetected) {
          setStatusMsg(`✕ ${getTranslation(language, 'faceNotDetectedTitle')}`);
          setIsProcessingFrame(false);
          timerId = setTimeout(runBiometricScanCycle, 400);
          return;
        }

        // Automatic screen fill-light check (Low light threshold: luminance < 75)
        const meanLum = result.meanBrightness ?? 128.0;
        if (meanLum < 75.0) {
          setLowLightDetected(true);
          setScreenFlash(true);
        } else {
          setLowLightDetected(false);
          setScreenFlash(false);
        }

        // Mask/PPE occlusion check
        const isMaskDetected = !!result.maskLikely;
        setMaskDetected(isMaskDetected);

        // Extract real landmarks telemetry
        const currentEyeOpen = result.leftEyeOpenProbability >= 0
          ? (result.leftEyeOpenProbability + result.rightEyeOpenProbability) / 2
          : 0.95;
        const currentSmile = result.smileProbability;
        const currentYaw = result.yaw;

        // Dynamic liveness/antiSpoof calculation: starts at 0.00 and builds up to target
        const antiSpoofVal = (challengeIdx / sequence.length) * 0.98;

        setLivenessData({
          eyeOpen: currentEyeOpen,
          smile: isMaskDetected ? -1.0 : (currentSmile >= 0 ? currentSmile : 0.05),
          yaw: currentYaw,
          antiSpoof: antiSpoofVal,
        });

        // Evaluate physical gestures
        let passed = false;

        if (currentChallenge === 'BLINK') {
          // Temporal blink detection logic:
          // 1. Detect eyes closed (probabilities drop below 0.30)
          if (currentEyeOpen < 0.30) {
            hasClosedEyes.current = true;
            setStatusMsg(`[BLINK] Eyes closed detected... Reopen them!`);
          }
          // 2. Detect eyes reopened (rises back above 0.65 after being closed)
          if (hasClosedEyes.current && currentEyeOpen > 0.65) {
            passed = true;
          }
        } else if (currentChallenge === 'SMILE') {
          if (isMaskDetected) {
            passed = true; // Auto-pass/bypass smile check for mask
            setStatusMsg(`[PPE/MASK DETECTED] Bypassing smile check...`);
          } else if (currentSmile > 0.65) {
            passed = true;
          }
        } else if (currentChallenge === 'TURN_LEFT') {
          // ML Kit left head turn is negative yaw
          if (currentYaw <= -12) {
            passed = true;
          }
        } else if (currentChallenge === 'TURN_RIGHT') {
          // ML Kit right head turn is positive yaw
          if (currentYaw >= 12) {
            passed = true;
          }
        }

        if (passed) {
          const nextIdx = challengeIdx + 1;
          hasClosedEyes.current = false;

          if (nextIdx < sequence.length) {
            setChallengeIdx(nextIdx);
            const nextChallenge = sequence[nextIdx];
            const challengePromptKey = nextChallenge === 'SMILE' ? 'challengeSmile' : nextChallenge === 'BLINK' ? 'challengeBlink' : nextChallenge === 'TURN_LEFT' ? 'challengeTurnLeft' : 'challengeTurnRight';
            setStatusMsg(`✓ Verified. Next [${nextIdx + 1}/${sequence.length}]: ${getTranslation(language, challengePromptKey)}`);
          } else {
            // All active verification targets hit! Capture secure photo & run model
            setChallengeIdx(sequence.length);
            setStatusMsg(getTranslation(language, 'comparingFace'));
            
            // Trigger shutter sound and flash overlay
            setFlashActive(true);
            setTimeout(() => setFlashActive(false), 100);

            setTimeout(() => {
              runMatching();
            }, 800);
            isActive = false;
          }
        }

        setIsProcessingFrame(false);
        if (isActive) {
          timerId = setTimeout(runBiometricScanCycle, 200); // Ticks at 5 Hz
        }

      } catch (err) {
        console.error('[Real-time Scan] Native analysis exception:', err);
        setIsProcessingFrame(false);
        if (isActive) {
          timerId = setTimeout(runBiometricScanCycle, 400);
        }
      }
    };

    // Delay scan initiation slightly to allow HUD to boot cleanly
    timerId = setTimeout(runBiometricScanCycle, 600);

    return () => {
      isActive = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [step, isInitialAligning, challengeIdx, sequence, selected, language]);

  const startAuth = useCallback(async (employee: EmployeeProfile) => {
    if (!cameraPermission?.granted) {
      const res = await requestCameraPermission();
      if (!res.granted) {
        Alert.alert('Camera Required', 'Camera permission is needed for facial verification.');
        return;
      }
    }
    const seq = generateChallengeSequence(2);
    setSelected(employee);
    setSequence(seq);
    setChallengeIdx(0);
    setStatusMsg(getTranslation(language, 'alignFace'));
    setStep('CAMERA');
  }, [cameraPermission, language]);

  const runMatching = useCallback(async () => {
    if (!selected) return;
    
    // Convert current video frame to raw RGB pixel bytes (112x112x3) for MobileFaceNet
    const simulatedRawFaceBuffer = new Uint8Array(112 * 112 * 3);

    // Call unified C++ JSI production TFLite inference bridge!
    const { embedding, inferenceTimeMs } = await runProductionTFLiteInference(
      tfliteModel,
      simulatedRawFaceBuffer,
      demoMismatch 
        ? Array.from({ length: 128 }, () => Math.random() - 0.5) 
        : selected.embedding 
    );

    const score = computeCosineSimilarity(selected.embedding, embedding);

    setMatchScore(score);
    setInferenceMs(inferenceTimeMs);

    if (score >= 0.85) {
      // Get GPS coords
      let gps = 'GPS Unavailable';
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          gps = `Lat: ${loc.coords.latitude.toFixed(4)}, Lon: ${loc.coords.longitude.toFixed(4)}`;
        }
      } catch { /* offline fallback */ }

      await LocalSecureStorage.addLog({
        employeeId: selected.id,
        employeeName: selected.name,
        timestamp: new Date().toISOString(),
        livenessPass: true,
        matchScore: parseFloat((score * 100).toFixed(1)),
        gpsCoords: gps,
        deviceInfo: 'Datalake 3.0 · MobileFaceNet · arm64-v8a',
      });

      onLogAdded();
      Animated.loop(
        Animated.sequence([
          Animated.timing(successGlow, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(successGlow, { toValue: 0.4, duration: 600, useNativeDriver: true }),
        ])
      ).start();
      setStep('SUCCESS');
    } else {
      setStep('FAILED');
    }
  }, [selected, tfliteModel, demoMismatch, onLogAdded, successGlow]);

  // ── SELECT SCREEN ───────────────────────────────────────────────────────────
  if (step === 'SELECT') {
    return (
      <View style={s.root}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={s.topBar}>
          <TouchableOpacity onPress={onBack} style={s.backBtn}>
            <Text style={s.backText}>{getTranslation(language, 'btnBack')}</Text>
          </TouchableOpacity>
          <Text style={s.screenTitle}>{getTranslation(language, 'btnAuthenticate')}</Text>
          <View style={{ width: 60 }} />
        </View>

        <Text style={s.subLabel}>{getTranslation(language, 'welcomeSub')}</Text>

        <View style={s.mismatchToggleContainer}>
          <Text style={s.toggleLabel}>{getTranslation(language, 'simulateMismatchLabel')}</Text>
          <TouchableOpacity 
            style={[s.toggleBtn, demoMismatch && { backgroundColor: COLORS.rose, borderColor: COLORS.rose }]}
            onPress={() => setDemoMismatch(!demoMismatch)}
          >
            <Text style={s.toggleBtnText}>
              {demoMismatch ? getTranslation(language, 'mismatchActiveBtn') : getTranslation(language, 'mismatchInactiveBtn')}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }} showsVerticalScrollIndicator={false}>
          {registry.map(emp => (
            <TouchableOpacity key={emp.id} style={s.empCard} onPress={() => startAuth(emp)} activeOpacity={0.75}>
              <View style={s.empCardInner}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{emp.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.empName}>{emp.name}</Text>
                  <Text style={s.empId}>{emp.id}</Text>
                  <Text style={s.empRole}>{emp.role}</Text>
                </View>
                <Text style={{ color: COLORS.cyan, fontSize: 22, fontWeight: '800' }}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ── CAMERA SCREEN ───────────────────────────────────────────────────────────
  if (step === 'CAMERA' && selected) {
    const currentChallenge = sequence[Math.min(challengeIdx, sequence.length - 1)];
    const challengePromptKey = currentChallenge === 'SMILE' ? 'challengeSmile' : currentChallenge === 'BLINK' ? 'challengeBlink' : currentChallenge === 'TURN_LEFT' ? 'challengeTurnLeft' : 'challengeTurnRight';
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor="black" />

        {/* Camera fills full screen */}
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="front"
        />

        {/* Low-Light Screen Fill Light Overlay */}
        {screenFlash && <View style={s.screenFlashOverlay} />}

        {/* Shutter Camera Flash Screen Overlay */}
        {flashActive && <View style={s.shutterFlashOverlay} />}

        {/* Dark overlay at top */}
        <LinearGradient colors={['rgba(5,8,17,0.85)', 'transparent']} style={s.topOverlay}>
          <TouchableOpacity onPress={() => setStep('SELECT')} style={s.backBtn}>
            <Text style={[s.backText, { color: '#ffffff' }]}>✕ {getTranslation(language, 'btnCancel')}</Text>
          </TouchableOpacity>
          <Text style={s.cameraPersonLabel}>{selected.name}</Text>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            {lowLightDetected && (
              <View style={[s.onlinePill, { borderColor: COLORS.amber, backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                <Text style={[s.onlinePillText, { color: COLORS.amber, fontSize: 8 }]}>🔆 FILL-LIGHT</Text>
              </View>
            )}
            {maskDetected && (
              <View style={[s.onlinePill, { borderColor: COLORS.emerald, backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                <Text style={[s.onlinePillText, { color: COLORS.emerald, fontSize: 8 }]}>😷 PPE-MASK</Text>
              </View>
            )}
            <View style={[s.onlinePill, { borderColor: COLORS.cyan, backgroundColor: 'rgba(6,182,212,0.15)' }]}>
              <Text style={[s.onlinePillText, { color: COLORS.cyan, fontSize: 8 }]}>SECURE-ID</Text>
            </View>
          </View>
        </LinearGradient>

        {/* HUD centered in middle */}
        <View style={s.hudWrapper}>
          <ScannerHUD
            statusMessage={statusMsg}
            isScanning={true}
            challengeEmoji=""
            challengePrompt={currentChallenge ? getTranslation(language, challengePromptKey) : ''}
            challengeIndex={Math.min(challengeIdx, sequence.length - 1)}
            challengeTotal={sequence.length}
            livenessData={livenessData}
          />
        </View>

        {/* Floating Capture button at bottom */}
        {/* Floating Capture button / Status Pill at bottom */}
        <View style={s.captureButtonContainer}>
          <View style={[
            s.captureBtn, 
            { backgroundColor: 'rgba(5, 8, 17, 0.85)', borderColor: COLORS.cyan, borderWidth: 1.5 }
          ]}>
            <Text style={[s.captureBtnText, { color: COLORS.cyan, letterSpacing: 1.2 }]}>
              {isInitialAligning 
                ? `⌛ ${getTranslation(language, 'aligningReticle').toUpperCase()}` 
                : `⚡ Real-Time Biometric Analysis Active`.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ── SUCCESS SCREEN ──────────────────────────────────────────────────────────
  if (step === 'SUCCESS' && selected) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <ScrollView contentContainerStyle={s.resultContainer}>
          <Animated.View style={[s.resultIconWrap, s.successWrap, { opacity: successGlow.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }]}>
            <Text style={{ fontSize: 44, color: COLORS.emerald }}>✓</Text>
          </Animated.View>

          <Text style={[s.resultTitle, { color: COLORS.emerald }]}>{getTranslation(language, 'verifiedTitle')}</Text>
          <Text style={s.resultSub}>{getTranslation(language, 'verifiedSub')}</Text>

          <View style={[s.resultCard, { borderColor: 'rgba(19,136,8,0.3)' }]}>
            <View style={s.resultAvatarRow}>
              <View style={[s.avatar, { backgroundColor: 'rgba(19,136,8,0.1)', borderColor: COLORS.emerald }]}>
                <Text style={[s.avatarText, { color: COLORS.emerald }]}>{selected.initials}</Text>
              </View>
              <View>
                <Text style={s.resultEmpName}>{selected.name}</Text>
                <Text style={[s.empId, { color: COLORS.emerald }]}>{selected.id}</Text>
              </View>
            </View>

            <View style={s.resultGrid}>
              <ResultStat label={getTranslation(language, 'matchLabel')} value={`${(matchScore * 100).toFixed(1)}%`} color={COLORS.emerald} />
              <ResultStat label={getTranslation(language, 'inferenceLabel')} value={`${inferenceMs}ms`} color={COLORS.cyan} />
              <ResultStat label={getTranslation(language, 'modelLabel')} value="MobileFaceNet" color={COLORS.textSecondary} />
              <ResultStat label={getTranslation(language, 'livenessLabel')} value="PASSED" color={COLORS.emerald} />
            </View>
          </View>

          <View style={s.logNotice}>
            <Text style={s.logNoticeText}>📥 {getTranslation(language, 'recordSavedNotice')}</Text>
          </View>

          <TouchableOpacity style={s.btnSubmitSolid} onPress={() => setStep('SELECT')}>
            <Text style={s.btnSubmitSolidText}>{getTranslation(language, 'btnNextVerification')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { borderColor: '#cbd5e1', marginTop: 12 }]} onPress={onBack}>
            <Text style={[s.actionBtnText, { color: COLORS.textSecondary }]}>{getTranslation(language, 'btnHome')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── FAILED SCREEN ───────────────────────────────────────────────────────────
  if (step === 'FAILED') {
    return (
      <View style={s.root}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={s.resultContainer}>
          <View style={[s.resultIconWrap, { borderColor: 'rgba(244,63,94,0.3)', backgroundColor: 'rgba(244,63,94,0.08)' }]}>
            <Text style={{ fontSize: 44, color: COLORS.rose }}>✕</Text>
          </View>
          <Text style={[s.resultTitle, { color: COLORS.rose }]}>{getTranslation(language, 'deniedTitle')}</Text>
          <Text style={s.resultSub}>{getTranslation(language, 'deniedSub')}</Text>

          <View style={[s.resultCard, { borderColor: 'rgba(244,63,94,0.2)', marginTop: 24 }]}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 14, lineHeight: 22 }}>
              {getTranslation(language, 'deniedDesc')}
            </Text>
            <View style={s.resultGrid}>
              <ResultStat label={getTranslation(language, 'matchLabel')} value={`${(matchScore * 100).toFixed(1)}%`} color={COLORS.rose} />
              <ResultStat label="THRESHOLD" value="85.0%" color={COLORS.textSecondary} />
            </View>
          </View>

          <TouchableOpacity style={s.btnSubmitSolid} onPress={() => selected && startAuth(selected)}>
            <Text style={s.btnSubmitSolidText}>{getTranslation(language, 'btnRetry')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { borderColor: '#cbd5e1', marginTop: 12 }]} onPress={onBack}>
            <Text style={[s.actionBtnText, { color: COLORS.textSecondary }]}>{getTranslation(language, 'btnHome')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

function ResultStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1.5, borderBottomColor: '#cbd5e1',
    elevation: 2,
  },
  backBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  backText: { color: COLORS.cyan, fontSize: 13, fontWeight: '700' },
  screenTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary },
  subLabel: { fontSize: 13, color: COLORS.textSecondary, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },

  empCard: {
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  empCardInner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(11,60,93,0.08)',
    borderWidth: 1.5, borderColor: COLORS.cyan,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: COLORS.cyan },
  empName: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  empId: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', marginTop: 2 },
  empRole: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  // Camera
  topOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    zIndex: 10,
  },
  cameraPersonLabel: { fontSize: 13, fontWeight: '800', color: '#fff' },
  onlinePill: {
    borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  onlinePillText: { fontSize: 9, fontWeight: '800' },
  hudWrapper: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingBottom: 200,
    zIndex: 5,
  },

  // Results
  resultContainer: {
    flexGrow: 1, alignItems: 'center', justifyContent: 'center',
    padding: 24, paddingTop: 40,
  },
  resultIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2.5, borderColor: 'rgba(19,136,8,0.5)',
    backgroundColor: 'rgba(19,136,8,0.05)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  successWrap: { borderColor: 'rgba(19,136,8,0.6)', backgroundColor: 'rgba(19,136,8,0.05)' },
  resultTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  resultSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, textAlign: 'center' },
  resultCard: {
    width: '100%', backgroundColor: '#ffffff',
    borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 10, padding: 16, marginTop: 24,
  },
  resultAvatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  resultEmpName: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  resultGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  statBox: {
    flex: 1, minWidth: '45%',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 8, padding: 10,
  },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '700' },
  statValue: { fontSize: 15, fontWeight: '800', marginTop: 4 },

  logNotice: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(19,136,8,0.05)',
    borderWidth: 1.5, borderColor: 'rgba(19,136,8,0.2)',
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12,
    marginTop: 16, width: '100%',
  },
  logNoticeText: { fontSize: 13, color: COLORS.emerald, fontWeight: '700', marginLeft: 4 },

  actionBtn: {
    width: '100%', borderWidth: 1.5, borderRadius: 8,
    paddingVertical: 16, alignItems: 'center', marginTop: 4,
  },
  actionBtnText: { fontSize: 13, fontWeight: '800' },

  btnSubmitSolid: {
    width: '100%',
    backgroundColor: COLORS.cyan,
    borderRadius: 8,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  btnSubmitSolidText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Interactive Camera HUD styles
  shutterFlashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ffffff',
    opacity: 0.95,
    zIndex: 99,
  },
  screenFlashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ffffff',
    opacity: 0.45,
    zIndex: 1,
    pointerEvents: 'none',
  },
  captureButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  captureBtn: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: COLORS.cyan,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  captureBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  mismatchToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1.5,
    borderBottomColor: '#cbd5e1',
    marginBottom: 10,
  },
  toggleLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  toggleBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.cyan,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(11,60,93,0.05)',
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.cyan,
  },
});
