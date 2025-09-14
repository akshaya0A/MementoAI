import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MementoBorderRadius, MementoColors, MementoFontSizes } from '@/constants/mementoTheme';

interface CustomLogoProps {
  size?: number;
  showText?: boolean;
}

export function CustomLogo({ size = 40, showText = true }: CustomLogoProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.logoContainer, { width: size, height: size }]}>
        <Text style={[styles.logo, { fontSize: size * 0.5 }]}>M</Text>
      </View>
      {showText && (
        <Text style={styles.text}>MementoAI</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    borderRadius: MementoBorderRadius.md,
    backgroundColor: MementoColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logo: {
    fontWeight: 'bold',
    color: MementoColors.text.white,
  },
  text: {
    fontSize: MementoFontSizes.lg,
    fontWeight: 'bold',
    color: MementoColors.text.primary,
  },
});
