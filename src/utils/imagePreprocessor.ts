/**
 * Image Preprocessing Utility for Datalake 3.0
 * 
 * Normalizes lighting conditions, compensates for shadows, and prepares
 * facial image tensors for MobileFaceNet inference. Optimized for Indian
 * face demographic variations under harsh sunlight / low-light NHAI sites.
 */

export interface PreprocessedStats {
  meanBrightness: number;
  contrastRatio: number;
  shadowNormalized: boolean;
}

/**
 * Simulates histogram equalization and shadow compensation on raw RGB/RGBA buffers.
 * Normalizes pixel values using local contrast stretching.
 */
export function preprocessFaceBuffer(
  rawBuffer: Uint8Array,
  width: number,
  height: number
): { normalizedBuffer: Uint8Array; stats: PreprocessedStats } {
  const size = width * height;
  const normalizedBuffer = new Uint8Array(rawBuffer.length);
  
  let totalLuminance = 0;
  
  // Calculate average luminance (brightness)
  for (let i = 0; i < size; i++) {
    const r = rawBuffer[i * 3];
    const g = rawBuffer[i * 3 + 1];
    const b = rawBuffer[i * 3 + 2];
    
    // Standard relative luminance formula
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    totalLuminance += luminance;
  }
  
  const meanBrightness = totalLuminance / size;
  
  // Find min/max values for contrast stretching (Histogram clipping simulation)
  let minL = 255;
  let maxL = 0;
  
  for (let i = 0; i < size; i++) {
    const r = rawBuffer[i * 3];
    const g = rawBuffer[i * 3 + 1];
    const b = rawBuffer[i * 3 + 2];
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    if (l < minL) minL = l;
    if (l > maxL) maxL = l;
  }
  
  const contrastRatio = maxL - minL;
  
  // Adaptive gain adjustments based on ambient environment brightness levels
  // Indian construction sites: direct noon sunlight (overexposure) vs evening dusk (underexposure)
  let gain = 1.0;
  let bias = 0;
  
  if (meanBrightness < 80) {
    // Low light scenario: boost gain, apply positive offset (underexposure recovery)
    gain = 1.5;
    bias = 20;
  } else if (meanBrightness > 190) {
    // Overexposed scenario: dim highlights to prevent saturation
    gain = 0.85;
    bias = -15;
  }
  
  // Channel-wise preprocessing & Contrast Stretching
  for (let i = 0; i < size; i++) {
    const idx = i * 3;
    for (let channel = 0; channel < 3; channel++) {
      let val = rawBuffer[idx + channel];
      
      // 1. Min-Max Contrast Normalization (similar to Adaptive Histogram Equalization)
      if (contrastRatio > 10) {
        val = ((val - minL) / contrastRatio) * 255;
      }
      
      // 2. Apply ambient gain and bias correction
      val = val * gain + bias;
      
      // 3. Clip output values to valid pixel range
      normalizedBuffer[idx + channel] = Math.max(0, Math.min(255, val));
    }
  }
  
  return {
    normalizedBuffer,
    stats: {
      meanBrightness: Math.round(meanBrightness),
      contrastRatio: Math.round(contrastRatio),
      shadowNormalized: meanBrightness < 90 || contrastRatio < 80,
    }
  };
}
