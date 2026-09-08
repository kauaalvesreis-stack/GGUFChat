// Powered by OnSpace.AI
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { FavoritePromptsModal } from '@/components/modals/FavoritePromptsModal';

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, onStop, isGenerating, disabled }: Props) {
  const [text, setText] = useState('');
  const [showFavs, setShowFavs] = useState(false);

  function handleSend() {
    if (!text.trim()) return;
    onSend(text);
    setText('');
  }

  function handleUseFavorite(content: string) {
    setText(content);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <Pressable
          onPress={() => setShowFavs(true)}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          hitSlop={8}
        >
          <MaterialIcons name="star" size={18} color={Colors.warning} />
        </Pressable>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Digite sua mensagem..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={4000}
          editable={!disabled && !isGenerating}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <Pressable
          onPress={isGenerating ? onStop : handleSend}
          disabled={disabled && !isGenerating}
          style={({ pressed }) => [
            styles.sendBtn,
            {
              backgroundColor: isGenerating ? 'rgba(255,68,68,0.15)' : Colors.primaryGlow,
              borderColor: isGenerating ? Colors.error : Colors.primary,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <MaterialIcons
            name={isGenerating ? 'stop' : 'send'}
            size={20}
            color={isGenerating ? Colors.error : Colors.primary}
          />
        </Pressable>
      </View>

      <FavoritePromptsModal
        visible={showFavs}
        onClose={() => setShowFavs(false)}
        onUse={handleUseFavorite}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: Colors.surfaceElevated,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    includeFontPadding: false,
  } as Record<string, unknown>,
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
