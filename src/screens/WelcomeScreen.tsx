import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { COLORS } from '../theme';
import { Language, getTranslation } from '../utils/translations';

interface Props {
  onAuthenticate: () => void;
  onEnroll: () => void;
  onDashboard: () => void;
  networkOnline: boolean;
  pendingLogs: number;
  enrolledCount: number;
  language: Language;
  onChangeLanguage: (lang: Language) => void;
}

export default function WelcomeScreen({
  onAuthenticate,
  onEnroll,
  onDashboard,
  networkOnline,
  pendingLogs,
  enrolledCount,
  language,
  onChangeLanguage,
}: Props) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Official Government Tricolor Header Bar */}
      <View style={styles.tricolorBar}>
        <View style={[styles.tricolorSegment, { backgroundColor: '#ff9933' }]} />
        <View style={[styles.tricolorSegment, { backgroundColor: '#ffffff' }]} />
        <View style={[styles.tricolorSegment, { backgroundColor: '#138808' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Language Selection and Official Header */}
        <View style={styles.govHeaderContainer}>
          <View style={styles.govTextSection}>
            <Text style={styles.govTitleHindi}>{getTranslation(language, 'orgNameHindi')}</Text>
            <Text style={styles.govTitleEng}>{getTranslation(language, 'orgName')}</Text>
          </View>
          
          <View style={styles.langSelectorRow}>
            <TouchableOpacity 
              style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
              onPress={() => onChangeLanguage('en')}
            >
              <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.langBtn, language === 'hi' && styles.langBtnActive]}
              onPress={() => onChangeLanguage('hi')}
            >
              <Text style={[styles.langBtnText, language === 'hi' && styles.langBtnTextActive]}>हिन्दी</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* NHAI Stamp Seal Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoSealText}>NHAI</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{getTranslation(language, 'appName')}</Text>
        <Text style={styles.subtitle}>{getTranslation(language, 'appSubName')}</Text>
        <Text style={styles.welcomeSubHeader}>{getTranslation(language, 'welcomeSub')}</Text>

        {/* Live status pills */}
        <View style={styles.pillRow}>
          <View style={[styles.pill, { borderColor: networkOnline ? COLORS.emerald : COLORS.amber }]}>
            <View style={[styles.pillDot, { backgroundColor: networkOnline ? COLORS.emerald : COLORS.amber }]} />
            <Text style={[styles.pillText, { color: networkOnline ? COLORS.emerald : COLORS.amber }]}>
              {networkOnline ? getTranslation(language, 'online') : getTranslation(language, 'offlineMode')}
            </Text>
          </View>
          <View style={[styles.pill, { borderColor: COLORS.cyan }]}>
            <Text style={[styles.pillText, { color: COLORS.cyan }]}>
              {getTranslation(language, 'enrolledCount', { count: enrolledCount })}
            </Text>
          </View>
          {pendingLogs > 0 && (
            <View style={[styles.pill, { borderColor: COLORS.amber }]}>
              <Text style={[styles.pillText, { color: COLORS.amber }]}>
                {getTranslation(language, 'pendingSync', { count: pendingLogs })}
              </Text>
            </View>
          )}
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>{getTranslation(language, 'zeroNetworkResilience')}</Text>
            <Text style={styles.infoBody}>{getTranslation(language, 'zeroNetworkDesc')}</Text>
          </View>
        </View>

        {/* Empty-registry first-run banner */}
        {enrolledCount === 0 && (
          <View style={styles.enrollBanner}>
            <Text style={styles.enrollBannerTitle}>[ ! ] {getTranslation(language, 'noPersonnelEnrolled')}</Text>
            <Text style={styles.enrollBannerBody}>
              {getTranslation(language, 'noPersonnelDesc')}
            </Text>
            <Text style={styles.pinHint}>{getTranslation(language, 'supervisorPinHint')}</Text>
          </View>
        )}

        {/* Action buttons (Big, bold, GIGW-compliant touch targets) */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.primaryGovBtn, 
              enrolledCount === 0 ? styles.primaryGovBtnDisabled : { backgroundColor: COLORS.emerald }
            ]}
            onPress={enrolledCount === 0 ? undefined : onAuthenticate}
            activeOpacity={enrolledCount === 0 ? 1 : 0.8}
          >
            <Text style={styles.primaryGovBtnText}>
              {getTranslation(language, 'btnAuthenticate')}
            </Text>
          </TouchableOpacity>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.secondaryGovBtn} onPress={onEnroll} activeOpacity={0.8}>
              <Text style={styles.secondaryGovBtnText}>
                {getTranslation(language, 'btnEnroll')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryGovBtn} onPress={onDashboard} activeOpacity={0.8}>
              <Text style={styles.secondaryGovBtnText}>
                {getTranslation(language, 'btnDashboard')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          National Highways Authority of India (NHAI) · Offline Biometric Portal v3.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 40 },

  tricolorBar: {
    height: 6,
    flexDirection: 'row',
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 100,
  },
  tricolorSegment: {
    flex: 1,
    height: '100%',
  },

  govHeaderContainer: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 16,
    marginBottom: 24,
    marginTop: 10,
    gap: 12,
  },
  govTextSection: {
    alignItems: 'center',
    gap: 2,
  },
  govTitleHindi: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.cyan,
    textAlign: 'center',
  },
  govTitleEng: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  
  langSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  langBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.cyan,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
  },
  langBtnActive: {
    backgroundColor: COLORS.cyan,
  },
  langBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.cyan,
  },
  langBtnTextActive: {
    color: '#ffffff',
  },

  logoArea: { alignItems: 'center', marginBottom: 20 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: COLORS.cyan,
    backgroundColor: '#ffffff',
  },
  logoSealText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.cyan,
    letterSpacing: 1,
  },

  title: {
    fontSize: 26, fontWeight: '900', color: COLORS.cyan,
    textAlign: 'center', letterSpacing: 1,
  },
  subtitle: {
    fontSize: 11, color: COLORS.textSecondary,
    textAlign: 'center', fontWeight: '700',
    marginTop: 4,
  },
  welcomeSubHeader: {
    fontSize: 13, color: COLORS.cyanBright,
    textAlign: 'center', fontWeight: '800',
    marginTop: 8,
    backgroundColor: 'rgba(255,153,51,0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: 'center',
  },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: COLORS.cardBorder, borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: '#ffffff',
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 10, fontWeight: '800' },

  infoCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5, borderColor: COLORS.cardBorder,
    borderRadius: 8, padding: 16, marginTop: 20,
  },
  infoTitle: { fontSize: 13, fontWeight: '800', color: COLORS.cyan, marginBottom: 4 },
  infoBody: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },

  enrollBanner: {
    backgroundColor: 'rgba(237,108,2,0.05)',
    borderWidth: 1.5,
    borderColor: COLORS.amber,
    borderRadius: 8,
    padding: 14,
    marginTop: 20,
    gap: 6,
  },
  enrollBannerTitle: { fontSize: 12, fontWeight: '800', color: COLORS.amber },
  enrollBannerBody: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  pinHint: { fontSize: 11, color: COLORS.amber, fontWeight: '800', marginTop: 4 },

  actions: { marginTop: 24, gap: 12 },
  
  primaryGovBtn: {
    borderRadius: 8,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  primaryGovBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  primaryGovBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },

  btnRow: { flexDirection: 'row', gap: 12 },
  secondaryGovBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5, borderColor: COLORS.cyan,
    borderRadius: 8, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  secondaryGovBtnText: {
    fontSize: 11,
    color: COLORS.cyan,
    fontWeight: '800',
  },

  footer: {
    textAlign: 'center', fontSize: 10, color: COLORS.textMuted,
    marginTop: 32, lineHeight: 16,
    fontWeight: '600',
  },
});
