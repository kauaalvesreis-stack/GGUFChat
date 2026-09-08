// Powered by OnSpace.AI
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { LlamaModel } from '@/services/llamaService';
import { GlowButton } from '@/components/ui/GlowButton';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (model: LlamaModel) => void;
}

const PRESETS = [
  { name: 'Llama 3.2 3B Q4', path: '/models/llama-3.2-3b-q4_k_m.gguf' },
  { name: 'Mistral 7B Q4', path: '/models/mistral-7b-q4_k_m.gguf' },
  { name: 'Phi-3 Mini Q4', path: '/models/phi-3-mini-q4.gguf' },
  { name: 'Gemma 2 2B Q8', path: '/models/gemma-2-2b-q8_0.gguf' },
];

export function AddModelModal({ visible, onClose, onAdd }: Props) {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');

  function handleAdd() {
    if (!name.trim() || !path.trim()) return;
    onAdd({
      id: `${Date.now()}`,
      name: name.trim(),
      path: path.trim(),
      addedAt: Date.now(),
    });
    setName('');
    setPath('');
    onClose();
  }

  function applyPreset(preset: { name: string; path: string }) {
    setName(preset.name);
    setPath(preset.path);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Adicionar Modelo GGUF</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Presets populares</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presets}>
            {PRESETS.map((p) => (
              <Pressable
                key={p.name}
                onPress={() => applyPreset(p)}
                style={({ pressed }) => [styles.presetChip, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.presetText}>{p.name}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.label}>Nome do modelo</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Llama 3.2 3B Q4"
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={styles.label}>Caminho do arquivo</Text>
          <TextInput
            style={styles.input}
            value={path}
            onChangeText={setPath}
            placeholder="Ex: /models/llama-3.2-3b.gguf"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
          />

          <Text style={styles.hint}>
            O caminho deve ser acessível pelo servidor llama.cpp (relativo ou absoluto)
          </Text>

          <View style={styles.actions}>
            <GlowButton label="Cancelar" onPress={onClose} variant="secondary" style={{ flex: 1 }} />
            <GlowButton
              label="Adicionar"
              onPress={handleAdd}
              disabled={!name.trim() || !path.trim()}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: 4,
  },
  presets: {
    marginBottom: Spacing.sm,
  },
  presetChip: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.full,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
  },
  presetText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 4,
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
  hint: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * 1.5,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
});
