import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { useTheme } from '../../contexts/ThemeContext';
import { useDesignStore } from '../../stores/designStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const COLOR_PALETTE: string[] = [
  '#1976D2', '#e74c3c', '#27ae60', '#f1c40f', '#8e44ad', '#fff', '#000',
  '#FF9800', '#00BCD4', '#9C27B0', '#F44336', '#4CAF50', '#FFC107', '#3F51B5',
  '#E91E63', '#009688', '#CDDC39', '#FFEB3B', '#795548', '#607D8B', '#BDBDBD',
];

const FONT_FAMILIES: string[] = ['System', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia'];

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
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gesture) => {
        onResize(gesture.dx, gesture.dy);
      },
      onPanResponderRelease: () => {
        pan.setValue({ x: 0, y: 0 });
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
      case 'topRight':
        newY = y + dy;
        newW = width + dx;
        newH = height - dy;
        break;
      case 'bottomRight':
        newW = width + dx;
        newH = height + dy;
        break;
      case 'bottomLeft':
        newX = x + dx;
        newW = width - dx;
        newH = height + dy;
        break;
    }
    
    newW = Math.max(30, Math.min(newW, canvasLayout.width - newX));
    newH = Math.max(30, Math.min(newH, canvasLayout.height - newY));
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
      {selected && ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'].map((handle) => (
        <ResizeHandle
          key={handle}
          x={handle.includes('Right') ? (shape.width || 60) : 0}
          y={handle.includes('bottom') ? (shape.height || 40) : 0}
          onResize={(dx, dy) => handleResize(handle, dx, dy)}
          type="corner"
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
  const isDragging = React.useRef(false);
  
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
        newX = Math.max(0, Math.min(newX, canvasLayout.width - 100));
        newY = Math.max(0, Math.min(newY, canvasLayout.height - 30));
        pan.setValue({ x: newX, y: newY });
      },
      onPanResponderRelease: (e: GestureResponderEvent, gesture) => {
        if (!canvasLayout) return;
        let newX = gesture.dx + panOffset.current.x;
        let newY = gesture.dy + panOffset.current.y;
        newX = Math.max(0, Math.min(newX, canvasLayout.width - 100));
        newY = Math.max(0, Math.min(newY, canvasLayout.height - 30));
        pan.setValue({ x: newX, y: newY });
        panOffset.current = { x: newX, y: newY };
        updatePosition && updatePosition(newX, newY);
        isDragging.current = false;
      },
    })
  ).current;

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
      <Text
        style={{
          fontSize: textObj.fontSize || 16,
          color: textObj.color || '#23235B',
          fontWeight: 'bold',
          fontFamily: textObj.fontFamily || 'System',
        }}
      >
        {textObj.text}
      </Text>
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
    // Don't update position if we're currently dragging
    if (isDragging.current) return;
    
    // Only update if the position has actually changed significantly
    const currentX = panOffset.current.x;
    const currentY = panOffset.current.y;
    const newX = image.x;
    const newY = image.y;
    
    // Only update if the difference is more than 1 pixel to avoid floating point issues
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
      case 'topRight':
        newY = y + dy;
        newW = width + dx;
        newH = height - dy;
        break;
      case 'bottomRight':
        newW = width + dx;
        newH = height + dy;
        break;
      case 'bottomLeft':
        newX = x + dx;
        newW = width - dx;
        newH = height + dy;
        break;
    }
    
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
        borderWidth: selected ? 3 : 0,
        borderColor: selected ? '#007AFF' : 'transparent',
        borderRadius: 8,
        backgroundColor: selected ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
        transform: pan.getTranslateTransform(),
      }}
    >
      <Image 
        source={{ uri: image.uri }} 
        style={{ width: image.width, height: image.height, borderRadius: 8 }} 
        resizeMode="contain" 
      />
      {selected && ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'].map((handle) => (
        <ResizeHandle
          key={handle}
          x={handle.includes('Right') ? (image.width || 60) : 0}
          y={handle.includes('bottom') ? (image.height || 40) : 0}
          onResize={(dx, dy) => handleResize(handle, dx, dy)}
          type="corner"
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
  
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
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
  const ignoreNextCanvasPress = React.useRef(false);

  const elements = designStore.elements;
  const selectedElements = designStore.selectedElements;
  const canvasBackgroundColor = designStore.canvasBackgroundColor;

  useEffect(() => {
    // Set template name from params if available
    if (params.templateName) {
      setTemplateName(params.templateName as string);
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

  const updateImageSize = (id: string, newWidth: number, newHeight: number, newX: number, newY: number) => {
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

  const deleteSelectedElement = () => {
    if (selectedShape !== null) {
      deleteSelectedShape();
    } else if (selectedText !== null) {
      deleteSelectedText();
    } else if (selectedImage !== null) {
      deleteSelectedImage();
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
      Alert.alert('Success', 'Template saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save template');
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

      {/* Canvas */}
      <View style={styles.canvasContainer}>
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
          {(selectedShape || selectedText || selectedImage) && (
            <View style={styles.selectionIndicator}>
              <Text style={styles.selectionText}>
                {selectedShape ? 'Shape Selected' : selectedText ? 'Text Selected' : 'Image Selected'}
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
                  updateSize={(id, width, height, x, y) => updateImageSize(element.id, width / scaleFactor, height / scaleFactor, x / scaleFactor, y / scaleFactor)}
                />
              );
            }
            return null;
          })}
        </View>
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
          disabled={!selectedShape && !selectedText && !selectedImage}
        >
          <Ionicons 
            name="trash" 
            size={24} 
            color={selectedShape || selectedText || selectedImage ? '#FF3B30' : colors.textSecondary} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => setShowColorPicker(true)}
          disabled={!selectedShape}
        >
          <Ionicons 
            name="color-palette" 
            size={24} 
            color={selectedShape ? colors.text : colors.textSecondary} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={handleCanvasColor}
        >
          <Ionicons name="color-fill" size={24} color={colors.text} />
        </TouchableOpacity>
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
            
            <View style={styles.colorPickerGrid}>
              {COLOR_PALETTE.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorPickerItem, { backgroundColor: color }]}
                  onPress={() => changeShapeColor(color)}
                />
              ))}
            </View>
            
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
              placeholder="Enter text..."
              placeholderTextColor={colors.textSecondary}
              multiline
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
                <Text style={styles.textInputButtonTextPrimary}>Add</Text>
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
            
            <View style={styles.colorPickerGrid}>
              {COLOR_PALETTE.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorPickerItem, { backgroundColor: color }]}
                  onPress={() => {
                    designStore.setCanvasBackgroundColor(color);
                    setShowCanvasColorPicker(false);
                  }}
                />
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCanvasColorPicker(false)}
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
    minHeight: 100,
    textAlignVertical: 'top',
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
});

export default TemplateEditScreen; 