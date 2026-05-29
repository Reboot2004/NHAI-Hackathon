import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, T } from '../theme';

interface Props {
  onAuthenticate: () => void;
  onEnroll: () => void;
  onDashboard: () => void;
  networkOnline: boolean;
  pendingLogs: number;
  enrolledCount: number;
}

export default function WelcomeScreen({
  onAuthenticate,
  onEnroll,
  onDashboard,
  networkOnline,
  pendingLogs,
  enrolledCount,
}: Props) {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 2500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Background grid lines */}
      <View style={styles.gridOverlay} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header badge */}
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <View style={styles.dot} />
            <Text style={styles.headerBadgeText}>NHAI HACKATHON 7.0</Text>
          </View>
        </View>

        {/* Main logo area */}
        <Animated.View style={[styles.logoArea, { transform: [{ translateY: floatAnim }] }]}>
          <Animated.View style={[styles.logoGlow, { opacity: glowOpacity }]} />
          <LinearGradient
            colors={['rgba(6,182,212,0.25)', 'rgba(6,182,212,0.05)']}
            style={styles.logoCircle}
          >
            <Text style={styles.logoEmoji}>🛡️</Text>
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>DATALAKE 3.0</Text>
        <Text style={styles.subtitle}>SECURE OFFLINE BIOMETRIC GATEWAY</Text>
        <Text style={styles.tagline}>
          MobileFaceNet · Active Liveness · Zero-Network Resilient
        </Text>

        {/* Live status pills */}
        <View style={styles.pillRow}>
          <View style={[styles.pill, { borderColor: networkOnline ? COLORS.emerald : COLORS.amber }]}>
            <View style={[styles.pillDot, { backgroundColor: networkOnline ? COLORS.emerald : COLORS.amber }]} />
            <Text style={[styles.pillText, { color: networkOnline ? COLORS.emerald : COLORS.amber }]}>
              {networkOnline ? 'ONLINE' : 'OFFLINE MODE'}
            </Text>
          </View>
          <View style={[styles.pill, { borderColor: COLORS.cyan }]}>
            <Text style={[styles.pillText, { color: COLORS.cyan }]}>
              {enrolledCount} ENROLLED
            </Text>
          </View>
          {pendingLogs > 0 && (
            <View style={[styles.pill, { borderColor: COLORS.amber }]}>
              <Text style={[styles.pillText, { color: COLORS.amber }]}>
                {pendingLogs} PENDING SYNC
              </Text>
            </View>
          )}
        </View>

        {/* Spec cards row */}
        <View style={styles.specRow}>
          <SpecCard emoji="⚡" value="~40ms" label="Inference" />
          <SpecCard emoji="📦" value="3.8 MB" label="Model Size" />
          <SpecCard emoji="🎯" value="99.5%" label="Accuracy" />
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🌐</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Zero-Network Resilience</Text>
            <Text style={styles.infoBody}>
              Fully operational in remote locations with no internet. Attendance
              logs are encrypted locally and auto-sync when connectivity restores.
            </Text>
          </View>
        </View>

        {/* Empty-registry first-run banner */}
        {enrolledCount === 0 && (
          <View style={styles.enrollBanner}>
            <Text style={styles.enrollBannerTitle}>⚠️  No Personnel Enrolled</Text>
            <Text style={styles.enrollBannerBody}>
              Tap <Text style={{ color: COLORS.cyan, fontWeight: '800' }}>ENROLL</Text> below to register a face biometric before authenticating.{`\n`}
              Use Supervisor PIN <Text style={{ color: COLORS.amber, fontWeight: '800' }}>8890</Text> to access enrollment.
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btnPrimary, enrolledCount === 0 && styles.btnDisabled]}
            onPress={enrolledCount === 0 ? undefined : onAuthenticate}
            activeOpacity={enrolledCount === 0 ? 1 : 0.8}
          >
            <LinearGradient
              colors={enrolledCount === 0
                ? ['rgba(30,41,59,0.4)', 'rgba(30,41,59,0.2)']
                : ['rgba(6,182,212,0.3)', 'rgba(6,182,212,0.08)']}
              style={styles.btnPrimaryInner}
            >
              <Text style={styles.btnPrimaryEmoji}>📷</Text>
              <View>
                <Text style={[styles.btnPrimaryText, enrolledCount === 0 && { color: COLORS.textMuted }]}>AUTHENTICATE</Text>
                <Text style={styles.btnPrimaryHint}>
                  {enrolledCount === 0 ? 'Enroll a profile first' : 'Face scan + liveness verification'}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.btnSecondary, { flex: 1 }]} onPress={onEnroll} activeOpacity={0.8}>
              <Text style={styles.btnSecondaryEmoji}>👤</Text>
              <Text style={styles.btnSecondaryText}>ENROLL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnSecondary, { flex: 1 }]} onPress={onDashboard} activeOpacity={0.8}>
              <Text style={styles.btnSecondaryEmoji}>📊</Text>
              <Text style={styles.btnSecondaryText}>DASHBOARD</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Open-Source · MobileFaceNet (Apache 2.0) · NHAI Datalake Integration
        </Text>
      </ScrollView>
    </View>
  );
}

