// Powered by OnSpace.AI
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ChatMessage } from '@/services/llamaService';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';

interface Props {
  message: ChatMessage;
}

function TypingDots() {
  const dots = [useRef(new Animated.Value(0)), useRef(new Animated.Value(0)), useRef(new Animated.Value(0))];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot.current, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot.current, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.dotsRow}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              opacity: dot.current,
              transform: [
                {
                  translateY: dot.current.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -4],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

export const MessageBubble = React.memo(function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  const isEmpty = !message.content && message.isStreaming;

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAI]}>
      <View style={[styles.avatar, isUser ? styles.avatarUser : styles.avatarAI]}>
        <Text style={[styles.avatarText, isUser ? { color: Colors.primary } : { color: Colors.accent }]}>
          {isUser ? 'U' : 'AI'}
        </Text>
      </View>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        {isEmpty ? (
          <TypingDots />
        ) : (
          <>
            <Text style={[styles.content, isUser ? styles.contentUser : styles.contentAI]}>
              {message.content}
            </Text>
            {message.isStreaming && message.content ? (
              <View style={styles.cursor} />
            ) : null}
          </>
        )}
        <Text style={styles.timestamp}>
          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  rowUser: {
    flexDirection: 'row-reverse',
  },
  rowAI: {},
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 2,
    flexShrink: 0,
  },
  avatarUser: {
    backgroundColor: Colors.userBubble,
    borderColor: Colors.userBubbleBorder,
  },
  avatarAI: {
    backgroundColor: Colors.aiBubble,
    borderColor: Colors.aiBubbleBorder,
  },
  avatarText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: Radius.md,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    gap: 4,
  },
  bubbleUser: {
    backgroundColor: Colors.userBubble,
    borderColor: Colors.userBubbleBorder,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: Colors.aiBubble,
    borderColor: Colors.aiBubbleBorder,
    borderBottomLeftRadius: 4,
  },
  content: {
    fontSize: FontSize.md,
    lineHeight: FontSize.md * 1.6,
  },
  contentUser: {
    color: Colors.textPrimary,
  },
  contentAI: {
    color: Colors.textPrimary,
  },
  timestamp: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    alignSelf: 'flex-end',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 5,
    height: 20,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.accent,
  },
  cursor: {
    width: 8,
    height: 16,
    backgroundColor: Colors.accent,
    opacity: 0.8,
  },
});
