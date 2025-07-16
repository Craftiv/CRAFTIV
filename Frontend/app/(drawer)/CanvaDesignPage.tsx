import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  SafeAreaView as RNSafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView as SafeAreaContextView } from 'react-native-safe-area-context';

// Conditionally import web-incompatible packages
let Svg: any, Circle: any, Ellipse: any, Line: any, Polygon: any, Rect: any, SvgImage: any, SvgText: any;
let ViewShot: any;

if (Platform.OS !== 'web') {
  try {
    const svgModule = require('react-native-svg');
    Svg = svgModule.default;
    Circle = svgModule.Circle;
    Ellipse = svgModule.Ellipse;
    Line = svgModule.Line;
    Polygon = svgModule.Polygon;
    Rect = svgModule.Rect;
    SvgImage = svgModule.Image;
    SvgText = svgModule.Text;
  } catch (error) {
    console.warn('react-native-svg not available:', error);
  }
  
  try {
    ViewShot = require('react-native-view-shot').default;
  } catch (error) {
    console.warn('react-native-view-shot not available:', error);
  }
} else {
  // Web fallback for ViewShot
  ViewShot = React.forwardRef(({ children, style, ...props }: any, ref: any) => (
    <View ref={ref} style={style} {...props}>
      {children}
    </View>
  ));
  // Web fallback components that convert SVG props to React Native props
  Svg = ({ children, width, height, ...props }: any) => (
    <View style={{ width, height, position: 'relative' }} {...props}>
      {children}
    </View>
  );
  
  Rect = ({ x, y, width, height, fill, stroke, strokeWidth, onPress, ...props }: any) => (
    <View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        backgroundColor: fill,
        borderWidth: strokeWidth || 0,
        borderColor: stroke || 'transparent',
      }}
      onTouchEnd={onPress}
      {...props}
    />
  );
  
  Circle = ({ cx, cy, r, fill, stroke, strokeWidth, onPress, ...props }: any) => (
    <View
      style={{
        position: 'absolute',
        left: cx - r,
        top: cy - r,
        width: r * 2,
        height: r * 2,
        borderRadius: r,
        backgroundColor: fill,
        borderWidth: strokeWidth || 0,
        borderColor: stroke || 'transparent',
      }}
      onTouchEnd={onPress}
      {...props}
    />
  );
  
  Ellipse = ({ cx, cy, rx, ry, fill, stroke, strokeWidth, onPress, ...props }: any) => (
    <View
      style={{
        position: 'absolute',
        left: cx - rx,
        top: cy - ry,
        width: rx * 2,
        height: ry * 2,
        borderRadius: Math.min(rx, ry),
        backgroundColor: fill,
        borderWidth: strokeWidth || 0,
        borderColor: stroke || 'transparent',
      }}
      onTouchEnd={onPress}
      {...props}
    />
  );
  
  Line = ({ x1, y1, x2, y2, stroke, strokeWidth, onPress, ...props }: any) => (
    <View
      style={{
        position: 'absolute',
        left: Math.min(x1, x2),
        top: Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1),
        backgroundColor: stroke,
        transform: [{ rotate: `${Math.atan2(y2 - y1, x2 - x1)}rad` }],
      }}
      onTouchEnd={onPress}
      {...props}
    />
  );
  
  Polygon = ({ points, fill, stroke, strokeWidth, onPress, ...props }: any) => (
    <View
      style={{
        position: 'absolute',
        backgroundColor: fill,
        borderWidth: strokeWidth || 0,
        borderColor: stroke || 'transparent',
        // Note: Polygon rendering on web is simplified
      }}
      onTouchEnd={onPress}
      {...props}
    />
  );
  
  SvgImage = ({ x, y, width, height, href, stroke, strokeWidth, onPress, ...props }: any) => (
    <View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        borderWidth: strokeWidth || 0,
        borderColor: stroke || 'transparent',
      }}
      onTouchEnd={onPress}
      {...props}
    >
      <Text>Image Placeholder</Text>
    </View>
  );
  
  SvgText = ({ x, y, fontSize, fontFamily, fill, stroke, strokeWidth, onPress, children, ...props }: any) => (
    <Text
      style={{
        position: 'absolute',
        left: x,
        top: y,
        fontSize,
        fontFamily,
        color: fill,
        textShadowColor: stroke,
        textShadowOffset: { width: strokeWidth || 0, height: strokeWidth || 0 },
      }}
      onPress={onPress}
      {...props}
    >
      {children}
    </Text>
  );
}

import ColorPicker from '../../components/ColorPicker';
import ShapePicker from '../../components/ShapePicker';
import TextEditor from '../../components/TextEditor';
import { useDesigns } from '../../contexts/DesignContext';
import { Element, ImageElement, Shape, TextElement, Tool, useDesignStore } from '../../stores/designStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CANVAS_WIDTH = screenWidth;
const CANVAS_HEIGHT = screenHeight * 0.7;
const SELECTION_PADDING = 10;
const TEXT_SELECTION_PADDING = 10; // Use same padding as other elements for consistent dragging

const generateId = () => Math.random().toString(36).substr(2, 9);

// Resize handle positions
type ResizeHandle = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'right' | 'bottom' | 'left';

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  elementStartX: number;
  elementStartY: number;
  elementId: string | null;
  dragOffsetX: number;
  dragOffsetY: number;
}

interface ResizeState {
  isResizing: boolean;
  handle: ResizeHandle | null;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  elementId: string | null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F4F4FF',
    paddingTop: 24,
    paddingBottom: 12,
    width: '100%',
    paddingHorizontal: 10,
  },
  topToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  toolbarButton: {
    padding: 8,
    borderRadius: 8,
  },
  canvasContainer: {
    flex: 1,
    margin: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  canvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    borderRadius: 8,
  },
  bottomToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  toolButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  activeToolButton: {
    backgroundColor: '#E3F2FD',
  },
  toolLabel: {
    fontSize: 12,
    marginTop: 4,
    color: '#333',
  },
  activeToolLabel: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  deleteButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
  },
  activeToolbarButton: {
    backgroundColor: '#E3F2FD',
  },
  toolbarButtonLabel: {
    fontSize: 12,
    marginLeft: 4,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    flex: 1,
  },
});

