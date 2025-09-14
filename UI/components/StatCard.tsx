import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MementoColors, MementoSpacing, MementoFontSizes, MementoBorderRadius } from '../constants/mementoTheme';

interface StatCardProps {
  title: string;
  value: number;
  color: string;
  icon: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, color, icon }) => {
  return (
    <View style={[styles.container, { borderLeftColor: color }]}>
      {/* Content */}
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <IconSymbol name={icon} size={24} color={color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
      
      {/* Subtle gradient overlay */}
      <View style={[styles.gradientOverlay, { backgroundColor: color + '08' }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: MementoColors.backgroundCard,
    borderRadius: MementoBorderRadius.lg,
    padding: MementoSpacing.lg,
    marginBottom: MementoSpacing.md,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
    position: 'relative',
    overflow: 'hidden',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: MementoBorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: MementoSpacing.md,
  },
  textContainer: {
    flex: 1,
  },
  value: {
    fontSize: MementoFontSizes.xxl,
    fontWeight: 'bold',
    color: MementoColors.text.primary,
    marginBottom: 4,
  },
  title: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: MementoBorderRadius.lg,
  },
});
