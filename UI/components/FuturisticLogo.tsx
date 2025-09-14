import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MementoColors, MementoSpacing } from '@/constants/mementoTheme';

interface FuturisticLogoProps {
  size?: number;
  showText?: boolean;
}

export const FuturisticLogo: React.FC<FuturisticLogoProps> = ({ 
  size = 40, 
  showText = true 
}) => {
  const logoSize = size;
  const textSize = size * 0.6;

  return (
    <View style={styles.container}>
      <View style={[styles.logoContainer, { width: logoSize, height: logoSize }]}>
        {/* Main M shape with gradient effect */}
        <View style={[styles.mShape, { width: logoSize * 0.8, height: logoSize * 0.8 }]}>
          {/* Left leg */}
          <View style={[styles.leg, styles.leftLeg]} />
          
          {/* Right leg */}
          <View style={[styles.leg, styles.rightLeg]} />
          
          {/* Center V */}
          <View style={[styles.centerV]} />
          
          {/* Top highlight */}
          <View style={[styles.highlight, styles.topHighlight]} />
          
          {/* Side highlight */}
          <View style={[styles.highlight, styles.sideHighlight]} />
          
          {/* Tech accent - small circle with line */}
          <View style={[styles.techAccent, { top: logoSize * 0.15, right: logoSize * 0.25 }]}>
            <View style={styles.techCircle}>
              <View style={styles.techDot} />
            </View>
            <View style={styles.techLine} />
          </View>
        </View>
        
        {/* Glow effect */}
        <View style={[styles.glow, { width: logoSize, height: logoSize }]} />
      </View>
      
      {showText && (
        <Text style={[styles.logoText, { fontSize: textSize }]}>
          MementoAI
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: MementoColors.primary + '15',
    borderRadius: 999,
    opacity: 0.4,
  },
  mShape: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leg: {
    position: 'absolute',
    width: 8,
    height: '80%',
    backgroundColor: MementoColors.primary,
    shadowColor: MementoColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  leftLeg: {
    left: 4,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  rightLeg: {
    right: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  centerV: {
    position: 'absolute',
    width: 8,
    height: '60%',
    backgroundColor: MementoColors.primaryDark,
    top: '20%',
    transform: [{ rotate: '15deg' }],
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  highlight: {
    position: 'absolute',
    backgroundColor: MementoColors.primaryLight,
    shadowColor: MementoColors.primaryLight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },
  topHighlight: {
    width: 6,
    height: 3,
    top: 2,
    left: '50%',
    marginLeft: -3,
    borderRadius: 2,
  },
  sideHighlight: {
    width: 3,
    height: 6,
    right: 2,
    top: '30%',
    borderRadius: 2,
  },
  techAccent: {
    position: 'absolute',
    width: 6,
    height: 12,
  },
  techCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: MementoColors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  techDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: MementoColors.primaryLight,
  },
  techLine: {
    width: 1,
    height: 4,
    backgroundColor: MementoColors.textMuted,
    alignSelf: 'center',
  },
  logoText: {
    color: MementoColors.text.primary,
    fontWeight: '700',
    marginLeft: MementoSpacing.sm,
    letterSpacing: 0.5,
  },
});
