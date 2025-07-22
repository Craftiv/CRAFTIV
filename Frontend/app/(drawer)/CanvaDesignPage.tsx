import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useRef, useState } from 'react';
import { Alert, Animated, Button, Dimensions, GestureResponderEvent, Image, Modal, PanResponder, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { Colors } from '../../constants/Colors';
import { useDesigns } from '../../contexts/DesignContext';

// Import html2canvas for web
let html2canvas: any;
if (Platform.OS === 'web') {
  try {
    html2canvas = require('html2canvas').default;
  } catch (error) {
    console.warn('html2canvas not available:', error);
  }
}

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const COLOR_PALETTE: string[] = [
  '#1976D2', '#e74c3c', '#27ae60', '#f1c40f', '#8e44ad', '#fff', '#000',
  '#FF9800', '#00BCD4', '#9C27B0', '#F44336', '#4CAF50', '#FFC107', '#3F51B5',
  '#E91E63', '#009688', '#CDDC39', '#FFEB3B', '#795548', '#607D8B', '#BDBDBD',
];

const FONT_FAMILIES: string[] = ['System', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia'];

const screenWidth = Dimensions.get('window').width;
const CANVAS_SIZE = Math.min(screenWidth * 0.9, 420);

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

function getHandlePositions(shape: any) {
  const { size } = shape;
  
  // Different dimensions for different shape types
  let w, h;
  if (shape.type === 'rectangle') {
    w = size;
    h = size * 0.7;
  } else if (shape.type === 'line') {
    w = size;
    h = 20; // Fixed height for line
  } else {
    // For circle, triangle, and icon shapes
    w = size;
    h = size;
  }
  
  return {
    topLeft: { x: 0, y: 0 },
    top: { x: w / 2, y: 0 },
    topRight: { x: w, y: 0 },
    right: { x: w, y: h / 2 },
    bottomRight: { x: w, y: h },
    bottom: { x: w / 2, y: h },
    bottomLeft: { x: 0, y: h },
    left: { x: 0, y: h / 2 },
  };
}

interface ResizeHandleProps {
  x: number;
  y: number;
  onResize: (dx: number, dy: number) => void;
  style?: any;
  type: 'corner' | 'side';
}

const ResizeHandle = ({ x, y, onResize, style, type }: ResizeHandleProps) => {
  const pan = React.useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gesture) => {
        // Debug log
        console.log('ResizeHandle move', type, gesture.dx, gesture.dy);
        onResize(gesture.dx, gesture.dy);
      },
      onPanResponderRelease: () => {
        pan.setValue({ x: 0, y: 0 });
      },
    })
  ).current;
  
  const handleSize = type === 'corner' ? 20 : 16;
  const handleRadius = type === 'corner' ? 10 : 4;
  const offset = handleSize / 2;
  
  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        {
          position: 'absolute',
          left: x - offset,
          top: y - offset,
          width: handleSize,
          height: handleSize,
          borderRadius: handleRadius,
          backgroundColor: '#fff',
          borderWidth: 2,
          borderColor: type === 'corner' ? '#3478f6' : '#666',
          shadowColor: '#000',
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

const ImageOnCanvas = ({ image, selected, onPress, draggable, updatePosition, canvasLayout, updateSize }: {
  image: any;
  selected?: boolean;
  onPress?: (e?: GestureResponderEvent) => void;
  draggable?: boolean;
  updatePosition?: (x: number, y: number) => void;
  canvasLayout?: { x: number; y: number; width: number; height: number };
  updateSize?: (id: number, newWidth: number, newHeight: number, newX: number, newY: number) => void;
}) => {
  const pan = React.useRef(new Animated.ValueXY({ x: image.x, y: image.y })).current;
  const panOffset = React.useRef({ x: image.x, y: image.y });
  React.useEffect(() => {
    pan.setValue({ x: image.x, y: image.y });
    panOffset.current = { x: image.x, y: image.y };
  }, [image.x, image.y]);
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent, gestureState) => {
        if (onPress) onPress(evt);
        // @ts-ignore
        const { x, y } = pan.__getValue();
        panOffset.current = { x, y };
      },
      onPanResponderMove: (e: GestureResponderEvent, gesture) => {
        if (!canvasLayout) return;
        let newX = gesture.dx + panOffset.current.x;
        let newY = gesture.dy + panOffset.current.y;
        // Constrain within canvas
        newX = Math.max(0, Math.min(newX, canvasLayout.width - (image.width || 60)));
        newY = Math.max(0, Math.min(newY, canvasLayout.height - (image.height || 60)));
        pan.setValue({ x: newX, y: newY });
      },
      onPanResponderRelease: (e: GestureResponderEvent, gesture) => {
        if (!canvasLayout) return;
        // @ts-ignore
        const { x, y } = pan.__getValue();
        let newX = x;
        let newY = y;
        // Constrain within canvas
        newX = Math.max(0, Math.min(newX, canvasLayout.width - (image.width || 60)));
        newY = Math.max(0, Math.min(newY, canvasLayout.height - (image.height || 60)));
        pan.setValue({ x: newX, y: newY });
        panOffset.current = { x: newX, y: newY };
        updatePosition && updatePosition(newX, newY);
      },
    })
  ).current;
  // Resize logic (all handles)
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
    
    // Constrain
    newW = Math.max(30, Math.min(newW, canvasLayout.width - newX));
    newH = Math.max(30, Math.min(newH, canvasLayout.height - newY));
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
        borderWidth: selected ? 2 : 0,
        borderColor: selected ? '#3478f6' : 'transparent',
        borderRadius: 8,
        backgroundColor: selected ? '#e6f0ff' : 'transparent',
        transform: pan.getTranslateTransform(),
      }}
    >
      <Image source={{ uri: image.uri }} style={{ width: image.width, height: image.height, borderRadius: 8 }} resizeMode="contain" />
      {selected && Object.entries({
          topLeft: { x: 0, y: 0 },
        top: { x: image.width / 2, y: 0 },
          topRight: { x: image.width, y: 0 },
        right: { x: image.width, y: image.height / 2 },
          bottomRight: { x: image.width, y: image.height },
        bottom: { x: image.width / 2, y: image.height },
          bottomLeft: { x: 0, y: image.height },
        left: { x: 0, y: image.height / 2 },
      }).map(([handle, pos]) => (
          <ResizeHandle
            key={handle}
            x={pos.x}
            y={pos.y}
            onResize={(dx: number, dy: number) => handleResize(handle, dx, dy)}
          type={['topLeft','topRight','bottomLeft','bottomRight'].includes(handle) ? 'corner' : 'side'}
          />
      ))}
    </Animated.View>
  );
};

