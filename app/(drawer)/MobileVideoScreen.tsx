import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useDesignStore } from '../../stores/designStore';
import CanvaDesignPage from './CanvaDesignPage';

const TOTAL_FRAMES = 5;

const COLOR_PALETTE = [
  '#1976D2', '#e74c3c', '#27ae60', '#f1c40f', '#8e44ad', '#fff', '#000',
  '#FF9800', '#00BCD4', '#9C27B0', '#F44336', '#4CAF50', '#FFC107', '#3F51B5',
  '#E91E63', '#009688', '#CDDC39', '#FFEB3B', '#795548', '#607D8B', '#BDBDBD',
];

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  playButton: {
    padding: 8,
  },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#F7F4FF',
    gap: 12,
  },
  timelineDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  timelineDotActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  instructions: {
    padding: 12,
    backgroundColor: 'transparent',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  toolbarBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  toolbarBtnText: {
    fontSize: 12,
    color: '#6366F1',
    marginTop: 2,
  },
  textModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  textModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: 280,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    width: 220,
    fontSize: 16,
  },
  textModalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  shapeOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    marginHorizontal: 8,
    backgroundColor: '#fff',
  },
  shapeOptionActive: {
    borderColor: '#6366F1',
    backgroundColor: '#F7F4FF',
  },
});

