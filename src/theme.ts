/**
 * NHAI Official UX4G Design Tokens
 * Reconfigured from cyberpunk dark-theme to Indian Government official tricolor identity:
 * Primary: Ashoka Navy Blue (#0b3c5d), Accent: Saffron (#ff9933), Secondary: Ashoka Green (#138808)
 * Optimized for high-contrast accessibility (WCAG compliant) for field workers.
 */
import { StyleSheet } from 'react-native';

export const COLORS = {
  // Light Government theme backgrounds
  bg: '#f1f5f9',               // Light background (slate-100)
  card: '#ffffff',             // Solid white cards for accessibility
  cardBorder: '#cbd5e1',       // Light border (slate-300)
  
  // Mapping existing variables to Tricolor system to prevent styling failures
  cyan: '#0b3c5d',             // Ashoka Navy Blue (Official text/header accent)
  cyanDim: 'rgba(11,60,93,0.08)', 
  cyanBright: '#ff9933',       // NHAI Saffron (Primary action color)
  
  // Standard functional alerts (GIGW Compliant)
  emerald: '#138808',          // Ashoka Green (Success / Verified)
  emeraldDim: 'rgba(19,136,8,0.08)',
  
  rose: '#d32f2f',             // High-contrast accessibility Red (Error / Denied)
  roseDim: 'rgba(211,47,47,0.08)',
  
  amber: '#ed6c02',            // High-contrast Orange/Amber (Warnings / Sync queues)
  amberDim: 'rgba(237,108,2,0.08)',
  
  // High Legibility Text Contrast (WCAG 4.5:1 target)
  textPrimary: '#0f172a',      // Deep slate-900 (near black) for all body copy
  textSecondary: '#334155',    // Slate-700 for subtitles
  textMuted: '#64748b',        // Slate-500 for captions
  
  // Gray adaptors to keep light theme consistent
  slate800: '#cbd5e1',         // Slate-300 (used for light card borders)
  slate900: '#f8fafc',         // Slate-50 (used for inputs background)
  slate950: '#ffffff',         // Solid white
};

export const FONTS = {
  hud: 'System',   
  sans: 'System',
  mono: 'System',              // Bypassed monospace default to improve readability for laborers
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
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardCyan: {
    backgroundColor: 'rgba(11,60,93,0.04)',
    borderWidth: 1,
    borderColor: COLORS.cyan,
    borderRadius: 12,
    padding: 12,
  },

  // Typography (Simplified for high readability)
  hudTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.5,
  },
  hudSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  label: {
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  bodyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Buttons (Thicker, solid layout for accessibility)
  btnCyan: {
    backgroundColor: COLORS.cyan,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCyanText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: COLORS.cyan,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  btnGhostText: {
    color: COLORS.cyan,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Status badges
  badgeCyan: {
    backgroundColor: COLORS.cyanDim,
    borderWidth: 1,
    borderColor: COLORS.cyan,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeEmerald: {
    backgroundColor: COLORS.emeraldDim,
    borderWidth: 1,
    borderColor: COLORS.emerald,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeRose: {
    backgroundColor: COLORS.roseDim,
    borderWidth: 1,
    borderColor: COLORS.rose,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeAmber: {
    backgroundColor: COLORS.amberDim,
    borderWidth: 1,
    borderColor: COLORS.amber,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});
