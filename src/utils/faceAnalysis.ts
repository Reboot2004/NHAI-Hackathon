import { NativeModules } from 'react-native';
import { preprocessFaceBuffer } from './imagePreprocessor';

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
export async function analyzeFaceImage(imageUri: string): Promise<FaceAnalysisResult> {
  if (isNativeBiometricModuleAvailable()) {
    try {
      console.log(`[FaceAnalysis] Passing file URI to native ML Kit context: ${imageUri}`);
      const result = await BiometricModule.analyzeFace(imageUri);
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
      });
    }, 400);
  });
}
