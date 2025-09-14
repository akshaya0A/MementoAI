import React from 'react';
import { Text } from 'react-native';

interface IconSymbolProps {
  name: string;
  size?: number;
  color?: string;
}

// Simple icon mapping to emoji/symbols for now
const iconMap: { [key: string]: string } = {
  'house': '🏠',
  'person.2': '👥',
  'magnifyingglass': '🔍',
  'square.and.arrow.up': '📤',
  'chart.bar.fill': '📊',
  'person.2.fill': '👥',
  'handshake.fill': '🤝',
  'calendar.badge.clock': '📅',
  'pencil.circle.fill': '✏️',
  'plus': '➕',
  'arrow.up.circle': '⬆️',
  'arrow.down.circle': '⬇️',
  'gearshape': '⚙️',
  'person.circle': '👤',
  'eye': '👁️',
  'clock': '🕐',
  'trash': '🗑️',
  'pencil': '✏️',
  'xmark': '❌',
  'list.bullet': '📋',
  'grid': '⊞',
  'arrow.up.arrow.down': '↕️',
  'chevron.up': '▲',
  'chevron.down': '▼',
  'square.grid.2x2': '⊞',
  'xmark.circle.fill': '❌',
  'safari': '🧭',
  'github': '⚡',
  'linkedin': '💼',
  'twitter': '🐦',
  'x': '🐦',
  'globe': '🌐',
  'link': '🔗',
  'phone': '📞',
  'envelope': '📧',
};

export function IconSymbol({ name, size = 24, color = '#000' }: IconSymbolProps) {
  const icon = iconMap[name] || '❓';
  return (
    <Text style={{ fontSize: size, color }}>
      {icon}
    </Text>
  );
}
