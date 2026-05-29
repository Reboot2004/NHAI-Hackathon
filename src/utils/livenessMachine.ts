/**
 * Active Liveness Detection State Machine
 * Randomised challenge sequences prevent static photo & video replay attacks.
 */

export type LivenessChallengeType = 'BLINK' | 'SMILE' | 'TURN_LEFT' | 'TURN_RIGHT';

export interface LivenessChallenge {
  type: LivenessChallengeType;
  emoji: string;
  prompt: string;
  hint: string;
}

export const CHALLENGES: Record<LivenessChallengeType, LivenessChallenge> = {
  BLINK: {
    type: 'BLINK',
    emoji: '👁️',
    prompt: 'Blink your eyes',
    hint: 'Close and open both eyes slowly',
  },
  SMILE: {
    type: 'SMILE',
    emoji: '😊',
    prompt: 'Give a smile',
    hint: 'Show a natural smile',
  },
  TURN_LEFT: {
    type: 'TURN_LEFT',
    emoji: '⬅️',
    prompt: 'Turn head left',
    hint: 'Slowly rotate your face to the left',
  },
  TURN_RIGHT: {
    type: 'TURN_RIGHT',
    emoji: '➡️',
    prompt: 'Turn head right',
    hint: 'Slowly rotate your face to the right',
  },
};

export function generateChallengeSequence(count = 2): LivenessChallengeType[] {
  const types: LivenessChallengeType[] = ['BLINK', 'SMILE', 'TURN_LEFT', 'TURN_RIGHT'];
  return [...types].sort(() => Math.random() - 0.5).slice(0, count);
}

/**
 * Evaluates if a FaceDetector result satisfies the given challenge.
 * Thresholds are tuned for ML Kit / expo-face-detector probabilities.
 */
export function evaluateChallenge(
  challenge: LivenessChallengeType,
  face: {
    leftEyeOpenProbability?: number;
    rightEyeOpenProbability?: number;
    smilingProbability?: number;
    yawAngle?: number;
  }
): boolean {
  switch (challenge) {
    case 'BLINK':
      return (
        (face.leftEyeOpenProbability ?? 1) < 0.2 &&
        (face.rightEyeOpenProbability ?? 1) < 0.2
      );
    case 'SMILE':
      return (face.smilingProbability ?? 0) > 0.75;
    case 'TURN_LEFT':
      return (face.yawAngle ?? 0) > 20;
    case 'TURN_RIGHT':
      return (face.yawAngle ?? 0) < -20;
    default:
      return false;
  }
}
