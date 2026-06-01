import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LocalSecureStorage } from './src/store/localDB';
import type { EmployeeProfile } from './src/utils/faceMath';
import type { AuthLog } from './src/store/localDB';
import { COLORS } from './src/theme';
import { Language } from './src/utils/translations';

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import AuthScreen from './src/screens/AuthScreen';
import EnrollScreen from './src/screens/EnrollScreen';
import DashboardScreen from './src/screens/DashboardScreen';

type ScreenState = 'WELCOME' | 'AUTH' | 'ENROLL' | 'DASHBOARD';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('WELCOME');
  const [registry, setRegistry] = useState<EmployeeProfile[]>([]);
  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [networkOnline, setNetworkOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('en');

  // Load database on start
  const loadDatabase = async () => {
    try {
      const enrolled = await LocalSecureStorage.getEnrolledProfiles();
      const allLogs = await LocalSecureStorage.getLogs();
      setRegistry(enrolled);
      setLogs(allLogs);
    } catch (err) {
      console.error('Failed to load local DB', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  const refreshData = async () => {
    const enrolled = await LocalSecureStorage.getEnrolledProfiles();
    const allLogs = await LocalSecureStorage.getLogs();
    setRegistry(enrolled);
    setLogs(allLogs);
  };

  if (loading) {
    return (
      <View style={s.loadingRoot}>
        <ActivityIndicator size="large" color={COLORS.cyan} />
        <Text style={s.loadingText}>BOOTING SECURE ENCLAVE...</Text>
      </View>
    );
  }

  const pendingLogsCount = logs.filter(l => l.syncStatus === 'PENDING').length;

  return (
    <View style={s.container}>
      <StatusBar style="light" />

      {screen === 'WELCOME' && (
        <WelcomeScreen
          onAuthenticate={() => setScreen('AUTH')}
          onEnroll={() => setScreen('ENROLL')}
          onDashboard={() => setScreen('DASHBOARD')}
          networkOnline={networkOnline}
          pendingLogs={pendingLogsCount}
          enrolledCount={registry.length}
          language={language}
          onChangeLanguage={setLanguage}
        />
      )}

      {screen === 'AUTH' && (
        <AuthScreen
          registry={registry}
          onBack={() => setScreen('WELCOME')}
          onLogAdded={refreshData}
          language={language}
        />
      )}

      {screen === 'ENROLL' && (
        <EnrollScreen
          onBack={() => setScreen('WELCOME')}
          onProfileAdded={refreshData}
          language={language}
        />
      )}

      {screen === 'DASHBOARD' && (
        <DashboardScreen
          logs={logs}
          enrolledCount={registry.length}
          networkOnline={networkOnline}
          onToggleNetwork={() => setNetworkOnline(p => !p)}
          onBack={() => setScreen('WELCOME')}
          onRefresh={refreshData}
          language={language}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 10,
    fontFamily: 'Courier New',
    color: COLORS.cyan,
    letterSpacing: 2,
    fontWeight: '800',
  },
});
