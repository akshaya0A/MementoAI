import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Text style={[styles.icon, { color }]}>{icon}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: MementoColors.backgroundCard,
    borderRadius: MementoBorderRadius.lg,
    borderLeftWidth: 4,
    padding: MementoSpacing.md,
    marginBottom: MementoSpacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: MementoBorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: MementoSpacing.md,
  },
  icon: {
    fontSize: MementoFontSizes.xl,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  value: {
    fontSize: MementoFontSizes.xxl,
    fontWeight: 'bold',
    color: MementoColors.text.primary,
    marginBottom: 2,
  },
  title: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
    textTransform: 'capitalize',
  },
});