const TextOnCanvas = ({ textObj, selected, onPress, draggable, updatePosition, canvasLayout, onDoubleTap }: {
  textObj: any;
  selected?: boolean;
  onPress?: (e?: GestureResponderEvent) => void;
  draggable?: boolean;
  updatePosition?: (x: number, y: number) => void;
  canvasLayout?: { x: number; y: number; width: number; height: number };
  onDoubleTap?: () => void;
}) => {
  const pan = React.useRef(new Animated.ValueXY({ x: textObj.x, y: textObj.y })).current;
  const panOffset = React.useRef({ x: textObj.x, y: textObj.y });
  React.useEffect(() => {
    pan.setValue({ x: textObj.x, y: textObj.y });
    panOffset.current = { x: textObj.x, y: textObj.y };
  }, [textObj.x, textObj.y]);
  // Double tap logic
  const lastTap = React.useRef(0);
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent, gestureState) => {
        if (onPress) onPress(evt);
        const now = Date.now();
        if (now - lastTap.current < 350) {
          onDoubleTap && onDoubleTap();
        }
        lastTap.current = now;
        // @ts-ignore
        const { x, y } = pan.__getValue();
        panOffset.current = { x, y };
      },
      onPanResponderMove: (e, gesture) => {
        if (!canvasLayout) return;
        let newX = gesture.dx + panOffset.current.x;
        let newY = gesture.dy + panOffset.current.y;
        // Constrain within canvas
        newX = Math.max(0, Math.min(newX, canvasLayout.width - 120));
        newY = Math.max(0, Math.min(newY, canvasLayout.height - 40));
        pan.setValue({ x: newX, y: newY });
      },
      onPanResponderRelease: (e, gesture) => {
        if (!canvasLayout) return;
        // @ts-ignore
        const { x, y } = pan.__getValue();
        let newX = x;
        let newY = y;
        // Constrain within canvas
        newX = Math.max(0, Math.min(newX, canvasLayout.width - 120));
        newY = Math.max(0, Math.min(newY, canvasLayout.height - 40));
        pan.setValue({ x: newX, y: newY });
        panOffset.current = { x: newX, y: newY };
        updatePosition && updatePosition(newX, newY);
      },
    })
  ).current;
  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        zIndex: selected ? 2 : 1,
        borderWidth: selected ? 2 : 0,
        borderColor: selected ? '#3478f6' : 'transparent',
        borderRadius: 8,
        backgroundColor: selected ? '#e6f0ff' : 'transparent',
        left: 0,
        top: 0,
        transform: pan.getTranslateTransform(),
        padding: 2,
      }}
    >
      {/* Show a visible border/highlight when selected */}
      <Text style={{ color: textObj.color, fontSize: textObj.fontSize, fontWeight: 'bold', fontFamily: textObj.fontFamily || 'System' }}>{textObj.text}</Text>
    </Animated.View>
  );
};

type CanvaDesignPageProps = {
  hideHeader?: boolean;
  hideToolbar?: boolean;
};

