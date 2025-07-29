import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface SkeletonCardProps {
  width?: number;
  height?: number;
}

export default function SkeletonCard({ width = 100, height = 150 }: SkeletonCardProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[styles.card, { width, height }]}>
      <Animated.View style={[styles.skeleton, { opacity }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  skeleton: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
});