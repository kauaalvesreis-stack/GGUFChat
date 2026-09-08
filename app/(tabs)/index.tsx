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

const PANEL_WIDTH = 260;

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
    isLoading,
  } = useApp();
  const { sendMessage, stopGeneration, isGenerating } = useChat();

  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);
  const [showSettings, setShowSettings] = useState(false);

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
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [serverUrl]);

  // Sync current session with store
  useEffect(() => {
    if (!activeSessionId) {
      setCurrentSession(null);
      return;
    }
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
      handleNewChat().then(() => {
        // Will be sent after session is created via effect
      });
      return;
    }
    sendMessage(currentSession, text, (updated) => {
      setCurrentSession(updated);
      updateSession(updated);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    });
  }

  function togglePanel(panel: SidePanel) {
    setSidePanel((prev) => (prev === panel ? null : panel));
  }

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
          <Pressable onPress={handleNewChat} style={styles.headerBtn} hitSlop={8}>
            <MaterialIcons name="add-comment" size={22} color={Colors.textSecondary} />
          </Pressable>
          <Pressable onPress={() => setShowSettings(true)} style={styles.headerBtn} hitSlop={8}>
            <MaterialIcons name="tune" size={22} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Side panel */}
        {sidePanel !== null ? (
          <View style={[styles.panel, { width: isNarrow ? dims.width * 0.72 : PANEL_WIDTH }]}>
            {sidePanel === 'models' ? (
              <ModelsPanel />
            ) : (
              <HistoryPanel onSelectSession={handleSelectSession} onNewChat={handleNewChat} />
            )}
          </View>
        ) : null}

        {/* Chat area */}
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
      </View>

      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
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
    gap: Spacing.sm,
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
    gap: Spacing.sm,
    width: 80,
    justifyContent: 'flex-end',
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
