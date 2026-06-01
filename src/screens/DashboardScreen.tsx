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
import { COLORS, T } from '../theme';
import { LocalSecureStorage } from '../store/localDB';
import type { AuthLog } from '../store/localDB';
import { Language, getTranslation } from '../utils/translations';

interface Props {
  logs: AuthLog[];
  enrolledCount: number;
  networkOnline: boolean;
  onToggleNetwork: () => void;
  onBack: () => void;
  onRefresh: () => void;
  language: Language;
}

export default function DashboardScreen({
  logs,
  enrolledCount,
  networkOnline,
  onToggleNetwork,
  onBack,
  onRefresh,
  language,
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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Top Bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backText}>{getTranslation(language, 'btnBack')}</Text>
        </TouchableOpacity>
        <Text style={s.screenTitle}>{getTranslation(language, 'dbTitle')}</Text>
        <TouchableOpacity onPress={onRefresh} style={s.backBtn}>
          <Text style={s.backText}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Network & Config Card */}
        <View style={T.card}>
          <Text style={s.cardTitle}>{getTranslation(language, 'dbActionsSection')}</Text>
          
          <View style={s.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldTitle}>{getTranslation(language, 'dbToggleNet')}</Text>
              <Text style={s.fieldSubtitle}>
                {networkOnline 
                  ? getTranslation(language, 'dbOnlineActive')
                  : getTranslation(language, 'dbOfflineActive')}
              </Text>
            </View>
            <Switch
              value={networkOnline}
              onValueChange={onToggleNetwork}
              trackColor={{ false: '#cbd5e1', true: 'rgba(11,60,93,0.3)' }}
              thumbColor={networkOnline ? COLORS.cyan : '#64748b'}
            />
          </View>

          <View style={s.divider} />

          {/* Database stats */}
          <View style={s.statsRow}>
            <View style={s.statCol}>
              <Text style={s.statNum}>{enrolledCount}</Text>
              <Text style={s.statLabel}>{getTranslation(language, 'enrolledCount', { count: '' }).trim()}</Text>
            </View>
            <View style={s.statCol}>
              <Text style={[s.statNum, pendingCount > 0 && { color: COLORS.amber }]}>{pendingCount}</Text>
              <Text style={s.statLabel}>{getTranslation(language, 'pendingSync', { count: '' }).trim()}</Text>
            </View>
            <View style={s.statCol}>
              <Text style={[s.statNum, { color: '#64748b' }]}>{syncedCount}</Text>
              <Text style={s.statLabel}>SYNCED</Text>
            </View>
          </View>
        </View>

        {/* Sync Console Control Center */}
        <View style={T.card}>
          <Text style={s.cardTitle}>{getTranslation(language, 'dbLogsSection')}</Text>
          <Text style={s.cardDesc}>
            {getTranslation(language, 'zeroNetworkDesc')}
          </Text>

          <View style={s.btnGrid}>
            <TouchableOpacity 
              style={[s.btnSync, syncing && s.btnDisabled]} 
              onPress={handleSync}
              disabled={syncing}
            >
              <Text style={s.btnSyncText}>☁ {getTranslation(language, 'dbForceSync')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[s.btnPurge, purging && s.btnDisabled]} 
              onPress={handlePurge}
              disabled={purging}
            >
              <Text style={s.btnPurgeText}>🗑 {getTranslation(language, 'dbClearLogs')}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.btnReset} onPress={handleReset}>
            <Text style={s.btnResetText}>⚠️ {getTranslation(language, 'dbResetDB')}</Text>
          </TouchableOpacity>
        </View>

        {/* System Terminal Console */}
        <View style={s.consoleCard}>
          <View style={s.consoleHeader}>
            <View style={s.consoleHeaderDot} />
            <Text style={s.consoleHeaderTitle}>{getTranslation(language, 'dbSystemConsole')}</Text>
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
          <Text style={s.cardTitle}>{getTranslation(language, 'dbLogsSection')} ({logs.length})</Text>
          
          {logs.length === 0 ? (
            <Text style={s.emptyText}>{getTranslation(language, 'dbLogsPlaceholder')}</Text>
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
  root: { flex: 1, backgroundColor: '#f8fafc' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1.5,
    borderBottomColor: '#cbd5e1',
    elevation: 2,
  },
  backBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  backText: { color: COLORS.cyan, fontSize: 13, fontWeight: '700' },
  screenTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary },

  scrollContainer: { padding: 20, gap: 20, paddingBottom: 60 },

  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.cyan,
    marginBottom: 8,
  },
  cardDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 16 },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  fieldTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  fieldSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 17 },

  divider: { height: 1.5, backgroundColor: '#cbd5e1', marginVertical: 14 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCol: { flex: 1, alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', padding: 10 },
  statNum: { fontSize: 20, fontWeight: '900', color: COLORS.cyan },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '700', marginTop: 4, textAlign: 'center' },

  btnGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  btnSync: {
    flex: 1,
    backgroundColor: COLORS.cyan,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnSyncText: { fontSize: 12, fontWeight: '800', color: '#ffffff' },
  
  btnPurge: {
    flex: 1,
    backgroundColor: 'rgba(19,136,8,0.1)',
    borderWidth: 1.5,
    borderColor: COLORS.emerald,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnPurgeText: { fontSize: 12, fontWeight: '800', color: COLORS.emerald },
  
  btnDisabled: { opacity: 0.5 },

  btnReset: {
    borderWidth: 1.5,
    borderColor: 'rgba(244,63,94,0.3)',
    backgroundColor: 'rgba(244,63,94,0.04)',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  btnResetText: { fontSize: 11, fontWeight: '800', color: COLORS.rose },

  consoleCard: {
    backgroundColor: 'rgba(11,60,93,0.95)',
    borderColor: '#ff9933',
    borderWidth: 1.5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  consoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(11,60,93,1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: '#ff9933',
  },
  consoleHeaderDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.emerald },
  consoleHeaderTitle: { fontSize: 9, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },
  consoleScroll: { height: 100, padding: 10 },
  consoleContent: { paddingBottom: 10 },
  consoleLine: { fontSize: 10, color: '#7dd3fc', lineHeight: 14, marginBottom: 4 },

  emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 20 },
  logItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
  },
  logEmpName: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  logEmpId: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', marginTop: 1 },
  logDetailRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  logMeta: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  logTimestamp: { fontSize: 10, color: COLORS.textSecondary, marginTop: 4 },

  badgeTextAmber: { fontSize: 9, fontWeight: '800', color: COLORS.amber },
  badgeTextCyan: { fontSize: 9, fontWeight: '800', color: COLORS.cyan },
});
