/**
 * Secure Offline Facial Recognition Math Core
 * Provides vector mathematics for face comparison and mock biometric enrollment.
 * In production: replace generateEmbedding with actual MobileFaceNet TFLite output.
 */

export function normalizeVector(vec: number[]): number[] {
  const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vec.map(() => 0);
  return vec.map(val => val / magnitude);
}

/**
 * Cosine Similarity: dot product of two L2-normalized vectors.
 * Score ≥ 0.85 → Identity match. Threshold tuned for MobileFaceNet.
 */
export function computeCosineSimilarity(v1: number[], v2: number[]): number {
  let dot = 0;
  for (let i = 0; i < v1.length; i++) dot += v1[i] * v2[i];
  return Math.max(-1, Math.min(1, dot));
}

/** Deterministic 128-D embedding seeded from an employee ID string */
export function generateDeterministicEmbedding(seed: string): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const embedding: number[] = [];
  for (let i = 0; i < 128; i++) {
    const x = Math.sin(hash + i) * 10000;
    embedding.push(x - Math.floor(x) - 0.5);
  }
  return normalizeVector(embedding);
}

/**
 * Simulates the natural variance introduced by lighting, angle, sensor noise
 * during a live camera scan. noiseStrength ≈ 0.05–0.10 is realistic.
 */
export function simulateFaceScan(base: number[], noiseStrength = 0.07): number[] {
  const scanned = base.map(v => v + (Math.random() - 0.5) * noiseStrength * 2);
  return normalizeVector(scanned);
}

export interface EmployeeProfile {
  id: string;
  name: string;
  role: string;
  department: string;
  initials: string;
  embedding: number[];
  syncStatus?: 'PENDING' | 'SYNCED';
}

// Registry is now fully runtime-managed.
// All profiles are enrolled via real camera scan + MobileFaceNet TFLite inference.
// Use LocalSecureStorage.getEnrolledProfiles() / enrollProfile() to read/write.
