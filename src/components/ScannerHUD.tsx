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
            Satyapan Step {challengeIndex + 1} of {challengeTotal}
          </Text>
          <Text style={styles.challengeText}>
            {challengePrompt}
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
          <TelemetryItem label="EYE" value={livenessData.eyeOpen.toFixed(2)} />
          <TelemetryItem label="SMILE" value={livenessData.smile.toFixed(2)} />
          <TelemetryItem label="ANGLE" value={livenessData.yaw.toFixed(1)} />
          <TelemetryItem
            label="LIVENESS"
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

  // Corner brackets - Government saffron accent
  bracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#ff9933',
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
    borderWidth: 1.5,
    borderColor: 'rgba(255,153,51,0.3)',
  },
  innerRing: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    width: '60%',
    height: '60%',
    borderRadius: RETICLE * 0.3,
    borderWidth: 2,
    borderColor: 'rgba(255,153,51,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff9933',
  },
  crossH: {
    position: 'absolute',
    width: '60%',
    height: 1,
    backgroundColor: 'rgba(255,153,51,0.3)',
  },
  crossV: {
    position: 'absolute',
    height: '60%',
    width: 1,
    backgroundColor: 'rgba(255,153,51,0.3)',
  },

  // Laser
  laser: {
    position: 'absolute',
    left: 0,
    width: '100%',
    height: 2.5,
    backgroundColor: '#ff9933',
    shadowColor: '#ff9933',
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
    backgroundColor: '#ff9933',
    opacity: 0.9,
  },

  // Challenge overlay
  challengeBox: {
    position: 'absolute',
    bottom: -80,
    left: -16,
    right: -16,
    backgroundColor: 'rgba(11,60,93,0.92)',
    borderWidth: 1.5,
    borderColor: '#ff9933',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  challengeStep: {
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: '700',
  },
  challengeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
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
    backgroundColor: '#ff9933',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 3,
  },

  // Telemetry
  telemetry: {
    position: 'absolute',
    bottom: -164,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  telemetryItem: {
    flex: 1,
    backgroundColor: 'rgba(11,60,93,0.9)',
    borderWidth: 1.5,
    borderColor: '#ff9933',
    borderRadius: 6,
    padding: 5,
    alignItems: 'center',
  },
  telemetryLabel: {
    fontSize: 8,
    color: '#cbd5e1',
    fontWeight: '700',
  },
  telemetryValue: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '800',
    marginTop: 1,
  },
});
