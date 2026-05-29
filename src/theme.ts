/**
 * Design tokens — shared across all screens.
 */
import { StyleSheet } from 'react-native';

export const COLORS = {
  bg: '#050811',
  card: 'rgba(13,20,38,0.9)',
  cardBorder: 'rgba(6,182,212,0.25)',
  cyan: '#06b6d4',
  cyanDim: 'rgba(6,182,212,0.15)',
  cyanBright: '#67e8f9',
  emerald: '#10b981',
  emeraldDim: 'rgba(16,185,129,0.15)',
  rose: '#f43f5e',
  roseDim: 'rgba(244,63,94,0.15)',
  amber: '#f59e0b',
  amberDim: 'rgba(245,158,11,0.15)',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
  slate800: '#1e293b',
  slate900: '#0f172a',
  slate950: '#020617',
};

export const FONTS = {
  hud: 'System',   // In production swap to Orbitron via expo-font
  sans: 'System',
  mono: 'Courier New',
};

export const T = StyleSheet.create({
  // Layout
  flex1: { flex: 1 },
  row: { flexDirection: 'row' },
  center: { alignItems: 'center', justifyContent: 'center' },
  between: { justifyContent: 'space-between' },

  // Card
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    padding: 16,
  },
  cardCyan: {
    backgroundColor: COLORS.cyanDim,
    borderWidth: 1,
    borderColor: COLORS.cyan,
    borderRadius: 12,
    padding: 12,
  },

  // Typography
  hudTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  hudSubtitle: {
    fontSize: 10,
    color: COLORS.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: FONTS.mono,
  },
  label: {
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: FONTS.mono,
  },
  bodyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Buttons
  btnCyan: {
    backgroundColor: COLORS.cyanDim,
    borderWidth: 1,
    borderColor: COLORS.cyan,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  btnCyanText: {
    color: COLORS.cyanBright,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: FONTS.mono,
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: COLORS.slate800,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  btnGhostText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: FONTS.mono,
  },

  // Status badges
  badgeCyan: {
    backgroundColor: COLORS.cyanDim,
    borderWidth: 1,
    borderColor: COLORS.cyan,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeEmerald: {
    backgroundColor: COLORS.emeraldDim,
    borderWidth: 1,
    borderColor: COLORS.emerald,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeRose: {
    backgroundColor: COLORS.roseDim,
    borderWidth: 1,
    borderColor: COLORS.rose,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeAmber: {
    backgroundColor: COLORS.amberDim,
    borderWidth: 1,
    borderColor: COLORS.amber,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});
