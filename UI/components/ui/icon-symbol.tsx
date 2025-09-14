// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  // Dashboard icons
  'chart.bar.fill': 'bar-chart',
  'person.2.fill': 'people',
  'square.and.arrow.up': 'share',
  // Search screen icons
  'magnifyingglass': 'search',
  'mic': 'mic',
  'waveform': 'graphic-eq',
  'slider.horizontal.3': 'tune',
  'xmark': 'close',
  'arrow.up.arrow.down': 'swap-vert',
  'chevron.up': 'keyboard-arrow-up',
  'chevron.down': 'keyboard-arrow-down',
  'list.bullet': 'list',
  'square.grid.2x2': 'grid-view',
  // Export screen icons
  'person.circle': 'person',
  'tablecells': 'table-chart',
  'curlybraces': 'code',
  'checkmark.circle.fill': 'check-circle',
  'checkmark.circle': 'check-circle-outline',
  // Contact card icons
  'flame': 'local-fire-department',
  'calendar': 'event',
  'location': 'place',
  // Dashboard icons
  'upload': 'cloud-upload',
  'download': 'cloud-download',
  'plus': 'add',
  'eye': 'visibility',
  'clock': 'schedule',
  'users': 'people',
  // Search screen icons
  'mic': 'mic',
  'waveform': 'graphic-eq',
  'tag': 'local-offer',
  // ContactDetail icons
  'pencil': 'edit',
  'trash': 'delete',
  'phone': 'phone',
  'envelope': 'email',
  'link': 'link',
  'building.2': 'business',
  'hand.raised': 'pan-tool',
  'star': 'star',
  'note.text': 'note',
  // Social media icons
  'code': 'code',
  'bird': 'pets',
  'camera': 'camera-alt',
  'globe': 'language',
  'arrow.up.right': 'open-in-new',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