export default function MobileVideoScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  // Each frame is an array of elements (designs)
  const [frames, setFrames] = useState<Array<any[]>>(Array(TOTAL_FRAMES).fill([]));
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playAnim = useRef(new Animated.Value(0)).current;

  // Add state for text input modal
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');

  // Add state for shape picker modal
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [selectedShape, setSelectedShape] = useState<'rectangle' | 'circle'>('rectangle');
  const [selectedColor, setSelectedColor] = useState<string>('#1976D2');
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Add state for instructions visibility
  const [showInstructions, setShowInstructions] = useState(true);

  // Store the design for the current frame
  const designStore = useDesignStore();

  // Save current frame's design before switching
  const saveCurrentFrame = () => {
    setFrames(prev => {
      const updated = [...prev];
      updated[currentFrame] = designStore.elements;
      return updated;
    });
  };

  // Switch to a different frame
  const handleFrameSwitch = (frameIdx: number) => {
    saveCurrentFrame();
    setCurrentFrame(frameIdx);
    // Load the selected frame's design into the store
    designStore.setElements(frames[frameIdx] || []);
  };

  // Play the video (show each frame for 1 second)
  const handlePlay = async () => {
    saveCurrentFrame();
    setIsPlaying(true);
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      setCurrentFrame(i);
      designStore.setElements(frames[i] || []);
      // Animate or wait for 1 second
      // eslint-disable-next-line no-await-in-loop
      await new Promise(res => setTimeout(res, 1000));
    }
    setIsPlaying(false);
  };

  // Add Rectangle
  const handleAddRectangle = () => {
    designStore.addElement({
      id: `rect_${Date.now()}`,
      type: 'rectangle',
      x: 50,
      y: 50,
      width: 80,
      height: 60,
      backgroundColor: '#1976D2',
      selected: false,
    });
  };

  // Add Text
  const handleAddText = () => {
    setShowTextInput(true);
  };
  const handleTextSubmit = () => {
    if (textInputValue.trim()) {
      designStore.addElement({
        id: `text_${Date.now()}`,
        type: 'text',
        x: 60,
        y: 60,
        width: 120,
        height: 40,
        text: textInputValue,
        fontSize: 18,
        fontFamily: 'System',
        color: '#23235B',
        selected: false,
      });
    }
    setShowTextInput(false);
    setTextInputValue('');
  };

  // Add Image
  const handleAddImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      designStore.addElement({
        id: `image_${Date.now()}`,
        type: 'image',
        x: 70,
        y: 70,
        width: 100,
        height: 100,
        uri: result.assets[0].uri,
        selected: false,
      });
    }
  };

  // Add Shape
  const handleAddShape = () => {
    setShowShapePicker(true);
  };
  const handleShapeSelect = (shape: 'rectangle' | 'circle') => {
    setSelectedShape(shape);
    setShowColorPicker(true);
  };
  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    // Add the shape to the canvas
    designStore.addElement({
      id: `${selectedShape}_${Date.now()}`,
      type: selectedShape,
      x: 50,
      y: 50,
      width: 80,
      height: 60,
      backgroundColor: color,
      selected: false,
    });
    setShowColorPicker(false);
    setShowShapePicker(false);
  };

  // Undo
  const handleUndo = () => {
    if (designStore.canUndo()) designStore.undo();
  };
  // Delete selected
  const handleDelete = () => {
    designStore.deleteSelectedElements();
  };

  useEffect(() => {
    setShowInstructions(true);
    const timer = setTimeout(() => setShowInstructions(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" />
      {/* Timeline */}
      <View style={styles.timeline}>
        {Array.from({ length: TOTAL_FRAMES }).map((_, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.timelineDot, currentFrame === idx && styles.timelineDotActive]}
            onPress={() => handleFrameSwitch(idx)}
            disabled={isPlaying}
          >
            <Text style={{ color: currentFrame === idx ? '#fff' : '#6366F1', fontWeight: 'bold' }}>{idx + 1}</Text>
          </TouchableOpacity>
        ))}
      </View>
     
      <View style={{ flex: 1 }}>
      
        <CanvaDesignPage hideToolbar />
      </View>
      {/* Minimal Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolbarBtn} onPress={handleAddRectangle}>
          <Ionicons name="square-outline" size={24} color="#6366F1" />
          <Text style={styles.toolbarBtnText}>Rect</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarBtn} onPress={handleAddText}>
          <Ionicons name="text" size={24} color="#6366F1" />
          <Text style={styles.toolbarBtnText}>Text</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarBtn} onPress={handleAddImage}>
          <Ionicons name="image-outline" size={24} color="#6366F1" />
          <Text style={styles.toolbarBtnText}>Image</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarBtn} onPress={handleAddShape}>
          <Ionicons name="shapes" size={24} color="#6366F1" />
          <Text style={styles.toolbarBtnText}>Shape</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarBtn} onPress={handleUndo}>
          <Ionicons name="arrow-undo" size={24} color="#6366F1" />
          <Text style={styles.toolbarBtnText}>Undo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#FF3B30" />
          <Text style={styles.toolbarBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
      {/* Text Input Modal */}
      {showTextInput && (
        <View style={styles.textModalOverlay}>
          <View style={styles.textModalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Add Text</Text>
            <TextInput
              style={styles.textInput}
              value={textInputValue}
              onChangeText={setTextInputValue}
              placeholder="Enter text..."
              autoFocus
            />
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <TouchableOpacity style={[styles.textModalBtn, { backgroundColor: '#6366F1' }]} onPress={handleTextSubmit}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.textModalBtn, { backgroundColor: '#eee', marginLeft: 12 }]} onPress={() => setShowTextInput(false)}>
                <Text style={{ color: '#23235B', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {showShapePicker && (
        <View style={styles.textModalOverlay}>
          <View style={styles.textModalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Pick Shape</Text>
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              <TouchableOpacity style={[styles.shapeOption, selectedShape === 'rectangle' && styles.shapeOptionActive]} onPress={() => handleShapeSelect('rectangle')}>
                <Ionicons name="square-outline" size={32} color="#6366F1" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.shapeOption, selectedShape === 'circle' && styles.shapeOptionActive]} onPress={() => handleShapeSelect('circle')}>
                <Ionicons name="ellipse-outline" size={32} color="#6366F1" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.textModalBtn, { backgroundColor: '#eee' }]} onPress={() => setShowShapePicker(false)}>
              <Text style={{ color: '#23235B', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {showColorPicker && (
        <View style={styles.textModalOverlay}>
          <View style={styles.textModalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Pick Color</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {COLOR_PALETTE.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: color,
                    margin: 6,
                    borderWidth: selectedColor === color ? 3 : 1,
                    borderColor: selectedColor === color ? '#6366F1' : '#ccc',
                  }}
                  onPress={() => handleColorSelect(color)}
                />
              ))}
            </View>
            <TouchableOpacity style={[styles.textModalBtn, { backgroundColor: '#eee', marginTop: 16 }]} onPress={() => setShowColorPicker(false)}>
              <Text style={{ color: '#23235B', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {showInstructions && (
        <View style={styles.instructions}>
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            Design each second. Tap play to preview your 5-second video.
          </Text>
        </View>
      )}
    </View>
  );
} 