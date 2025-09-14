import React from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { MementoColors } from '@/constants/mementoTheme';

interface CustomLogoProps {
  size?: number;
  showText?: boolean;
}

export const CustomLogo: React.FC<CustomLogoProps> = ({ 
  size = 32, 
  showText = false 
}) => {
  // Import the logo image
  const logoImage: ImageSourcePropType = require('./TechMlogo.png');

  return (
    <View style={styles.container}>
      {/* Logo Image */}
      <View style={[styles.logoContainer, { width: size, height: size }]}>
        <Image
          source={logoImage}
          style={[styles.logoImage, { width: size, height: size }]}
          resizeMode="contain"
        />
      </View>
      
      {/* Text */}
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.logoText, { fontSize: size * 0.4 }]}>
            MEMENTO
          </Text>
          <View style={styles.underline} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    // Image will maintain its aspect ratio and fit within the container
  },
  textContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  logoText: {
    fontFamily: 'System',
    fontWeight: '900',
    color: MementoColors.textPrimary,
    letterSpacing: 2,
  },
  underline: {
    width: 40,
    height: 2,
    backgroundColor: MementoColors.primary,
    marginTop: 2,
    borderRadius: 1,
  },
});
