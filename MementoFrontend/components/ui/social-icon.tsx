import React from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import { MementoColors } from '@/constants/mementoTheme';

interface SocialIconProps {
  platform: 'github' | 'linkedin' | 'x' | 'twitter' | 'instagram' | 'globe' | 'phone' | 'envelope';
  size?: number;
  color?: string;
}

// Platform-specific configurations
const platformConfig = {
  github: {
    emoji: '⚡',
    imageSource: require('@/assets/images/github.png'),
    fallbackToEmoji: true,
  },
  linkedin: {
    emoji: '💼',
    imageSource: require('@/assets/images/linkedin.png'),
    fallbackToEmoji: true,
  },
  x: {
    emoji: '🐦',
    imageSource: require('@/assets/images/xlogo.jpg'),
    fallbackToEmoji: true,
  },
  twitter: {
    emoji: '🐦',
    imageSource: require('@/assets/images/xlogo.jpg'),
    fallbackToEmoji: true,
  },
  instagram: {
    emoji: '📷',
    imageSource: require('@/assets/images/instagram-simple.png'),
    fallbackToEmoji: true,
  },
  globe: {
    emoji: '🌐',
    imageSource: require('@/assets/images/globe.png'),
    fallbackToEmoji: true,
  },
  phone: {
    emoji: '📞',
    imageSource: null, // No specific image, use emoji
    fallbackToEmoji: true,
  },
  envelope: {
    emoji: '📧',
    imageSource: null, // No specific image, use emoji
    fallbackToEmoji: true,
  },
};

export function SocialIcon({ platform, size = 24, color = MementoColors.text.secondary }: SocialIconProps) {
  const config = platformConfig[platform];
  
  // If no image source available, use emoji
  if (!config.imageSource) {
    return (
      <Text style={{ fontSize: size, color }}>
        {config.emoji}
      </Text>
    );
  }

  // Use actual image asset
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={config.imageSource}
        style={[styles.image, { width: size, height: size }]}
        resizeMode="contain"
        onError={(error) => {
          // If image fails to load, it will fallback to emoji
          console.log(`Failed to load ${platform} logo:`, error);
        }}
        onLoad={() => {
          console.log(`Successfully loaded ${platform} logo`);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    tintColor: undefined, // Keep original colors for logos
  },
});
