import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MementoBorderRadius, MementoColors, MementoFontSizes, MementoSpacing, MementoShadows } from '@/constants/mementoTheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface StatCardProps {
  title: string;
  value: number;
  color: string;
  icon: string;
  trend?: string;
}

export function StatCard({ title, value, color, icon, trend }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <IconSymbol name={icon} size={20} color={color} />
        </View>
        {trend && (
          <View style={styles.trendContainer}>
            <Text style={[styles.trendText, { color: MementoColors.success }]}>
              {trend}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.value}>{value.toLocaleString()}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: MementoColors.backgroundCard,
    borderRadius: MementoBorderRadius.lg,
    padding: MementoSpacing.lg,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
    ...MementoShadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: MementoSpacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    backgroundColor: MementoColors.success + '20',
    paddingHorizontal: MementoSpacing.sm,
    paddingVertical: 2,
    borderRadius: MementoBorderRadius.sm,
  },
  trendText: {
    fontSize: MementoFontSizes.xs,
    fontWeight: '600',
  },
  content: {
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
    fontWeight: '500',
  },
});
