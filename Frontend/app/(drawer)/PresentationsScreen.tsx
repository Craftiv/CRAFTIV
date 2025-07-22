import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const DEFAULT_BG = '#fff';
const COLOR_PALETTE = [
  '#fff', '#1976D2', '#e74c3c', '#27ae60', '#f1c40f', '#8e44ad', '#000',
  '#FF9800', '#00BCD4', '#9C27B0', '#F44336', '#4CAF50', '#FFC107', '#3F51B5',
  '#E91E63', '#009688', '#CDDC39', '#FFEB3B', '#795548', '#607D8B', '#BDBDBD',
];

export default function PresentationsScreen() {
  const router = useRouter();
  const [slides, setSlides] = useState([
    { title: '', body: '', imageUri: '', backgroundColor: DEFAULT_BG, backgroundImageUri: '' },
  ]);
  const [current, setCurrent] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgImagePicker, setShowBgImagePicker] = useState(false);
  const [preview, setPreview] = useState(false);

  const currentSlide = slides[current];

  const updateSlide = (updates: any) => {
    setSlides(slides => slides.map((s, i) => i === current ? { ...s, ...updates } : s));
  };

  const addSlide = () => {
    setSlides([...slides, { title: '', body: '', imageUri: '', backgroundColor: DEFAULT_BG, backgroundImageUri: '' }]);
    setCurrent(slides.length);
  };

  const deleteSlide = () => {
    if (slides.length === 1) return;
    const newSlides = slides.filter((_, i) => i !== current);
    setSlides(newSlides);
    setCurrent(Math.max(0, current - 1));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!result.canceled && result.assets[0]) {
      updateSlide({ imageUri: result.assets[0].uri });
    }
  };

  const pickBgImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!result.canceled && result.assets[0]) {
      updateSlide({ backgroundImageUri: result.assets[0].uri });
      setShowBgImagePicker(false);
    }
  };

  // Preview mode: auto-advance slides
  React.useEffect(() => {
    if (!preview) return;
    if (current < slides.length - 1) {
      const timer = setTimeout(() => setCurrent(current + 1), 1200);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setPreview(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [preview, current]);

  return (
    <View style={{ flex: 1, backgroundColor: currentSlide.backgroundColor }}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#23235B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Presentation</Text>
        <TouchableOpacity style={styles.playButton} onPress={() => { setPreview(true); setCurrent(0); }}>
          <Ionicons name="play" size={24} color={preview ? '#ccc' : '#6366F1'} />
        </TouchableOpacity>
      </View>
      {/* Slide Navigation */}
      <View style={styles.slideNav}>
        <TouchableOpacity onPress={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0 || preview}>
          <Ionicons name="chevron-back" size={28} color={current === 0 ? '#ccc' : '#6366F1'} />
        </TouchableOpacity>
        <Text style={styles.slideNavText}>Slide {current + 1} / {slides.length}</Text>
        <TouchableOpacity onPress={() => setCurrent(Math.min(slides.length - 1, current + 1))} disabled={current === slides.length - 1 || preview}>
          <Ionicons name="chevron-forward" size={28} color={current === slides.length - 1 ? '#ccc' : '#6366F1'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={addSlide} disabled={preview} style={{ marginLeft: 12 }}>
          <Ionicons name="add-circle-outline" size={28} color="#27ae60" />
        </TouchableOpacity>
        <TouchableOpacity onPress={deleteSlide} disabled={slides.length === 1 || preview} style={{ marginLeft: 4 }}>
          <Ionicons name="trash-outline" size={28} color={slides.length === 1 ? '#ccc' : '#e74c3c'} />
        </TouchableOpacity>
      </View>
      {/* Slide Content */}
      <ScrollView contentContainerStyle={styles.slideContent}>
        {/* Background image */}
        {currentSlide.backgroundImageUri ? (
          <Image source={{ uri: currentSlide.backgroundImageUri }} style={styles.bgImage} resizeMode="cover" />
        ) : null}
        {/* Title */}
        <TextInput
          style={styles.titleInput}
          value={currentSlide.title}
          onChangeText={t => updateSlide({ title: t })}
          placeholder="Slide Title"
          editable={!preview}
        />
        {/* Body */}
        <TextInput
          style={styles.bodyInput}
          value={currentSlide.body}
          onChangeText={t => updateSlide({ body: t })}
          placeholder="Type your content here..."
          multiline
          editable={!preview}
        />
        {/* Slide Image */}
        {currentSlide.imageUri ? (
          <Image source={{ uri: currentSlide.imageUri }} style={styles.slideImage} resizeMode="contain" />
        ) : null}
      </ScrollView>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolbarBtn} onPress={pickImage} disabled={preview}>
          <Ionicons name="image-outline" size={24} color="#6366F1" />
          <Text style={styles.toolbarBtnText}>Image</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarBtn} onPress={() => setShowColorPicker(true)} disabled={preview}>
          <Ionicons name="color-palette-outline" size={24} color="#6366F1" />
          <Text style={styles.toolbarBtnText}>BG Color</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarBtn} onPress={() => setShowBgImagePicker(true)} disabled={preview}>
          <Ionicons name="images-outline" size={24} color="#6366F1" />
          <Text style={styles.toolbarBtnText}>BG Image</Text>
        </TouchableOpacity>
      </View>
      {/* Color Picker Modal */}
      {showColorPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Pick Background Color</Text>
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
                    borderWidth: currentSlide.backgroundColor === color ? 3 : 1,
                    borderColor: currentSlide.backgroundColor === color ? '#6366F1' : '#ccc',
                  }}
                  onPress={() => { updateSlide({ backgroundColor: color, backgroundImageUri: '' }); setShowColorPicker(false); }}
                />
              ))}
            </View>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#eee', marginTop: 16 }]} onPress={() => setShowColorPicker(false)}>
              <Text style={{ color: '#23235B', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* BG Image Picker Modal */}
      {showBgImagePicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Pick Background Image</Text>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#6366F1', marginTop: 8 }]} onPress={pickBgImage}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Choose Image</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#eee', marginTop: 16 }]} onPress={() => setShowBgImagePicker(false)}>
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
  playButton: {
    padding: 8,
  },
  slideNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#F7F4FF',
    gap: 8,
  },
  slideNavText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366F1',
    marginHorizontal: 8,
  },
  slideContent: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 24,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#23235B',
    marginBottom: 12,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 8,
    padding: 8,
  },
  bodyInput: {
    fontSize: 16,
    color: '#23235B',
    width: '100%',
    minHeight: 80,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  slideImage: {
    width: 220,
    height: 140,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#eee',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
    borderRadius: 16,
    opacity: 0.25,
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