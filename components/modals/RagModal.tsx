// Powered by OnSpace.AI
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { GlowButton } from '@/components/ui/GlowButton';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { RagDocument } from '@/services/storageService';
import { estimateTokenCount } from '@/services/ragService';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function RagModal({ visible, onClose }: Props) {
  const { ragDocuments, addRagDocument, removeRagDocument, ragEnabled, setRagEnabled } = useApp();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);

  async function pickDocument() {
    setLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'text/*', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;

      let content = '';
      try {
        content = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
      } catch {
        showAlert('Erro', 'Não foi possível ler o arquivo. Certifique-se que é um arquivo de texto (.txt).');
        return;
      }

      if (!content.trim()) {
        showAlert('Erro', 'O arquivo está vazio.');
        return;
      }

      const doc: RagDocument = {
        id: generateId(),
        name: asset.name,
        content,
        addedAt: Date.now(),
        size: asset.size ?? content.length,
      };
      await addRagDocument(doc);
    } catch {
      showAlert('Erro', 'Falha ao carregar documento.');
    } finally {
      setLoading(false);
    }
  }

  function confirmDelete(doc: RagDocument) {
    showAlert('Remover documento', `Remover "${doc.name}" da base RAG?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removeRagDocument(doc.id) },
    ]);
  }

  const totalTokens = ragDocuments.reduce((s, d) => s + estimateTokenCount(d.content), 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>RAG — Base de Documentos</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <MaterialIcons name="auto-awesome" size={16} color={ragEnabled ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.toggleLabel, ragEnabled && { color: Colors.primary }]}>
                RAG {ragEnabled ? 'ativado' : 'desativado'}
              </Text>
            </View>
            <Switch
              value={ragEnabled}
              onValueChange={setRagEnabled}
              trackColor={{ false: Colors.surfaceBorder, true: Colors.primaryDim }}
              thumbColor={ragEnabled ? Colors.primary : Colors.textMuted}
            />
          </View>

          <View style={styles.stats}>
            <Text style={styles.statsText}>
              {ragDocuments.length} documento{ragDocuments.length !== 1 ? 's' : ''} · ~{totalTokens.toLocaleString()} tokens
            </Text>
          </View>

          {ragDocuments.length === 0 ? (
            <View style={styles.empty}>
              <MaterialIcons name="description" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Nenhum documento carregado</Text>
              <Text style={styles.emptySub}>Adicione arquivos .txt para usar como contexto nas respostas</Text>
            </View>
          ) : (
            <FlatList
              data={ragDocuments}
              keyExtractor={(d) => d.id}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.docCard}>
                  <MaterialIcons name="description" size={18} color={Colors.accent} />
                  <View style={styles.docInfo}>
                    <Text style={styles.docName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.docMeta}>
                      ~{estimateTokenCount(item.content).toLocaleString()} tokens · {(item.size / 1024).toFixed(1)} KB
                    </Text>
                  </View>
                  <Pressable onPress={() => confirmDelete(item)} hitSlop={8}>
                    <MaterialIcons name="delete-outline" size={18} color={Colors.textMuted} />
                  </Pressable>
                </View>
              )}
            />
          )}

          <GlowButton
            label={loading ? 'Carregando...' : '+ Adicionar Documento (.txt)'}
            onPress={pickDocument}
            disabled={loading}
            size="sm"
            style={styles.addBtn}
          />
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  toggleLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  stats: {
    paddingVertical: 4,
  },
  statsText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
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
    lineHeight: FontSize.xs * 1.5,
  },
  list: {
    maxHeight: 250,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  docMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  addBtn: {
    marginTop: Spacing.xs,
  },
});
