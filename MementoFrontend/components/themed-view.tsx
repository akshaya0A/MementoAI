import React from 'react';
import { View, ViewProps } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const theme = useColorScheme() ?? 'light';
  const backgroundColor = theme === 'light' ? lightColor : darkColor;

  return (
    <View
      style={[{ backgroundColor: theme === 'light' ? Colors.light.background : Colors.dark.background }, { backgroundColor }, style]}
      {...otherProps}
    />
  );
}
