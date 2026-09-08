// Powered by OnSpace.AI
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { GlowButton } from '@/components/ui/GlowButton';
import { useApp } from '@/hooks/useApp';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  function inc() {
    onChange(Math.min(max, parseFloat((value + step).toFixed(2))));
  }
  function dec() {
    onChange(Math.max(min, parseFloat((value - step).toFixed(2))));
  }

  return (
    <View style={sliderStyles.row}>
      <Text style={sliderStyles.label}>{label}</Text>
      <View style={sliderStyles.controls}>
        <Pressable onPress={dec} style={sliderStyles.btn}>
          <MaterialIcons name="remove" size={16} color={Colors.primary} />
        </Pressable>
        <Text style={sliderStyles.value}>{value}</Text>
        <Pressable onPress={inc} style={sliderStyles.btn}>
          <MaterialIcons name="add" size={16} color={Colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  label: { color: Colors.textSecondary, fontSize: FontSize.sm },
  controls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  btn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { color: Colors.primary, fontSize: FontSize.md, minWidth: 50, textAlign: 'center', fontWeight: '600' },
});

export function SettingsModal({ visible, onClose }: Props) {
  const { params, setParams, serverUrl, setServerUrl, systemPrompt, setSystemPrompt } = useApp();
  const [localUrl, setLocalUrl] = useState(serverUrl);
  const [localPrompt, setLocalPrompt] = useState(systemPrompt);
  const [localParams, setLocalParams] = useState(params);

  useEffect(() => {
    setLocalUrl(serverUrl);
    setLocalPrompt(systemPrompt);
    setLocalParams(params);
  }, [visible]);

  async function handleSave() {
    await setServerUrl(localUrl);
    await setParams(localParams);
    await setSystemPrompt(localPrompt);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Configurações</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.section}>Servidor</Text>
            <TextInput
              style={styles.input}
              value={localUrl}
              onChangeText={setLocalUrl}
              placeholder="http://localhost:8080"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              keyboardType="url"
            />

            <Text style={styles.section}>System Prompt</Text>
            <TextInput
              style={[styles.input, { height: 90 }]}
              value={localPrompt}
              onChangeText={setLocalPrompt}
              placeholder="Você é um assistente útil..."
              placeholderTextColor={Colors.textMuted}
              multiline
            />

            <Text style={styles.section}>Parâmetros de Geração</Text>
            <SliderRow
              label="Temperatura"
              value={localParams.temperature}
              min={0}
              max={2}
              step={0.1}
              onChange={(v) => setLocalParams((p) => ({ ...p, temperature: v }))}
            />
            <SliderRow
              label="Top-P"
              value={localParams.top_p}
              min={0.1}
              max={1}
              step={0.05}
              onChange={(v) => setLocalParams((p) => ({ ...p, top_p: v }))}
            />
            <SliderRow
              label="Top-K"
              value={localParams.top_k}
              min={1}
              max={100}
              step={1}
              onChange={(v) => setLocalParams((p) => ({ ...p, top_k: v }))}
            />
            <SliderRow
              label="Max Tokens"
              value={localParams.max_tokens}
              min={64}
              max={4096}
              step={64}
              onChange={(v) => setLocalParams((p) => ({ ...p, max_tokens: v }))}
            />
            <SliderRow
              label="Repetition Penalty"
              value={localParams.repeat_penalty}
              min={1}
              max={2}
              step={0.05}
              onChange={(v) => setLocalParams((p) => ({ ...p, repeat_penalty: v }))}
            />
            <View style={sliderStyles.row}>
              <Text style={sliderStyles.label}>Streaming</Text>
              <Switch
                value={localParams.stream}
                onValueChange={(v) => setLocalParams((p) => ({ ...p, stream: v }))}
                trackColor={{ false: Colors.surfaceBorder, true: Colors.primaryDim }}
                thumbColor={localParams.stream ? Colors.primary : Colors.textMuted}
              />
            </View>

            <GlowButton
              label="Salvar Configurações"
              onPress={handleSave}
              size="lg"
              style={{ marginTop: Spacing.lg, marginBottom: Spacing.md }}
            />
          </ScrollView>
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
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  section: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
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
});
