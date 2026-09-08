// Powered by OnSpace.AI
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { GlowButton } from '@/components/ui/GlowButton';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { FavoritePrompt } from '@/services/storageService';

interface Props {
  visible: boolean;
  onClose: () => void;
  onUse: (content: string) => void;
}

export function FavoritePromptsModal({ visible, onClose, onUse }: Props) {
  const { favoritePrompts, addFavoritePrompt, removeFavoritePrompt } = useApp();
  const { showAlert } = useAlert();
  const [mode, setMode] = useState<'list' | 'add'>('list');
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');

  function handleSave() {
    if (!newName.trim() || !newContent.trim()) return;
    addFavoritePrompt(newName.trim(), newContent.trim());
    setNewName('');
    setNewContent('');
    setMode('list');
  }

  function handleDelete(prompt: FavoritePrompt) {
    showAlert('Excluir prompt', `Excluir "${prompt.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => removeFavoritePrompt(prompt.id) },
    ]);
  }

  function handleUse(content: string) {
    onUse(content);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Prompts Favoritos</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {mode === 'list' ? (
            <>
              <GlowButton
                label="+ Novo Prompt"
                onPress={() => setMode('add')}
                size="sm"
                style={styles.newBtn}
              />
              {favoritePrompts.length === 0 ? (
                <View style={styles.empty}>
                  <MaterialIcons name="star-outline" size={40} color={Colors.textMuted} />
                  <Text style={styles.emptyText}>Nenhum prompt salvo</Text>
                  <Text style={styles.emptySub}>Salve prompts frequentes para reutilizar rapidamente</Text>
                </View>
              ) : (
                <FlatList
                  data={favoritePrompts}
                  keyExtractor={(p) => p.id}
                  style={styles.list}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <View style={styles.promptCard}>
                      <View style={styles.promptInfo}>
                        <Text style={styles.promptName}>{item.name}</Text>
                        <Text style={styles.promptContent} numberOfLines={2}>
                          {item.content}
                        </Text>
                      </View>
                      <View style={styles.promptActions}>
                        <Pressable
                          onPress={() => handleUse(item.content)}
                          style={({ pressed }) => [styles.useBtn, pressed && { opacity: 0.7 }]}
                        >
                          <MaterialIcons name="send" size={16} color={Colors.primary} />
                        </Pressable>
                        <Pressable
                          onPress={() => handleDelete(item)}
                          style={({ pressed }) => [styles.delBtn, pressed && { opacity: 0.7 }]}
                          hitSlop={8}
                        >
                          <MaterialIcons name="delete-outline" size={16} color={Colors.textMuted} />
                        </Pressable>
                      </View>
                    </View>
                  )}
                />
              )}
            </>
          ) : (
            <View style={styles.addForm}>
              <Text style={styles.label}>Nome do prompt</Text>
              <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder="Ex: Resumo acadêmico"
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.label}>Conteúdo</Text>
              <TextInput
                style={[styles.input, { height: 110 }]}
                value={newContent}
                onChangeText={setNewContent}
                placeholder="Digite o prompt completo..."
                placeholderTextColor={Colors.textMuted}
                multiline
              />
              <View style={styles.formActions}>
                <GlowButton label="Voltar" onPress={() => setMode('list')} variant="secondary" style={{ flex: 1 }} />
                <GlowButton
                  label="Salvar"
                  onPress={handleSave}
                  disabled={!newName.trim() || !newContent.trim()}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.lg,
    maxHeight: '80%',
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  newBtn: {
    alignSelf: 'flex-start',
  },
  list: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  emptySub: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    gap: Spacing.sm,
  },
  promptInfo: {
    flex: 1,
    gap: 2,
  },
  promptName: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  promptContent: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * 1.5,
  },
  promptActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  useBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addForm: {
    gap: Spacing.sm,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.sm,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    includeFontPadding: false,
  } as Record<string, unknown>,
  formActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
});
