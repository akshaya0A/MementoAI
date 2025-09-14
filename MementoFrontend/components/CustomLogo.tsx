import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { MementoBorderRadius, MementoColors, MementoFontSizes } from '@/constants/mementoTheme';

interface CustomLogoProps {
  size?: number;
  showText?: boolean;
}

export function CustomLogo({ size = 40, showText = true }: CustomLogoProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.logoContainer, { width: size, height: size }]}>
        <Image 
          source={require('@/assets/images/LogoMomento.jpg')} 
          style={[styles.logoImage, { width: size, height: size }]}
          resizeMode="contain"
        />
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
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoImage: {
    borderRadius: MementoBorderRadius.md,
  },
  text: {
    fontSize: MementoFontSizes.lg,
    fontWeight: 'bold',
    color: MementoColors.text.primary,
  },
});
