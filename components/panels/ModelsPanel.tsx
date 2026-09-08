// Powered by OnSpace.AI
import React, { useState } from 'react';
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
import { LlamaModel } from '@/services/llamaService';
import { StatusDot } from '@/components/ui/StatusDot';
import { GlowButton } from '@/components/ui/GlowButton';
import { AddModelModal } from '@/components/modals/AddModelModal';
import { HuggingFaceModal } from '@/components/modals/HuggingFaceModal';
import { useAlert } from '@/template';

export function ModelsPanel() {
  const { models, addModel, removeModel, activeModelId, setActiveModelId, serverStatus } = useApp();
  const { showAlert } = useAlert();
  const [showAdd, setShowAdd] = useState(false);
  const [showHF, setShowHF] = useState(false);

  function confirmRemove(model: LlamaModel) {
    showAlert('Remover modelo', `Remover "${model.name}" da lista?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removeModel(model.id) },
    ]);
  }

  function renderModel({ item }: { item: LlamaModel }) {
    const isActive = item.id === activeModelId;
    const isUrl = item.path.startsWith('http');
    return (
      <Pressable
        onPress={() => setActiveModelId(isActive ? null : item.id)}
        style={({ pressed }) => [
          styles.modelCard,
          isActive && styles.modelCardActive,
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={styles.modelLeft}>
          <MaterialIcons
            name={isUrl ? 'cloud' : 'memory'}
            size={18}
            color={isActive ? Colors.primary : Colors.textSecondary}
          />
          <View style={styles.modelInfo}>
            <Text style={[styles.modelName, isActive && { color: Colors.primary }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.modelPath} numberOfLines={1}>
              {item.path}
            </Text>
          </View>
        </View>
        <Pressable onPress={() => confirmRemove(item)} hitSlop={8}>
          <MaterialIcons name="delete-outline" size={18} color={Colors.textMuted} />
        </Pressable>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Modelos GGUF</Text>
        <View style={styles.statusRow}>
          <StatusDot connected={serverStatus.connected} size={8} />
          <Text style={[styles.statusText, { color: serverStatus.connected ? Colors.primary : Colors.error }]}>
            {serverStatus.connected ? 'Servidor online' : 'Desconectado'}
          </Text>
        </View>
      </View>

      {models.length === 0 ? (
        <View style={styles.empty}>
          <MaterialIcons name="folder-open" size={36} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Nenhum modelo adicionado</Text>
          <Text style={styles.emptyHint}>Adicione um arquivo .gguf para começar</Text>
        </View>
      ) : (
        <FlatList
          data={models}
          keyExtractor={(m) => m.id}
          renderItem={renderModel}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.buttons}>
        <GlowButton
          label="+ Adicionar"
          onPress={() => setShowAdd(true)}
          size="sm"
          style={{ flex: 1 }}
        />
        <GlowButton
          label="HuggingFace"
          onPress={() => setShowHF(true)}
          size="sm"
          variant="secondary"
          style={{ flex: 1 }}
        />
      </View>

      <AddModelModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={addModel} />
      <HuggingFaceModal visible={showHF} onClose={() => setShowHF(false)} />
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
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusText: {
    fontSize: FontSize.xs,
  },
  list: {
    flex: 1,
  },
  modelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  modelCardActive: {
    backgroundColor: Colors.primaryGlow,
  },
  modelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    marginRight: Spacing.sm,
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  modelPath: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  emptyHint: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.xs,
    margin: Spacing.md,
  },
});
