import { API_KEYS } from '../constants/apiKeys';
import { parseFigmaFrameToElements } from './figmaParser';

export async function loadFigmaTemplateToStore(frameId, designStore) {
  // 1. Fetch Figma file
  const res = await fetch(`https://api.figma.com/v1/files/${API_KEYS.FIGMA_FILE_KEY}`, {
    headers: { 'X-Figma-Token': API_KEYS.FIGMA_TOKEN }
  });
  const data = await res.json();

  // 2. Find the frame node
  function findNode(node) {
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
  if (!frameNode) throw new Error('Frame not found');

  // 3. Parse elements
  const elements = parseFigmaFrameToElements(frameNode);

  // 4. Fetch image URLs if needed
  const imageElements = elements.filter(el => el.type === 'image');
  const imageIds = imageElements.map(el => el.id);
  let imageMap = {};
  if (imageIds.length > 0) {
    const imageRes = await fetch(
      `https://api.figma.com/v1/images/${API_KEYS.FIGMA_FILE_KEY}?ids=${imageIds.join(',')}&format=png`,
      { headers: { 'X-Figma-Token': API_KEYS.FIGMA_TOKEN } }
    );
    const imageData = await imageRes.json();
    imageMap = imageData.images || {};
  }

  // 5. Assign URLs to image elements
  const elementsWithImages = elements.map((el, index) => {
    let updated = { ...el };
    if (el.type === 'image' && imageMap[el.id]) {
      let url = imageMap[el.id];
      url = url.replace(/^[^h]+(https?:\/\/)/, '$1');
      updated.uri = url;
    }
    // Assign a unique ID
    updated.id = `${el.type}_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
    return updated;
  });

  // 6. Set elements in store
  designStore.setElements(elementsWithImages);
} 