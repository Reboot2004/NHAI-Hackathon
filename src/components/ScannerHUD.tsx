import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { COLORS } from '../theme';

const { width } = Dimensions.get('window');
const RETICLE = width * 0.62;

interface ScannerHUDProps {
  statusMessage: string;
  isScanning: boolean;
  challengeEmoji?: string;
  challengePrompt?: string;
  challengeIndex?: number;
  challengeTotal?: number;
  livenessData?: {
    eyeOpen: number;
    smile: number;
    yaw: number;
    antiSpoof: number;
  };
}

export default function ScannerHUD({
  statusMessage,
  isScanning,
  challengeEmoji,
  challengePrompt,
  challengeIndex = 0,
  challengeTotal = 2,
  livenessData,
}: ScannerHUDProps) {
  const laserY = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const dotOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Laser sweep animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(laserY, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(laserY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation on reticle ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.04,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Blinking dot on status
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, { toValue: 0.2, duration: 700, useNativeDriver: true }),
        Animated.timing(dotOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const laserTranslate = laserY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, RETICLE - 4],
  });

  return (
    <View style={styles.container}>
      {/* Corner brackets */}
      <View style={[styles.bracket, styles.bracketTL]} />
      <View style={[styles.bracket, styles.bracketTR]} />
      <View style={[styles.bracket, styles.bracketBL]} />
      <View style={[styles.bracket, styles.bracketBR]} />

      {/* Outer pulsing ring */}
      <Animated.View style={[styles.outerRing, { transform: [{ scale: pulseScale }] }]} />

      {/* Inner face reticle */}
      <View style={styles.innerRing}>
        {/* Center dot */}
        <View style={styles.centerDot} />
        {/* Horizontal crosshair */}
        <View style={styles.crossH} />
        <View style={styles.crossV} />
      </View>

      {/* Laser sweep line */}
      <Animated.View
        style={[
          styles.laser,
          { transform: [{ translateY: laserTranslate }] },
        ]}
      />

      {/* Face landmark dots (simulated) */}
      <View style={styles.landmarkContainer} pointerEvents="none">
        <View style={[styles.landmark, { top: '28%', left: '28%' }]} />
        <View style={[styles.landmark, { top: '28%', right: '28%' }]} />
        <View style={[styles.landmark, { top: '48%', left: '48%' }]} />
        <View style={[styles.landmark, { top: '58%', left: '44%' }]} />
        <View style={[styles.landmark, { top: '58%', right: '44%' }]} />
        <View style={[styles.landmark, { top: '70%', left: '48%' }]} />
      </View>

      {/* Challenge prompt overlay at bottom */}
      {challengePrompt && (
        <View style={styles.challengeBox}>
          <Text style={styles.challengeStep}>
            Challenge {challengeIndex + 1} of {challengeTotal}
          </Text>
          <Text style={styles.challengeText}>
            {challengeEmoji}  {challengePrompt}
          </Text>
        </View>
      )}

      {/* Status message bar below reticle */}
      <View style={styles.statusBar}>
        <Animated.View style={[styles.statusDot, { opacity: dotOpacity }]} />
        <Text style={styles.statusText} numberOfLines={1}>
          {statusMessage}
        </Text>
      </View>

      {/* Telemetry readout */}
      {livenessData && (
        <View style={styles.telemetry}>
          <TelemetryItem label="EYE_OPEN" value={livenessData.eyeOpen.toFixed(2)} />
          <TelemetryItem label="SMILE" value={livenessData.smile.toFixed(2)} />
          <TelemetryItem label="YAW°" value={livenessData.yaw.toFixed(1)} />
          <TelemetryItem
            label="ANTISPOOF"
            value={livenessData.antiSpoof.toFixed(2)}
            highlight={livenessData.antiSpoof > 0.8}
          />
        </View>
      )}
    </View>
  );
}

function TelemetryItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.telemetryItem}>
      <Text style={styles.telemetryLabel}>{label}</Text>
      <Text style={[styles.telemetryValue, highlight && { color: COLORS.emerald }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: RETICLE,
    height: RETICLE,
    alignSelf: 'center',
    position: 'relative',
  },

  // Corner brackets
  bracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: COLORS.cyan,
  },
  bracketTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  bracketTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bracketBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  bracketBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },

  // Rings
  outerRing: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    width: '80%',
    height: '80%',
    borderRadius: RETICLE * 0.4,
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.3)',
  },
  innerRing: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    width: '60%',
    height: '60%',
    borderRadius: RETICLE * 0.3,
    borderWidth: 1.5,
    borderColor: 'rgba(6,182,212,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.cyan,
  },
  crossH: {
    position: 'absolute',
    width: '60%',
    height: 1,
    backgroundColor: 'rgba(6,182,212,0.4)',
  },
  crossV: {
    position: 'absolute',
    height: '60%',
    width: 1,
    backgroundColor: 'rgba(6,182,212,0.4)',
  },

  // Laser
  laser: {
    position: 'absolute',
    left: 0,
    width: '100%',
    height: 2,
    backgroundColor: COLORS.cyan,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    opacity: 0.85,
  },

  // Landmark dots
  landmarkContainer: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  },
  landmark: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.cyanBright,
    opacity: 0.9,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },

  // Challenge overlay
  challengeBox: {
    position: 'absolute',
    bottom: -80,
    left: -16,
    right: -16,
    backgroundColor: 'rgba(6,182,212,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.4)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  challengeStep: {
    fontSize: 9,
    color: COLORS.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: 'Courier New',
  },
  challengeText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.cyanBright,
    marginTop: 4,
    letterSpacing: 1,
  },

  // Status bar
  statusBar: {
    position: 'absolute',
    bottom: -116,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.cyan,
  },
  statusText: {
    fontSize: 11,
    color: COLORS.cyan,
    fontFamily: 'Courier New',
    letterSpacing: 0.5,
  },

  // Telemetry
  telemetry: {
    position: 'absolute',
    bottom: -160,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  telemetryItem: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(30,41,59,0.8)',
    borderRadius: 6,
    padding: 5,
  },
  telemetryLabel: {
    fontSize: 7,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    fontFamily: 'Courier New',
  },
  telemetryValue: {
    fontSize: 10,
    color: COLORS.cyan,
    fontWeight: '700',
    fontFamily: 'Courier New',
    marginTop: 1,
  },
});
