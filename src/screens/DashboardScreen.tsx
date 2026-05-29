import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, T } from '../theme';
import { LocalSecureStorage } from '../store/localDB';
import type { AuthLog } from '../store/localDB';

interface Props {
  logs: AuthLog[];
  enrolledCount: number;
  networkOnline: boolean;
  onToggleNetwork: () => void;
  onBack: () => void;
  onRefresh: () => void;
}

export default function DashboardScreen({
  logs,
  enrolledCount,
  networkOnline,
  onToggleNetwork,
  onBack,
  onRefresh,
}: Props) {
  const [consoleOutput, setConsoleOutput] = useState<string[]>([
    'System Initialized.',
    'Offline DB ready. SQLite simulation active.',
  ]);
  const [syncing, setSyncing] = useState(false);
  const [purging, setPurging] = useState(false);

  const consoleScrollRef = useRef<ScrollView>(null);

  const writeToConsole = (msg: string) => {
    setConsoleOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    // Auto scroll console to bottom
    setTimeout(() => {
      consoleScrollRef.current?.scrollToEnd({ animated: true });
    }, 50);
  }, [consoleOutput]);

  const handleSync = async () => {
    if (!networkOnline) {
      Alert.alert('Network Offline', 'Simulated network is offline. Please toggle Network Online first.');
      writeToConsole('SYNC ERR: Simulated gateway offline.');
      return;
    }

    setSyncing(true);
    writeToConsole('Initiating AWS Sync Handshake...');
    
    try {
      const count = await LocalSecureStorage.syncWithAWS((msg) => {
        writeToConsole(msg);
      });
      writeToConsole(`Sync process complete. ${count} record(s) uploaded.`);
      onRefresh();
    } catch (err) {
      writeToConsole('ERROR: AWS Synced handshakes interrupted.');
    } finally {
      setSyncing(false);
    }
  };

  const handlePurge = async () => {
    setPurging(true);
    writeToConsole('Initiating flash purge cycle...');

    try {
      const count = await LocalSecureStorage.purgeSynced((msg) => {
        writeToConsole(msg);
      });
      writeToConsole(`Purge process complete. ${count} local record(s) wiped.`);
      onRefresh();
    } catch (err) {
      writeToConsole('ERROR: Purge failure.');
    } finally {
      setPurging(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Local Secure Database',
      'This will delete all custom enrolled profiles and delete all attendance logs. Registry will revert to default 4 employees. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'WIPE EVERYTHING',
          style: 'destructive',
          onPress: async () => {
            await LocalSecureStorage.resetAll();
            writeToConsole('WARNING: Master Database wiped. Reverting to default registry.');
            onRefresh();
          },
        },
      ]
    );
  };

  const pendingCount = logs.filter(l => l.syncStatus === 'PENDING').length;
  const syncedCount = logs.filter(l => l.syncStatus === 'SYNCED').length;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      
      {/* Top Bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={s.screenTitle}>SYSTEM DASHBOARD</Text>
        <TouchableOpacity onPress={onRefresh} style={s.backBtn}>
          <Text style={s.backText}>REFRESH ↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Network & Config Card */}
        <View style={T.card}>
          <Text style={s.cardTitle}>Gateway Environment Configuration</Text>
          
          <View style={s.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldTitle}>Simulated Network Status</Text>
              <Text style={s.fieldSubtitle}>
                {networkOnline 
                  ? 'Active cellular / wifi link verified.' 
                  : 'Zero-network environment. Local caching mode active.'}
              </Text>
            </View>
            <Switch
              value={networkOnline}
              onValueChange={onToggleNetwork}
              trackColor={{ false: COLORS.slate800, true: 'rgba(6,182,212,0.4)' }}
              thumbColor={networkOnline ? COLORS.cyan : COLORS.textMuted}
            />
          </View>

          <View style={s.divider} />

          {/* Database stats */}
          <View style={s.statsRow}>
            <View style={s.statCol}>
              <Text style={s.statNum}>{enrolledCount}</Text>
              <Text style={s.statLabel}>Enrolled Officers</Text>
            </View>
            <View style={s.statCol}>
              <Text style={[s.statNum, pendingCount > 0 && { color: COLORS.amber }]}>{pendingCount}</Text>
              <Text style={s.statLabel}>Pending Sync</Text>
            </View>
            <View style={s.statCol}>
              <Text style={[s.statNum, { color: COLORS.textMuted }]}>{syncedCount}</Text>
              <Text style={s.statLabel}>Cached Synced</Text>
            </View>
          </View>
        </View>

        {/* Sync Console Control Center */}
        <View style={[T.card, { borderColor: 'rgba(6,182,212,0.1)' }]}>
          <Text style={s.cardTitle}>AWS Synchronization Hub</Text>
          <Text style={s.cardDesc}>
            Deploy captured logs into the cloud. Use purge to zero out local files for absolute security.
          </Text>

          <View style={s.btnGrid}>
            <TouchableOpacity 
              style={[s.btnSync, syncing && s.btnDisabled]} 
              onPress={handleSync}
              disabled={syncing}
            >
              <Text style={s.btnSyncText}>☁ AWS LOGS SYNC</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[s.btnPurge, purging && s.btnDisabled]} 
              onPress={handlePurge}
              disabled={purging}
            >
              <Text style={s.btnPurgeText}>🗑 FLASH PURGE</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.btnReset} onPress={handleReset}>
            <Text style={s.btnResetText}>⚠️ RESET MASTER SECURE DATABASE</Text>
          </TouchableOpacity>
        </View>

        {/* System Terminal Console */}
        <View style={s.consoleCard}>
          <View style={s.consoleHeader}>
            <View style={s.consoleHeaderDot} />
            <Text style={s.consoleHeaderTitle}>SYSTEM TERMINAL LOGS CONSOLE</Text>
          </View>
          <ScrollView
            ref={consoleScrollRef}
            style={s.consoleScroll}
            contentContainerStyle={s.consoleContent}
            nestedScrollEnabled={true}
          >
            {consoleOutput.map((line, idx) => (
              <Text key={idx} style={s.consoleLine}>
                {line}
              </Text>
            ))}
          </ScrollView>
        </View>

        {/* Attendance Journals */}
        <View style={T.card}>
          <Text style={s.cardTitle}>Biometric Attendance Journals ({logs.length})</Text>
          
          {logs.length === 0 ? (
            <Text style={s.emptyText}>No attendance records verified yet.</Text>
          ) : (
            <View style={{ gap: 8, marginTop: 10 }}>
              {logs.map(log => (
                <View key={log.id} style={s.logItem}>
                  <View style={s.rowBetween}>
                    <View>
                      <Text style={s.logEmpName}>{log.employeeName}</Text>
                      <Text style={s.logEmpId}>{log.employeeId}</Text>
                    </View>
                    <View style={log.syncStatus === 'PENDING' ? T.badgeAmber : T.badgeCyan}>
                      <Text style={log.syncStatus === 'PENDING' ? s.badgeTextAmber : s.badgeTextCyan}>
                        {log.syncStatus}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={s.logDetailRow}>
                    <Text style={s.logMeta}>Score: {log.matchScore}%</Text>
                    <Text style={s.logMeta}>📍 {log.gpsCoords}</Text>
                  </View>
                  <Text style={s.logTimestamp}>
                    Time: {new Date(log.timestamp).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  backBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  backText: { color: COLORS.cyan, fontSize: 11, fontFamily: 'Courier New', letterSpacing: 1 },
  screenTitle: { fontSize: 12, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 2 },

  scrollContainer: { padding: 20, gap: 20, paddingBottom: 60 },

  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.cyanBright,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  cardDesc: { fontSize: 11, color: COLORS.textSecondary, lineHeight: 16, marginBottom: 16 },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  fieldTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  fieldSubtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, lineHeight: 15 },

  divider: { height: 1, backgroundColor: COLORS.slate800, marginVertical: 14 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCol: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.5)', borderRadius: 10, padding: 10 },
  statNum: { fontSize: 20, fontWeight: '900', color: COLORS.cyanBright },
  statLabel: { fontSize: 9, color: COLORS.textMuted, letterSpacing: 0.5, marginTop: 4, fontFamily: 'Courier New' },

  btnGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  btnSync: {
    flex: 1,
    backgroundColor: 'rgba(6,182,212,0.12)',
    borderWidth: 1,
    borderColor: COLORS.cyan,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnSyncText: { fontSize: 10, fontWeight: '700', color: COLORS.cyanBright, letterSpacing: 1, fontFamily: 'Courier New' },
  
  btnPurge: {
    flex: 1,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: COLORS.emerald,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnPurgeText: { fontSize: 10, fontWeight: '700', color: COLORS.emerald, letterSpacing: 1, fontFamily: 'Courier New' },
  
  btnDisabled: { opacity: 0.5 },

  btnReset: {
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.3)',
    backgroundColor: 'rgba(244,63,94,0.04)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  btnResetText: { fontSize: 9, fontWeight: '700', color: COLORS.rose, letterSpacing: 1, fontFamily: 'Courier New' },

  consoleCard: {
    backgroundColor: '#02040a',
    borderColor: 'rgba(6,182,212,0.2)',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  consoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#080d1a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(6,182,212,0.15)',
  },
  consoleHeaderDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.emerald },
  consoleHeaderTitle: { fontSize: 8, fontWeight: '800', color: COLORS.textSecondary, letterSpacing: 1, fontFamily: 'Courier New' },
  consoleScroll: { height: 120, padding: 10 },
  consoleContent: { paddingBottom: 10 },
  consoleLine: { fontSize: 9, color: '#38bdf8', fontFamily: 'Courier New', lineHeight: 14, marginBottom: 4 },

  emptyText: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 20 },
  logItem: {
    backgroundColor: 'rgba(15,23,42,0.6)',
    borderWidth: 1,
    borderColor: COLORS.slate800,
    borderRadius: 10,
    padding: 12,
  },
  logEmpName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  logEmpId: { fontSize: 9, color: COLORS.textMuted, fontFamily: 'Courier New', marginTop: 1 },
  logDetailRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  logMeta: { fontSize: 10, color: COLORS.textSecondary, fontFamily: 'Courier New' },
  logTimestamp: { fontSize: 8, color: COLORS.textMuted, fontFamily: 'Courier New', marginTop: 4 },

  badgeTextAmber: { fontSize: 8, fontWeight: '800', color: COLORS.amber, letterSpacing: 0.5, fontFamily: 'Courier New' },
  badgeTextCyan: { fontSize: 8, fontWeight: '800', color: COLORS.cyanBright, letterSpacing: 0.5, fontFamily: 'Courier New' },
});
