import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

// Cutout dimensions (typical document ratio, roughly A4)
const overlayWidth = screenWidth * 0.85;
const overlayHeight = overlayWidth * 1.414;

export const CameraOverlay: React.FC = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.backdropContainer}>
        {/* Top backdrop mask */}
        <View style={[styles.backdrop, styles.topBackdrop]} />
        
        {/* Cutout row mask */}
        <View style={styles.middleRow}>
          <View style={[styles.backdrop, styles.sideBackdrop]} />
          
          {/* Document Framing Cutout */}
          <View style={styles.frameContainer}>
            {/* Outline Corners */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          
          <View style={[styles.backdrop, styles.sideBackdrop]} />
        </View>
        
        {/* Bottom backdrop mask */}
        <View style={[styles.backdrop, styles.bottomBackdrop]} />
      </View>

      {/* Center Guidance Text */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>Align document within the frame</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdropContainer: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  topBackdrop: {
    flex: 1.1,
  },
  bottomBackdrop: {
    flex: 1.5, // More padding at bottom for control buttons
  },
  middleRow: {
    height: overlayHeight,
    flexDirection: 'row',
  },
  sideBackdrop: {
    flex: 1,
  },
  frameContainer: {
    width: overlayWidth,
    height: overlayHeight,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#1977F3', // Theme Blue
  },
  topLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 14,
  },
  topRight: {
    top: -1,
    right: -1,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 14,
  },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 14,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 14,
  },
  instructionContainer: {
    position: 'absolute',
    top: '12%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
