import { NativeModules } from 'react-native';
import { preprocessFaceBuffer } from './imagePreprocessor';
import { computeCosineSimilarity } from './faceMath';

const { BiometricModule } = NativeModules;

export interface FaceAnalysisResult {
  faceDetected: boolean;
  smileProbability: number;
  leftEyeOpenProbability: number;
  rightEyeOpenProbability: number;
  yaw: number;
  pitch: number;
  roll: number;
  meanBrightness?: number;
  maskLikely?: boolean;
  facePixels?: number[];
  faceEmbedding?: number[];
  preprocessStats?: {
    meanBrightness: number;
    contrastRatio: number;
    shadowNormalized: boolean;
  };
}

/**
 * Checks if the native ML Kit face detection module is available in the current runtime.
 * If running in standard Expo Go or simulator, this will return false.
 * If running inside a custom dev client or compiled standalone APK, this will return true.
 */
export function isNativeBiometricModuleAvailable(): boolean {
  return !!BiometricModule && typeof BiometricModule.analyzeFace === 'function';
}

/**
 * Invokes the custom native C++ JSI or Kotlin Google ML Kit bridge to detect a face
 * and extract high-fidelity facial orientation and expression coefficients from a saved image.
 * 
 * Falls back to simulator logic when running in standard Expo Go environments.
 */
export async function analyzeFaceImage(imageUri: string, modelPath: string): Promise<FaceAnalysisResult> {
  if (isNativeBiometricModuleAvailable()) {
    try {
      console.log(`[FaceAnalysis] Passing file URI to native ML Kit context: ${imageUri} with model: ${modelPath}`);
      const result = await BiometricModule.analyzeFace(imageUri, modelPath);
      console.log('[FaceAnalysis] Native ML Kit telemetry:', result);
      return result;
    } catch (error) {
      console.error('[FaceAnalysis] Native face detection execution crashed:', error);
    }
  }

  // Fallback simulator response for testing UI/UX pipelines in Expo Go
  console.log('[FaceAnalysis] Native module unavailable. Running JS emulator fallback...');
  
  // Simulate fetching a mock YUV/RGB face buffer and processing it
  const simulatedBuffer = new Uint8Array(112 * 112 * 3);
  // Fill with dummy dark/uneven pixels to simulate direct sunlight shadows
  for (let i = 0; i < simulatedBuffer.length; i++) {
    simulatedBuffer[i] = Math.round(40 + Math.random() * 80); 
  }
  
  const { stats } = preprocessFaceBuffer(simulatedBuffer, 112, 112);
  console.log('[FaceAnalysis] Simulation Adaptive Lighting Stats applied:', stats);

  // Dynamic values for testing simulated states
  const mockBrightness = Math.random() > 0.5 ? 45.0 : 130.0;
  const mockMask = Math.random() > 0.7;

  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate a mock normalized 128-D vector
      const mockVector = Array.from({ length: 128 }, (_, i) => Math.sin(i * 0.31 + 1.7) * 0.4 + Math.cos(i * 0.17) * 0.3);
      let sq = 0;
      for (let i = 0; i < 128; i++) sq += mockVector[i] * mockVector[i];
      const norm = Math.sqrt(sq) || 1.0;
      const mockEmbedding = mockVector.map(v => v / norm);

      resolve({
        faceDetected: true,
        smileProbability: mockMask ? -1.0 : 0.85,
        leftEyeOpenProbability: 0.98,
        rightEyeOpenProbability: 0.97,
        yaw: 2.1,
        pitch: -1.4,
        roll: 0.5,
        meanBrightness: mockBrightness,
        maskLikely: mockMask,
        preprocessStats: stats,
        facePixels: Array.from({ length: 112 * 112 * 3 }, () => Math.round(Math.random() * 255)),
        faceEmbedding: mockEmbedding,
      });
    }, 400);
  });
}

export async function verifyFaceAgainstProfile(
  photoUri: string,
  registeredEmbedding: number[],
  modelPath: string,
  similarityThreshold = 0.85
): Promise<{
  passed: boolean;
  matchScore: number;
  faceDetected: boolean;
  livenessTelemetry: {
    smileProbability: number;
    leftEyeOpenProbability: number;
    rightEyeOpenProbability: number;
    yaw: number;
    pitch: number;
    roll: number;
    maskLikely: boolean;
    meanBrightness?: number;
  };
  faceEmbedding?: number[];
}> {
  const result = await analyzeFaceImage(photoUri, modelPath);
  
  if (!result.faceDetected || !result.faceEmbedding) {
    return {
      passed: false,
      matchScore: 0,
      faceDetected: false,
      livenessTelemetry: {
        smileProbability: -1,
        leftEyeOpenProbability: -1,
        rightEyeOpenProbability: -1,
        yaw: 0,
        pitch: 0,
        roll: 0,
        maskLikely: false,
        meanBrightness: 128,
      },
    };
  }

  const score = computeCosineSimilarity(registeredEmbedding, result.faceEmbedding);

  return {
    passed: score >= similarityThreshold,
    matchScore: parseFloat((score * 100).toFixed(1)),
    faceDetected: true,
    livenessTelemetry: {
      smileProbability: result.smileProbability,
      leftEyeOpenProbability: result.leftEyeOpenProbability,
      rightEyeOpenProbability: result.rightEyeOpenProbability,
      yaw: result.yaw,
      pitch: result.pitch,
      roll: result.roll,
      maskLikely: !!result.maskLikely,
      meanBrightness: result.meanBrightness,
    },
    faceEmbedding: result.faceEmbedding,
  };
}
