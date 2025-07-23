import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_KEYS } from '../../../constants/apiKeys';
import { useTheme } from '../../../contexts/ThemeContext';
import { useDesignStore } from '../../../stores/designStore';
import { parseFigmaFrameToElements } from '../../../utils/figmaParser';


// WARNING: Never expose your Figma token in production or public apps!

export default function ExploreScreen() {
  const { colors } = useTheme();
  const [templates, setTemplates] = useState<{ id: string, name: string, thumbnail: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<{ id: string, name: string, thumbnail: string } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const designStore = useDesignStore();
  const router = useRouter();

  useEffect(() => {
    async function fetchTemplates() {
      setLoading(true);
      try {
        // 1. Fetch file structure
        const res = await fetch(`https://api.figma.com/v1/files/${API_KEYS.FIGMA_FILE_KEY}`, {
          headers: { 'X-Figma-Token': API_KEYS.FIGMA_TOKEN }
        });
        const data = await res.json();
        // 2. Collect all frame nodes from all pages
        const frameNodes: { id: string, name: string }[] = [];
        for (const page of data.document.children || []) {
          for (const node of page.children || []) {
            if (node.type === 'FRAME') {
              frameNodes.push({ id: node.id, name: node.name });
            }
          }
        }
        // 3. Fetch image URLs for all frame IDs
        const ids = frameNodes.map(f => f.id).join(',');
        const imageRes = await fetch(`https://api.figma.com/v1/images/${API_KEYS.FIGMA_FILE_KEY}?ids=${ids}&format=png`, {
          headers: { 'X-Figma-Token': API_KEYS.FIGMA_TOKEN }
        });
        const imageData = await imageRes.json();
        // 4. Map frame nodes to image URLs
        const templates = frameNodes.map(f => ({
          id: f.id,
          name: f.name,
          thumbnail: imageData.images[f.id] || ''
        }));
        setTemplates(templates);
      } catch (e) {
        setTemplates([]);
      }
      setLoading(false);
    }
    fetchTemplates();
  }, []);

  const openFigmaFrame = (frameId: string) => {
    const figmaFrameUrl = `https://www.figma.com/file/${API_KEYS.FIGMA_FILE_KEY}?node-id=${encodeURIComponent(frameId)}`;
    Linking.openURL(figmaFrameUrl);
  };

  async function importFigmaFrame(frameId: string) {
    const res = await fetch(`https://api.figma.com/v1/files/${API_KEYS.FIGMA_FILE_KEY}`, {
      headers: { 'X-Figma-Token': API_KEYS.FIGMA_TOKEN }
    });
    const data = await res.json();
    // Recursively find the frame node by ID
    function findNode(node: any): any | null {
      if (node.id === frameId) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child);
          if (found) return found;
        }
      }
      return null;
    }
    const frameNode = findNode(data.document);
    if (!frameNode) return;

    // 1. Parse elements
    const elements = parseFigmaFrameToElements(frameNode);

    // 2. Collect image node IDs
    const imageElements = elements.filter(el => el.type === 'image');
    const imageIds = imageElements.map(el => el.id);

    // 3. Fetch image URLs if any
    let imageMap: Record<string, string> = {};
    if (imageIds.length > 0) {
      const imageRes = await fetch(
        `https://api.figma.com/v1/images/${API_KEYS.FIGMA_FILE_KEY}?ids=${imageIds.join(',')}&format=png`,
        { headers: { 'X-Figma-Token': API_KEYS.FIGMA_TOKEN } }
      );
      const imageData = await imageRes.json();
      imageMap = imageData.images || {};
    }

    // 4. Assign URLs to image elements (before generating unique IDs)
    const elementsWithImages = elements.map((el, index) => {
      let updated = { ...el };
      if (el.type === 'image' && imageMap[el.id]) {
        let url = imageMap[el.id];
        url = url.replace(/^[^h]+(https?:\/\/)/, '$1');
        // Only set uri if the element is an image
        (updated as any).uri = url;
      }
      // Now assign a unique ID for all elements
      const uniqueId = `${el.type}_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
      updated.id = uniqueId;
      return updated;
    });

    // 5. Add to store with unique IDs
    designStore.setElements(elementsWithImages);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: 'bold', margin: 20 }}>Explore</Text>
      {/* Large, bold, centered message with background and spacing */}
      <View
        style={{
          backgroundColor: '#F7F4FF', // light purple or any highlight color
          borderRadius: 16,
          marginHorizontal: 16,
          marginBottom: 32, // more space below
          marginTop: 8,
          paddingVertical: 18,
          paddingHorizontal: 12,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#23235B',
          }}
        >
          Explore more templates and designs for inspiration 🎉
        </Text>
      </View>
      {loading ? (
        <Text style={{ marginLeft: 20 }}>Loading...</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={styles.card}
                onPress={() => {
                  setSelectedTemplate(template);
                  setModalVisible(true);
                }}
              >
                {template.thumbnail ? (
                  <Image source={{ uri: template.thumbnail }} style={styles.cardImg} />
                ) : (
                  <View style={[styles.cardImg, { backgroundColor: '#ccc', alignItems: 'center', justifyContent: 'center' }]}> 
                    <Text style={{ color: '#333', fontSize: 12 }}>No Image</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
      {/* Full View Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            {selectedTemplate && (
              <>
                <Text style={styles.modalTitle}>{selectedTemplate.name}</Text>
                {selectedTemplate.thumbnail ? (
                  <Image source={{ uri: selectedTemplate.thumbnail }} style={styles.fullImg} resizeMode="contain" />
                ) : (
                  <View style={[styles.fullImg, { backgroundColor: '#ccc', alignItems: 'center', justifyContent: 'center' }]}> 
                    <Text style={{ color: '#333', fontSize: 16 }}>No Image</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={async () => {
                    await importFigmaFrame(selectedTemplate.id);
                    setModalVisible(false);
                    router.push({
                      pathname: '/(drawer)/TemplateEditScreen',
                      params: { templateName: selectedTemplate.name }
                    } as any);
                  }}
                >
                  <Text style={styles.editBtnText}>Edit in App</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
      {/* ...other explore content... */}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    height: 180,
    backgroundColor: '#fff', // white background for clean look
    borderRadius: 16,
    marginRight: 16,
    marginBottom: 20, // add vertical spacing between rows
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0, // no extra padding
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardImg: {
    width: 140,
    height: 180,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  cardTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    maxWidth: 350,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#23235B',
    textAlign: 'center',
  },
  fullImg: {
    width: 280,
    height: 280,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#eee',
  },
  editBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  editBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeBtn: {
    backgroundColor: '#eee',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeBtnText: {
    color: '#23235B',
    fontWeight: 'bold',
    fontSize: 15,
  },
}); 