import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    GestureResponderEvent,
    Image,
    Modal,
    PanResponder,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { useDesigns } from '../../contexts/DesignContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useDesignStore } from '../../stores/designStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

// Color palette removed - using ColorSpectrumPicker instead

const ColorSpectrumPicker = ({ 
  visible, 
  onClose, 
  onColorSelect, 
  initialColor = '#1976D2' 
}: {
  visible: boolean;
  onClose: () => void;
  onColorSelect: (color: string) => void;
  initialColor?: string;
}) => {
  const [hue, setHue] = useState(210);
  const [saturation, setSaturation] = useState(100);
  const [brightness, setBrightness] = useState(100);

  const hsvToHex = React.useCallback((h: number, s: number, v: number): string => {
    const c = (v / 100) * (s / 100);
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = (v / 100) - c;
    
    let r = 0, g = 0, b = 0;
    
    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }
    
    const red = Math.round((r + m) * 255);
    const green = Math.round((g + m) * 255);
    const blue = Math.round((b + m) * 255);
    
    return `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;
  }, []);

  // Calculate current color without state updates
  const currentColor = React.useMemo(() => {
    return hsvToHex(hue, saturation, brightness);
  }, [hue, saturation, brightness, hsvToHex]);

  const handleApply = () => {
    onColorSelect(currentColor);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.colorPickerOverlay}>
        <View style={styles.colorPickerContainer}>
          <Text style={styles.colorSpectrumPickerTitle}>Choose Color</Text>
          
          <View style={styles.colorPreview}>
            <View style={[styles.colorSwatch, { backgroundColor: currentColor }]} />
            <Text style={styles.colorHex}>{currentColor}</Text>
          </View>
          
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Hue</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={360}
              value={hue}
              onValueChange={(value) => {
                // Throttle updates to prevent excessive re-renders
                requestAnimationFrame(() => setHue(value));
              }}
              minimumTrackTintColor="#3478f6"
              maximumTrackTintColor="#ddd"
            />
          </View>
          
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Saturation</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={saturation}
              onValueChange={(value) => {
                // Throttle updates to prevent excessive re-renders
                requestAnimationFrame(() => setSaturation(value));
              }}
              minimumTrackTintColor="#3478f6"
              maximumTrackTintColor="#ddd"
            />
          </View>
          
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Brightness</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={brightness}
              onValueChange={(value) => {
                // Throttle updates to prevent excessive re-renders
                requestAnimationFrame(() => setBrightness(value));
              }}
              minimumTrackTintColor="#3478f6"
              maximumTrackTintColor="#ddd"
            />
          </View>
          
          <View style={styles.colorPickerButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const FONT_FAMILIES: string[] = ['System', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia'];

const TEXT_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
  '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000', '#FFC0CB',
  '#A52A2A', '#808080', '#C0C0C0', '#FFD700', '#FF6347', '#32CD32'
];

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
// Default canvas size - will be overridden by template dimensions
const CANVAS_SIZE = Math.min(screenWidth * 0.95, 500);
const CANVAS_HEIGHT = Math.min(screenHeight * 0.6, 600);

const SHAPE_OPTIONS = [
  { type: 'rectangle', label: 'Rectangle', icon: 'square-outline' },
  { type: 'circle', label: 'Circle', icon: 'ellipse-outline' },
  { type: 'triangle', label: 'Triangle', icon: 'triangle-outline' },
  { type: 'line', label: 'Line', icon: 'remove-outline' },
  { type: 'star', label: 'Star', icon: 'star-outline' },
  { type: 'heart', label: 'Heart', icon: 'heart-outline' },
  { type: 'arrow', label: 'Arrow', icon: 'arrow-forward-outline' },
  { type: 'pentagon', label: 'Pentagon', icon: 'shapes-outline' },
  { type: 'diamond', label: 'Diamond', icon: 'shapes-outline' },
  { type: 'cloud', label: 'Cloud', icon: 'cloud-outline' },
];

const MIN_SHAPE_SIZE = 30;

// Reuse the same components from CanvaDesignPage
const ResizeHandle = ({ x, y, onResize, style, type }: {
  x: number;
  y: number;
  onResize: (dx: number, dy: number) => void;
  style?: any;
  type: 'corner' | 'side';
}) => {
  const pan = React.useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastPosition = React.useRef({ x: 0, y: 0 });
  const lastUpdate = React.useRef(0);
  
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastPosition.current = { x: 0, y: 0 };
      },
      onPanResponderMove: (e, gesture) => {
        const dx = gesture.dx - lastPosition.current.x;
        const dy = gesture.dy - lastPosition.current.y;
        lastPosition.current = { x: gesture.dx, y: gesture.dy };
        
        // Throttle updates to prevent excessive re-renders
        const now = Date.now();
        if (now - lastUpdate.current > 16) { // ~60fps
          onResize(dx, dy);
          lastUpdate.current = now;
        }
      },
      onPanResponderRelease: () => {
        pan.setValue({ x: 0, y: 0 });
        lastPosition.current = { x: 0, y: 0 };
      },
    })
  ).current;
  
  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        {
          position: 'absolute',
          left: x - (type === 'corner' ? 10 : 8),
          top: y - (type === 'corner' ? 10 : 8),
          width: type === 'corner' ? 20 : 16,
          height: type === 'corner' ? 20 : 16,
          borderRadius: type === 'corner' ? 10 : 4,
          backgroundColor: '#fff',
          borderWidth: 2,
          borderColor: '#3478f6',
          shadowColor: '#3478f6',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.15,
          shadowRadius: 2,
          elevation: 2,
          zIndex: 10,
        },
        style,
      ]}
    />
  );
};

const ShapeOnCanvas = ({ shape, selected, onPress, draggable, updatePosition, canvasLayout, updateSize }: {
  shape: any;
  selected?: boolean;
  onPress?: (e?: GestureResponderEvent) => void;
  draggable?: boolean;
  updatePosition?: (x: number, y: number) => void;
  canvasLayout?: { x: number; y: number; width: number; height: number };
  updateSize?: (id: string, newWidth: number, newHeight: number, newX: number, newY: number) => void;
}) => {
  const pan = React.useRef(new Animated.ValueXY({ x: shape.x, y: shape.y })).current;
  const panOffset = React.useRef({ x: shape.x, y: shape.y });
  const isDragging = React.useRef(false);
  
  React.useEffect(() => {
    // Don't update position if we're currently dragging
    if (isDragging.current) return;
    
    // Only update if the position has actually changed significantly
    const currentX = panOffset.current.x;
    const currentY = panOffset.current.y;
    const newX = shape.x;
    const newY = shape.y;
    
    // Only update if the difference is more than 1 pixel to avoid floating point issues
    if (Math.abs(currentX - newX) > 1 || Math.abs(currentY - newY) > 1) {
      pan.setValue({ x: newX, y: newY });
      panOffset.current = { x: newX, y: newY };
    }
  }, [shape.x, shape.y]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        if (onPress) onPress(evt);
        isDragging.current = true;
        panOffset.current = { x: shape.x, y: shape.y };
      },
      onPanResponderMove: (e: GestureResponderEvent, gesture) => {
        if (!canvasLayout) return;
        let newX = gesture.dx + panOffset.current.x;
        let newY = gesture.dy + panOffset.current.y;
        newX = Math.max(0, Math.min(newX, canvasLayout.width - (shape.width || 60)));
        newY = Math.max(0, Math.min(newY, canvasLayout.height - (shape.height || 60)));
        pan.setValue({ x: newX, y: newY });
      },
      onPanResponderRelease: (e: GestureResponderEvent, gesture) => {
        if (!canvasLayout) return;
        let newX = gesture.dx + panOffset.current.x;
        let newY = gesture.dy + panOffset.current.y;
        newX = Math.max(0, Math.min(newX, canvasLayout.width - (shape.width || 60)));
        newY = Math.max(0, Math.min(newY, canvasLayout.height - (shape.height || 60)));
        pan.setValue({ x: newX, y: newY });
        panOffset.current = { x: newX, y: newY };
        updatePosition && updatePosition(newX, newY);
        isDragging.current = false;
      },
    })
  ).current;

  const handleResize = (handle: string, dx: number, dy: number) => {
    if (!updateSize || !canvasLayout) return;
    let { x, y, width, height } = shape;
    let newX = x, newY = y, newW = width, newH = height;
    
    switch (handle) {
      case 'topLeft':
        newX = x + dx;
        newY = y + dy;
        newW = width - dx;
        newH = height - dy;
        break;
      case 'top':
        newY = y + dy;
        newH = height - dy;
        break;
      case 'topRight':
        newY = y + dy;
        newW = width + dx;
        newH = height - dy;
        break;
      case 'right':
        newW = width + dx;
        break;
      case 'bottomRight':
        newW = width + dx;
        newH = height + dy;
        break;
      case 'bottom':
        newH = height + dy;
        break;
      case 'bottomLeft':
        newX = x + dx;
        newW = width - dx;
        newH = height + dy;
        break;
      case 'left':
        newX = x + dx;
        newW = width - dx;
        break;
    }
    
    // Apply constraints
    const minSize = shape.type === 'circle' ? 30 : 30;
    newW = Math.max(minSize, Math.min(newW, canvasLayout.width - newX));
    newH = Math.max(minSize, Math.min(newH, canvasLayout.height - newY));
    newX = Math.max(0, Math.min(newX, canvasLayout.width - newW));
    newY = Math.max(0, Math.min(newY, canvasLayout.height - newH));
    
    updateSize(shape.id, newW, newH, newX, newY);
  };

  const renderShape = () => {
    const size = shape.width || 60;
    const height = shape.height || 40;
    
    switch (shape.type) {
      case 'rectangle':
        return (
          <View
            style={{
              width: size,
              height: height,
              backgroundColor: shape.backgroundColor || '#1976D2',
              borderRadius: 4,
            }}
          />
        );
      case 'circle':
        return (
          <View
            style={{
              width: size,
              height: size,
              backgroundColor: shape.backgroundColor || '#8e44ad',
              borderRadius: size / 2,
            }}
          />
        );
      default:
        return (
          <View
            style={{
              width: size,
              height: height,
              backgroundColor: shape.backgroundColor || '#1976D2',
              borderRadius: 4,
            }}
          />
        );
    }
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        zIndex: selected ? 2 : 1,
        borderWidth: selected ? 3 : 0,
        borderColor: selected ? '#007AFF' : 'transparent',
        borderRadius: 8,
        backgroundColor: selected ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
        transform: pan.getTranslateTransform(),
      }}
    >
      {renderShape()}
      {selected && [
        // Corner handles
        { handle: 'topLeft', x: 0, y: 0, type: 'corner' as const },
        { handle: 'topRight', x: shape.width || 60, y: 0, type: 'corner' as const },
        { handle: 'bottomRight', x: shape.width || 60, y: shape.height || 40, type: 'corner' as const },
        { handle: 'bottomLeft', x: 0, y: shape.height || 40, type: 'corner' as const },
        // Side handles
        { handle: 'top', x: (shape.width || 60) / 2, y: 0, type: 'side' as const },
        { handle: 'right', x: shape.width || 60, y: (shape.height || 40) / 2, type: 'side' as const },
        { handle: 'bottom', x: (shape.width || 60) / 2, y: shape.height || 40, type: 'side' as const },
        { handle: 'left', x: 0, y: (shape.height || 40) / 2, type: 'side' as const },
      ].map(({ handle, x, y, type }) => (
        <ResizeHandle
          key={handle}
          x={x}
          y={y}
          onResize={(dx, dy) => handleResize(handle, dx, dy)}
          type={type}
        />
      ))}
    </Animated.View>
  );
};

const TextOnCanvas = ({ textObj, selected, onPress, draggable, updatePosition, canvasLayout, onDoubleTap, updateSize }: {
  textObj: any;
  selected?: boolean;
  onPress?: (e?: GestureResponderEvent) => void;
  draggable?: boolean;
  updatePosition?: (x: number, y: number) => void;
  canvasLayout?: { x: number; y: number; width: number; height: number };
  onDoubleTap?: () => void;
  updateSize?: (id: string, newWidth: number, newHeight: number, newX: number, newY: number) => void;
}) => {
  const pan = React.useRef(new Animated.ValueXY({ x: textObj.x, y: textObj.y })).current;
  const panOffset = React.useRef({ x: textObj.x, y: textObj.y });
  const isDragging = React.useRef(false);
  const lastTap = React.useRef(0);
  
  // Get actual dimensions with fallbacks
  const actualWidth = textObj.width || 200;
  const actualHeight = textObj.height || 50;
  
  // Add state to track dimensions and make them reactive
  const [currentWidth, setCurrentWidth] = React.useState(actualWidth);
  const [currentHeight, setCurrentHeight] = React.useState(actualHeight);
  
  // Update dimensions when textObj changes
  React.useEffect(() => {
    setCurrentWidth(textObj.width || 200);
    setCurrentHeight(textObj.height || 50);
  }, [textObj.width, textObj.height]);
  
  React.useEffect(() => {
    // Don't update position if we're currently dragging
    if (isDragging.current) return;
    
    // Only update if the position has actually changed significantly
    const currentX = panOffset.current.x;
    const currentY = panOffset.current.y;
    const newX = textObj.x;
    const newY = textObj.y;
    
    // Only update if the difference is more than 1 pixel to avoid floating point issues
    if (Math.abs(currentX - newX) > 1 || Math.abs(currentY - newY) > 1) {
      pan.setValue({ x: newX, y: newY });
      panOffset.current = { x: newX, y: newY };
    }
  }, [textObj.x, textObj.y]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        if (onPress) onPress(evt);
        isDragging.current = true;
        panOffset.current = { x: textObj.x, y: textObj.y };
      },
      onPanResponderMove: (e: GestureResponderEvent, gesture) => {
        if (!canvasLayout) return;
        let newX = gesture.dx + panOffset.current.x;
        let newY = gesture.dy + panOffset.current.y;
        newX = Math.max(0, Math.min(newX, canvasLayout.width - currentWidth));
        newY = Math.max(0, Math.min(newY, canvasLayout.height - currentHeight));
        pan.setValue({ x: newX, y: newY });
      },
      onPanResponderRelease: (e: GestureResponderEvent, gesture) => {
        if (!canvasLayout) return;
        let newX = gesture.dx + panOffset.current.x;
        let newY = gesture.dy + panOffset.current.y;
        newX = Math.max(0, Math.min(newX, canvasLayout.width - currentWidth));
        newY = Math.max(0, Math.min(newY, canvasLayout.height - currentHeight));
        pan.setValue({ x: newX, y: newY });
        panOffset.current = { x: newX, y: newY };
        updatePosition && updatePosition(newX, newY);
        isDragging.current = false;
        
        // Check for double tap
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;
        if (now - lastTap.current < DOUBLE_TAP_DELAY) {
          // Double tap detected
          if (onDoubleTap) {
            onDoubleTap();
          }
        }
        lastTap.current = now;
      },
    })
  ).current;

  // Calculate responsive font size based on container size
  const getResponsiveFontSize = () => {
    const storedFontSize = textObj.fontSize || 16;
    const containerWidth = currentWidth;
    const containerHeight = currentHeight;
    const textLength = textObj.text?.length || 0;
    
    // Calculate optimal font size based on container dimensions
    const minDimension = Math.min(containerWidth, containerHeight);
    const maxDimension = Math.max(containerWidth, containerHeight);
    
    // Base font size calculation - more responsive to container size
    let responsiveSize = Math.max(8, Math.min(48, minDimension * 0.35));
    
    // Adjust based on aspect ratio
    const aspectRatio = containerWidth / containerHeight;
    if (aspectRatio > 3) {
      // Very wide container - reduce font size
      responsiveSize *= 0.8;
    } else if (aspectRatio < 0.5) {
      // Very tall container - increase font size slightly
      responsiveSize *= 1.1;
    }
    
    // Adjust for text length with better scaling
    if (textLength > 100) {
      responsiveSize *= 0.6;
    } else if (textLength > 50) {
      responsiveSize *= 0.75;
    } else if (textLength > 20) {
      responsiveSize *= 0.85;
    } else if (textLength < 5) {
      responsiveSize *= 1.2;
    }
    
    // Ensure bounds with better limits
    responsiveSize = Math.max(6, Math.min(60, responsiveSize));
    
    return Math.round(responsiveSize);
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        zIndex: selected ? 2 : 1,
        borderWidth: selected ? 3 : 0,
        borderColor: selected ? '#007AFF' : 'transparent',
        borderRadius: 8,
        backgroundColor: selected ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
        transform: pan.getTranslateTransform(),
        width: currentWidth,
        height: currentHeight,
        minWidth: 40,
        minHeight: 25,
      }}
    >
      <Text
        style={{
          fontSize: getResponsiveFontSize(),
          color: textObj.color || '#23235B',
          fontWeight: 'bold',
          fontFamily: textObj.fontFamily || 'System',
          width: '100%',
          height: '100%',
          textAlign: 'center',
          textAlignVertical: 'center',
          paddingHorizontal: Math.max(4, currentWidth * 0.03),
          paddingVertical: Math.max(2, currentHeight * 0.03),
          includeFontPadding: false,
          lineHeight: currentHeight * 0.85, // Better line height for text centering
          letterSpacing: 0.5, // Better letter spacing for readability
        }}
        numberOfLines={Math.max(1, Math.floor(currentHeight / getResponsiveFontSize()))}
        adjustsFontSizeToFit={true}
        minimumFontScale={0.2}
        allowFontScaling={true}
        ellipsizeMode="tail"
      >
        {textObj.text}
      </Text>
      
      {/* Resize handles - only show when selected */}
      {selected && updateSize && (
        <>
          {/* Corner resize handles */}
          <ResizeHandle
            x={0}
            y={0}
            onResize={(dx, dy) => {
              const newWidth = Math.max(40, currentWidth - dx);
              const newHeight = Math.max(25, currentHeight - dy);
              const newX = textObj.x + dx;
              const newY = textObj.y + dy;
              updateSize(textObj.id, newWidth, newHeight, newX, newY);
            }}
            type="corner"
            style={{ position: 'absolute', top: -5, left: -5 }}
          />
          <ResizeHandle
            x={currentWidth - 10}
            y={0}
            onResize={(dx, dy) => {
              const newWidth = Math.max(40, currentWidth + dx);
              const newHeight = Math.max(25, currentHeight - dy);
              const newY = textObj.y + dy;
              updateSize(textObj.id, newWidth, newHeight, textObj.x, newY);
            }}
            type="corner"
            style={{ position: 'absolute', top: -5, right: -5 }}
          />
          <ResizeHandle
            x={0}
            y={currentHeight - 10}
            onResize={(dx, dy) => {
              const newWidth = Math.max(40, currentWidth - dx);
              const newHeight = Math.max(25, currentHeight + dy);
              const newX = textObj.x + dx;
              updateSize(textObj.id, newWidth, newHeight, newX, textObj.y);
            }}
            type="corner"
            style={{ position: 'absolute', bottom: -5, left: -5 }}
          />
          <ResizeHandle
            x={currentWidth - 10}
            y={currentHeight - 10}
            onResize={(dx, dy) => {
              const newWidth = Math.max(40, currentWidth + dx);
              const newHeight = Math.max(25, currentHeight + dy);
              updateSize(textObj.id, newWidth, newHeight, textObj.x, textObj.y);
            }}
            type="corner"
            style={{ position: 'absolute', bottom: -5, right: -5 }}
          />
          
          {/* Side resize handles */}
          <ResizeHandle
            x={currentWidth / 2 - 5}
            y={0}
            onResize={(dx, dy) => {
              const newHeight = Math.max(25, currentHeight - dy);
              const newY = textObj.y + dy;
              updateSize(textObj.id, currentWidth, newHeight, textObj.x, newY);
            }}
            type="side"
            style={{ position: 'absolute', top: -5, left: '50%', marginLeft: -5 }}
          />
          <ResizeHandle
            x={currentWidth / 2 - 5}
            y={currentHeight - 10}
            onResize={(dx, dy) => {
              const newHeight = Math.max(25, currentHeight + dy);
              updateSize(textObj.id, currentWidth, newHeight, textObj.x, textObj.y);
            }}
            type="side"
            style={{ position: 'absolute', bottom: -5, left: '50%', marginLeft: -5 }}
          />
          <ResizeHandle
            x={0}
            y={currentHeight / 2 - 5}
            onResize={(dx, dy) => {
              const newWidth = Math.max(40, currentWidth - dx);
              const newX = textObj.x + dx;
              updateSize(textObj.id, newWidth, currentHeight, newX, textObj.y);
            }}
            type="side"
            style={{ position: 'absolute', left: -5, top: '50%', marginTop: -5 }}
          />
          <ResizeHandle
            x={currentWidth - 10}
            y={currentHeight / 2 - 5}
            onResize={(dx, dy) => {
              const newWidth = Math.max(40, currentWidth + dx);
              updateSize(textObj.id, newWidth, currentHeight, textObj.x, textObj.y);
            }}
            type="side"
            style={{ position: 'absolute', right: -5, top: '50%', marginTop: -5 }}
          />
        </>
      )}
    </Animated.View>
  );
};

const ImageOnCanvas = ({ image, selected, onPress, draggable, updatePosition, canvasLayout, updateSize }: {
  image: any;
  selected?: boolean;
  onPress?: (e?: GestureResponderEvent) => void;
  draggable?: boolean;
  updatePosition?: (x: number, y: number) => void;
  canvasLayout?: { x: number; y: number; width: number; height: number };
  updateSize?: (id: string, newWidth: number, newHeight: number, newX: number, newY: number) => void;
}) => {
  const pan = React.useRef(new Animated.ValueXY({ x: image.x, y: image.y })).current;
  const panOffset = React.useRef({ x: image.x, y: image.y });
  const isDragging = React.useRef(false);
  
  React.useEffect(() => {
    if (isDragging.current) return;
    const currentX = panOffset.current.x;
    const currentY = panOffset.current.y;
    const newX = image.x;
    const newY = image.y;
    if (Math.abs(currentX - newX) > 1 || Math.abs(currentY - newY) > 1) {
      pan.setValue({ x: newX, y: newY });
      panOffset.current = { x: newX, y: newY };
    }
  }, [image.x, image.y]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        if (onPress) onPress(evt);
        isDragging.current = true;
        panOffset.current = { x: image.x, y: image.y };
      },
      onPanResponderMove: (e: GestureResponderEvent, gesture) => {
        if (!canvasLayout) return;
        let newX = gesture.dx + panOffset.current.x;
        let newY = gesture.dy + panOffset.current.y;
        newX = Math.max(0, Math.min(newX, canvasLayout.width - (image.width || 60)));
        newY = Math.max(0, Math.min(newY, canvasLayout.height - (image.height || 60)));
        pan.setValue({ x: newX, y: newY });
      },
      onPanResponderRelease: (e: GestureResponderEvent, gesture) => {
        if (!canvasLayout) return;
        let newX = gesture.dx + panOffset.current.x;
        let newY = gesture.dy + panOffset.current.y;
        newX = Math.max(0, Math.min(newX, canvasLayout.width - (image.width || 60)));
        newY = Math.max(0, Math.min(newY, canvasLayout.height - (image.height || 60)));
        pan.setValue({ x: newX, y: newY });
        panOffset.current = { x: newX, y: newY };
        updatePosition && updatePosition(newX, newY);
        isDragging.current = false;
      },
    })
  ).current;

  // Enhanced handleResize for all sides and corners
  const handleResize = (handle: string, dx: number, dy: number) => {
    if (!updateSize || !canvasLayout) return;
    let { x, y, width, height } = image;
    let newX = x, newY = y, newW = width, newH = height;
    
    switch (handle) {
      case 'topLeft':
        newX = x + dx;
        newY = y + dy;
        newW = width - dx;
        newH = height - dy;
        break;
      case 'top':
        newY = y + dy;
        newH = height - dy;
        break;
      case 'topRight':
        newY = y + dy;
        newW = width + dx;
        newH = height - dy;
        break;
      case 'right':
        newW = width + dx;
        break;
      case 'bottomRight':
        newW = width + dx;
        newH = height + dy;
        break;
      case 'bottom':
        newH = height + dy;
        break;
      case 'bottomLeft':
        newX = x + dx;
        newW = width - dx;
        newH = height + dy;
        break;
      case 'left':
        newX = x + dx;
        newW = width - dx;
        break;
    }
    
    // Apply constraints
    const minSize = 30;
    newW = Math.max(minSize, Math.min(newW, canvasLayout.width - newX));
    newH = Math.max(minSize, Math.min(newH, canvasLayout.height - newY));
    newX = Math.max(0, Math.min(newX, canvasLayout.width - newW));
    newY = Math.max(0, Math.min(newY, canvasLayout.height - newH));
    
    updateSize(image.id, newW, newH, newX, newY);
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        zIndex: selected ? 2 : 1,
        borderWidth: selected ? 3 : 0,
        borderColor: selected ? '#007AFF' : 'transparent',
        borderRadius: 8,
        backgroundColor: selected ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
        transform: pan.getTranslateTransform(),
        width: image.width,
        height: image.height,
      }}
    >
      <Image 
        source={{ uri: image.uri }} 
        style={{ width: image.width, height: image.height, borderRadius: 8 }} 
        resizeMode="contain" 
      />
      {selected && [
        // Corners
        { handle: 'topLeft', x: 0, y: 0 },
        { handle: 'topRight', x: image.width, y: 0 },
        { handle: 'bottomRight', x: image.width, y: image.height },
        { handle: 'bottomLeft', x: 0, y: image.height },
        // Sides
        { handle: 'top', x: image.width / 2, y: 0 },
        { handle: 'right', x: image.width, y: image.height / 2 },
        { handle: 'bottom', x: image.width / 2, y: image.height },
        { handle: 'left', x: 0, y: image.height / 2 },
      ].map(({ handle, x, y }) => (
        <ResizeHandle
          key={handle}
          x={x}
          y={y}
          onResize={(dx, dy) => handleResize(handle, dx, dy)}
          type={['top', 'right', 'bottom', 'left'].includes(handle) ? 'side' : 'corner'}
        />
      ))}
    </Animated.View>
  );
};

export interface TableElement {
  id: string;
  type: 'table';
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  columns: string[];
  rows: string[][];
  backgroundColor: string;
  borderColor: string;
  titleBackgroundColor: string;
  selected: boolean;
}

const TableOnCanvas = ({ table, selected, onPress, draggable, updatePosition, canvasLayout, updateSize }: {
  table: any;
  selected?: boolean;
  onPress?: (e?: GestureResponderEvent) => void;
  draggable?: boolean;
  updatePosition?: (x: number, y: number) => void;
  canvasLayout?: { x: number; y: number; width: number; height: number };
  updateSize?: (id: string, newWidth: number, newHeight: number, newX: number, newY: number) => void;
}) => {
  const pan = React.useRef(new Animated.ValueXY({ x: table.x, y: table.y })).current;
  const panOffset = React.useRef({ x: table.x, y: table.y });
  const isDragging = React.useRef(false);
  
  React.useEffect(() => {
    if (isDragging.current) return;
    const currentX = panOffset.current.x;
    const currentY = panOffset.current.y;
    const newX = table.x;
    const newY = table.y;
    if (Math.abs(currentX - newX) > 1 || Math.abs(currentY - newY) > 1) {
      pan.setValue({ x: newX, y: newY });
      panOffset.current = { x: newX, y: newY };
    }
  }, [table.x, table.y]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        if (onPress) onPress(evt);
        isDragging.current = true;
        panOffset.current = { x: table.x, y: table.y };
      },
      onPanResponderMove: (e: GestureResponderEvent, gesture) => {
        if (!canvasLayout) return;
        let newX = gesture.dx + panOffset.current.x;
        let newY = gesture.dy + panOffset.current.y;
        newX = Math.max(0, Math.min(newX, canvasLayout.width - (table.width || 300)));
        newY = Math.max(0, Math.min(newY, canvasLayout.height - (table.height || 200)));
        pan.setValue({ x: newX, y: newY });
      },
      onPanResponderRelease: (e: GestureResponderEvent, gesture) => {
        if (!canvasLayout) return;
        let newX = gesture.dx + panOffset.current.x;
        let newY = gesture.dy + panOffset.current.y;
        newX = Math.max(0, Math.min(newX, canvasLayout.width - (table.width || 300)));
        newY = Math.max(0, Math.min(newY, canvasLayout.height - (table.height || 200)));
        pan.setValue({ x: newX, y: newY });
        panOffset.current = { x: newX, y: newY };
        updatePosition && updatePosition(newX, newY);
        isDragging.current = false;
      },
    })
  ).current;

  const handleResize = (handle: string, dx: number, dy: number) => {
    if (!updateSize || !canvasLayout) return;
    let { x, y, width, height } = table;
    let newX = x, newY = y, newW = width, newH = height;
    
    switch (handle) {
      case 'topLeft':
        newX = x + dx;
        newY = y + dy;
        newW = width - dx;
        newH = height - dy;
        break;
      case 'top':
        newY = y + dy;
        newH = height - dy;
        break;
      case 'topRight':
        newY = y + dy;
        newW = width + dx;
        newH = height - dy;
        break;
      case 'right':
        newW = width + dx;
        break;
      case 'bottomRight':
        newW = width + dx;
        newH = height + dy;
        break;
      case 'bottom':
        newH = height + dy;
        break;
      case 'bottomLeft':
        newX = x + dx;
        newW = width - dx;
        newH = height + dy;
        break;
      case 'left':
        newX = x + dx;
        newW = width - dx;
        break;
    }
    
    // Apply constraints for tables
    const minWidth = 200;
    const minHeight = 100;
    newW = Math.max(minWidth, Math.min(newW, canvasLayout.width - newX));
    newH = Math.max(minHeight, Math.min(newH, canvasLayout.height - newY));
    newX = Math.max(0, Math.min(newX, canvasLayout.width - newW));
    newY = Math.max(0, Math.min(newY, canvasLayout.height - newH));
    
    updateSize(table.id, newW, newH, newX, newY);
  };

  const renderTable = () => {
    const { title, columns, rows, backgroundColor, borderColor, titleBackgroundColor } = table;
    const cellWidth = (table.width || 300) / Math.max(columns?.length || 1, 1);
    const headerHeight = 40;
    const rowHeight = 30;
    const titleHeight = title ? 40 : 0;

    return (
      <View style={{
        width: table.width || 300,
        height: table.height || 200,
        backgroundColor: backgroundColor || '#ffffff',
        borderWidth: 1,
        borderColor: borderColor || '#000000',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        {/* Title */}
        {title && (
          <View style={{
            height: titleHeight,
            backgroundColor: titleBackgroundColor || '#4CAF50',
            justifyContent: 'center',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: borderColor || '#000000',
          }}>
            <Text style={{
              color: '#ffffff',
              fontSize: 16,
              fontWeight: 'bold',
            }}>
              {title}
            </Text>
          </View>
        )}
        
        {/* Column Headers */}
        <View style={{
          flexDirection: 'row',
          height: headerHeight,
          borderBottomWidth: 1,
          borderBottomColor: borderColor || '#000000',
        }}>
          {columns?.map((column: string, index: number) => (
            <View key={index} style={{
              width: cellWidth,
              height: headerHeight,
              borderRightWidth: index < (columns.length - 1) ? 1 : 0,
              borderRightColor: borderColor || '#000000',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#f5f5f5',
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: 'bold',
                color: '#333333',
                textAlign: 'center',
              }}>
                {column}
              </Text>
            </View>
          ))}
        </View>
        
        {/* Table Rows */}
        {rows?.map((row: string[], rowIndex: number) => (
          <View key={rowIndex} style={{
            flexDirection: 'row',
            height: rowHeight,
            borderBottomWidth: rowIndex < (rows.length - 1) ? 1 : 0,
            borderBottomColor: borderColor || '#000000',
          }}>
            {row.map((cell: string, cellIndex: number) => (
              <View key={cellIndex} style={{
                width: cellWidth,
                height: rowHeight,
                borderRightWidth: cellIndex < (row.length - 1) ? 1 : 0,
                borderRightColor: borderColor || '#000000',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text style={{
                  fontSize: 11,
                  color: '#333333',
                  textAlign: 'center',
                }}>
                  {cell}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        zIndex: selected ? 2 : 1,
        borderWidth: selected ? 3 : 0,
        borderColor: selected ? '#007AFF' : 'transparent',
        borderRadius: 8,
        backgroundColor: selected ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
        transform: pan.getTranslateTransform(),
      }}
    >
      {renderTable()}
      {selected && [
        // Corner handles
        { handle: 'topLeft', x: 0, y: 0, type: 'corner' as const },
        { handle: 'topRight', x: table.width || 300, y: 0, type: 'corner' as const },
        { handle: 'bottomRight', x: table.width || 300, y: table.height || 200, type: 'corner' as const },
        { handle: 'bottomLeft', x: 0, y: table.height || 200, type: 'corner' as const },
        // Side handles
        { handle: 'top', x: (table.width || 300) / 2, y: 0, type: 'side' as const },
        { handle: 'right', x: table.width || 300, y: (table.height || 200) / 2, type: 'side' as const },
        { handle: 'bottom', x: (table.width || 300) / 2, y: table.height || 200, type: 'side' as const },
        { handle: 'left', x: 0, y: (table.height || 200) / 2, type: 'side' as const },
      ].map(({ handle, x, y, type }) => (
        <ResizeHandle
          key={handle}
          x={x}
          y={y}
          onResize={(dx, dy) => handleResize(handle, dx, dy)}
          type={type}
        />
      ))}
    </Animated.View>
  );
};

const TemplateEditScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const designStore = useDesignStore();
  const { addDesign } = useDesigns();
  
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [showToolbox, setShowToolbox] = useState(false);
  const [showToolsToolbox, setShowToolsToolbox] = useState(false);
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [showCanvasColorPicker, setShowCanvasColorPicker] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [templateName, setTemplateName] = useState('Template Edit');
  const [showTableEditor, setShowTableEditor] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [currentColorPickerTarget, setCurrentColorPickerTarget] = useState<'shape' | 'text' | 'canvas' | 'draw' | 'table'>('shape');
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [editingText, setEditingText] = useState<any>(null);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showFontSizeSlider, setShowFontSizeSlider] = useState(false);
  const [showFontFamilyPicker, setShowFontFamilyPicker] = useState(false);
  const ignoreNextCanvasPress = React.useRef(false);
  const viewShotRef = useRef(null);

  const elements = designStore.elements;
  const selectedElements = designStore.selectedElements;
  const canvasBackgroundColor = designStore.canvasBackgroundColor;

  useEffect(() => {
    // Set template name from params if available
    if (params.templateName) {
      setTemplateName(params.templateName as string);
    }
    // Only load elements if the store is empty and we have elements to load
    if (params.elements && designStore.elements.length === 0) {
      try {
        const parsedElements = JSON.parse(params.elements as string);
        designStore.setElements(parsedElements);
      } catch (e) {
        // ignore
      }
    }
    // Only set canvas background color if store is empty and we have a color
    if (params.canvasBgColor && designStore.elements.length === 0) {
      designStore.setCanvasBackgroundColor(params.canvasBgColor as string);
    }
  }, [params]);

  const handleUndo = () => {
    if (designStore.canUndo()) {
      designStore.undo();
    }
  };

  const handleRedo = () => {
    if (designStore.canRedo()) {
      designStore.redo();
    }
  };

  const handleToolboxPress = async (tool: string) => {
    switch (tool) {
      case 'shape':
        setShowShapePicker(true);
        break;
      case 'text':
        setShowTextInput(true);
        break;
      case 'image':
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        });
        if (!result.canceled && result.assets[0]) {
          const newImage = {
            id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'image' as const,
            x: 50,
            y: 50,
            width: 100,
            height: 100,
            uri: result.assets[0].uri,
            selected: false,
          };
          designStore.addElement(newImage);
        }
        break;
      case 'table':
        const newTable = {
          id: `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'table' as const,
          x: 50,
          y: 50,
          width: 300,
          height: 200,
          title: 'New Table',
          columns: ['Column 1', 'Column 2'],
          rows: [['Row 1, Col 1', 'Row 1, Col 2']],
          backgroundColor: '#ffffff',
          borderColor: '#000000',
          titleBackgroundColor: '#4CAF50', // Added default title background color
          selected: false,
        };
        designStore.addElement(newTable);
        setSelectedTable(newTable.id);
        break;
      case 'color':
        setShowColorPicker(true);
        break;
      case 'save':
        try {
          await designStore.saveDesign();
          Alert.alert('Success', 'Template saved successfully!');
        } catch (error) {
          Alert.alert('Error', 'Failed to save template');
        }
        break;
      case 'back':
        router.back();
        break;
    }
    setShowToolbox(false);
  };

  const handleToolsToolboxPress = (tool: string) => {
    designStore.setCurrentTool(tool as any);
    setShowToolsToolbox(false);
  };

  const handleShapeSelect = (shapeType: string) => {
    const newShape = {
      id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: shapeType as any,
      x: 50,
      y: 50,
      width: 60,
      height: 40,
      backgroundColor: '#1976D2',
      selected: false,
    };
    designStore.addElement(newShape);
    setShowShapePicker(false);
  };

  const handleCanvasPress = (e: any) => {
    if (ignoreNextCanvasPress.current) {
      ignoreNextCanvasPress.current = false;
      return;
    }
    designStore.clearSelection();
    setSelectedShape(null);
    setSelectedText(null);
    setSelectedImage(null);
    setSelectedTable(null);
  };

  const handleShapePress = (id: string, e?: GestureResponderEvent) => {
    ignoreNextCanvasPress.current = true;
    designStore.selectElement(id);
    setSelectedShape(id);
    setSelectedText(null);
    setSelectedImage(null);
  };

  const handleImagePress = (id: string, e?: GestureResponderEvent) => {
    ignoreNextCanvasPress.current = true;
    designStore.selectElement(id);
    setSelectedImage(id);
    setSelectedShape(null);
    setSelectedText(null);
  };

  const handleTablePress = (id: string, e?: GestureResponderEvent) => {
    ignoreNextCanvasPress.current = true;
    designStore.selectElement(id);
    setSelectedTable(id);
    setSelectedShape(null);
    setSelectedText(null);
    setSelectedImage(null);
  };

  const handleTableEdit = (tableId: string) => {
    const table = elements.find(el => el.id === tableId);
    if (table && table.type === 'table') {
      setEditingTable(table);
      setShowTableEditor(true);
    }
  };

  const handleTableSave = () => {
    if (editingTable) {
      designStore.updateElement(editingTable.id, {
        title: editingTable.title,
        columns: editingTable.columns,
        rows: editingTable.rows,
        titleBackgroundColor: editingTable.titleBackgroundColor,
      } as any);
      setShowTableEditor(false);
      setEditingTable(null);
    }
  };

  const addTableColumn = () => {
    if (editingTable) {
      const newColumns = [...editingTable.columns, `Column ${editingTable.columns.length + 1}`];
      const newRows = editingTable.rows.map((row: string[]) => [...row, '']);
      setEditingTable({
        ...editingTable,
        columns: newColumns,
        rows: newRows,
      });
    }
  };

  const removeTableColumn = (columnIndex: number) => {
    if (editingTable && editingTable.columns.length > 1) {
      const newColumns = editingTable.columns.filter((_: any, index: number) => index !== columnIndex);
      const newRows = editingTable.rows.map((row: string[]) => row.filter((_: any, index: number) => index !== columnIndex));
      setEditingTable({
        ...editingTable,
        columns: newColumns,
        rows: newRows,
      });
    }
  };

  const addTableRow = () => {
    if (editingTable) {
      const newRow = editingTable.columns.map(() => '');
      setEditingTable({
        ...editingTable,
        rows: [...editingTable.rows, newRow],
      });
    }
  };

  const removeTableRow = (rowIndex: number) => {
    if (editingTable && editingTable.rows.length > 1) {
      const newRows = editingTable.rows.filter((_: any, index: number) => index !== rowIndex);
      setEditingTable({
        ...editingTable,
        rows: newRows,
      });
    }
  };

  const updateShapePosition = (id: string, newX: number, newY: number) => {
    designStore.updateElement(id, { x: newX, y: newY });
  };

  const updateShapeSize = (id: string, newWidth: number, newHeight: number, newX: number, newY: number) => {
    designStore.updateElement(id, { 
      width: newWidth, 
      height: newHeight, 
      x: newX, 
      y: newY 
    });
  };

  const deleteSelectedShape = () => {
    if (selectedShape !== null) {
      designStore.deleteElement(selectedShape);
      setSelectedShape(null);
    }
  };

  const deleteSelectedText = () => {
    if (selectedText !== null) {
      designStore.deleteElement(selectedText);
      setSelectedText(null);
    }
  };

  const changeShapeColor = (color: string) => {
    if (selectedShape !== null) {
      designStore.updateElement(selectedShape, { backgroundColor: color });
    }
    setShowColorPicker(false);
  };

  const updateImagePosition = (id: string, newX: number, newY: number) => {
    designStore.updateElement(id, { x: newX, y: newY });
  };

  const updateImageSize = React.useCallback((id: string, newWidth: number, newHeight: number, newX: number, newY: number) => {
    // Get current element to check if update is needed
    const currentElement = elements.find(el => el.id === id);
    if (currentElement) {
      // Only update if there are actual changes
      if (currentElement.width === newWidth && currentElement.height === newHeight && 
          currentElement.x === newX && currentElement.y === newY) {
        return;
      }
    }
    
    designStore.updateElement(id, { 
      width: newWidth, 
      height: newHeight, 
      x: newX, 
      y: newY 
    });
  }, [elements, designStore]);

  const updateTablePosition = (id: string, newX: number, newY: number) => {
    designStore.updateElement(id, { x: newX, y: newY });
  };

  const updateTableSize = (id: string, newWidth: number, newHeight: number, newX: number, newY: number) => {
    designStore.updateElement(id, { 
      width: newWidth, 
      height: newHeight, 
      x: newX, 
      y: newY 
    });
  };

  const deleteSelectedImage = () => {
    if (selectedImage !== null) {
      designStore.deleteElement(selectedImage);
      setSelectedImage(null);
    }
  };

  const deleteSelectedTable = () => {
    if (selectedTable !== null) {
      designStore.deleteElement(selectedTable);
      setSelectedTable(null);
    }
  };

  const deleteSelectedElement = () => {
    if (selectedShape !== null) {
      deleteSelectedShape();
    } else if (selectedText !== null) {
      deleteSelectedText();
    } else if (selectedImage !== null) {
      deleteSelectedImage();
    } else if (selectedTable !== null) {
      deleteSelectedTable();
    }
  };

  // Layer ordering functions
  const bringToFront = () => {
    if (selectedShape !== null) {
      designStore.bringToFront(selectedShape);
    } else if (selectedText !== null) {
      designStore.bringToFront(selectedText);
    } else if (selectedImage !== null) {
      designStore.bringToFront(selectedImage);
    } else if (selectedTable !== null) {
      designStore.bringToFront(selectedTable);
    }
  };

  const sendToBack = () => {
    if (selectedShape !== null) {
      designStore.sendToBack(selectedShape);
    } else if (selectedText !== null) {
      designStore.sendToBack(selectedText);
    } else if (selectedImage !== null) {
      designStore.sendToBack(selectedImage);
    } else if (selectedTable !== null) {
      designStore.sendToBack(selectedTable);
    }
  };

  const handleTextPress = (id: string, e?: GestureResponderEvent) => {
    ignoreNextCanvasPress.current = true;
    designStore.selectElement(id);
    setSelectedText(id);
    setSelectedShape(null);
    setSelectedImage(null);
  };

  const updateTextPosition = (id: string, newX: number, newY: number) => {
    designStore.updateElement(id, { x: newX, y: newY });
  };

  const handleCanvasColor = () => setShowCanvasColorPicker(true);

  const handleSaveTemplate = async () => {
    try {
      await designStore.saveDesign();
      // Add to recent designs for homepage
      const firstImage = elements.find(e => e.type === 'image');
      addDesign({
        label: templateName,
        image: firstImage?.uri || 'https://placehold.co/100x150?text=Design',
        isCompleted: false,
        elements: elements,
        canvasBackgroundColor: canvasBackgroundColor,
      });
      // Save to gallery
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant gallery permission to save the design.');
        return;
      }
      const uri = await captureRef(viewShotRef, { format: 'png', quality: 1 });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Success', 'Template saved successfully and added to your gallery!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save template or add to gallery');
    }
  };

  // Calculate canvas dimensions based on template or use defaults
  const getCanvasDimensions = () => {
    // If we have elements, calculate the canvas size based on the template
    if (elements.length > 0) {
      // Find the maximum bounds of all elements
      let maxX = 0, maxY = 0;
      elements.forEach(element => {
        const elementRight = element.x + (element.width || 60);
        const elementBottom = element.y + (element.height || 40);
        maxX = Math.max(maxX, elementRight);
        maxY = Math.max(maxY, elementBottom);
      });
      
      // Add some padding and ensure minimum size
      const templateWidth = Math.max(maxX + 40, 420); // Default template width
      const templateHeight = Math.max(maxY + 40, 483); // Default template height
      
      // Scale to fit screen while maintaining aspect ratio
      const maxWidth = screenWidth * 0.95;
      const maxHeight = screenHeight * 0.6;
      const scaleX = maxWidth / templateWidth;
      const scaleY = maxHeight / templateHeight;
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
      
      return {
        width: templateWidth * scale,
        height: templateHeight * scale,
      };
    }
    
    // Default dimensions
    return {
      width: CANVAS_SIZE,
      height: CANVAS_HEIGHT,
    };
  };

  const canvasDimensions = getCanvasDimensions();
  
  // Calculate scaling factor for elements
  const getScaleFactor = () => {
    if (elements.length > 0) {
      // Find the maximum bounds of all elements
      let maxX = 0, maxY = 0;
      elements.forEach(element => {
        const elementRight = element.x + (element.width || 60);
        const elementBottom = element.y + (element.height || 40);
        maxX = Math.max(maxX, elementRight);
        maxY = Math.max(maxY, elementBottom);
      });
      
      const templateWidth = Math.max(maxX + 40, 420);
      const templateHeight = Math.max(maxY + 40, 483);
      
      const maxWidth = screenWidth * 0.95;
      const maxHeight = screenHeight * 0.6;
      const scaleX = maxWidth / templateWidth;
      const scaleY = maxHeight / templateHeight;
      return Math.min(scaleX, scaleY, 1);
    }
    return 1;
  };
  
  const scaleFactor = getScaleFactor();
  
  const canvasLayout = {
    x: 0,
    y: 0,
    width: canvasDimensions.width,
    height: canvasDimensions.height,
  };

  const handleTextEdit = (textId: string) => {
    const textElement = elements.find(el => el.id === textId);
    if (textElement && textElement.type === 'text') {
      setEditingText(textElement);
      setShowTextEditor(true);
    }
  };

  const handleTextColorChange = (color: string) => {
    if (selectedText !== null) {
      designStore.updateElement(selectedText, { color: color });
    }
    setShowTextColorPicker(false);
  };

  const handleFontSizeChange = (fontSize: number) => {
    if (selectedText !== null) {
      designStore.updateElement(selectedText, { fontSize: fontSize });
    }
  };

  const handleFontFamilyChange = (fontFamily: string) => {
    if (selectedText !== null) {
      designStore.updateElement(selectedText, { fontFamily: fontFamily });
    }
    setShowFontFamilyPicker(false);
  };

  const handleTextSave = () => {
    if (editingText && editingText.text.trim()) {
      designStore.updateElement(editingText.id, { text: editingText.text });
      setShowTextEditor(false);
      setEditingText(null);
    }
  };

  const updateTextSize = React.useCallback((id: string, newWidth: number, newHeight: number, newX: number, newY: number) => {
    console.log('updateTextSize called:', { id, newWidth, newHeight, newX, newY });
    
    // Get current element to check if update is needed
    const currentElement = elements.find(el => el.id === id);
    if (currentElement) {
      console.log('Current element:', { 
        width: currentElement.width, 
        height: currentElement.height, 
        x: currentElement.x, 
        y: currentElement.y 
      });
      
      // Only update if there are actual changes
      if (currentElement.width === newWidth && currentElement.height === newHeight && 
          currentElement.x === newX && currentElement.y === newY) {
        console.log('No changes detected, skipping update');
        return;
      }
    }
    
    // Calculate new font size based on new container dimensions with better algorithm
    const minDimension = Math.min(newWidth, newHeight);
    const maxDimension = Math.max(newWidth, newHeight);
    const aspectRatio = newWidth / newHeight;
    const textLength = (currentElement as any)?.text?.length || 0;
    
    // Base font size calculation
    let newFontSize = Math.max(6, Math.min(60, minDimension * 0.35));
    
    // Adjust based on aspect ratio
    if (aspectRatio > 3) {
      newFontSize *= 0.8;
    } else if (aspectRatio < 0.5) {
      newFontSize *= 1.1;
    }
    
    // Adjust for text length
    if (textLength > 100) {
      newFontSize *= 0.6;
    } else if (textLength > 50) {
      newFontSize *= 0.75;
    } else if (textLength > 20) {
      newFontSize *= 0.85;
    } else if (textLength < 5) {
      newFontSize *= 1.2;
    }
    
    // Ensure bounds
    newFontSize = Math.max(6, Math.min(60, newFontSize));
    
    console.log('Updating text element with new dimensions and font size:', { 
      newFontSize: Math.round(newFontSize),
      aspectRatio: aspectRatio.toFixed(2),
      textLength 
    });
    
    designStore.updateElement(id, { 
      width: newWidth, 
      height: newHeight, 
      x: newX, 
      y: newY,
      fontSize: Math.round(newFontSize) // Update font size based on new container size
    });
  }, [elements, designStore]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {templateName}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Tap elements to select • Drag to move • Use handles to resize
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSaveTemplate}
        >
          <Ionicons name="save" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {selectedImage && (
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <TouchableOpacity
            style={{ backgroundColor: '#6366F1', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 }}
            onPress={async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
              });
              if (!result.canceled && result.assets[0]) {
                designStore.updateElement(selectedImage, { uri: result.assets[0].uri });
              }
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Replace Image</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedTable && (
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <TouchableOpacity
            style={{ backgroundColor: '#4CAF50', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 }}
            onPress={() => handleTableEdit(selectedTable)}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Edit Table</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Canvas */}
      <View style={styles.canvasContainer}>
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }} style={{ alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={[
              styles.canvas,
              {
                backgroundColor: canvasBackgroundColor,
                width: canvasDimensions.width,
                height: canvasDimensions.height,
                borderWidth: 2,
                borderColor: '#E0E0E0',
                borderRadius: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              },
            ]}
            onTouchEnd={handleCanvasPress}
          >
            {/* Selection indicator */}
            {(selectedShape || selectedText || selectedImage || selectedTable) && (
              <View style={styles.selectionIndicator}>
                <Text style={styles.selectionText}>
                  {selectedShape ? 'Shape Selected' : selectedText ? 'Text Selected' : selectedImage ? 'Image Selected' : 'Table Selected'}
                </Text>
              </View>
            )}
            {elements.map((element) => {
              // Scale the element properties for display
              const scaledElement = {
                ...element,
                x: element.x * scaleFactor,
                y: element.y * scaleFactor,
                width: (element.width || 60) * scaleFactor,
                height: (element.height || 40) * scaleFactor,
                ...(element.type === 'text' && { fontSize: (element.fontSize || 16) * scaleFactor }),
              };
              
              if (element.type === 'rectangle' || element.type === 'circle') {
                return (
                  <ShapeOnCanvas
                    key={element.id}
                    shape={scaledElement}
                    selected={selectedElements.includes(element.id)}
                    onPress={() => handleShapePress(element.id, undefined)}
                    draggable={true}
                    updatePosition={(x, y) => updateShapePosition(element.id, x / scaleFactor, y / scaleFactor)}
                    canvasLayout={canvasLayout}
                    updateSize={(id, width, height, x, y) => updateShapeSize(element.id, width / scaleFactor, height / scaleFactor, x / scaleFactor, y / scaleFactor)}
                  />
                );
              } else if (element.type === 'text') {
                return (
                  <TextOnCanvas
                    key={element.id}
                    textObj={scaledElement}
                    selected={selectedElements.includes(element.id)}
                    onPress={() => handleTextPress(element.id, undefined)}
                    draggable={true}
                    updatePosition={(x, y) => updateTextPosition(element.id, x / scaleFactor, y / scaleFactor)}
                    canvasLayout={canvasLayout}
                    onDoubleTap={() => handleTextEdit(element.id)}
                    updateSize={(id, width, height, x, y) => updateTextSize(id, width / scaleFactor, height / scaleFactor, x / scaleFactor, y / scaleFactor)}
                  />
                );
              } else if (element.type === 'image') {
                return (
                  <ImageOnCanvas
                    key={element.id}
                    image={scaledElement}
                    selected={selectedElements.includes(element.id)}
                    onPress={() => handleImagePress(element.id, undefined)}
                    draggable={true}
                    updatePosition={(x, y) => updateImagePosition(element.id, x / scaleFactor, y / scaleFactor)}
                    canvasLayout={canvasLayout}
                    updateSize={(id, width, height, x, y) => updateImageSize(id, width / scaleFactor, height / scaleFactor, x / scaleFactor, y / scaleFactor)}
                  />
                );
              } else if (element.type === 'table') {
                return (
                  <TableOnCanvas
                    key={element.id}
                    table={scaledElement}
                    selected={selectedElements.includes(element.id)}
                    onPress={() => handleTablePress(element.id, undefined)}
                    draggable={true}
                    updatePosition={(x, y) => updateTablePosition(element.id, x / scaleFactor, y / scaleFactor)}
                    canvasLayout={canvasLayout}
                    updateSize={(id, width, height, x, y) => updateTableSize(element.id, width / scaleFactor, height / scaleFactor, x / scaleFactor, y / scaleFactor)}
                  />
                );
              }
              return null;
            })}
          </View>
        </ViewShot>
      </View>

      {/* Toolbar */}
      <View style={[styles.toolbar, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => setShowToolbox(true)}
        >
          <Ionicons name="add" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={handleUndo}
          disabled={!designStore.canUndo()}
        >
          <Ionicons name="arrow-undo" size={24} color={designStore.canUndo() ? colors.text : colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={handleRedo}
          disabled={!designStore.canRedo()}
        >
          <Ionicons name="arrow-redo" size={24} color={designStore.canRedo() ? colors.text : colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={deleteSelectedElement}
          disabled={!selectedShape && !selectedText && !selectedImage && !selectedTable}
        >
          <Ionicons 
            name="trash" 
            size={24} 
            color={selectedShape || selectedText || selectedImage || selectedTable ? '#FF3B30' : colors.textSecondary} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => {
            if (selectedText) {
              setShowTextColorPicker(true);
            } else if (selectedShape) {
              setShowColorPicker(true);
            }
          }}
          disabled={!selectedShape && !selectedText}
        >
          <Ionicons 
            name="color-palette" 
            size={24} 
            color={selectedShape || selectedText ? colors.text : colors.textSecondary} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={handleCanvasColor}
        >
          <Ionicons name="color-fill" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={bringToFront}
          disabled={!selectedShape && !selectedText && !selectedImage && !selectedTable}
        >
          <Ionicons 
            name="arrow-up" 
            size={24} 
            color={selectedShape || selectedText || selectedImage || selectedTable ? '#f39c12' : colors.textSecondary} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={sendToBack}
          disabled={!selectedShape && !selectedText && !selectedImage && !selectedTable}
        >
          <Ionicons 
            name="arrow-down" 
            size={24} 
            color={selectedShape || selectedText || selectedImage || selectedTable ? '#f39c12' : colors.textSecondary} 
          />
        </TouchableOpacity>
        
        {/* Text editing buttons - only show when text is selected */}
        {selectedText && (
          <>
            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={() => handleTextEdit(selectedText)}
            >
              <Ionicons name="create" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={() => setShowFontSizeSlider(true)}
            >
              <Ionicons name="text" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={() => setShowFontFamilyPicker(true)}
            >
              <Ionicons name="options" size={24} color={colors.text} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Toolbox Modal */}
      <Modal
        visible={showToolbox}
        transparent
        animationType="slide"
        onRequestClose={() => setShowToolbox(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.toolbox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.toolboxTitle, { color: colors.text }]}>Add Elements</Text>
            
            <View style={styles.toolboxGrid}>
              <TouchableOpacity
                style={styles.toolboxItem}
                onPress={() => handleToolboxPress('shape')}
              >
                <Ionicons name="shapes" size={32} color={colors.text} />
                <Text style={[styles.toolboxItemText, { color: colors.text }]}>Shape</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.toolboxItem}
                onPress={() => handleToolboxPress('text')}
              >
                <Ionicons name="text" size={32} color={colors.text} />
                <Text style={[styles.toolboxItemText, { color: colors.text }]}>Text</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.toolboxItem}
                onPress={() => handleToolboxPress('image')}
              >
                <Ionicons name="image" size={32} color={colors.text} />
                <Text style={[styles.toolboxItemText, { color: colors.text }]}>Image</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.toolboxItem}
                onPress={() => handleToolboxPress('table')}
              >
                <Ionicons name="grid-outline" size={32} color={colors.text} />
                <Text style={[styles.toolboxItemText, { color: colors.text }]}>Table</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.toolboxItem}
                onPress={() => handleToolboxPress('color')}
              >
                <Ionicons name="color-palette" size={32} color={colors.text} />
                <Text style={[styles.toolboxItemText, { color: colors.text }]}>Color</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowToolbox(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Shape Picker Modal */}
      <Modal
        visible={showShapePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShapePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.shapePicker, { backgroundColor: colors.surface }]}>
            <Text style={[styles.shapePickerTitle, { color: colors.text }]}>Select Shape</Text>
            
            <View style={styles.shapePickerGrid}>
              {SHAPE_OPTIONS.map((shape) => (
                <TouchableOpacity
                  key={shape.type}
                  style={styles.shapePickerItem}
                  onPress={() => handleShapeSelect(shape.type)}
                >
                  <Ionicons name={shape.icon as any} size={32} color={colors.text} />
                  <Text style={[styles.shapePickerItemText, { color: colors.text }]}>
                    {shape.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowShapePicker(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Color Picker Modal */}
      <Modal
        visible={showColorPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.colorPicker, { backgroundColor: colors.surface }]}>
            <Text style={[styles.colorPickerTitle, { color: colors.text }]}>Select Color</Text>
            
                <TouchableOpacity
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: '#3478f6',
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'center',
              }}
              onPress={() => {
                setCurrentColorPickerTarget('shape');
                setShowColorPicker(true);
                setShowColorPicker(false);
              }}
            >
              <Ionicons name="color-palette" size={16} color="#fff" />
              <Text style={{ color: '#fff', marginLeft: 4, fontWeight: '600' }}>Choose Color</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowColorPicker(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Text Input Modal */}
      <Modal
        visible={showTextInput}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTextInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.textInputModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.textInputTitle, { color: colors.text }]}>Add Text</Text>
            
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={textInputValue}
              onChangeText={setTextInputValue}
              placeholder="Enter text... (Press Enter for new line)"
              placeholderTextColor={colors.textSecondary}
              multiline
              returnKeyType="default"
              blurOnSubmit={false}
              textAlignVertical="top"
            />
            
            <View style={styles.textInputButtons}>
              <TouchableOpacity
                style={styles.textInputButton}
                onPress={() => setShowTextInput(false)}
              >
                <Text style={styles.textInputButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.textInputButton, styles.textInputButtonPrimary]}
                onPress={() => {
                  if (textInputValue.trim()) {
                    const newText = {
                      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                      type: 'text' as const,
                      x: 50,
                      y: 50,
                      width: 100,
                      height: 30,
                      text: textInputValue,
                      fontSize: 16,
                      fontFamily: 'System',
                      color: '#23235B',
                      selected: false,
                    };
                    designStore.addElement(newText);
                    setTextInputValue('');
                    setShowTextInput(false);
                  }
                }}
              >
                <Text style={styles.textInputButtonTextPrimary}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Canvas Color Picker Modal */}
      <Modal
        visible={showCanvasColorPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCanvasColorPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.colorPicker, { backgroundColor: colors.surface }]}>
            <Text style={[styles.colorPickerTitle, { color: colors.text }]}>Canvas Background</Text>
            
                <TouchableOpacity
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: '#3478f6',
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'center',
              }}
                  onPress={() => {
                setCurrentColorPickerTarget('canvas');
                setShowColorPicker(true);
                    setShowCanvasColorPicker(false);
                  }}
            >
              <Ionicons name="color-palette" size={16} color="#fff" />
              <Text style={{ color: '#fff', marginLeft: 4, fontWeight: '600' }}>Choose Color</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCanvasColorPicker(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Table Editor Modal */}
      <Modal
        visible={showTableEditor}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTableEditor(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.tableEditor, { backgroundColor: colors.surface }]}>
            <Text style={[styles.tableEditorTitle, { color: colors.text }]}>Edit Table</Text>
            
            {editingTable && (
              <View style={styles.tableEditorContent}>
                {/* Title */}
                <View style={styles.tableEditorSection}>
                  <Text style={[styles.tableEditorLabel, { color: colors.text }]}>Title:</Text>
                  <TextInput
                    style={[styles.tableEditorInput, { 
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.border
                    }]}
                    value={editingTable.title}
                    onChangeText={(text) => setEditingTable({ ...editingTable, title: text })}
                    placeholder="Table title"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                {/* Title Background Color */}
                <View style={styles.tableEditorSection}>
                  <Text style={[styles.tableEditorLabel, { color: colors.text }]}>Title Background Color:</Text>
                      <TouchableOpacity
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      backgroundColor: '#3478f6',
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      alignSelf: 'center',
                    }}
                    onPress={() => {
                      setCurrentColorPickerTarget('table');
                      setShowColorPicker(true);
                      setShowTableEditor(false);
                    }}
                  >
                    <Ionicons name="color-palette" size={16} color="#fff" />
                    <Text style={{ color: '#fff', marginLeft: 4, fontWeight: '600' }}>Choose Color</Text>
                  </TouchableOpacity>
                </View>

                {/* Columns */}
                <View style={styles.tableEditorSection}>
                  <View style={styles.tableEditorHeader}>
                    <Text style={[styles.tableEditorLabel, { color: colors.text }]}>Columns:</Text>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={addTableColumn}
                    >
                      <Ionicons name="add" size={20} color="#4CAF50" />
                    </TouchableOpacity>
                  </View>
                  {editingTable.columns.map((column: string, index: number) => (
                    <View key={index} style={styles.tableEditorRow}>
                      <TextInput
                        style={[styles.tableEditorInput, { 
                          backgroundColor: colors.background,
                          color: colors.text,
                          borderColor: colors.border,
                          flex: 1
                        }]}
                        value={column}
                        onChangeText={(text) => {
                          const newColumns = [...editingTable.columns];
                          newColumns[index] = text;
                          setEditingTable({ ...editingTable, columns: newColumns });
                        }}
                        placeholder={`Column ${index + 1}`}
                        placeholderTextColor={colors.textSecondary}
                      />
                      {editingTable.columns.length > 1 && (
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removeTableColumn(index)}
                        >
                          <Ionicons name="close" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>

                {/* Rows */}
                <View style={styles.tableEditorSection}>
                  <View style={styles.tableEditorHeader}>
                    <Text style={[styles.tableEditorLabel, { color: colors.text }]}>Rows:</Text>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={addTableRow}
                    >
                      <Ionicons name="add" size={20} color="#4CAF50" />
                    </TouchableOpacity>
                  </View>
                  {editingTable.rows.map((row: string[], rowIndex: number) => (
                    <View key={rowIndex} style={styles.tableEditorRow}>
                      {row.map((cell: string, cellIndex: number) => (
                        <TextInput
                          key={cellIndex}
                          style={[styles.tableEditorCellInput, { 
                            backgroundColor: colors.background,
                            color: colors.text,
                            borderColor: colors.border
                          }]}
                          value={cell}
                          onChangeText={(text) => {
                            const newRows = [...editingTable.rows];
                            newRows[rowIndex] = [...newRows[rowIndex]];
                            newRows[rowIndex][cellIndex] = text;
                            setEditingTable({ ...editingTable, rows: newRows });
                          }}
                          placeholder={`Cell ${rowIndex + 1}-${cellIndex + 1}`}
                          placeholderTextColor={colors.textSecondary}
                        />
                      ))}
                      {editingTable.rows.length > 1 && (
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removeTableRow(rowIndex)}
                        >
                          <Ionicons name="close" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            <View style={styles.tableEditorButtons}>
              <TouchableOpacity
                style={styles.tableEditorButton}
                onPress={() => setShowTableEditor(false)}
              >
                <Text style={styles.tableEditorButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tableEditorButton, styles.tableEditorButtonPrimary]}
                onPress={handleTableSave}
              >
                <Text style={styles.tableEditorButtonTextPrimary}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Color Spectrum Picker */}
      <ColorSpectrumPicker
        visible={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        onColorSelect={(color) => {
          if (currentColorPickerTarget === 'shape') {
            changeShapeColor(color);
          } else if (currentColorPickerTarget === 'canvas') {
            designStore.setCanvasBackgroundColor(color);
          } else if (currentColorPickerTarget === 'table') {
            setEditingTable({ ...editingTable, titleBackgroundColor: color });
            setShowTableEditor(true);
          } else if (currentColorPickerTarget === 'text') {
            handleTextColorChange(color);
          }
          setShowColorPicker(false);
        }}
        initialColor="#1976D2"
      />

      {/* Text Editor Modal */}
      <Modal
        visible={showTextEditor}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTextEditor(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.textEditor, { backgroundColor: colors.surface }]}>
            <Text style={[styles.textEditorTitle, { color: colors.text }]}>Edit Text</Text>
            
            <TextInput
              style={[styles.textEditorInput, { 
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={editingText?.text || ''}
              onChangeText={(text) => setEditingText({ ...editingText, text })}
              placeholder="Enter text..."
              placeholderTextColor={colors.textSecondary}
              multiline
              returnKeyType="default"
              blurOnSubmit={false}
              textAlignVertical="top"
            />
            
            <View style={styles.textEditorButtons}>
              <TouchableOpacity
                style={styles.textEditorButton}
                onPress={() => setShowTextEditor(false)}
              >
                <Text style={styles.textEditorButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.textEditorButton, styles.textEditorButtonPrimary]}
                onPress={handleTextSave}
              >
                <Text style={styles.textEditorButtonTextPrimary}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Text Color Picker Modal */}
      <Modal
        visible={showTextColorPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTextColorPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.colorPicker, { backgroundColor: colors.surface }]}>
            <Text style={[styles.colorPickerTitle, { color: colors.text }]}>Text Color</Text>
            
            <View style={styles.colorPickerGrid}>
              {TEXT_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={styles.colorPickerItem}
                  onPress={() => handleTextColorChange(color)}
                >
                  <View style={[styles.colorPreview, { backgroundColor: color }]} />
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTextColorPicker(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Font Size Slider Modal */}
      <Modal
        visible={showFontSizeSlider}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFontSizeSlider(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.sliderContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sliderLabel, { color: colors.text }]}>Font Size</Text>
            <Slider
              style={styles.slider}
              minimumValue={12}
              maximumValue={36}
              value={(elements.find(el => el.id === selectedText) as any)?.fontSize || 16}
              onValueChange={(value) => handleFontSizeChange(value)}
              minimumTrackTintColor="#3478f6"
              maximumTrackTintColor="#ddd"
            />
            <View style={styles.sliderValue}>
              <Text style={styles.sliderValueText}>{(elements.find(el => el.id === selectedText) as any)?.fontSize || 16}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowFontSizeSlider(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Font Family Picker Modal */}
      <Modal
        visible={showFontFamilyPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFontFamilyPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.fontFamilyPicker, { backgroundColor: colors.surface }]}>
            <Text style={[styles.fontFamilyPickerTitle, { color: colors.text }]}>Font Family</Text>
            
            <View style={styles.fontFamilyPickerGrid}>
              {FONT_FAMILIES.map((fontFamily) => (
                <TouchableOpacity
                  key={fontFamily}
                  style={styles.fontFamilyPickerItem}
                  onPress={() => handleFontFamilyChange(fontFamily)}
                >
                  <Text style={[styles.fontFamilyPickerItemText, { color: colors.text }]}>
                    {fontFamily}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowFontFamilyPicker(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  saveButton: {
    padding: 8,
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  canvas: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginBottom: 24, // Add space above the phone's navigation bar
  },
  toolbarButton: {
    padding: 10,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbox: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  toolboxTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  toolboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  toolboxItem: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    minWidth: 80,
  },
  toolboxItemText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  shapePicker: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  shapePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  shapePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  shapePickerItem: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    minWidth: 80,
  },
  shapePickerItemText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  colorPicker: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  colorPickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  colorPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  colorPickerItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 5,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sliderContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  colorPickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginRight: 10,
    alignItems: 'center',
  },
  applyButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#3478f6',
    marginLeft: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  selectionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tableEditor: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%', // Limit height to 80% of screen
  },
  tableEditorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  tableEditorContent: {
    maxHeight: 400,
  },
  tableEditorSection: {
    marginBottom: 20,
  },
  tableEditorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tableEditorInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  tableEditorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButton: {
    padding: 8,
  },
  tableEditorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tableEditorCellInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    marginRight: 8,
    flex: 1,
  },
  removeButton: {
    padding: 8,
  },
  tableEditorButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  tableEditorButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  tableEditorButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  tableEditorButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tableEditorButtonTextPrimary: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  textEditor: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%', // Limit height to 80% of screen
  },
  textEditorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  textEditorInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 120,
    maxHeight: 200,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  textEditorButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textEditorButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  textEditorButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  textEditorButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  textEditorButtonTextPrimary: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  sliderValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  sliderValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  fontFamilyPicker: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  fontFamilyPickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  fontFamilyPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  fontFamilyPickerItem: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    minWidth: 80,
  },
  fontFamilyPickerItemText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // ColorSpectrumPicker styles
  colorPickerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  colorPickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: 320,
    maxWidth: '90%',
  },
  colorSpectrumPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 10,
  },
  colorHex: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  textInputModal: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  textInputTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 120,
    maxHeight: 200,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  textInputButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textInputButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  textInputButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  textInputButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  textInputButtonTextPrimary: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default TemplateEditScreen; 