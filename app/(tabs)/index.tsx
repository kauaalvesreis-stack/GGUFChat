// Powered by OnSpace.AI
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useChat } from '@/hooks/useChat';
import { ChatSession } from '@/services/llamaService';
import { checkServerStatus } from '@/services/llamaService';
import { MessageBubble, ChatInput, ModelsPanel, HistoryPanel, SettingsModal } from '@/components';
import { StatusDot } from '@/components/ui/StatusDot';
import { RagModal } from '@/components/modals/RagModal';
import { estimateSessionTokens } from '@/services/ragService';

const PANEL_WIDTH = 260;
const MAX_CTX_TOKENS = 4096;

type SidePanel = 'models' | 'history' | null;

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createSession,
    updateSession,
    activeModelId,
    serverUrl,
    serverStatus,
    setServerStatus,
    params,
    ragDocuments,
    ragEnabled,
    isLoading,
  } = useApp();
  const { sendMessage, stopGeneration, isGenerating } = useChat();

  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showRag, setShowRag] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const dims = Dimensions.get('window');

  // Poll server status every 10s
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const status = await checkServerStatus(serverUrl);
      if (!cancelled) setServerStatus(status);
    }
    poll();
    const interval = setInterval(poll, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [serverUrl]);

  // Sync current session with store
  useEffect(() => {
    if (!activeSessionId) { setCurrentSession(null); return; }
    const found = sessions.find((s) => s.id === activeSessionId);
    if (found) setCurrentSession(found);
  }, [activeSessionId, sessions]);

  async function handleNewChat() {
    setSidePanel(null);
    const modelId = activeModelId ?? 'default';
    const session = await createSession(modelId);
    setCurrentSession(session);
  }

  function handleSelectSession(session: ChatSession) {
    setCurrentSession(session);
    setActiveSessionId(session.id);
    setSidePanel(null);
  }

  function handleSend(text: string) {
    if (!currentSession) {
      handleNewChat().then(() => {});
      return;
    }
    sendMessage(currentSession, text, (updated) => {
      setCurrentSession(updated);
      updateSession(updated);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    });
  }

  async function handleExport() {
    if (!currentSession || currentSession.messages.length === 0) return;
    const lines = currentSession.messages.map((m) => {
      const role = m.role === 'user' ? 'Você' : 'AI';
      const time = new Date(m.timestamp).toLocaleString('pt-BR');
      return `[${role}] ${time}\n${m.content}`;
    });
    const content = `# ${currentSession.title}\n\n${lines.join('\n\n---\n\n')}`;
    try {
      await Share.share({ message: content, title: currentSession.title });
    } catch {
      // ignore
    }
  }

  function togglePanel(panel: SidePanel) {
    setSidePanel((prev) => (prev === panel ? null : panel));
  }

  const contextTokens = currentSession ? estimateSessionTokens(currentSession.messages) : 0;
  const contextPercent = Math.min((contextTokens / MAX_CTX_TOKENS) * 100, 100);
  const isEmpty = !currentSession || currentSession.messages.length === 0;
  const isNarrow = dims.width < 700;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => togglePanel('models')} style={styles.headerBtn} hitSlop={8}>
            <MaterialIcons
              name="memory"
              size={22}
              color={sidePanel === 'models' ? Colors.primary : Colors.textSecondary}
            />
          </Pressable>
          <Pressable onPress={() => togglePanel('history')} style={styles.headerBtn} hitSlop={8}>
            <MaterialIcons
              name="history"
              size={22}
              color={sidePanel === 'history' ? Colors.primary : Colors.textSecondary}
            />
          </Pressable>
        </View>

        <View style={styles.headerCenter}>
          <StatusDot connected={serverStatus.connected} size={8} />
          <Text style={styles.headerTitle}>GGUF Chat</Text>
        </View>

        <View style={styles.headerRight}>
          {/* RAG toggle */}
          <Pressable onPress={() => setShowRag(true)} style={styles.headerBtn} hitSlop={8}>
            <MaterialIcons
              name="auto-awesome"
              size={20}
              color={ragEnabled && ragDocuments.length > 0 ? Colors.accent : Colors.textSecondary}
            />
          </Pressable>
          {/* Export */}
          <Pressable onPress={handleExport} style={styles.headerBtn} hitSlop={8} disabled={isEmpty}>
            <MaterialIcons
              name="ios-share"
              size={20}
              color={isEmpty ? Colors.textMuted : Colors.textSecondary}
            />
          </Pressable>
          <Pressable onPress={handleNewChat} style={styles.headerBtn} hitSlop={8}>
            <MaterialIcons name="add-comment" size={22} color={Colors.textSecondary} />
          </Pressable>
          <Pressable onPress={() => setShowSettings(true)} style={styles.headerBtn} hitSlop={8}>
            <MaterialIcons name="tune" size={22} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Context window bar */}
      {contextTokens > 0 ? (
        <View style={styles.ctxBar}>
          <Text style={styles.ctxLabel}>
            Contexto: {contextTokens.toLocaleString()} / {MAX_CTX_TOKENS} tokens
          </Text>
          <View style={styles.ctxTrack}>
            <View
              style={[
                styles.ctxFill,
                {
                  width: `${contextPercent}%` as `${number}%`,
                  backgroundColor: contextPercent > 80 ? Colors.error : contextPercent > 60 ? Colors.warning : Colors.primary,
                },
              ]}
            />
          </View>
          {contextPercent > 75 ? (
            <Text style={styles.ctxWarn}>⚠ Janela quase cheia</Text>
          ) : null}
        </View>
      ) : null}

      {/* Body */}
      <View style={styles.body}>
        {sidePanel !== null ? (
          <View style={[styles.panel, { width: isNarrow ? dims.width * 0.72 : PANEL_WIDTH }]}>
            {sidePanel === 'models' ? (
              <ModelsPanel />
            ) : (
              <HistoryPanel onSelectSession={handleSelectSession} onNewChat={handleNewChat} />
            )}
          </View>
        ) : null}

        <View style={styles.chat}>
          {isEmpty ? (
            <View style={styles.welcome}>
              <MaterialIcons name="psychology" size={52} color={Colors.primaryDim} />
              <Text style={styles.welcomeTitle}>GGUF Chat</Text>
              <Text style={styles.welcomeSub}>
                Conecte ao servidor llama.cpp e carregue um modelo GGUF para começar
              </Text>
              <View style={styles.welcomeRow}>
                <View style={[styles.badge, { borderColor: serverStatus.connected ? Colors.primary : Colors.error }]}>
                  <StatusDot connected={serverStatus.connected} size={7} />
                  <Text style={[styles.badgeText, { color: serverStatus.connected ? Colors.primary : Colors.error }]}>
                    {serverStatus.connected ? 'Servidor online' : 'Servidor offline'}
                  </Text>
                </View>
                {activeModelId ? (
                  <View style={[styles.badge, { borderColor: Colors.accent }]}>
                    <MaterialIcons name="memory" size={12} color={Colors.accent} />
                    <Text style={[styles.badgeText, { color: Colors.accent }]}>Modelo selecionado</Text>
                  </View>
                ) : null}
                {ragEnabled && ragDocuments.length > 0 ? (
                  <View style={[styles.badge, { borderColor: Colors.accent }]}>
                    <MaterialIcons name="auto-awesome" size={12} color={Colors.accent} />
                    <Text style={[styles.badgeText, { color: Colors.accent }]}>RAG ativo ({ragDocuments.length} docs)</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.welcomeTip}>
                {!serverStatus.connected
                  ? 'Inicie o servidor: llama-server -m seu-modelo.gguf'
                  : 'Digite uma mensagem para começar'}
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={currentSession?.messages}
              keyExtractor={(m) => m.id}
              renderItem={({ item }) => <MessageBubble message={item} />}
              contentContainerStyle={styles.messages}
              showsVerticalScrollIndicator={false}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />
          )}

          <ChatInput
            onSend={handleSend}
            onStop={stopGeneration}
            isGenerating={isGenerating}
            disabled={false}
          />
        </View>
      </View>

      {/* Params bar */}
      <View style={[styles.paramsBar, { paddingBottom: insets.bottom + 4 }]}>
        <Text style={styles.paramChip}>T:{params.temperature}</Text>
        <Text style={styles.paramChip}>P:{params.top_p}</Text>
        <Text style={styles.paramChip}>K:{params.top_k}</Text>
        <Text style={styles.paramChip}>Max:{params.max_tokens}</Text>
        <Text style={[styles.paramChip, params.stream && { color: Colors.primary }]}>
          {params.stream ? 'Stream ON' : 'Stream OFF'}
        </Text>
        {ragEnabled && ragDocuments.length > 0 ? (
          <Text style={[styles.paramChip, { color: Colors.accent }]}>RAG:{ragDocuments.length}</Text>
        ) : null}
      </View>

      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
      <RagModal visible={showRag} onClose={() => setShowRag(false)} />
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    gap: Spacing.xs,
    width: 80,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerTitle: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.xs,
    width: 140,
    justifyContent: 'flex-end',
  },
  headerBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctxBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  ctxLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    minWidth: 200,
  },
  ctxTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.surfaceBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  ctxFill: {
    height: '100%',
    borderRadius: 2,
  },
  ctxWarn: {
    color: Colors.warning,
    fontSize: FontSize.xs,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  panel: {
    borderRightWidth: 1,
    borderRightColor: Colors.surfaceBorder,
  },
  chat: {
    flex: 1,
    flexDirection: 'column',
  },
  messages: {
    paddingVertical: Spacing.md,
  },
  welcome: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  welcomeTitle: {
    color: Colors.primary,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    letterSpacing: 2,
  },
  welcomeSub: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.6,
  },
  welcomeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  welcomeTip: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  paramsBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: 6,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    flexWrap: 'wrap',
  },
  paramChip: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