export default function CanvaDesignPage({ hideHeader, hideToolbar }: CanvaDesignPageProps) {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const { addDesign } = useDesigns();
  const [canvasBgColor, setCanvasBgColor] = useState('#fff'); // 1. Add canvas background color state
  const [canvasFocused, setCanvasFocused] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [shapePickerOpen, setShapePickerOpen] = useState(false);
  const [canvasShapes, setCanvasShapes] = useState<any[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<number | null>(null);
  const [canvasLayout, setCanvasLayout] = useState({ x: 0, y: 0, width: CANVAS_SIZE, height: CANVAS_SIZE * 1.15 });
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [drawToolActive, setDrawToolActive] = useState(false);
  const [selectedDrawTool, setSelectedDrawTool] = useState<'pencil' | 'marker' | 'eraser'>('pencil');
  const [drawThickness, setDrawThickness] = useState(3);
  const [showThicknessSlider, setShowThicknessSlider] = useState(false);
  const [drawPaths, setDrawPaths] = useState<any[]>([]);
  const [currentPath, setCurrentPath] = useState<any | null>(null);
  const [pencilColor, setPencilColor] = useState('#222');
  const [drawColorPickerOpen, setDrawColorPickerOpen] = useState(false);
  const [canvasImages, setCanvasImages] = useState<any[]>([]);
  // 1. Add state for text elements and text editing
  const [canvasTexts, setCanvasTexts] = useState<any[]>([]);
  const [editingTextId, setEditingTextId] = useState<number | null>(null);
  const [textModalVisible, setTextModalVisible] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [textInputColor, setTextInputColor] = useState('#222');
  const [textInputFontSize, setTextInputFontSize] = useState(20);
  const [textInputFontFamily, setTextInputFontFamily] = useState('System');
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showTextSizePicker, setShowTextSizePicker] = useState(false);
  const [showTextFontFamilyPicker, setShowTextFontFamilyPicker] = useState(false);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [showCanvasColorPicker, setShowCanvasColorPicker] = useState(false);
  const [canvasNote, setCanvasNote] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [canvasAnim] = useState(new Animated.Value(1));

  const designRef = useRef(null);

  // Save state to undo stack only when state changes
  React.useEffect(() => {
    setUndoStack((prev) => {
      const last = prev[0];
      if (
        last &&
        JSON.stringify(last.canvasShapes) === JSON.stringify(canvasShapes) &&
        JSON.stringify(last.canvasImages) === JSON.stringify(canvasImages) &&
        JSON.stringify(last.drawPaths) === JSON.stringify(drawPaths) &&
        JSON.stringify(last.canvasTexts) === JSON.stringify(canvasTexts)
      ) {
        return prev;
      }
      return [
        {
          canvasShapes,
          canvasImages,
          drawPaths,
          canvasTexts,
        },
        ...prev.slice(0, 19), // keep up to 20 undos
      ];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasShapes, canvasImages, drawPaths, canvasTexts]);
  // Undo handler
  const handleUndo = () => {
    if (undoStack.length > 1) {
      const prev = undoStack[1];
      setCanvasShapes(prev.canvasShapes);
      setCanvasImages(prev.canvasImages);
      setDrawPaths(prev.drawPaths);
      setCanvasTexts(prev.canvasTexts);
      setUndoStack(undoStack.slice(1));
    }
  };

  const selectedText = canvasTexts.find(txt => txt.id === selectedShapeId);

  // Clear canvas if ?new= param is present (fresh design)
  React.useEffect(() => {
    if (searchParams?.new) {
      setCanvasShapes([]);
      setCanvasImages([]);
      setDrawPaths([]);
      setCanvasTexts([]);
      setSelectedShapeId(null);
      setCanvasBgColor('#fff');
      setUndoStack([]);
    }
  }, [searchParams?.new]);

  // Load design data if ?edit= param is present (editing existing design)
  React.useEffect(() => {
    if (searchParams?.edit && searchParams?.designData) {
      try {
        const designData = JSON.parse(searchParams.designData as string);
        const canvasBgColorParam = searchParams.canvasBgColor as string;
        
        setCanvasShapes(designData.canvasShapes || []);
        setCanvasImages(designData.canvasImages || []);
        setDrawPaths(designData.drawPaths || []);
        setCanvasTexts(designData.canvasTexts || []);
        setCanvasBgColor(canvasBgColorParam || '#fff');
        setSelectedShapeId(null);
        setUndoStack([]);
        
        console.log('Loaded design for editing:', designData);
      } catch (error) {
        console.error('Error loading design data:', error);
        Alert.alert('Error', 'Failed to load design data');
      }
    }
  }, [searchParams?.edit, searchParams?.designData, searchParams?.canvasBgColor]);

  const handleToolboxPress = async (tool: string) => {
    if (tool === 'Tools') {
      setToolsOpen((prev) => !prev);
      setActiveTool(null);
      setShapePickerOpen(false);
    } else if (tool === 'Images') {
      setToolsOpen(false);
      setActiveTool(null);
      setShapePickerOpen(false);
      // Image picker logic
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newImage = {
          id: Date.now(),
          uri: asset.uri,
          x: 40 + Math.random() * 60,
          y: 40 + Math.random() * 60,
          width: 120,
          height: 120,
        };
        setCanvasImages((prev) => [...prev, newImage]);
      }
    } else if (tool === 'Text') {
      setToolsOpen(false);
      setActiveTool(null);
      setShapePickerOpen(false);
      // Add new text element and open modal
      const newId = Date.now();
      const newText = {
        id: newId,
        text: 'Double tap to edit',
        x: 60 + Math.random() * 60,
        y: 60 + Math.random() * 60,
        color: '#222',
        fontSize: 20,
        fontFamily: 'System',
      };
      setCanvasTexts((prev) => [...prev, newText]);
      setSelectedShapeId(newId);
      setEditingTextId(newId);
      setTextInputValue('Double tap to edit');
      setTextInputColor('#222');
      setTextInputFontSize(20);
      setTextInputFontFamily(newText.fontFamily || 'System');
      setTextModalVisible(true);
    } else {
      setToolsOpen(false);
      setActiveTool(null);
      setShapePickerOpen(false);
    }
  };

  const handleToolsToolboxPress = (tool: string) => {
    setActiveTool(tool);
    if (tool === 'Draw') {
      setDrawToolActive(true);
      setShapePickerOpen(false);
    } else if (tool === 'Shapes') {
      setShapePickerOpen(true);
      setDrawToolActive(false);
    } else {
      setDrawToolActive(false);
      setShapePickerOpen(false);
    }
  };

  const handleShapeSelect = (shapeType: string) => {
    const newShape = {
      id: Date.now(),
      type: shapeType,
      x: 40 + Math.random() * 60,
      y: 40 + Math.random() * 60,
      size: 60,
      color: '#1976D2',
    };
    setCanvasShapes((prev) => [...prev, newShape]);
    setShapePickerOpen(false);
    setActiveTool(null);
    setSelectedShapeId(newShape.id);
  };

  const handleCanvasPress = (e: any) => {
    // Only select canvas if user taps background (not a shape)
    setCanvasFocused(true);
    setSelectedShapeId(null);
  };

  const handleShapePress = (id: number, e?: GestureResponderEvent) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setSelectedShapeId(id);
    setCanvasFocused(false);
  };
  const handleImagePress = (id: number, e?: GestureResponderEvent) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setSelectedShapeId(id);
    setCanvasFocused(false);
  };

  // Update shape position in state
  const updateShapePosition = (id: number, newX: number, newY: number) => {
    setCanvasShapes((prev) =>
      prev.map((shape) =>
        shape.id === id ? { ...shape, x: newX, y: newY } : shape
      )
    );
  };

  const updateShapeSize = (id: number, newSize: number, newX: number, newY: number) => {
    // Debug log
    console.log('updateShapeSize', { id, newSize, newX, newY });
    setCanvasShapes((prev) =>
      prev.map((shape) =>
        shape.id === id ? { ...shape, size: newSize, x: newX, y: newY } : shape
      )
    );
  };

  // Delete shape
  const deleteSelectedShape = () => {
    if (canvasTexts.some(txt => txt.id === selectedShapeId)) {
      setCanvasTexts(prev => prev.filter(txt => txt.id !== selectedShapeId));
      setSelectedShapeId(null);
      return;
    }
    if (canvasImages.some(img => img.id === selectedShapeId)) {
      setCanvasImages(prev => prev.filter(img => img.id !== selectedShapeId));
      setSelectedShapeId(null);
      return;
    }
    setCanvasShapes(prev => prev.filter(s => s.id !== selectedShapeId));
    setSelectedShapeId(null);
  };

  // Add deleteSelectedText function
  const deleteSelectedText = () => {
    setCanvasTexts((prev) => prev.filter((txt) => txt.id !== selectedShapeId));
    setSelectedShapeId(null);
  };

  // Change background color (placeholder)
  const changeShapeColor = (color: string) => {
    if (canvasFocused && !selectedShapeId) {
      setCanvasBgColor(color);
      setColorPickerOpen(false);
      return;
    }
    
    // Check if selected element is text
    const selectedText = canvasTexts.find(txt => txt.id === selectedShapeId);
    if (selectedText) {
      setCanvasTexts(prev => prev.map(txt => txt.id === selectedShapeId ? { ...txt, color } : txt));
      setColorPickerOpen(false);
      return;
    }
    
    // Handle shapes
    setCanvasShapes((prev) =>
      prev.map((shape) =>
        shape.id === selectedShapeId ? { ...shape, color } : shape
      )
    );
    setColorPickerOpen(false);
  };

  // Add image manipulation logic
  const updateImagePosition = (id: number, newX: number, newY: number) => {
    setCanvasImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, x: newX, y: newY } : img
      )
    );
  };
  const updateImageSize = (id: number, newWidth: number, newHeight: number, newX: number, newY: number) => {
    setCanvasImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, width: newWidth, height: newHeight, x: newX, y: newY } : img
      )
    );
  };

  // Add deleteSelectedImage function
  const deleteSelectedImage = () => {
    setCanvasImages((prev) => prev.filter((img) => img.id !== selectedShapeId));
    setSelectedShapeId(null);
  };

  // Update toolbarPos calculation to support images
  React.useEffect(() => {
    if (!selectedShapeId) {
      setToolbarPos(null);
      return;
    }
    const shape = canvasShapes.find((s) => s.id === selectedShapeId);
    if (shape) {
      const w = shape.type === 'rectangle' ? shape.size : shape.size;
      const h = shape.type === 'rectangle' ? shape.size * 0.7 : shape.size;
      setToolbarPos({ x: shape.x + w / 2, y: Math.max(shape.y - 32, 0) });
      return;
    }
    const image = canvasImages.find((img) => img.id === selectedShapeId);
    if (image) {
      setToolbarPos({ x: image.x + image.width / 2, y: Math.max(image.y - 32, 0) });
      return;
    }
    const text = canvasTexts.find((txt) => txt.id === selectedShapeId);
    if (text) {
      // Estimate text width: fontSize * 0.6 * text.length
      const width = (text.fontSize || 16) * 0.6 * (text.text?.length || 1);
      setToolbarPos({ x: text.x + width / 2, y: Math.max(text.y - 32, 0) });
      return;
    }
    setToolbarPos(null);
  }, [selectedShapeId, canvasShapes, canvasImages, canvasTexts]);

  // Drawing logic on canvas
  const getDrawColor = () => {
    if (selectedDrawTool === 'pencil') return pencilColor;
    if (selectedDrawTool === 'marker') return 'rgba(124,58,237,0.5)'; // purple, semi-transparent
    if (selectedDrawTool === 'eraser') return '#fff'; // canvas background
    return '#222';
  };
  const getDrawOpacity = () => {
    if (selectedDrawTool === 'marker') return 0.5;
    return 1;
  };
  const handleDrawStart = (e: any) => {
    if (!drawToolActive) return;
    const { locationX, locationY } = e.nativeEvent;
    setCurrentPath({
      tool: selectedDrawTool,
      color: getDrawColor(),
      thickness: drawThickness,
      points: [`${locationX},${locationY}`],
    });
  };
  const handleDrawMove = (e: any) => {
    if (!drawToolActive) return;
    if (!currentPath) return;
    const { locationX, locationY } = e.nativeEvent;
    setCurrentPath((prev: any) => prev ? {
      ...prev,
      points: [...prev.points, `${locationX},${locationY}`],
    } : prev);
  };
  const handleDrawEnd = () => {
    if (!drawToolActive) return;
    if (currentPath && currentPath.points.length > 1) {
      setDrawPaths((prev) => [...prev, currentPath]);
    }
    setCurrentPath(null);
  };

  // Add a function to clear the canvas
  const clearCanvas = () => {
    setCanvasShapes([]);
    setCanvasImages([]);
    setDrawPaths([]);
    setCanvasTexts([]); // Clear all text elements
    setSelectedShapeId(null);
  };

  // 5. Text element selection logic
  const handleTextPress = (id: number, e?: GestureResponderEvent) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setSelectedShapeId(id); // Always set selection
    setCanvasFocused(false);
  };
  const updateTextPosition = (id: number, newX: number, newY: number) => {
    setCanvasTexts((prev) => prev.map((txt) => txt.id === id ? { ...txt, x: newX, y: newY } : txt));
  };

  const handleCanvasColor = () => setShowCanvasColorPicker(true);
  const handleCanvasAnimate = () => {
    Animated.sequence([
      Animated.timing(canvasAnim, { toValue: 1.05, duration: 120, useNativeDriver: true }),
      Animated.timing(canvasAnim, { toValue: 0.95, duration: 120, useNativeDriver: true }),
      Animated.timing(canvasAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };
  const handleCanvasNote = () => setShowNoteModal(true);

  const handleExport = async () => {
    try {
      console.log('Starting export process...');
      let uri: string;
      
      if (Platform.OS === 'web') {
        // Web implementation using html2canvas
        if (!html2canvas) {
          // Fallback: create a simple data URL with canvas content
          console.log('html2canvas not available, using fallback...');
          const canvas = document.createElement('canvas');
          canvas.width = 420;
          canvas.height = 483;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Fill background
            ctx.fillStyle = canvasBgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add a simple text indicating the design
            ctx.fillStyle = '#000';
            ctx.font = '16px Arial';
            ctx.fillText('Design saved', 20, 40);
            ctx.fillText(`Shapes: ${canvasShapes.length}`, 20, 60);
            ctx.fillText(`Texts: ${canvasTexts.length}`, 20, 80);
            ctx.fillText(`Images: ${canvasImages.length}`, 20, 100);
          }
          uri = canvas.toDataURL('image/png');
        } else {
          const canvasElement = designRef.current;
          if (!canvasElement) {
            throw new Error('Canvas element not found');
          }
          
          console.log('Capturing canvas with html2canvas...');
          const canvas = await html2canvas(canvasElement, {
            backgroundColor: canvasBgColor,
            scale: 2, // Higher quality
            useCORS: true,
            allowTaint: true,
          });
          
          uri = canvas.toDataURL('image/png');
        }
        console.log('Captured image URI (web):', uri.substring(0, 100) + '...');
      } else {
        // Mobile implementation using react-native-view-shot
        uri = await captureRef(designRef, { format: 'png', quality: 1 });
        console.log('Captured image URI (mobile):', uri);
      }
      
      // Save to YourStories
      const designData = {
        id: Date.now().toString(),
        title: `Design ${new Date().toLocaleDateString()}`,
        imageUri: uri,
        date: new Date().toISOString(),
        designData: {
          canvasShapes,
          canvasImages,
          drawPaths,
          canvasTexts,
          canvasBgColor,
        },
      };

      console.log('Design data to save:', designData);

      // Save to DesignContext for Recent Designs
      addDesign({
        id: designData.id,
        label: designData.title,
        image: uri,
        elements: [
          ...canvasShapes,
          ...canvasImages,
          ...drawPaths,
          ...canvasTexts,
        ],
        canvasBackgroundColor: canvasBgColor,
        isCompleted: true,
      });

      // Get existing stories
      const existingStories = await AsyncStorage.getItem('yourStories');
      console.log('Existing stories from storage:', existingStories);
      const stories = existingStories ? JSON.parse(existingStories) : [];
      console.log('Parsed stories array:', stories);
      
      // Add new design
      stories.unshift(designData);
      console.log('Updated stories array:', stories);
      
      // Save back to storage
      await AsyncStorage.setItem('yourStories', JSON.stringify(stories));
      console.log('Successfully saved to AsyncStorage');
      
      if (Platform.OS === 'web') {
        // Web download
        const a = document.createElement('a');
        a.href = uri;
        a.download = 'canvas-design.png';
        a.click();
        Alert.alert('Saved!', 'Design saved to Your Stories and downloaded.');
      } else {
        // Mobile share
        await Sharing.shareAsync(uri);
        Alert.alert('Saved!', 'Design saved to Your Stories.');
      }
    } catch (e: any) {
      console.error('Export error:', e);
      Alert.alert('Save failed', e.message);
    }
  };

  // 6. Text editing modal
  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 36, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: Colors.light.tint, borderBottomWidth: 0, zIndex: 100, elevation: 8 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, borderRadius: 8 }}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleExport} style={{ padding: 8, borderRadius: 8 }}>
          <Ionicons name="download-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(drawer)/TimerScreen')} style={{ padding: 8, borderRadius: 8 }}>
          <Ionicons name="time-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleUndo} style={{ padding: 8, borderRadius: 8 }} disabled={undoStack.length <= 1}>
          <Ionicons name="arrow-undo" size={26} color={undoStack.length > 1 ? '#fff' : '#eee'} />
        </TouchableOpacity>
      </View>
      <View style={styles.centeredContent}>
        <ViewShot ref={designRef}>
        <View
          style={[styles.canvas, canvasFocused && styles.canvasFocused, { backgroundColor: canvasBgColor }]} // 3. Use dynamic bg color
          onLayout={e => {
            const { x, y, width, height } = e.nativeEvent.layout;
            setCanvasLayout({ x, y, width, height });
          }}
          {...(drawToolActive ? {
            onStartShouldSetResponder: () => true,
            onResponderGrant: handleDrawStart,
            onResponderMove: handleDrawMove,
            onResponderRelease: handleDrawEnd,
          } : {
            onStartShouldSetResponder: () => true,
            onResponderRelease: handleCanvasPress,
          })}
        >
          {/* Render shapes on canvas */}
          {canvasShapes.map((shape) => (
            <ShapeOnCanvas
              key={shape.id}
              shape={shape}
              selected={selectedShapeId === shape.id}
              onPress={(e) => handleShapePress(shape.id, e)}
              draggable={selectedShapeId === shape.id}
              updatePosition={(x, y) => updateShapePosition(shape.id, x, y)}
              updateSize={updateShapeSize}
              canvasLayout={canvasLayout}
            />
          ))}
          {/* Render images on the canvas, similar to shapes */}
          {canvasImages.map((img) => (
            <ImageOnCanvas
              key={img.id}
              image={img}
              selected={selectedShapeId === img.id}
              onPress={(e) => handleImagePress(img.id, e)}
              draggable={selectedShapeId === img.id}
              updatePosition={(x, y) => updateImagePosition(img.id, x, y)}
              updateSize={updateImageSize}
              canvasLayout={canvasLayout}
            />
          ))}
          {/* Render text elements on the canvas */}
          {canvasTexts.map((txt) => (
            <TextOnCanvas
              key={txt.id}
              textObj={txt}
              selected={selectedShapeId === txt.id}
              onPress={(e) => handleTextPress(txt.id, e)}
              draggable={selectedShapeId === txt.id}
              updatePosition={(x, y) => updateTextPosition(txt.id, x, y)}
              canvasLayout={canvasLayout}
              onDoubleTap={() => {
                setEditingTextId(txt.id);
                setTextInputValue(txt.text);
                setTextInputColor(txt.color);
                setTextInputFontSize(txt.fontSize);
                setTextInputFontFamily(txt.fontFamily || 'System');
                setTextModalVisible(true);
              }}
            />
          ))}
            {/* Text editing toolbar - appears when text is selected */}
            {selectedShapeId && canvasTexts.find(txt => txt.id === selectedShapeId) && (
              <View style={[styles.textToolbar, { left: (toolbarPos?.x ?? 0) - 60, top: (toolbarPos?.y ?? 0) - 48 }]}>
                    <TouchableOpacity style={styles.toolbarBtn} onPress={deleteSelectedShape}>
                      <Ionicons name="trash-outline" size={22} color="#e74c3c" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolbarBtn} onPress={() => setColorPickerOpen(true)}>
                      <Ionicons name="color-palette-outline" size={22} color="#3478f6" />
                    </TouchableOpacity>
                <TouchableOpacity style={styles.toolbarBtn} onPress={() => {
                  const selectedText = canvasTexts.find(txt => txt.id === selectedShapeId);
                  if (selectedText) {
                    setEditingTextId(selectedText.id);
                    setTextInputValue(selectedText.text);
                    setTextInputColor(selectedText.color);
                    setTextInputFontSize(selectedText.fontSize);
                    setTextInputFontFamily(selectedText.fontFamily || 'System');
                    setTextModalVisible(true);
                  }
                }}>
                  <Ionicons name="create-outline" size={22} color="#27ae60" />
                </TouchableOpacity>
                  </View>
            )}
            {/* Image editing toolbar - appears when image is selected */}
            {selectedShapeId && canvasImages.find(img => img.id === selectedShapeId) && (
              <View style={[styles.imageToolbar, { left: (toolbarPos?.x ?? 0) - 40, top: (toolbarPos?.y ?? 0) - 48 }]}>
                    <TouchableOpacity style={styles.toolbarBtn} onPress={deleteSelectedImage}>
                      <Ionicons name="trash-outline" size={22} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
            )}
            {/* Shape editing toolbar - appears when shape is selected */}
            {selectedShapeId && canvasShapes.find(shape => shape.id === selectedShapeId) && (
              <View style={[styles.shapeToolbar, { left: (toolbarPos?.x ?? 0) - 60, top: (toolbarPos?.y ?? 0) - 48 }]}>
                <TouchableOpacity style={styles.toolbarBtn} onPress={deleteSelectedShape}>
                      <Ionicons name="trash-outline" size={22} color="#e74c3c" />
                    </TouchableOpacity>
                <TouchableOpacity style={styles.toolbarBtn} onPress={() => setColorPickerOpen(true)}>
                  <Ionicons name="color-palette-outline" size={22} color="#3478f6" />
                    </TouchableOpacity>
                  </View>
          )}
            {/* REMOVED: Floating toolbar for selected shape or canvas */}
          {/* Simple color picker (placeholder) */}
          {colorPickerOpen && (
            <View style={styles.colorPickerPopup}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorPickerScroll}>
                {COLOR_PALETTE.map((color: string) => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorSwatch, { backgroundColor: color },
                      selectedShapeId && canvasShapes.find(s => s.id === selectedShapeId)?.color === color ? styles.selectedSwatch : null
                    ]}
                    onPress={() => changeShapeColor(color)}
                  />
                ))}
              </ScrollView>
            </View>
          )}
          {/* Render drawn paths */}
          <Svg style={StyleSheet.absoluteFill}>
            {drawPaths.map((path, idx) => (
              <Path
                key={idx}
                d={`M${path.points.join(' L')}`}
                stroke={path.color}
                strokeWidth={path.thickness}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={path.tool === 'marker' ? 0.5 : 1}
              />
            ))}
            {currentPath && (
              <Path
                d={`M${currentPath.points.join(' L')}`}
                stroke={currentPath.color}
                strokeWidth={currentPath.thickness}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={currentPath.tool === 'marker' ? 0.5 : 1}
              />
            )}
          </Svg>
        </View>
        </ViewShot>
      </View>
      {/* Toolbox */}
      {!hideToolbar && (
      <View style={styles.toolboxContainer}>
        {/* Shape picker overlays and covers the sub toolbox */}
        {shapePickerOpen && (
          <ShapePicker onSelect={handleShapeSelect} onClose={() => { setShapePickerOpen(false); setActiveTool(null); }} />
        )}
        {drawToolActive && (
          <View style={styles.drawToolbar}>
            <TouchableOpacity
              style={[styles.drawToolBtn, selectedDrawTool === 'pencil' && styles.drawToolBtnSelected]}
              onPress={() => setSelectedDrawTool('pencil')}
            >
              <Ionicons name="pencil-outline" size={24} color={selectedDrawTool === 'pencil' ? pencilColor : '#888'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.drawToolBtn, selectedDrawTool === 'marker' && styles.drawToolBtnSelected]}
              onPress={() => setSelectedDrawTool('marker')}
            >
              <Ionicons name="brush-outline" size={24} color={selectedDrawTool === 'marker' ? '#3478f6' : '#888'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.drawToolBtn, selectedDrawTool === 'eraser' && styles.drawToolBtnSelected]}
              onPress={() => setSelectedDrawTool('eraser')}
            >
              <Ionicons name="remove-circle-outline" size={24} color={selectedDrawTool === 'eraser' ? '#e74c3c' : '#888'} />
            </TouchableOpacity>
            {/* Pencil color picker button */}
            {selectedDrawTool === 'pencil' && (
              <TouchableOpacity style={styles.thicknessBtn} onPress={() => setDrawColorPickerOpen(true)}>
                <Ionicons name="color-palette-outline" size={22} color={pencilColor} />
              </TouchableOpacity>
            )}
            {/* Thickness selector button */}
            <TouchableOpacity style={styles.thicknessBtn} onPress={() => setShowThicknessSlider(true)}>
              <View style={{ width: drawThickness, height: drawThickness, borderRadius: drawThickness / 2, backgroundColor: '#3478f6' }} />
            </TouchableOpacity>
            {/* Close button for draw toolbar */}
            <TouchableOpacity style={styles.thicknessSliderClose} onPress={() => { setDrawToolActive(false); setActiveTool(null); }}>
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
            {/* Color picker popup for pencil */}
            {drawColorPickerOpen && (
              <View style={[styles.colorPickerPopup, { top: -70, left: undefined, right: 0, transform: [] }]}> 
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorPickerScroll}>
                  {COLOR_PALETTE.map((color: string) => (
                    <TouchableOpacity
                      key={color}
                      style={[styles.colorSwatch, { backgroundColor: color }, pencilColor === color ? styles.selectedSwatch : null]}
                      onPress={() => { setPencilColor(color); setDrawColorPickerOpen(false); }}
                    />
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}
        {/* Thickness slider popup */}
        {showThicknessSlider && (
          <View style={styles.thicknessSliderPopup}>
            <Slider
              style={{ width: '80%', height: 40 }}
              minimumValue={1}
              maximumValue={20}
              step={1}
              value={drawThickness}
              onValueChange={setDrawThickness}
              minimumTrackTintColor="#3478f6"
              maximumTrackTintColor="#eee"
              thumbTintColor="#3478f6"
            />
            <TouchableOpacity style={styles.thicknessSliderClose} onPress={() => setShowThicknessSlider(false)}>
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>
        )}
        {!shapePickerOpen && drawToolActive && (
          // draw toolbar is already rendered above
          null
        )}
        {!shapePickerOpen && !drawToolActive && toolsOpen && (
          <ToolsToolbox
            onToolPress={handleToolsToolboxPress}
            activeTool={activeTool}
          />
        )}
        <Toolbox
          visible={!canvasFocused}
          onToolPress={handleToolboxPress}
          toolsOpen={toolsOpen}
        />
        {canvasFocused && <CanvasOptions onClose={() => setCanvasFocused(false)} onDeleteAll={clearCanvas} onColor={handleCanvasColor} onAnimate={handleCanvasAnimate} onNote={handleCanvasNote} />}
      </View>
      )}
      {/* Text editing modal */}
      <Modal visible={textModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, width: 300 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Edit Text</Text>
            <TextInput
              value={textInputValue}
              onChangeText={setTextInputValue}
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 12, fontSize: textInputFontSize, color: textInputColor }}
            />
            <Text style={{ marginBottom: 4 }}>Font Size</Text>
            <TextInput
              value={String(textInputFontSize)}
              onChangeText={v => setTextInputFontSize(Number(v) || 16)}
              keyboardType="numeric"
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 6, marginBottom: 12 }}
            />
            <Text style={{ marginBottom: 4 }}>Font Family</Text>
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', alignItems: 'center' }}>
                {FONT_FAMILIES.map((family: string) => (
                  <TouchableOpacity
                    key={family}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: textInputFontFamily === family ? '#e6f0ff' : '#f5f6fa',
                      marginHorizontal: 4,
                    }}
                    onPress={() => setTextInputFontFamily(family)}
                  >
                    <Text style={{ fontFamily: family, fontSize: 16, color: '#222' }}>{family}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <Text style={{ marginBottom: 4 }}>Color</Text>
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', alignItems: 'center' }}>
                {COLOR_PALETTE.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      marginHorizontal: 4,
                      backgroundColor: color,
                      borderWidth: textInputColor === color ? 3 : 2,
                      borderColor: textInputColor === color ? '#3478f6' : '#eee',
                    }}
                    onPress={() => setTextInputColor(color)}
                  />
                ))}
              </ScrollView>
            </View>
            <TextInput
              value={textInputColor}
              onChangeText={setTextInputColor}
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 6, marginBottom: 12 }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Button title="Cancel" onPress={() => setTextModalVisible(false)} />
              <View style={{ width: 12 }} />
              <Button title="Save" onPress={() => {
                setCanvasTexts((prev) => prev.map((txt) => txt.id === editingTextId ? { ...txt, text: textInputValue, color: textInputColor, fontSize: textInputFontSize, fontFamily: textInputFontFamily } : txt));
                setTextModalVisible(false);
              }} />
            </View>
          </View>
        </View>
      </Modal>
      {/* Font color picker popup */}
      <Modal visible={showTextColorPicker} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, minWidth: 220 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Text Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', alignItems: 'center' }}>
              {COLOR_PALETTE.map((color: string) => (
                <TouchableOpacity
                  key={color}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    marginHorizontal: 4,
                    backgroundColor: color,
                    borderWidth: selectedText && selectedText.color === color ? 3 : 2,
                    borderColor: selectedText && selectedText.color === color ? '#3478f6' : '#eee',
                  }}
                  onPress={() => {
                    setCanvasTexts((prev) => prev.map((txt) => txt.id === selectedText.id ? { ...txt, color } : txt));
                    setShowTextColorPicker(false);
                  }}
                />
              ))}
            </ScrollView>
            <Button title="Close" onPress={() => setShowTextColorPicker(false)} />
          </View>
        </View>
      </Modal>
      {/* Font size picker popup */}
      <Modal visible={showTextSizePicker} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, minWidth: 220 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Font Size</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', alignItems: 'center' }}>
              {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72].map((size: number) => (
                <TouchableOpacity
                  key={size}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: selectedText && selectedText.fontSize === size ? '#e6f0ff' : '#f5f6fa',
                    marginHorizontal: 4,
                  }}
                  onPress={() => {
                    setCanvasTexts((prev) => prev.map((txt) => txt.id === selectedText.id ? { ...txt, fontSize: size } : txt));
                    setShowTextSizePicker(false);
                  }}
                >
                  <Text style={{ fontSize: size, color: '#222' }}>{size}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button title="Close" onPress={() => setShowTextSizePicker(false)} />
          </View>
        </View>
      </Modal>
      {/* Font family picker popup */}
      <Modal visible={showTextFontFamilyPicker} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, minWidth: 220 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Font Family</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', alignItems: 'center' }}>
              {FONT_FAMILIES.map((family: string) => (
                <TouchableOpacity
                  key={family}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: selectedText && selectedText.fontFamily === family ? '#e6f0ff' : '#f5f6fa',
                    marginHorizontal: 4,
                  }}
                  onPress={() => {
                    setCanvasTexts((prev) => prev.map((txt) => txt.id === selectedText.id ? { ...txt, fontFamily: family } : txt));
                    setShowTextFontFamilyPicker(false);
                  }}
                >
                  <Text style={{ fontFamily: family, fontSize: 16, color: '#222' }}>{family}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button title="Close" onPress={() => setShowTextFontFamilyPicker(false)} />
          </View>
        </View>
      </Modal>
      {/* Color picker modal for canvas background */}
      <Modal visible={showCanvasColorPicker} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, width: 320, maxWidth: '90%' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Canvas Background Color</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}
              style={{ maxWidth: 300 }}
            >
              {COLOR_PALETTE.map((color: string) => (
                <TouchableOpacity
                  key={color}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    marginHorizontal: 4,
                    backgroundColor: color,
                    borderWidth: canvasBgColor === color ? 3 : 2,
                    borderColor: canvasBgColor === color ? '#3478f6' : '#eee',
                  }}
                  onPress={() => { setCanvasBgColor(color); setShowCanvasColorPicker(false); }}
                />
              ))}
            </ScrollView>
            <Button title="Close" onPress={() => setShowCanvasColorPicker(false)} />
          </View>
        </View>
      </Modal>
      {/* Note modal */}
      <Modal visible={showNoteModal} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, minWidth: 260 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Add Note</Text>
            <TextInput
              value={canvasNote}
              onChangeText={setCanvasNote}
              placeholder="Enter a short note..."
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, minHeight: 60, marginBottom: 12 }}
              multiline
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Button title="Cancel" onPress={() => setShowNoteModal(false)} />
              <View style={{ width: 12 }} />
              <Button title="Save" onPress={() => setShowNoteModal(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const Toolbox = ({ visible, onToolPress, toolsOpen }: { visible: boolean; onToolPress: (tool: string) => void; toolsOpen: boolean }) => {
  if (!visible) return null;
  return (
    <View style={styles.toolbox}>
      <ToolboxItem icon="text" label="Text" onPress={() => onToolPress('Text')} />
      <ToolboxItem icon="image-outline" label="Images" onPress={() => onToolPress('Images')} />
      <ToolboxItem icon="construct-outline" label="Tools" onPress={() => onToolPress('Tools')} selected={toolsOpen} />
    </View>
  );
};

const ToolboxItem = ({ icon, label, onPress, selected }: { icon: IoniconsName; label: string; onPress: () => void; selected?: boolean }) => (
  <TouchableOpacity style={[styles.toolboxItem, selected && styles.toolboxItemSelected]} onPress={onPress}>
    <Ionicons name={icon} size={28} color={selected ? '#3478f6' : '#222'} />
    <Text style={[styles.toolboxLabel, selected && { color: '#3478f6' }]}>{label}</Text>
  </TouchableOpacity>
);

const ToolsToolbox = ({ onToolPress, activeTool }: { onToolPress: (tool: string) => void; activeTool: string | null }) => (
  <View style={styles.toolsToolbox}>
    <ToolsToolboxItem icon="hand-left-outline" label="Select" color="#4B0082" onPress={() => onToolPress('Select')} selected={activeTool === 'Select'} />
    <ToolsToolboxItem icon="pencil-outline" label="Draw" color="#FFD600" onPress={() => onToolPress('Draw')} selected={activeTool === 'Draw'} />
    <ToolsToolboxItem icon="ellipse-outline" label="Shapes" color="#000" onPress={() => onToolPress('Shapes')} selected={activeTool === 'Shapes'} />
    <ToolsToolboxItem icon="document-text-outline" label="Notes" color="#4B0082" onPress={() => onToolPress('Notes')} selected={activeTool === 'Notes'} />
    <ToolsToolboxItem icon="grid-outline" label="Table" color="#1976D2" onPress={() => onToolPress('Table')} selected={activeTool === 'Table'} />
  </View>
);

const ToolsToolboxItem = ({ icon, label, color, onPress, selected }: { icon: IoniconsName; label: string; color: string; onPress: () => void; selected?: boolean }) => (
  <TouchableOpacity style={[styles.toolsToolboxItem, selected && styles.toolsToolboxItemSelected]} onPress={onPress}>
    <Ionicons name={icon} size={26} color={color} />
    <Text style={[styles.toolsToolboxLabel, selected && { color }]}>{label}</Text>
  </TouchableOpacity>
);

const ShapePicker = ({ onSelect, onClose }: { onSelect: (shapeType: string) => void; onClose: () => void }) => (
  <View style={styles.shapePickerOverlay}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shapePickerScroll}>
      {SHAPE_OPTIONS.map((shape) => (
        <TouchableOpacity
          key={shape.type}
          style={styles.shapePickerItem}
          onPress={() => onSelect(shape.type)}
        >
          <Ionicons name={shape.icon as IoniconsName} size={36} color="#1976D2" />
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.shapePickerClose} onPress={onClose}>
        <Ionicons name="close" size={32} color="#888" />
      </TouchableOpacity>
    </ScrollView>
  </View>
);

const ShapeOnCanvas = ({ shape, selected, onPress, draggable, updatePosition, canvasLayout, updateSize }: {
  shape: any;
  selected?: boolean;
  onPress?: (e?: GestureResponderEvent) => void;
  draggable?: boolean;
  updatePosition?: (x: number, y: number) => void;
  canvasLayout?: { x: number; y: number; width: number; height: number };
  updateSize?: (id: number, newSize: number, newX: number, newY: number) => void;
}) => {
  // Debug log for selection
  console.log('ShapeOnCanvas', shape.id, 'selected:', selected);
  const pan = React.useRef(new Animated.ValueXY({ x: shape.x, y: shape.y })).current;
  const panOffset = React.useRef({ x: shape.x, y: shape.y });

  React.useEffect(() => {
    pan.setValue({ x: shape.x, y: shape.y });
    panOffset.current = { x: shape.x, y: shape.y };
  }, [shape.x, shape.y]);

  // Tap-to-select logic
  const handleTap = (e: GestureResponderEvent) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!selected && onPress) {
      onPress(e);
    }
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        if (onPress) {
          onPress(evt);
        }
        return !!selected;
      },
      onPanResponderGrant: (evt, gestureState) => {
        if (!selected && onPress) {
          if (evt && evt.stopPropagation) evt.stopPropagation();
          onPress(evt);
        }
        // @ts-ignore
        const { x, y } = pan.__getValue();
        panOffset.current = { x, y };
      },
      onPanResponderMove: (e, gesture) => {
        if (!canvasLayout || !selected) return;
        let newX = gesture.dx + panOffset.current.x;
        let newY = gesture.dy + panOffset.current.y;
        // Constrain within canvas
        newX = Math.max(0, Math.min(newX, canvasLayout.width - (shape.size || 36)));
        newY = Math.max(0, Math.min(newY, canvasLayout.height - (shape.size || 36)));
        pan.setValue({ x: newX, y: newY });
      },
      onPanResponderRelease: (e, gesture) => {
        if (!canvasLayout || !selected) return;
        // @ts-ignore
        const { x, y } = pan.__getValue();
        let newX = x;
        let newY = y;
        // Constrain within canvas
        newX = Math.max(0, Math.min(newX, canvasLayout.width - (shape.size || 36)));
        newY = Math.max(0, Math.min(newY, canvasLayout.height - (shape.size || 36)));
        pan.setValue({ x: newX, y: newY });
        panOffset.current = { x: newX, y: newY };
        updatePosition && updatePosition(newX, newY);
      },
    })
  ).current;

  // Resize logic (for all shapes)
  const handleResize = (handle: string, dx: number, dy: number) => {
    if (!selected || !updateSize || !canvasLayout) return;
    let { x, y, size } = shape;
    
    // Get current dimensions based on shape type
    let w, h;
    if (shape.type === 'rectangle') {
      w = size;
      h = size * 0.7;
    } else if (shape.type === 'line') {
      w = size;
      h = 20;
    } else {
      // For circle, triangle, and icon shapes
      w = size;
      h = size;
    }
    
    let newX = x, newY = y, newW = w, newH = h;
    
    // Debug log
    console.log('handleResize', handle, dx, dy, { x, y, w, h, shapeType: shape.type });
    
    // Handle logic for each handle
    switch (handle) {
      case 'topLeft':
        newX = x + dx;
        newY = y + dy;
        newW = w - dx;
        newH = h - dy;
        break;
      case 'top':
        newY = y + dy;
        newH = h - dy;
        break;
      case 'topRight':
        newY = y + dy;
        newW = w + dx;
        newH = h - dy;
        break;
      case 'right':
        newW = w + dx;
        break;
      case 'bottomRight':
        newW = w + dx;
        newH = h + dy;
        break;
      case 'bottom':
        newH = h + dy;
        break;
      case 'bottomLeft':
        newX = x + dx;
        newW = w - dx;
        newH = h + dy;
        break;
      case 'left':
        newX = x + dx;
        newW = w - dx;
        break;
    }
    
    // Constrain
    newW = Math.max(MIN_SHAPE_SIZE, Math.min(newW, canvasLayout.width - newX));
    newH = Math.max(MIN_SHAPE_SIZE, Math.min(newH, canvasLayout.height - newY));
    newX = Math.max(0, Math.min(newX, canvasLayout.width - newW));
    newY = Math.max(0, Math.min(newY, canvasLayout.height - newH));
    
    // Update size based on shape type
    if (shape.type === 'circle') {
      // For circles, keep it square
      const newSize = Math.max(newW, newH);
      updateSize(shape.id, newSize, newX, newY);
    } else if (shape.type === 'line') {
      // For lines, use width as size
      updateSize(shape.id, newW, newX, newY);
    } else {
      // For rectangles, triangles, and icon shapes, use width as size
      updateSize(shape.id, newW, newX, newY);
    }
  };

  // Rectangle
  if (shape.type === 'rectangle') {
    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.shapeRect,
          {
            width: shape.size,
            height: shape.size * 0.7,
            backgroundColor: shape.color || 'transparent',
            position: 'absolute',
            borderWidth: selected ? 2 : 2,
            borderColor: selected ? '#7c3aed' : '#bbb',
            zIndex: selected ? 2 : 1,
            transform: pan.getTranslateTransform(),
          },
        ]}
      >
        {selected && Object.entries(getHandlePositions(shape)).map(([handle, pos]) => (
          <ResizeHandle
            key={handle}
            x={pos.x}
            y={pos.y}
            onResize={(dx: number, dy: number) => handleResize(handle, dx, dy)}
            type={['topLeft','topRight','bottomLeft','bottomRight'].includes(handle) ? 'corner' : 'side'}
          />
        ))}
      </Animated.View>
    );
  }
  // Circle
  if (shape.type === 'circle') {
    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.shapeCircle,
          {
            width: shape.size,
            height: shape.size,
            backgroundColor: shape.color || 'transparent',
            borderRadius: shape.size / 2,
            position: 'absolute',
            borderWidth: selected ? 2 : 2,
            borderColor: selected ? '#7c3aed' : '#bbb',
            zIndex: selected ? 2 : 1,
            transform: pan.getTranslateTransform(),
          },
        ]}
      >
        {selected && Object.entries(getHandlePositions(shape)).map(([handle, pos]) => (
          <ResizeHandle
            key={handle}
            x={pos.x}
            y={pos.y}
            onResize={(dx: number, dy: number) => handleResize(handle, dx, dy)}
            type={['topLeft','topRight','bottomLeft','bottomRight'].includes(handle) ? 'corner' : 'side'}
          />
        ))}
      </Animated.View>
    );
  }
  // Triangle
  if (shape.type === 'triangle') {
    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          position: 'absolute',
          zIndex: selected ? 2 : 1,
          borderWidth: selected ? 2 : 0,
          borderColor: selected ? '#7c3aed' : 'transparent',
          borderRadius: 8,
          backgroundColor: selected ? '#e6f0ff' : 'transparent',
          transform: pan.getTranslateTransform(),
        }}
      >
        <View
          style={[
            {
              width: shape.size,
              height: shape.size,
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
      >
        <View
          style={[
            {
              width: 0,
              height: 0,
              borderLeftWidth: shape.size / 2,
              borderRightWidth: shape.size / 2,
                borderBottomWidth: shape.size * 0.866, // Equilateral triangle height
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: selected ? '#3478f6' : '#bbb',
            },
            selected && {
              shadowColor: '#3478f6',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.7,
              shadowRadius: 6,
              elevation: 4,
            },
          ]}
        />
        </View>
        {selected && Object.entries(getHandlePositions(shape)).map(([handle, pos]) => (
          <ResizeHandle
            key={handle}
            x={pos.x}
            y={pos.y}
            onResize={(dx: number, dy: number) => handleResize(handle, dx, dy)}
            type={['topLeft','topRight','bottomLeft','bottomRight'].includes(handle) ? 'corner' : 'side'}
          />
        ))}
      </Animated.View>
    );
  }
  // Line
  if (shape.type === 'line') {
    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          position: 'absolute',
          zIndex: selected ? 2 : 1,
          borderWidth: selected ? 2 : 0,
          borderColor: selected ? '#7c3aed' : 'transparent',
          borderRadius: 8,
          backgroundColor: selected ? '#e6f0ff' : 'transparent',
          transform: pan.getTranslateTransform(),
        }}
      >
        <View
          style={[
            {
              width: shape.size,
              height: 20,
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
        >
          <View
        style={[{
          width: shape.size,
          height: 4,
          backgroundColor: selected ? '#3478f6' : '#bbb',
          borderRadius: 2,
        }]}
      />
        </View>
        {selected && Object.entries(getHandlePositions(shape)).map(([handle, pos]) => (
          <ResizeHandle
            key={handle}
            x={pos.x}
            y={pos.y}
            onResize={(dx: number, dy: number) => handleResize(handle, dx, dy)}
            type={['topLeft','topRight','bottomLeft','bottomRight'].includes(handle) ? 'corner' : 'side'}
          />
        ))}
      </Animated.View>
    );
  }
  // Icon-based shapes
  if ([
    'star', 'heart', 'arrow', 'pentagon', 'diamond', 'cloud',
  ].includes(shape.type)) {
    const iconMap: Record<string, IoniconsName> = {
      star: 'star-outline',
      heart: 'heart-outline',
      arrow: 'arrow-forward-outline',
      pentagon: 'shapes-outline',
      diamond: 'shapes-outline',
      cloud: 'cloud-outline',
    };
    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          position: 'absolute',
          zIndex: selected ? 2 : 1,
          borderWidth: selected ? 2 : 0,
          borderColor: selected ? '#7c3aed' : 'transparent',
          borderRadius: 16,
          backgroundColor: selected ? '#e6f0ff' : 'transparent',
          transform: pan.getTranslateTransform(),
        }}
      >
        <View
          style={[
            {
              width: shape.size,
              height: shape.size,
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
      >
        <Ionicons
          name={iconMap[shape.type]}
            size={Math.min(36, shape.size * 0.6)}
          color={shape.color || (selected ? '#3478f6' : '#bbb')}
        />
        </View>
        {selected && Object.entries(getHandlePositions(shape)).map(([handle, pos]) => (
          <ResizeHandle
            key={handle}
            x={pos.x}
            y={pos.y}
            onResize={(dx: number, dy: number) => handleResize(handle, dx, dy)}
            type={['topLeft','topRight','bottomLeft','bottomRight'].includes(handle) ? 'corner' : 'side'}
          />
        ))}
      </Animated.View>
    );
  }
  return null;
};

