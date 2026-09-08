// Powered by OnSpace.AI
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { ChatSession } from '@/services/llamaService';
import { GlowButton } from '@/components/ui/GlowButton';
import { useAlert } from '@/template';

interface Props {
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
}

export function HistoryPanel({ onSelectSession, onNewChat }: Props) {
  const { sessions, activeSessionId, deleteSession } = useApp();
  const { showAlert } = useAlert();

  function confirmDelete(session: ChatSession) {
    showAlert('Excluir conversa', `Excluir "${session.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => deleteSession(session.id),
      },
    ]);
  }

  function renderSession({ item }: { item: ChatSession }) {
    const isActive = item.id === activeSessionId;
    const lastMsg = item.messages[item.messages.length - 1];
    return (
      <Pressable
        onPress={() => onSelectSession(item)}
        style={({ pressed }) => [
          styles.sessionCard,
          isActive && styles.sessionCardActive,
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={styles.sessionContent}>
          <Text style={[styles.sessionTitle, isActive && { color: Colors.primary }]} numberOfLines={1}>
            {item.title}
          </Text>
          {lastMsg ? (
            <Text style={styles.sessionPreview} numberOfLines={1}>
              {lastMsg.role === 'user' ? 'Você: ' : 'AI: '}
              {lastMsg.content}
            </Text>
          ) : null}
          <Text style={styles.sessionDate}>
            {new Date(item.updatedAt).toLocaleDateString('pt-BR')}
          </Text>
        </View>
        <Pressable onPress={() => confirmDelete(item)} hitSlop={8} style={styles.deleteBtn}>
          <MaterialIcons name="delete-outline" size={16} color={Colors.textMuted} />
        </Pressable>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Histórico</Text>
      </View>
      <GlowButton
        label="+ Nova Conversa"
        onPress={onNewChat}
        size="sm"
        style={styles.newBtn}
      />
      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <MaterialIcons name="chat-bubble-outline" size={36} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Nenhuma conversa ainda</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(s) => s.id}
          renderItem={renderSession}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRightWidth: 1,
    borderRightColor: Colors.surfaceBorder,
  },
  header: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  title: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  newBtn: {
    margin: Spacing.md,
    marginBottom: Spacing.sm,
  },
  list: {
    flex: 1,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  sessionCardActive: {
    backgroundColor: Colors.primaryGlow,
  },
  sessionContent: {
    flex: 1,
    gap: 2,
  },
  sessionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  sessionPreview: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  sessionDate: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  deleteBtn: {
    padding: 4,
    marginLeft: Spacing.sm,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
});
