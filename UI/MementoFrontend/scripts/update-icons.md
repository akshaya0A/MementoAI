# Icon Update Guide for MementoAI

## Your 3D "M" Logo - Minimalistic Theme
You've uploaded a beautiful 3D crystalline "M" logo. Here's how to integrate it into your app with the new minimalistic black, grey, and white theme:

## Required Icon Sizes

### Main App Icon
- **File**: `assets/images/icon.png`
- **Size**: 1024x1024px
- **Format**: PNG with transparency
- **Color**: Black or dark grey (#000000 or #333333)
- **Background**: White or transparent

### Android Icons
- **Foreground**: `assets/images/android-icon-foreground.png`
  - Size: 1024x1024px
  - Your "M" logo in black
  - Transparent background
- **Background**: `assets/images/android-icon-background.png`
  - Size: 1024x1024px
  - Solid color: #FFFFFF (white)
- **Monochrome**: `assets/images/android-icon-monochrome.png`
  - Size: 1024x1024px
  - Black "M" logo for system UI

### Web Favicon
- **File**: `assets/images/favicon.png`
- **Size**: 32x32px (or 16x16px)
- **Format**: PNG or ICO
- **Color**: Black or dark grey

### Splash Screen
- **File**: `assets/images/splash-icon.png`
- **Size**: 200x200px (or larger, will be resized)
- **Format**: PNG with transparency
- **Color**: Black or dark grey

## Steps to Update Icons

1. **Convert your logo to black/grey** to match the minimalistic theme
2. **Resize your uploaded image** to the required sizes above
3. **Replace the existing files** in `assets/images/` with your new icons
4. **Ensure transparency** is preserved for foreground icons
5. **Test the app** to see the new icons

## Minimalistic Color Scheme
- **Primary**: #000000 (Pure Black)
- **Secondary**: #666666 (Medium Grey)
- **Background**: #FFFFFF (Pure White)
- **Light Background**: #F8F8F8 (Very Light Grey)
- **Dark Background**: #000000 (Pure Black)

## Tools for Icon Generation
- **Online**: Canva, Figma, or any image editor
- **Command Line**: ImageMagick for batch resizing
- **Design**: Convert your 3D crystalline effect to black/grey tones

## Testing
After updating the icons:
1. Run `npx expo start` to see changes in development
2. Build the app to test on actual devices
3. Check web version for favicon updates

Your 3D "M" logo will look stunning in the minimalistic black and white theme! The clean, professional design perfectly matches the modern, minimalistic aesthetic of MementoAI.