function SpecCard({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View style={styles.specCard}>
      <Text style={styles.specEmoji}>{emoji}</Text>
      <Text style={styles.specValue}>{value}</Text>
      <Text style={styles.specLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },

  gridOverlay: {
    position: 'absolute', inset: 0,
    opacity: 0.04,
    // React Native doesn't support CSS grid — using border effect trick
    borderWidth: 40,
    borderColor: COLORS.cyan,
  },

  header: { alignItems: 'center', marginBottom: 32 },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(6,182,212,0.08)',
    borderWidth: 1, borderColor: 'rgba(6,182,212,0.3)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.cyan },
  headerBadgeText: { fontSize: 10, color: COLORS.cyan, letterSpacing: 2, fontFamily: 'Courier New' },

  logoArea: { alignItems: 'center', marginBottom: 24, position: 'relative' },
  logoGlow: {
    position: 'absolute',
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: COLORS.cyan,
    top: 0, alignSelf: 'center',
  },
  logoCircle: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(6,182,212,0.5)',
  },
  logoEmoji: { fontSize: 44 },

  title: {
    fontSize: 28, fontWeight: '900', color: COLORS.cyan,
    textAlign: 'center', letterSpacing: 6, textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 10, color: COLORS.textSecondary,
    textAlign: 'center', letterSpacing: 3,
    fontFamily: 'Courier New', marginTop: 4,
  },
  tagline: {
    fontSize: 11, color: COLORS.textMuted,
    textAlign: 'center', marginTop: 8, letterSpacing: 0.5,
  },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 20 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  pillDot: { width: 5, height: 5, borderRadius: 3 },
  pillText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, fontFamily: 'Courier New' },

  specRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  specCard: {
    flex: 1, backgroundColor: 'rgba(13,20,38,0.8)',
    borderWidth: 1, borderColor: 'rgba(6,182,212,0.2)',
    borderRadius: 12, padding: 12, alignItems: 'center',
  },
  specEmoji: { fontSize: 20, marginBottom: 4 },
  specValue: { fontSize: 14, fontWeight: '800', color: COLORS.cyanBright, letterSpacing: 1 },
  specLabel: { fontSize: 9, color: COLORS.textMuted, letterSpacing: 1, marginTop: 2, fontFamily: 'Courier New' },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: 'rgba(6,182,212,0.05)',
    borderWidth: 1, borderColor: 'rgba(6,182,212,0.2)',
    borderRadius: 14, padding: 14, marginTop: 20,
  },
  infoIcon: { fontSize: 22 },
  infoTitle: { fontSize: 13, fontWeight: '700', color: COLORS.cyanBright, marginBottom: 4 },
  infoBody: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },

  enrollBanner: {
    backgroundColor: 'rgba(245,158,11,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
    gap: 6,
  },
  enrollBannerTitle: { fontSize: 12, fontWeight: '800', color: COLORS.amber, letterSpacing: 1 },
  enrollBannerBody: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 20 },

  btnDisabled: { borderColor: COLORS.slate700, opacity: 0.55 },

  actions: { marginTop: 28, gap: 12 },
  btnPrimary: {
    borderWidth: 1, borderColor: COLORS.cyan,
    borderRadius: 16, overflow: 'hidden',
  },
  btnPrimaryInner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 18, paddingHorizontal: 20,
  },
  btnPrimaryEmoji: { fontSize: 28 },
  btnPrimaryText: { fontSize: 14, fontWeight: '800', color: COLORS.cyanBright, letterSpacing: 2 },
  btnPrimaryHint: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2, letterSpacing: 0.5 },

  btnRow: { flexDirection: 'row', gap: 12 },
  btnSecondary: {
    backgroundColor: 'rgba(30,41,59,0.6)',
    borderWidth: 1, borderColor: COLORS.slate800,
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', gap: 4,
  },
  btnSecondaryEmoji: { fontSize: 22 },
  btnSecondaryText: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '700', letterSpacing: 1.5, fontFamily: 'Courier New' },

  footer: {
    textAlign: 'center', fontSize: 9, color: COLORS.textMuted,
    letterSpacing: 0.5, marginTop: 32, lineHeight: 16,
  },
});
