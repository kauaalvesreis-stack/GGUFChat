// Powered by OnSpace.AI
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  FlatList,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { GlowButton } from '@/components/ui/GlowButton';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import {
  searchHFModels,
  getModelFiles,
  getDownloadUrl,
  formatBytes,
  formatDownloads,
  HFModel,
  HFFile,
} from '@/services/huggingfaceService';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Stage = 'search' | 'files';

export function HuggingFaceModal({ visible, onClose }: Props) {
  const { addModel } = useApp();
  const { showAlert } = useAlert();
  const [stage, setStage] = useState<Stage>('search');
  const [query, setQuery] = useState('llama gguf');
  const [models, setModels] = useState<HFModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<HFModel | null>(null);
  const [files, setFiles] = useState<HFFile[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);

  async function doSearch() {
    if (!query.trim()) return;
    setLoadingModels(true);
    const results = await searchHFModels(query.trim());
    setModels(results);
    setLoadingModels(false);
  }

  async function selectModel(model: HFModel) {
    setSelectedModel(model);
    setLoadingFiles(true);
    setStage('files');
    const ggufFiles = await getModelFiles(model.modelId);
    setFiles(ggufFiles);
    setLoadingFiles(false);
  }

  function handleAddFile(file: HFFile) {
    if (!selectedModel) return;
    const downloadUrl = getDownloadUrl(selectedModel.modelId, file.rfilename);
    const modelName = file.rfilename.replace(/\.gguf$/i, '').replace(/[-_]/g, ' ');
    addModel({
      id: `${Date.now()}`,
      name: modelName,
      path: downloadUrl,
      addedAt: Date.now(),
    });
    showAlert('Modelo adicionado', `"${modelName}" foi adicionado. Configure o servidor para apontar para este arquivo após o download.`);
    onClose();
    reset();
  }

  function reset() {
    setStage('search');
    setSelectedModel(null);
    setFiles([]);
    setModels([]);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { onClose(); reset(); }}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {stage === 'files' ? (
                <Pressable onPress={() => setStage('search')} hitSlop={8} style={{ marginRight: Spacing.sm }}>
                  <MaterialIcons name="arrow-back" size={20} color={Colors.textSecondary} />
                </Pressable>
              ) : null}
              <Text style={styles.title}>
                {stage === 'search' ? 'Buscar no HuggingFace' : selectedModel?.modelId ?? ''}
              </Text>
            </View>
            <Pressable onPress={() => { onClose(); reset(); }} hitSlop={8}>
              <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {stage === 'search' ? (
            <>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Buscar modelos GGUF..."
                  placeholderTextColor={Colors.textMuted}
                  returnKeyType="search"
                  onSubmitEditing={doSearch}
                />
                <Pressable
                  onPress={doSearch}
                  style={({ pressed }) => [styles.searchBtn, pressed && { opacity: 0.7 }]}
                >
                  <MaterialIcons name="search" size={20} color={Colors.primary} />
                </Pressable>
              </View>

              {loadingModels ? (
                <View style={styles.center}>
                  <ActivityIndicator color={Colors.primary} size="large" />
                  <Text style={styles.loadingText}>Buscando modelos...</Text>
                </View>
              ) : models.length === 0 ? (
                <View style={styles.center}>
                  <MaterialIcons name="cloud-queue" size={48} color={Colors.textMuted} />
                  <Text style={styles.emptyText}>Busque modelos GGUF no HuggingFace Hub</Text>
                  <Text style={styles.emptySub}>Ex: "llama gguf", "mistral q4", "phi-3"</Text>
                  <GlowButton label="Buscar" onPress={doSearch} size="sm" style={{ marginTop: Spacing.sm }} />
                </View>
              ) : (
                <FlatList
                  data={models}
                  keyExtractor={(m) => m.modelId}
                  style={styles.list}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => selectModel(item)}
                      style={({ pressed }) => [styles.modelCard, pressed && { opacity: 0.7 }]}
                    >
                      <View style={styles.modelInfo}>
                        <Text style={styles.modelId} numberOfLines={1}>{item.modelId}</Text>
                        <View style={styles.modelMeta}>
                          <View style={styles.metaChip}>
                            <MaterialIcons name="download" size={11} color={Colors.textMuted} />
                            <Text style={styles.metaText}>{formatDownloads(item.downloads)}</Text>
                          </View>
                          <View style={styles.metaChip}>
                            <MaterialIcons name="favorite-border" size={11} color={Colors.textMuted} />
                            <Text style={styles.metaText}>{formatDownloads(item.likes)}</Text>
                          </View>
                        </View>
                      </View>
                      <MaterialIcons name="chevron-right" size={18} color={Colors.textMuted} />
                    </Pressable>
                  )}
                />
              )}
            </>
          ) : (
            <>
              <View style={styles.infoBox}>
                <MaterialIcons name="info-outline" size={14} color={Colors.accent} />
                <Text style={styles.infoText}>
                  Selecione um arquivo .gguf para adicionar ao app. O download deve ser feito manualmente e configurado no servidor llama.cpp.
                </Text>
              </View>
              {loadingFiles ? (
                <View style={styles.center}>
                  <ActivityIndicator color={Colors.primary} />
                  <Text style={styles.loadingText}>Carregando arquivos...</Text>
                </View>
              ) : files.length === 0 ? (
                <View style={styles.center}>
                  <Text style={styles.emptyText}>Nenhum arquivo .gguf encontrado</Text>
                </View>
              ) : (
                <FlatList
                  data={files}
                  keyExtractor={(f) => f.rfilename}
                  style={styles.list}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => handleAddFile(item)}
                      style={({ pressed }) => [styles.fileCard, pressed && { opacity: 0.7 }]}
                    >
                      <MaterialIcons name="insert-drive-file" size={18} color={Colors.primary} />
                      <View style={styles.fileInfo}>
                        <Text style={styles.fileName} numberOfLines={2}>{item.rfilename}</Text>
                        {item.size ? (
                          <Text style={styles.fileSize}>{formatBytes(item.size)}</Text>
                        ) : null}
                      </View>
                      <MaterialIcons name="add-circle-outline" size={20} color={Colors.primary} />
                    </Pressable>
                  )}
                />
              )}
            </>
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
    maxHeight: '85%',
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  title: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '700',
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.sm,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    includeFontPadding: false,
  } as Record<string, unknown>,
  searchBtn: {
    width: 44,
    height: 44,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySub: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  modelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    gap: Spacing.sm,
  },
  modelInfo: {
    flex: 1,
    gap: 4,
  },
  modelId: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  modelMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: Colors.accentDim,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  infoText: {
    flex: 1,
    color: Colors.accent,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * 1.5,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  fileSize: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
});
