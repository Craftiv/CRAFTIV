import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Alert, Image, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import ViewShot, { captureRef } from 'react-native-view-shot';

const TSHIRT_COLORS = [
  '#fff', '#000', '#1976D2', '#e74c3c', '#27ae60', '#f1c40f', '#8e44ad',
  '#FF9800', '#00BCD4', '#9C27B0', '#F44336', '#4CAF50', '#FFC107', '#3F51B5',
  '#E91E63', '#009688', '#CDDC39', '#FFEB3B', '#795548', '#607D8B', '#BDBDBD',
];

type DrawPath = { color: string; points: [number, number][] };
type TShirtImage = { uri: string; x: number; y: number; w: number; h: number };
type Design = { images: TShirtImage[]; drawPaths: DrawPath[]; color: string };

function emptyDesign(): Design {
  return { images: [], drawPaths: [], color: '#fff' };
}

export default function TShirtDesignScreen() {
  const router = useRouter();
  const [view, setView] = useState<'front' | 'back'>('front');
  const [front, setFront] = useState<Design>(emptyDesign());
  const [back, setBack] = useState<Design>(emptyDesign());
  const [drawing, setDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#23235B');
  const [eraser, setEraser] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTShirtColorPicker, setShowTShirtColorPicker] = useState(false);
  const designRef = useRef(null);

  const current = view === 'front' ? front : back;
  const setCurrent = (d: Design) => view === 'front' ? setFront(d) : setBack(d);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!result.canceled && result.assets[0]) {
      setCurrent({ ...current, images: [...current.images, { uri: result.assets[0].uri, x: 80, y: 120, w: 100, h: 100 }] });
    }
  };

  const handleDrawStart = (e: any) => {
    if (!drawing && !eraser) return;
    const { locationX, locationY } = e.nativeEvent;
    setCurrent({ ...current, drawPaths: [...current.drawPaths, { color: eraser ? current.color : drawColor, points: [[locationX, locationY]] }] });
  };
  const handleDrawMove = (e: any) => {
    if ((!drawing && !eraser) || current.drawPaths.length === 0) return;
    const { locationX, locationY } = e.nativeEvent;
    setCurrent({
      ...current,
      drawPaths: current.drawPaths.map((p, i, arr) => i === arr.length - 1 ? { ...p, points: [...p.points, [locationX, locationY]] } : p),
    });
  };
  const handleDrawEnd = () => { setDrawing(false); setEraser(false); };

  const changeTShirtColor = (color: string) => {
    setCurrent({ ...current, color });
    setShowTShirtColorPicker(false);
  };

  const handleExport = async () => {
    try {
      const uri = await captureRef(designRef, { format: 'png', quality: 1 });
      if (Platform.OS === 'web') {
        // Download on web
        const response = await fetch(uri);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tshirt-design-${view}.png`;
        a.click();
        window.URL.revokeObjectURL(url);
        Alert.alert('Exported!', 'Image downloaded.');
      } else {
        await Sharing.shareAsync(uri);
      }
    } catch (e: any) {
      Alert.alert('Export failed', e.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f7f7f7' }}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#23235B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>T-Shirt Designer</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Ionicons name="download-outline" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>
      {/* View Switcher */}
      <View style={styles.viewSwitcher}>
        <TouchableOpacity style={[styles.viewBtn, view === 'front' && styles.viewBtnActive]} onPress={() => setView('front')}>
          <Text style={[styles.viewBtnText, view === 'front' && styles.viewBtnTextActive]}>Front</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.viewBtn, view === 'back' && styles.viewBtnActive]} onPress={() => setView('back')}>
          <Text style={[styles.viewBtnText, view === 'back' && styles.viewBtnTextActive]}>Back</Text>
        </TouchableOpacity>
      </View>
      {/* T-Shirt Canvas */}
      <View style={styles.canvasWrap}>
        <ViewShot ref={designRef} options={{ format: 'png', quality: 1 }} style={{ alignItems: 'center', justifyContent: 'center' }}>
          <View style={[styles.tshirt, { backgroundColor: current.color }]}
            onStartShouldSetResponder={() => drawing || eraser}
            onResponderGrant={handleDrawStart}
            onResponderMove={handleDrawMove}
            onResponderRelease={handleDrawEnd}
          >
            {/* Images */}
            {current.images.map((img, i) => (
              <Image key={i} source={{ uri: img.uri }} style={[styles.img, { left: img.x, top: img.y, width: img.w, height: img.h }]} resizeMode="contain" />
            ))}
            {/* Drawings */}
            {current.drawPaths.map((p, i) => (
              <View key={i} style={StyleSheet.absoluteFill} pointerEvents="none">
                <Svg height="100%" width="100%">
                  <Path d={`M${p.points.map(pt => pt.join(',')).join(' L')}`} stroke={p.color} strokeWidth={3} fill="none" />
                </Svg>
              </View>
            ))}
          </View>
        </ViewShot>
      </View>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolbarBtn} onPress={pickImage}>
          <Ionicons name="image-outline" size={24} color="#6366F1" />
          <Text style={styles.toolbarBtnText}>Image</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarBtn} onPress={() => { setDrawing(true); setEraser(false); }}>
          <Ionicons name="brush-outline" size={24} color={drawing && !eraser ? '#6366F1' : '#aaa'} />
          <Text style={styles.toolbarBtnText}>Draw</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarBtn} onPress={() => { setEraser(true); setDrawing(false); }}>
          <Ionicons name="remove-circle-outline" size={24} color={eraser ? '#6366F1' : '#aaa'} />
          <Text style={styles.toolbarBtnText}>Eraser</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarBtn} onPress={() => setShowTShirtColorPicker(true)}>
          <Ionicons name="color-palette-outline" size={24} color="#6366F1" />
          <Text style={styles.toolbarBtnText}>Tee Color</Text>
        </TouchableOpacity>
      </View>
      {/* T-Shirt Color Picker Modal */}
      {showTShirtColorPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Pick T-Shirt Color</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {TSHIRT_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: color,
                    margin: 6,
                    borderWidth: current.color === color ? 3 : 1,
                    borderColor: current.color === color ? '#6366F1' : '#ccc',
                  }}
                  onPress={() => changeTShirtColor(color)}
                />
              ))}
            </View>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#eee', marginTop: 16 }]} onPress={() => setShowTShirtColorPicker(false)}>
              <Text style={{ color: '#23235B', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

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
    color: '#23235B',
  },
  exportBtn: {
    padding: 8,
  },
  viewSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#F7F4FF',
    gap: 12,
  },
  viewBtn: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginHorizontal: 8,
  },
  viewBtnActive: {
    backgroundColor: '#6366F1',
  },
  viewBtnText: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: 'bold',
  },
  viewBtnTextActive: {
    color: '#fff',
  },
  canvasWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  tshirt: {
    width: 260,
    height: 340,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#eee',
    position: 'relative',
  },
  img: {
    position: 'absolute',
    borderRadius: 12,
    backgroundColor: '#eee',
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
  modalOverlay: {
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
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: 280,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
}); 