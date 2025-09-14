import React from 'react';
import { Text, TextProps } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const theme = useColorScheme() ?? 'light';
  const color = theme === 'light' ? lightColor : darkColor;

  return (
    <Text
      style={[
        { color: theme === 'light' ? Colors.light.text : Colors.dark.text },
        type === 'default' ? { fontSize: 16, lineHeight: 24 } : {},
        type === 'title' ? { fontSize: 20, fontWeight: 'bold', lineHeight: 32 } : {},
        type === 'defaultSemiBold' ? { fontSize: 16, fontWeight: '600', lineHeight: 24 } : {},
        type === 'subtitle' ? { fontSize: 18, fontWeight: '600', lineHeight: 28 } : {},
        type === 'link' ? { fontSize: 16, color: Colors.light.tint, lineHeight: 24 } : {},
        { color },
        style,
      ]}
      {...rest}
    />
  );
}
