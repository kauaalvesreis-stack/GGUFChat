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
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { LlamaModel } from '@/services/llamaService';
import { GlowButton } from '@/components/ui/GlowButton';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (model: LlamaModel) => void;
}

type Tab = 'manual' | 'file' | 'huggingface';

export function AddModelModal({ visible, onClose, onAdd }: Props) {
  const [tab, setTab] = useState<Tab>('file');
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [picking, setPicking] = useState(false);
  const [pickedFile, setPickedFile] = useState<{ name: string; uri: string; size?: number } | null>(null);

  function handleAdd() {
    if (!name.trim()) return;
    const modelPath = tab === 'file' && pickedFile ? pickedFile.uri : path.trim();
    if (!modelPath) return;
    onAdd({
      id: `${Date.now()}`,
      name: name.trim(),
      path: modelPath,
      addedAt: Date.now(),
    });
    reset();
    onClose();
  }

  function reset() {
    setName('');
    setPath('');
    setPickedFile(null);
    setTab('file');
  }

  async function pickGgufFile() {
    setPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      setPickedFile({ name: asset.name, uri: asset.uri, size: asset.size });
      const autoName = asset.name.replace(/\.gguf$/i, '').replace(/[-_]/g, ' ');
      setName(autoName);
    } catch {
      // ignore
    } finally {
      setPicking(false);
    }
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'file', label: 'Arquivo', icon: 'folder-open' },
    { key: 'manual', label: 'Manual', icon: 'edit' },
    { key: 'huggingface', label: 'HuggingFace', icon: 'cloud-download' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Adicionar Modelo GGUF</Text>
            <Pressable onPress={() => { reset(); onClose(); }} hitSlop={8}>
              <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {tabs.map((t) => (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
              >
                <MaterialIcons
                  name={t.icon as 'edit'}
                  size={14}
                  color={tab === t.key ? Colors.primary : Colors.textMuted}
                />
                <Text style={[styles.tabLabel, tab === t.key && { color: Colors.primary }]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* File picker tab */}
          {tab === 'file' ? (
            <View style={styles.fileSection}>
              <Pressable
                onPress={pickGgufFile}
                style={({ pressed }) => [styles.dropZone, pressed && { opacity: 0.7 }]}
              >
                {picking ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : pickedFile ? (
                  <View style={styles.pickedFile}>
                    <MaterialIcons name="insert-drive-file" size={28} color={Colors.primary} />
                    <Text style={styles.pickedName} numberOfLines={2}>{pickedFile.name}</Text>
                    {pickedFile.size ? (
                      <Text style={styles.pickedSize}>
                        {(pickedFile.size / 1024 / 1024).toFixed(1)} MB
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.dropHint}>
                    <MaterialIcons name="folder-open" size={36} color={Colors.primaryDim} />
                    <Text style={styles.dropText}>Toque para selecionar arquivo .gguf</Text>
                    <Text style={styles.dropSub}>do dispositivo ou armazenamento local</Text>
                  </View>
                )}
              </Pressable>
              <Text style={styles.label}>Nome do modelo</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Llama 3.2 3B Q4"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          ) : tab === 'manual' ? (
            <View style={styles.manualSection}>
              <Text style={styles.hint}>
                Informe o caminho do arquivo acessível pelo servidor llama.cpp
              </Text>
              <Text style={styles.label}>Nome do modelo</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Mistral 7B Q4"
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.label}>Caminho do arquivo no servidor</Text>
              <TextInput
                style={styles.input}
                value={path}
                onChangeText={setPath}
                placeholder="/models/mistral-7b-q4_k_m.gguf"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
              />
            </View>
          ) : (
            <View style={styles.hfSection}>
              <View style={styles.hfInfo}>
                <MaterialIcons name="info-outline" size={16} color={Colors.accent} />
                <Text style={styles.hfInfoText}>
                  Use a aba HuggingFace na tela principal para buscar e baixar modelos diretamente do Hub
                </Text>
              </View>
              <Text style={styles.label}>Caminho após download</Text>
              <TextInput
                style={styles.input}
                value={path}
                onChangeText={setPath}
                placeholder="/models/arquivo-baixado.gguf"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
              />
              <Text style={styles.label}>Nome do modelo</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Llama 3 8B Q4"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          )}

          <View style={styles.actions}>
            <GlowButton
              label="Cancelar"
              onPress={() => { reset(); onClose(); }}
              variant="secondary"
              style={{ flex: 1 }}
            />
            <GlowButton
              label="Adicionar"
              onPress={handleAdd}
              disabled={
                !name.trim() ||
                (tab === 'file' ? !pickedFile : !path.trim())
              }
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
    gap: Spacing.sm,
    maxHeight: '90%',
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
  tabs: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surfaceElevated,
  },
  tabBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  fileSection: {
    gap: Spacing.sm,
  },
  dropZone: {
    height: 140,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  dropHint: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dropText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  dropSub: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  pickedFile: {
    alignItems: 'center',
    gap: 4,
    padding: Spacing.sm,
  },
  pickedName: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  pickedSize: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  manualSection: {
    gap: Spacing.sm,
  },
  hfSection: {
    gap: Spacing.sm,
  },
  hfInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: Colors.accentDim,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  hfInfoText: {
    flex: 1,
    color: Colors.accent,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * 1.5,
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