export default function CanvaDesignPage() {
  const {
    elements,
    selectedElements,
    canvasBackgroundColor,
    currentTool,
    addElement,
    selectElement,
    clearSelection,
    moveElement,
    resizeElement,
    deleteSelectedElements,
    undo,
    redo,
    canUndo,
    canRedo,
    saveDesign,
    loadDesign,
    clearDesign,
    updateElement,
    setCurrentTool,
  } = useDesignStore();

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerTarget, setColorPickerTarget] = useState<'canvas' | 'element' | 'text'>('canvas');
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    elementStartX: 0,
    elementStartY: 0,
    elementId: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
  });
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    handle: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    elementId: null,
  });
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'select' | 'text' | 'images' | 'shapes' | 'background'>('text');
  
  const canvasRef = useRef<View>(null);
  const viewShotRef = useRef<any>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const canvasOffsetRef = useRef({ x: 0, y: 0 });
  useEffect(() => { canvasOffsetRef.current = canvasOffset; }, [canvasOffset]);

  // Handle template parameter
  useEffect(() => {
    if (params.template) {
      try {
        const templateData = JSON.parse(params.template as string);
        console.log('Template data received:', templateData);
        
        // Clear existing design
        clearDesign();
        
        // Add template title as text element
        if (templateData.title) {
          addElement({
            id: generateId(),
            type: 'text',
            x: CANVAS_WIDTH / 2 - 100,
            y: 50,
            width: 200,
            height: 40,
            text: templateData.title,
            fontSize: 24,
            color: '#000000',
            fontFamily: 'Arial',
            selected: false,
          });
        }
        
        // You can add more template-specific elements here
        // For example, add a placeholder image or shape based on template type
        
      } catch (error) {
        console.error('Error parsing template data:', error);
      }
    }
  }, [params.template]);

  // For real-time drag
  const dragPositionRef = useRef<{ x: number; y: number } | null>(null);
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [, forceUpdate] = useState(0); // Used to force re-render during drag

  // Load design on mount
  useEffect(() => {
    // Don't auto-load design - let user choose what to load
    // loadDesign();
  }, []);

  // Use onLayout to get the absolute position of the canvas on the screen
  const handleCanvasLayout = (event: any) => {
    const { x, y } = event.nativeEvent.layout;
    // x and y are relative to the parent, but we want absolute position on screen
    // Use measureInWindow for absolute position
    if (canvasRef.current && typeof canvasRef.current.measureInWindow === 'function') {
      // @ts-ignore
      canvasRef.current.measureInWindow((px, py, width, height) => {
        setCanvasOffset({ x: px, y: py });
      });
    }
  };

  // Check if a point is within a resize handle
  const getResizeHandleAtPoint = (x: number, y: number, element: Element): ResizeHandle | null => {
    const handleSize = 12;
    const { x: elX, y: elY, width, height } = element;
    
    // Check corner handles
    if (x >= elX - handleSize && x <= elX + handleSize && y >= elY - handleSize && y <= elY + handleSize) {
      return 'top-left';
    }
    if (x >= elX + width - handleSize && x <= elX + width + handleSize && y >= elY - handleSize && y <= elY + handleSize) {
      return 'top-right';
    }
    if (x >= elX - handleSize && x <= elX + handleSize && y >= elY + height - handleSize && y <= elY + height + handleSize) {
      return 'bottom-left';
    }
    if (x >= elX + width - handleSize && x <= elX + width + handleSize && y >= elY + height - handleSize && y <= elY + height + handleSize) {
      return 'bottom-right';
    }
    
    // Check edge handles
    if (x >= elX && x <= elX + width && y >= elY - handleSize && y <= elY + handleSize) {
      return 'top';
    }
    if (x >= elX + width - handleSize && x <= elX + width + handleSize && y >= elY && y <= elY + height) {
      return 'right';
    }
    if (x >= elX && x <= elX + width && y >= elY + height - handleSize && y <= elY + height + handleSize) {
      return 'bottom';
    }
    if (x >= elX - handleSize && x <= elX + handleSize && y >= elY && y <= elY + height) {
      return 'left';
    }
    
    return null;
  };

  // PanResponder for canvas interactions
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { pageX, pageY } = evt.nativeEvent;
      if (canvasRef.current && typeof canvasRef.current.measureInWindow === 'function') {
        // @ts-ignore
        canvasRef.current.measureInWindow((px, py, width, height) => {
          // Store in ref for immediate use
          canvasOffsetRef.current = { x: px, y: py };
          setCanvasOffset({ x: px, y: py });
          const localX = pageX - px;
          const localY = pageY - py;
          handlePanGrantLogic(localX, localY, pageX, pageY);
        });
      } else {
        // Fallback if measureInWindow is not available
        const { x, y } = canvasOffsetRef.current;
        const localX = pageX - x;
        const localY = pageY - y;
        handlePanGrantLogic(localX, localY, pageX, pageY);
      }
      // Reset drag position ref
      dragPositionRef.current = null;
      setDraggedElementId(null);
    },
    onPanResponderMove: (evt) => {
      const { pageX, pageY } = evt.nativeEvent;
      const { x, y } = canvasOffsetRef.current;
      const localX = pageX - x;
      const localY = pageY - y;
      console.log('[PanResponderMove] pageX:', pageX, 'localX:', localX, 'pageY:', pageY, 'localY:', localY);
      if (resizeState.isResizing && resizeState.elementId) {
        handleResize(localX, localY);
      } else if (dragState.isDragging && dragState.elementId) {
        // Real-time drag: update dragPositionRef and force re-render
        const element = elements.find(el => el.id === dragState.elementId);
        if (!element) return;
        // Calculate new position directly from finger position and offset
        const newX = localX - dragState.dragOffsetX;
        const newY = localY - dragState.dragOffsetY;
        
        // Apply bounds checking only at the edges to prevent going off-canvas
        const width = element.width;
        const height = element.height;
        const boundedX = Math.max(0, Math.min(CANVAS_WIDTH - width, newX));
        const boundedY = Math.max(0, Math.min(CANVAS_HEIGHT - height, newY));
        
        dragPositionRef.current = { x: boundedX, y: boundedY };
        setDraggedElementId(dragState.elementId);
        // Force immediate re-render for responsive dragging
        requestAnimationFrame(() => forceUpdate(n => n + 1));
      }
    },
    onPanResponderRelease: () => {
      // Commit drag position to Zustand
      if (draggedElementId && dragPositionRef.current) {
        updateElement(draggedElementId, dragPositionRef.current);
      }
      // Clear all drag-related state immediately
      dragPositionRef.current = null;
      setDraggedElementId(null);
      // Force a re-render to stop any ongoing movement
      forceUpdate(n => n + 1);
      setDragState({
        isDragging: false,
        startX: 0,
        startY: 0,
        elementStartX: 0,
        elementStartY: 0,
        elementId: null,
        dragOffsetX: 0,
        dragOffsetY: 0,
      });
      setResizeState({
        isResizing: false,
        handle: null,
        startX: 0,
        startY: 0,
        startWidth: 0,
        startHeight: 0,
        elementId: null,
      });
    },
  });

  const estimateTextWidth = (text: string, fontSize: number) => (fontSize || 16) * 0.6 * (text?.length || 1);

  const handleDrag = (x: number, y: number) => {
    if (dragState.elementId) {
      const element = elements.find(el => el.id === dragState.elementId);
      if (!element) return;
      // Use the stored width from the element, don't recalculate during drag
      const width = element.width;
      const newX = x - dragState.dragOffsetX;
      const newY = y - dragState.dragOffsetY;
      const boundedX = Math.max(0, Math.min(CANVAS_WIDTH - width, newX));
      const boundedY = Math.max(0, Math.min(CANVAS_HEIGHT - element.height, newY));
      updateElement(dragState.elementId, { x: boundedX, y: boundedY });
    }
  };

  const handleResize = (x: number, y: number) => {
    if (!resizeState.elementId || !resizeState.handle) return;
    
    // Adjust coordinates for canvas container margin
    const adjustedX = x - 10;
    const adjustedY = y - 10;
    
    const deltaX = adjustedX - (resizeState.startX - 10);
    const deltaY = adjustedY - (resizeState.startY - 10);
    
    let newWidth = resizeState.startWidth;
    let newHeight = resizeState.startHeight;
    let newX = 0;
    let newY = 0;
    
    const element = elements.find(el => el.id === resizeState.elementId);
    if (!element) return;
    
    switch (resizeState.handle) {
      case 'top-left':
        newWidth = Math.max(10, resizeState.startWidth - deltaX);
        newHeight = Math.max(10, resizeState.startHeight - deltaY);
        newX = element.x + deltaX;
        newY = element.y + deltaY;
        break;
      case 'top-right':
        newWidth = Math.max(10, resizeState.startWidth + deltaX);
        newHeight = Math.max(10, resizeState.startHeight - deltaY);
        newY = element.y + deltaY;
        break;
      case 'bottom-left':
        newWidth = Math.max(10, resizeState.startWidth - deltaX);
        newHeight = Math.max(10, resizeState.startHeight + deltaY);
        newX = element.x + deltaX;
        break;
      case 'bottom-right':
        newWidth = Math.max(10, resizeState.startWidth + deltaX);
        newHeight = Math.max(10, resizeState.startHeight + deltaY);
        break;
      case 'top':
        newHeight = Math.max(10, resizeState.startHeight - deltaY);
        newY = element.y + deltaY;
        break;
      case 'right':
        newWidth = Math.max(10, resizeState.startWidth + deltaX);
        break;
      case 'bottom':
        newHeight = Math.max(10, resizeState.startHeight + deltaY);
        break;
      case 'left':
        newWidth = Math.max(10, resizeState.startWidth - deltaX);
        newX = element.x + deltaX;
        break;
    }
    
    // Add bounds checking for resize
    const boundedX = Math.max(0, Math.min(CANVAS_WIDTH - newWidth, newX));
    const boundedY = Math.max(0, Math.min(CANVAS_HEIGHT - newHeight, newY));
    const boundedWidth = Math.min(CANVAS_WIDTH - boundedX, newWidth);
    const boundedHeight = Math.min(CANVAS_HEIGHT - boundedY, newHeight);
    
    // For resize operations, we need to handle bounds differently
    // If we're not changing position (newX/newY is 0), don't constrain dimensions
    const finalWidth = newX === 0 ? newWidth : boundedWidth;
    const finalHeight = newY === 0 ? newHeight : boundedHeight;
    const finalX = newX === 0 ? element.x : boundedX;
    const finalY = newY === 0 ? element.y : boundedY;
    
    // Update element with new dimensions and position
    const updates: Partial<Element> = {
      width: finalWidth,
      height: finalHeight,
    };
    
    if (newX !== 0) updates.x = finalX;
    if (newY !== 0) updates.y = finalY;
    
    updateElement(resizeState.elementId, updates);
  };

  const handleCanvasTap = (x: number, y: number) => {
    // Debug log for tap coordinates
    console.log('Canvas tap at:', x, y, 'Current tool:', currentTool, 'Active tab:', activeTab);
    if (currentTool === 'select') {
      // Check if tapping on an element (including text with bounding box), top-most first
      const tappedElement = elements.slice().reverse().find(el => {
        if (el.type === 'text') {
          const width = estimateTextWidth(el.text, el.fontSize);
          const height = el.fontSize || 16;
          return x >= el.x - TEXT_SELECTION_PADDING && x <= el.x + width + TEXT_SELECTION_PADDING && y >= el.y - TEXT_SELECTION_PADDING && y <= el.y + height + TEXT_SELECTION_PADDING;
        }
        return x >= el.x - SELECTION_PADDING && x <= el.x + el.width + SELECTION_PADDING && y >= el.y - SELECTION_PADDING && y <= el.y + el.height + SELECTION_PADDING;
      });
      console.log('Tapped element:', tappedElement);
      if (tappedElement) {
        selectElement(tappedElement.id, false);
      } else {
        clearSelection();
      }
    } else if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'ellipse' || currentTool === 'triangle' || currentTool === 'star' || currentTool === 'line') {
      // Add shape at tap location
      let newShape: Shape;
      if (currentTool === 'rectangle') {
        newShape = {
          id: generateId(),
          type: 'rectangle',
          x: x - 50,
          y: y - 25,
          width: 100,
          height: 50,
          backgroundColor: '#FF6B6B',
          selected: true,
        };
      } else if (currentTool === 'circle') {
        newShape = {
          id: generateId(),
          type: 'circle',
          x: x - 25,
          y: y - 25,
          width: 50,
          height: 50,
          backgroundColor: '#4ECDC4',
          selected: true,
        };
      } else if (currentTool === 'ellipse') {
        newShape = {
          id: generateId(),
          type: 'ellipse',
          x: x - 40,
          y: y - 20,
          width: 80,
          height: 40,
          backgroundColor: '#FFD166',
          selected: true,
        };
      } else if (currentTool === 'triangle') {
        newShape = {
          id: generateId(),
          type: 'triangle',
          x: x - 40,
          y: y - 35,
          width: 80,
          height: 70,
          backgroundColor: '#118AB2',
          selected: true,
        };
      } else if (currentTool === 'star') {
        newShape = {
          id: generateId(),
          type: 'star',
          x: x - 40,
          y: y - 35,
          width: 80,
          height: 70,
          backgroundColor: '#EF476F',
          selected: true,
        };
      } else if (currentTool === 'line') {
        newShape = {
          id: generateId(),
          type: 'line',
          x: x,
          y: y,
          width: 80,
          height: 0,
          backgroundColor: '#073B4C',
          selected: true,
        };
      }
      addElement(newShape!);
      setActiveTab('select');
      setCurrentTool('select');
    }
  };

  const handleCanvasDrag = (x: number, y: number) => {
    // Handle dragging for selected elements
    if (selectedElements.length > 0 && currentTool === 'select') {
      // This would need more sophisticated drag handling
      // For now, we'll implement basic movement
    }
  };

  // Double-tap detection for text editing
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);

  const handleTextTap = (id: string) => {
    const now = Date.now();
    // Always select immediately for responsive selection
    selectElement(id, false);
    
    // Check for double-tap
    if (lastTapRef.current && lastTapRef.current.id === id && now - lastTapRef.current.time < 350) {
      // Double-tap detected - open text editor
      setEditingTextId(id);
      setActiveTab('select');
      setCurrentTool('select');
      lastTapRef.current = null;
    } else {
      // Single tap - set up for potential double-tap
      lastTapRef.current = { id, time: now };
    }
  };

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0] && result.assets[0].uri) {
        const newImage: ImageElement = {
          id: generateId(),
          type: 'image',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          uri: result.assets[0].uri,
          selected: true,
        };
        addElement(newImage);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleInsertImageIntoShape = async () => {
    if (selectedElements.length === 0) {
      Alert.alert('No shape selected', 'Please select a shape to insert an image into.');
      return;
    }

    const selectedElement = elements.find(el => el.id === selectedElements[0]);
    if (!selectedElement || !(selectedElement.type === 'rectangle' || selectedElement.type === 'circle' || selectedElement.type === 'ellipse' || selectedElement.type === 'triangle' || selectedElement.type === 'star')) {
      Alert.alert('Invalid selection', 'Please select a shape to insert an image into.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [selectedElement.width, selectedElement.height],
        quality: 1,
      });

      if (!result.canceled && result.assets[0] && result.assets[0].uri) {
        const newImage: ImageElement = {
          id: generateId(),
          type: 'image',
          x: selectedElement.x,
          y: selectedElement.y,
          width: selectedElement.width,
          height: selectedElement.height,
          uri: result.assets[0].uri,
          selected: true,
        };
        addElement(newImage);
        // Clear the shape selection and select the new image
        clearSelection();
        selectElement(newImage.id, false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleExport = async () => {
    try {
      if (viewShotRef.current && typeof viewShotRef.current.capture === 'function') {
        const uri = await viewShotRef.current.capture();
        Alert.alert('Success', `Design exported to: ${uri}`);
      } else {
        Alert.alert('Error', 'Export functionality not available');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export design');
    }
  };

  const handleSaveDesign = async () => {
    try {
      const designId = generateId();
      await saveDesign(designId);
      
      // Add to recent designs
      const { addDesign } = useDesigns();
      addDesign({
        label: `Design ${new Date().toLocaleDateString()}`,
        image: 'https://placehold.co/120x90/eee/000?text=Design',
        isCompleted: true,
      });
      
      Alert.alert('Success', 'Design saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save design');
    }
  };

  const renderElement = (element: Element) => {
    let x = element.x;
    let y = element.y;
    if (element.id === draggedElementId && dragPositionRef.current && dragState.isDragging) {
      x = dragPositionRef.current.x;
      y = dragPositionRef.current.y;
    }
    const isSelected = selectedElements.includes(element.id);

    switch (element.type) {
      case 'rectangle':
        return (
          <Rect
            key={element.id}
            x={x}
            y={y}
            width={element.width}
            height={element.height}
            fill={element.backgroundColor}
            stroke={isSelected ? '#007AFF' : 'none'}
            strokeWidth={isSelected ? 2 : 0}
            onPress={() => selectElement(element.id, false)}
          />
        );
      case 'circle':
        return (
          <Circle
            key={element.id}
            cx={x + element.width / 2}
            cy={y + element.height / 2}
            r={element.width / 2}
            fill={element.backgroundColor}
            stroke={isSelected ? '#007AFF' : 'none'}
            strokeWidth={isSelected ? 2 : 0}
            onPress={() => selectElement(element.id, false)}
          />
        );
      case 'text':
        return (
          <SvgText
            key={element.id}
            x={x}
            y={y + element.fontSize}
            fontSize={element.fontSize}
            fontFamily={element.fontFamily}
            fill={element.color}
            stroke={isSelected ? '#007AFF' : 'none'}
            strokeWidth={isSelected ? 1 : 0}
            onPress={() => handleTextTap(element.id)}
          >
            {element.text}
          </SvgText>
        );
      case 'image':
        if (!element.uri) {
          console.warn('Skipping image with empty uri', element);
          return null;
        }
        return (
          <SvgImage
            key={element.id}
            x={x}
            y={y}
            width={element.width}
            height={element.height}
            href={{ uri: element.uri }}
            stroke={isSelected ? '#007AFF' : 'none'}
            strokeWidth={isSelected ? 2 : 0}
            onPress={() => selectElement(element.id, false)}
          />
        );
      case 'ellipse':
        return (
          <Ellipse
            key={element.id}
            cx={x + element.width / 2}
            cy={y + element.height / 2}
            rx={element.width / 2}
            ry={element.height / 2}
            fill={element.backgroundColor}
            stroke={isSelected ? '#007AFF' : 'none'}
            strokeWidth={isSelected ? 2 : 0}
            onPress={() => selectElement(element.id, false)}
          />
        );
      case 'triangle':
        return (
          <Polygon
            key={element.id}
            points={`${x},${y} ${x + element.width / 2},${y + element.height} ${x + element.width},${y}`}
            fill={element.backgroundColor}
            stroke={isSelected ? '#007AFF' : 'none'}
            strokeWidth={isSelected ? 2 : 0}
            onPress={() => selectElement(element.id, false)}
          />
        );
      case 'line':
        return (
          <Line
            key={element.id}
            x1={x}
            y1={y}
            x2={x + element.width}
            y2={y + element.height}
            stroke={element.backgroundColor}
            strokeWidth={isSelected ? 2 : 0}
            onPress={() => selectElement(element.id, false)}
          />
        );
      case 'star':
        return (
          <Polygon
            key={element.id}
            points={`${x + element.width / 2},${y} ${x + element.width * 0.16},${y + element.height * 0.16} ${x + element.width * 0.5},${y + element.height * 0.5} ${x + element.width * 0.84},${y + element.height * 0.16} ${x},${y}`}
            fill={element.backgroundColor}
            stroke={isSelected ? '#007AFF' : 'none'}
            strokeWidth={isSelected ? 2 : 0}
            onPress={() => selectElement(element.id, false)}
          />
        );
      default:
        return null;
    }
  };

  // Render resize handles for selected elements
  const renderResizeHandles = (element: Element) => {
    if (!selectedElements.includes(element.id)) return null;
    const handleSize = 6;
    let x = element.x, y = element.y, width = element.width, height = element.height;
    if (element.id === draggedElementId && dragPositionRef.current) {
      x = dragPositionRef.current.x;
      y = dragPositionRef.current.y;
    }
    if (element.type === 'text') {
      height = element.fontSize;
      width = (element.fontSize || 16) * 0.6 * (element.text?.length || 1);
    }
    return (
      <>
        {/* Corner handles */}
        <Rect key={`${element.id}-tl`} x={x - handleSize} y={y - handleSize} width={handleSize * 2} height={handleSize * 2} fill="#007AFF" />
        <Rect key={`${element.id}-tr`} x={x + width - handleSize} y={y - handleSize} width={handleSize * 2} height={handleSize * 2} fill="#007AFF" />
        <Rect key={`${element.id}-bl`} x={x - handleSize} y={y + height - handleSize} width={handleSize * 2} height={handleSize * 2} fill="#007AFF" />
        <Rect key={`${element.id}-br`} x={x + width - handleSize} y={y + height - handleSize} width={handleSize * 2} height={handleSize * 2} fill="#007AFF" />
        {/* Edge handles */}
        <Rect key={`${element.id}-t`} x={x + width / 2 - handleSize} y={y - handleSize} width={handleSize * 2} height={handleSize * 2} fill="#007AFF" />
        <Rect key={`${element.id}-r`} x={x + width - handleSize} y={y + height / 2 - handleSize} width={handleSize * 2} height={handleSize * 2} fill="#007AFF" />
        <Rect key={`${element.id}-b`} x={x + width / 2 - handleSize} y={y + height - handleSize} width={handleSize * 2} height={handleSize * 2} fill="#007AFF" />
        <Rect key={`${element.id}-l`} x={x - handleSize} y={y + height / 2 - handleSize} width={handleSize * 2} height={handleSize * 2} fill="#007AFF" />
      </>
    );
  };

  const ToolButton = ({ tool, icon, label }: { tool: Tool; icon: string; label: string }) => (
    <TouchableOpacity
      style={[styles.toolButton, currentTool === tool && styles.activeToolButton]}
      onPress={() => useDesignStore.getState().setCurrentTool(tool)}
    >
      <Ionicons name={icon as any} size={24} color={currentTool === tool ? '#007AFF' : '#333'} />
      <Text style={[styles.toolLabel, currentTool === tool && styles.activeToolLabel]}>{label}</Text>
    </TouchableOpacity>
  );

  const updateTextElementWidth = (id: string, text: string, fontSize: number) => {
    const width = estimateTextWidth(text, fontSize);
    updateElement(id, { width });
  };

  // Extracted logic for pan grant
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePanGrantLogic = (localX: number, localY: number, pageX: number, pageY: number) => {
    console.log('PanResponder grant at:', pageX, pageY, 'Local:', localX, localY, 'Current tool:', currentTool, 'Selected elements:', selectedElements);
    if (currentTool === 'select' && selectedElements.length > 0) {
      // Check if we're clicking on a resize handle
      for (const elementId of selectedElements) {
        const element = elements.find(el => el.id === elementId);
        if (element) {
          const handle = getResizeHandleAtPoint(localX, localY, element);
          if (handle) {
            setResizeState({
              isResizing: true,
              handle,
              startX: localX,
              startY: localY,
              startWidth: element.width,
              startHeight: element.height,
              elementId,
            });
            console.log('Resize started for element:', elementId, 'Handle:', handle);
            return;
          }
        }
      }
      // Check if we're clicking on a selected element for dragging
      for (const elementId of selectedElements) {
        const element = elements.find(el => el.id === elementId);
        if (element && 
          localX >= element.x - SELECTION_PADDING && localX <= element.x + element.width + SELECTION_PADDING &&
          localY >= element.y - SELECTION_PADDING && localY <= element.y + element.height + SELECTION_PADDING) {
          setDragState({
            isDragging: true,
            startX: localX,
            startY: localY,
            elementStartX: element.x,
            elementStartY: element.y,
            elementId,
            // Calculate precise offset from touch point to element position
            dragOffsetX: localX - element.x,
            dragOffsetY: localY - element.y,
          });
          console.log('Drag started for element:', elementId);
          // Immediately set the drag position for instant response
          dragPositionRef.current = { x: element.x, y: element.y };
          setDraggedElementId(elementId);
          return;
        }
      }
    }
    // Default canvas tap behavior
    handleCanvasTap(localX, localY);
  };

  // Move element in array to change stacking order
  const bringToFront = () => {
    if (selectedElements.length === 0) return;
    const id = selectedElements[0];
    const idx = elements.findIndex(el => el.id === id);
    if (idx === -1 || idx === elements.length - 1) return;
    const newElements = [...elements];
    const [el] = newElements.splice(idx, 1);
    newElements.push(el);
    useDesignStore.setState({ elements: newElements });
  };
  const sendToBack = () => {
    if (selectedElements.length === 0) return;
    const id = selectedElements[0];
    const idx = elements.findIndex(el => el.id === id);
    if (idx <= 0) return;
    const newElements = [...elements];
    const [el] = newElements.splice(idx, 1);
    newElements.unshift(el);
    useDesignStore.setState({ elements: newElements });
  };

  // Add state for options modal
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  // Open TextEditor immediately when text tab is selected
  useEffect(() => {
    if (activeTab === 'text') {
      setEditingTextId('new'); // Use 'new' to indicate creating a new text element
    }
  }, [activeTab]);

  // Add state for font controls
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [showFontFamilyPicker, setShowFontFamilyPicker] = useState(false);

  // Add font size and family arrays
  const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];
  const FONT_FAMILIES = ['System', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia'];

  return (
    <RNSafeAreaView style={{ flex: 1, backgroundColor: '#F4F4FF' }}>
      {/* Header */}
      <SafeAreaContextView edges={['top']} style={styles.headerBar}>
        <TouchableOpacity onPress={() => { if (typeof router !== 'undefined') router.back && router.back(); }} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Untitled Design</Text>
        <TouchableOpacity onPress={() => router.push('/(drawer)/TimerScreen')} style={{ padding: 4 }}>
          <Ionicons name="time-outline" size={28} color="#6366F1" />
        </TouchableOpacity>
      </SafeAreaContextView>
      <View style={{ flex: 1, backgroundColor: '#F4F4FF' }}>
        <StatusBar barStyle="dark-content" />
        {/* Top Tab Bar with Save */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F4FF', paddingHorizontal: 10, paddingTop: 10, paddingBottom: 10, marginBottom: 10 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', paddingRight: 16 }}>
            {['select', 'text', 'images', 'shapes', 'background'].map(tab => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab as any)}
                style={{ marginRight: 18, borderBottomWidth: activeTab === tab ? 2 : 0, borderBottomColor: '#6366F1', paddingBottom: 4 }}
              >
                <Text style={{ color: activeTab === tab ? '#6366F1' : '#222', fontWeight: activeTab === tab ? 'bold' : 'normal', fontSize: 16 }}>
                  {tab === 'select' ? 'Select' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={handleSaveDesign} style={{ marginLeft: 10 }}>
              <Ionicons name="save" size={22} color="#6366F1" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Canvas */}
        <View style={{ flex: 1, backgroundColor: '#F4F4FF', justifyContent: 'center', alignItems: 'center' }}>
          <ViewShot ref={viewShotRef} style={styles.canvasContainer}>
            <View
              ref={canvasRef}
              style={[styles.canvas, { backgroundColor: canvasBackgroundColor }]}
              onLayout={handleCanvasLayout}
              {...panResponder.panHandlers}
            >
              <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
                {elements.map(renderElement)}
                {elements.map(element => (
                  <React.Fragment key={`handles-${element.id}`}>
                    {renderResizeHandles(element)}
                  </React.Fragment>
                ))}
              </Svg>
            </View>
          </ViewShot>
        </View>

        {/* Bottom Bar: context-sensitive controls */}
        <SafeAreaContextView edges={['bottom']} style={{ backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderTopWidth: 1, borderTopColor: '#E0E0E0' }}>
            {activeTab === 'text' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', flexGrow: 1, minWidth: 0 }}>
                {/* Font family selector */}
                <TouchableOpacity style={{ marginHorizontal: 6, padding: 6, backgroundColor: '#eee', borderRadius: 6 }}>
                  <Text>Open Sans</Text>
                </TouchableOpacity>
                {/* Bold */}
                <TouchableOpacity style={{ marginHorizontal: 6 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 18 }}>B</Text>
                </TouchableOpacity>
                {/* Underline */}
                <TouchableOpacity style={{ marginHorizontal: 6 }}>
                  <Text style={{ textDecorationLine: 'underline', fontSize: 18 }}>U</Text>
                </TouchableOpacity>
                {/* Text Color button (only if a text element is selected) */}
                {selectedElements.length > 0 && elements.find(el => el.id === selectedElements[0] && el.type === 'text') && (
                  <TouchableOpacity
                    style={{ marginHorizontal: 6, padding: 6, backgroundColor: '#E3F2FD', borderRadius: 6, flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => { setColorPickerTarget('text'); setShowColorPicker(true); }}
                  >
                    <Ionicons name="color-palette" size={18} color="#007AFF" />
                    <Text style={{ marginLeft: 4 }}>Text Color</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
            {activeTab === 'images' && (
              <TouchableOpacity onPress={handleImagePicker} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="image" size={24} color="#333" />
                <Text style={{ marginLeft: 8 }}>Upload Image</Text>
              </TouchableOpacity>
            )}
            {activeTab === 'shapes' && (
              <TouchableOpacity onPress={() => setShowShapePicker(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="shapes" size={24} color="#333" />
                <Text style={{ marginLeft: 8 }}>Add Shape</Text>
              </TouchableOpacity>
            )}
            {activeTab === 'background' && (
              <TouchableOpacity onPress={() => { setColorPickerTarget('canvas'); setShowColorPicker(true); }} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="color-palette" size={24} color="#333" />
                <Text style={{ marginLeft: 8 }}>Background Color</Text>
              </TouchableOpacity>
            )}
            {/* Options button for shapes in select tab */}
            {activeTab === 'select' && selectedElements.length > 0 && elements.find(el => el.id === selectedElements[0] && (
              el.type === 'rectangle' || el.type === 'circle' || el.type === 'ellipse' || el.type === 'triangle' || el.type === 'star' || el.type === 'text')) && (
              <View style={{ flex: 1 }} />
            )}
            {activeTab === 'select' && selectedElements.length > 0 && elements.find(el => el.id === selectedElements[0] && (
              el.type === 'rectangle' || el.type === 'circle' || el.type === 'ellipse' || el.type === 'triangle' || el.type === 'star' || el.type === 'text')) && (
              <TouchableOpacity onPress={() => setShowOptionsModal(true)} style={{ backgroundColor: '#E3F2FD', padding: 8, borderRadius: 8, marginLeft: 8, flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="options" size={24} color="#007AFF" />
                <Text style={{ marginLeft: 4, fontSize: 14, color: '#007AFF' }}>Options</Text>
              </TouchableOpacity>
            )}
            {/* Delete button for any selected element in select tab */}
            {activeTab === 'select' && selectedElements.length > 0 && (
              <TouchableOpacity onPress={deleteSelectedElements} style={{ backgroundColor: '#FFEBEE', padding: 8, borderRadius: 8, marginLeft: 8 }}>
                <Ionicons name="trash" size={24} color="#FF3B30" />
              </TouchableOpacity>
            )}
            {/* Font controls for selected text in select tab */}
            {activeTab === 'select' && selectedElements.length > 0 && elements.find(el => el.id === selectedElements[0] && el.type === 'text') && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                {/* Font Size */}
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 4, backgroundColor: '#E3F2FD', padding: 8, borderRadius: 8 }}
                  onPress={() => setShowFontSizePicker(true)}
                >
                  <Ionicons name="text" size={18} color="#007AFF" />
                  <Text style={{ marginLeft: 4, fontSize: 14, color: '#007AFF' }}>
                    {(() => {
                      const textElement = elements.find(el => el.id === selectedElements[0]) as TextElement;
                      return textElement ? textElement.fontSize : 16;
                    })()}
                  </Text>
                </TouchableOpacity>
                {/* Font Family */}
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 4, backgroundColor: '#E3F2FD', padding: 8, borderRadius: 8 }}
                  onPress={() => setShowFontFamilyPicker(true)}
                >
                  <Ionicons name="text" size={18} color="#007AFF" />
                  <Text style={{ marginLeft: 4, fontSize: 14, color: '#007AFF' }}>
                    {(() => {
                      const textElement = elements.find(el => el.id === selectedElements[0]) as TextElement;
                      return textElement ? textElement.fontFamily : 'System';
                    })()}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaContextView>

        {/* Shape Picker Modal */}
        <Modal visible={showShapePicker} transparent animationType="fade">
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 8 }}>
              <ShapePicker
                selected={currentTool}
                onSelect={type => {
                  setCurrentTool(type as Tool);
                  setShowShapePicker(false);
                }}
              />
              <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 8 }} onPress={() => setShowShapePicker(false)}>
                <Text style={{ color: '#6366F1', fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Color Picker Modal */}
        {showColorPicker && (
          <ColorPicker
            visible={showColorPicker}
            onClose={() => setShowColorPicker(false)}
            title={colorPickerTarget === 'element' ? 'Choose Shape Color' : colorPickerTarget === 'text' ? 'Choose Text Color' : 'Choose Canvas Color'}
            initialColor={
              colorPickerTarget === 'element' && selectedElements.length > 0
                ? (() => {
                    const selectedElement = elements.find(el => el.id === selectedElements[0]);
                    if (selectedElement && 'backgroundColor' in selectedElement) {
                      return selectedElement.backgroundColor;
                    }
                    return '#FFFFFF';
                  })()
                : colorPickerTarget === 'text' && selectedElements.length > 0
                ? (() => {
                    const selectedTextElement = elements.find(el => el.id === selectedElements[0] && el.type === 'text');
                    if (selectedTextElement && 'color' in selectedTextElement) {
                      return selectedTextElement.color;
                    }
                    return '#000000';
                  })()
                : canvasBackgroundColor
            }
            onColorSelect={(color) => {
              setShowColorPicker(false);
              if (colorPickerTarget === 'canvas') {
                useDesignStore.getState().setCanvasBackgroundColor(color);
              } else if (colorPickerTarget === 'element') {
                if (selectedElements.length > 0) {
                  // Update background color for all selected elements
                  selectedElements.forEach(elementId => {
                    const element = elements.find(el => el.id === elementId);
                    if (element && 'backgroundColor' in element) {
                      updateElement(elementId, { backgroundColor: color });
                    }
                  });
                } else {
                  // Optionally, show a message: No shape selected
                  Alert && Alert.alert && Alert.alert('No shape selected', 'Please select a shape to change its color.');
                }
              } else if (colorPickerTarget === 'text' && selectedElements.length > 0) {
                // Update text color for all selected text elements
                selectedElements.forEach(elementId => {
                  const element = elements.find(el => el.id === elementId);
                  if (element && element.type === 'text') {
                    updateElement(elementId, { color });
                  }
                });
              }
            }}
          />
        )}

        <TextEditor
          visible={editingTextId !== null}
          onClose={() => {
            setEditingTextId(null);
            setActiveTab('select');
          }}
          textElementId={editingTextId}
        />

        {/* Options Modal */}
        <Modal visible={showOptionsModal} transparent animationType="fade">
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 8, minWidth: 200 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>Element Options</Text>
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 8 }}
                onPress={() => { setShowOptionsModal(false); bringToFront(); }}
              >
                <Ionicons name="arrow-up-circle" size={20} color="#007AFF" />
                <Text style={{ marginLeft: 8, fontSize: 16 }}>Bring to Front</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 8 }}
                onPress={() => { setShowOptionsModal(false); sendToBack(); }}
              >
                <Ionicons name="arrow-down-circle" size={20} color="#007AFF" />
                <Text style={{ marginLeft: 8, fontSize: 16 }}>Send to Back</Text>
              </TouchableOpacity>
              {(() => {
                const selectedElement = elements.find(el => el.id === selectedElements[0]);
                if (selectedElement && (selectedElement.type === 'rectangle' || selectedElement.type === 'circle' || selectedElement.type === 'ellipse' || selectedElement.type === 'triangle' || selectedElement.type === 'star')) {
                  return (
                    <>
                      <TouchableOpacity 
                        style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 8 }}
                        onPress={() => { setShowOptionsModal(false); setColorPickerTarget('element'); setShowColorPicker(true); }}
                      >
                        <Ionicons name="color-palette" size={20} color="#007AFF" />
                        <Text style={{ marginLeft: 8, fontSize: 16 }}>Shape Color</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 8 }}
                        onPress={() => { setShowOptionsModal(false); handleInsertImageIntoShape(); }}
                      >
                        <Ionicons name="image" size={20} color="#007AFF" />
                        <Text style={{ marginLeft: 8, fontSize: 16 }}>Insert Image</Text>
                      </TouchableOpacity>
                    </>
                  );
                }
                return null;
              })()}
              {(() => {
                const selectedElement = elements.find(el => el.id === selectedElements[0]);
                if (selectedElement && selectedElement.type === 'text') {
                  return (
                    <TouchableOpacity 
                      style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 8 }}
                      onPress={() => { setShowOptionsModal(false); setColorPickerTarget('text'); setShowColorPicker(true); }}
                    >
                      <Ionicons name="color-palette" size={20} color="#007AFF" />
                      <Text style={{ marginLeft: 8, fontSize: 16 }}>Text Color</Text>
                    </TouchableOpacity>
                  );
                }
                return null;
              })()}
              <TouchableOpacity 
                style={{ alignSelf: 'center', marginTop: 8, padding: 8 }}
                onPress={() => setShowOptionsModal(false)}
              >
                <Text style={{ color: '#6366F1', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Font Size Picker Modal */}
        <Modal visible={showFontSizePicker} transparent animationType="fade">
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 8, minWidth: 200 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>Font Size</Text>
              <ScrollView style={{ maxHeight: 300 }}>
                {FONT_SIZES.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 4 }}
                    onPress={() => {
                      if (selectedElements.length > 0) {
                        const textElement = elements.find(el => el.id === selectedElements[0]) as TextElement;
                        if (textElement) {
                          updateElement(selectedElements[0], { fontSize: size });
                        }
                      }
                      setShowFontSizePicker(false);
                    }}
                  >
                    <Text style={{ fontSize: size, marginLeft: 8 }}>{size}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={{ alignSelf: 'center', marginTop: 8, padding: 8 }}
                onPress={() => setShowFontSizePicker(false)}
              >
                <Text style={{ color: '#6366F1', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Font Family Picker Modal */}
        <Modal visible={showFontFamilyPicker} transparent animationType="fade">
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 8, minWidth: 200 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>Font Family</Text>
              <ScrollView style={{ maxHeight: 300 }}>
                {FONT_FAMILIES.map((family) => (
                  <TouchableOpacity
                    key={family}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 4 }}
                    onPress={() => {
                      if (selectedElements.length > 0) {
                        const textElement = elements.find(el => el.id === selectedElements[0]) as TextElement;
                        if (textElement) {
                          updateElement(selectedElements[0], { fontFamily: family });
                        }
                      }
                      setShowFontFamilyPicker(false);
                    }}
                  >
                    <Text style={{ fontFamily: family, marginLeft: 8 }}>{family}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={{ alignSelf: 'center', marginTop: 8, padding: 8 }}
                onPress={() => setShowFontFamilyPicker(false)}
              >
                <Text style={{ color: '#6366F1', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </RNSafeAreaView>
  );
} 