import React, { useEffect, useState } from 'react';
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
};

export function AnimatedPressable({ style, children, ...props }: Props) {
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => () => {
    scale.stopAnimation();
  }, [scale]);

  return (
    <Pressable
      {...props}
      onPressIn={event => {
        Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
        props.onPressIn?.(event);
      }}
      onPressOut={event => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 24, bounciness: 5 }).start();
        props.onPressOut?.(event);
      }}
      style={state => [
        typeof style === 'function' ? style(state) : style,
        { transform: [{ scale }] },
      ]}
    >
      {children}
    </Pressable>
  );
}