const CanvasOptions = ({ onClose, onDeleteAll, onColor, onAnimate, onNote }: { onClose: () => void; onDeleteAll: () => void; onColor: () => void; onAnimate: () => void; onNote: () => void }) => (
  <View style={styles.optionsOverlay}>
    <View style={styles.optionsRow}>
      <TouchableOpacity onPress={onColor} style={styles.optionItem}>
        <Ionicons name="color-palette-outline" size={26} color="#222" />
        <Text style={styles.optionLabel}>Color</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onAnimate} style={styles.optionItem}>
        <Ionicons name="sparkles-outline" size={26} color="#222" />
        <Text style={styles.optionLabel}>Animate</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onNote} style={styles.optionItem}>
        <Ionicons name="document-text-outline" size={26} color="#222" />
        <Text style={styles.optionLabel}>Notes</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDeleteAll} style={styles.closeBtn}>
        <Ionicons name="trash-outline" size={28} color="#e74c3c" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
        <Ionicons name="close" size={28} color="#222" />
      </TouchableOpacity>
    </View>
  </View>
);

const OptionItem = ({ icon, label }: { icon: IoniconsName; label: string }) => (
  <View style={styles.optionItem}>
    <Ionicons name={icon} size={26} color="#222" />
    <Text style={styles.optionLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    justifyContent: 'flex-end',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE * 1.15,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  canvasFocused: {
    borderWidth: 2,
    borderColor: '#3478f6',
  },
  toolboxContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 48,
    position: 'relative',
  },
  toolbox: {
    flexDirection: 'row',
    backgroundColor: '#F5F6FA',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    width: '90%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  toolboxItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  toolboxItemSelected: {
    backgroundColor: '#e6f0ff',
    borderRadius: 12,
  },
  toolboxLabel: {
    fontSize: 12,
    color: '#222',
    marginTop: 2,
    fontFamily: 'System',
  },
  optionsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionItem: {
    alignItems: 'center',
    flex: 1,
  },
  optionLabel: {
    fontSize: 12,
    color: '#222',
    marginTop: 2,
    fontFamily: 'System',
  },
  closeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    flex: 0.5,
  },
  toolsToolbox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    justifyContent: 'space-between',
    width: '90%',
    alignSelf: 'center',
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  toolsToolboxItem: {
    alignItems: 'center',
    flex: 1,
  },
  toolsToolboxItemSelected: {
    backgroundColor: '#e6f0ff',
    borderRadius: 12,
  },
  toolsToolboxLabel: {
    fontSize: 12,
    color: '#222',
    marginTop: 2,
    fontFamily: 'System',
  },
  shapePicker: {
    // old style removed
  },
  shapePickerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 16,
    elevation: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  shapePickerScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  shapePickerItem: {
    marginHorizontal: 10,
    padding: 10,
    borderRadius: 16,
    backgroundColor: '#f5f6fa',
    alignItems: 'center',
  },
  shapePickerClose: {
    marginLeft: 18,
    padding: 10,
    borderRadius: 16,
    backgroundColor: '#f5f6fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shapeRect: {
    borderRadius: 6,
  },
  shapeCircle: {},
  shapeToolbar: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    zIndex: 20,
    flexDirection: 'row',
  },
  toolbarBtn: {
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  colorPickerPopup: {
    position: 'absolute',
    top: 60,
    left: '50%',
    transform: [{ translateX: -80 }],
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    zIndex: 30,
  },
  colorPickerScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginHorizontal: 6,
    borderWidth: 2,
    borderColor: '#eee',
  },
  selectedSwatch: {
    borderColor: '#3478f6',
    borderWidth: 3,
  },
  drawToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    marginBottom: 8,
    zIndex: 20,
  },
  drawToolBtn: {
    marginHorizontal: 8,
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f5f6fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawToolBtnSelected: {
    backgroundColor: '#e6f0ff',
  },
  thicknessSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  thicknessBtn: {
    marginHorizontal: 4,
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#f5f6fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thicknessBtnSelected: {
    backgroundColor: '#dbeafe',
  },
  thicknessSliderPopup: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    zIndex: 30,
  },
  thicknessSliderClose: {
    marginLeft: 16,
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#f5f6fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 36,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.tint,
    borderBottomWidth: 0,
    zIndex: 100,
    elevation: 8,
  },
  textToolbar: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    zIndex: 20,
    flexDirection: 'row',
  },
  imageToolbar: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    zIndex: 20,
    flexDirection: 'row',
  },
});
