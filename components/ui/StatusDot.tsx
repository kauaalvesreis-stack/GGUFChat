// Powered by OnSpace.AI
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '@/constants/theme';

interface Props {
  connected: boolean;
  size?: number;
}

export function StatusDot({ connected, size = 10 }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!connected) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [connected, pulse]);

  return (
    <View style={styles.wrapper}>
      {connected && (
        <Animated.View
          style={[
            styles.ring,
            {
              width: size * 2,
              height: size * 2,
              borderRadius: size,
              transform: [{ scale: pulse }],
            },
          ]}
        />
      )}
      <View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: connected ? Colors.primary : Colors.error,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
  },
  ring: {
    backgroundColor: 'rgba(0,255,136,0.15)',
  },
});
