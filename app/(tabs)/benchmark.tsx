// Powered by OnSpace.AI
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { GlowButton } from '@/components/ui/GlowButton';
import { runBenchmark, BenchmarkResult, BenchmarkProgress, BENCH_PROMPT_LABELS } from '@/services/benchmarkService';
import { StatusDot } from '@/components/ui/StatusDot';

export default function BenchmarkScreen() {
  const insets = useSafeAreaInsets();
  const { serverUrl, serverStatus, params } = useApp();
  const [promptIndex, setPromptIndex] = useState(0);
  const [progress, setProgress] = useState<BenchmarkProgress | null>(null);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const runningRef = useRef(false);

  async function startBenchmark() {
    if (runningRef.current) return;
    if (!serverStatus.connected) return;
    runningRef.current = true;
    setProgress({ stage: 'running', message: 'Iniciando...', tokensReceived: 0, elapsedMs: 0 });
    const result = await runBenchmark(serverUrl, params, promptIndex, (p) => setProgress(p));
    if (result) setResults((prev) => [result, ...prev.slice(0, 9)]);
    runningRef.current = false;
  }

  const isRunning = progress?.stage === 'running';
  const best = results.length > 0 ? results.reduce((a, b) => (a.tokensPerSecond > b.tokensPerSecond ? a : b)) : null;
  const avg = results.length > 0 ? results.reduce((s, r) => s + r.tokensPerSecond, 0) / results.length : 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <MaterialIcons name="speed" size={20} color={Colors.primary} />
        <Text style={styles.headerTitle}>BENCHMARK</Text>
        <View style={styles.statusRow}>
          <StatusDot connected={serverStatus.connected} size={7} />
          <Text style={[styles.statusText, { color: serverStatus.connected ? Colors.primary : Colors.error }]}>
            {serverStatus.connected ? 'online' : 'offline'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Config */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROMPT DE TESTE</Text>
          <View style={styles.promptTabs}>
            {BENCH_PROMPT_LABELS.map((label, i) => (
              <Pressable
                key={i}
                onPress={() => !isRunning && setPromptIndex(i)}
                style={[styles.promptTab, promptIndex === i && styles.promptTabActive]}
              >
                <Text style={[styles.promptTabText, promptIndex === i && { color: Colors.primary }]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Progress */}
        {progress ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>STATUS</Text>
            <View style={[styles.card, { borderColor: progress.stage === 'error' ? Colors.error : progress.stage === 'done' ? Colors.success : Colors.primary }]}>
              <View style={styles.progressRow}>
                {isRunning ? <ActivityIndicator size="small" color={Colors.primary} /> : null}
                <Text style={[styles.progressMsg, {
                  color: progress.stage === 'error' ? Colors.error : progress.stage === 'done' ? Colors.success : Colors.textPrimary
                }]}>
                  {progress.message}
                </Text>
              </View>
              {isRunning || progress.stage === 'done' ? (
                <View style={styles.metricsRow}>
                  <View style={styles.metric}>
                    <Text style={styles.metricValue}>{progress.tokensReceived}</Text>
                    <Text style={styles.metricLabel}>tokens</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricValue}>{(progress.elapsedMs / 1000).toFixed(1)}s</Text>
                    <Text style={styles.metricLabel}>tempo</Text>
                  </View>
                  {progress.elapsedMs > 0 ? (
                    <View style={styles.metric}>
                      <Text style={[styles.metricValue, { color: Colors.primary }]}>
                        {(progress.tokensReceived / (progress.elapsedMs / 1000)).toFixed(1)}
                      </Text>
                      <Text style={styles.metricLabel}>tok/s</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Summary */}
        {results.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RESUMO</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{best?.tokensPerSecond.toFixed(1)}</Text>
                <Text style={styles.summaryLabel}>Melhor tok/s</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{avg.toFixed(1)}</Text>
                <Text style={styles.summaryLabel}>Média tok/s</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{best?.firstTokenMs}ms</Text>
                <Text style={styles.summaryLabel}>First token</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* History */}
        {results.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HISTÓRICO</Text>
            {results.map((r) => (
              <View key={r.id} style={styles.resultRow}>
                <View style={styles.resultLeft}>
                  <Text style={styles.resultTokS}>
                    {r.tokensPerSecond} tok/s
                  </Text>
                  <Text style={styles.resultDate}>
                    {new Date(r.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.resultRight}>
                  <Text style={styles.resultMeta}>
                    {r.outputTokens} tokens · {(r.totalMs / 1000).toFixed(1)}s · 1st:{r.firstTokenMs}ms
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ height: insets.bottom + Spacing.xl }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <GlowButton
          label={isRunning ? 'Executando...' : 'Iniciar Benchmark'}
          onPress={startBenchmark}
          disabled={isRunning || !serverStatus.connected}
          size="lg"
          style={styles.startBtn}
        />
        {!serverStatus.connected ? (
          <Text style={styles.offlineHint}>Servidor llama.cpp offline</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    flex: 1,
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '700',
    letterSpacing: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: FontSize.xs,
  },
  scroll: {
    flex: 1,
  },
  section: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: Spacing.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  promptTabs: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  promptTab: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surfaceElevated,
  },
  promptTabActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  promptTabText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressMsg: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metric: {
    alignItems: 'center',
    gap: 2,
  },
  metricValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  metricLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 4,
  },
  summaryValue: {
    color: Colors.primary,
    fontSize: FontSize.xl,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  summaryLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  resultLeft: {
    gap: 2,
  },
  resultTokS: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  resultDate: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  resultRight: {},
  resultMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'right',
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    gap: Spacing.xs,
  },
  startBtn: {
    width: '100%',
  },
  offlineHint: {
    color: Colors.error,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
});
