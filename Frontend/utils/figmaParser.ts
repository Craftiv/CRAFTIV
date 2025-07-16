import { Element } from '../stores/designStore';

// Helper to convert Figma color to hex
function figmaColorToHex(color: any) {
  if (!color) return '#000000';
  const r = Math.round((color.r || 0) * 255);
  const g = Math.round((color.g || 0) * 255);
  const b = Math.round((color.b || 0) * 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Recursively parse Figma nodes to your Element[]
export function parseFigmaFrameToElements(frameNode: any): Element[] {
  const elements: Element[] = [];

  // Get the frame's top-left as origin
  const originX = frameNode.absoluteBoundingBox?.x || 0;
  const originY = frameNode.absoluteBoundingBox?.y || 0;

  function walk(node: any) {
    // Rectangle
    if (node.type === 'RECTANGLE') {
      elements.push({
        id: node.id,
        type: 'rectangle',
        x: (node.absoluteBoundingBox?.x || 0) - originX,
        y: (node.absoluteBoundingBox?.y || 0) - originY,
        width: node.absoluteBoundingBox?.width || 100,
        height: node.absoluteBoundingBox?.height || 100,
        backgroundColor: figmaColorToHex(node.fills?.[0]?.color),
        selected: false,
      });
    }
    // Ellipse
    if (node.type === 'ELLIPSE') {
      elements.push({
        id: node.id,
        type: 'ellipse',
        x: (node.absoluteBoundingBox?.x || 0) - originX,
        y: (node.absoluteBoundingBox?.y || 0) - originY,
        width: node.absoluteBoundingBox?.width || 100,
        height: node.absoluteBoundingBox?.height || 100,
        backgroundColor: figmaColorToHex(node.fills?.[0]?.color),
        selected: false,
      });
    }
    // Line
    if (node.type === 'LINE') {
      elements.push({
        id: node.id,
        type: 'line',
        x: (node.absoluteBoundingBox?.x || 0) - originX,
        y: (node.absoluteBoundingBox?.y || 0) - originY,
        width: node.absoluteBoundingBox?.width || 100,
        height: node.absoluteBoundingBox?.height || 2,
        backgroundColor: figmaColorToHex(node.strokes?.[0]?.color),
        selected: false,
      });
    }
    // Text
    if (node.type === 'TEXT') {
      elements.push({
        id: node.id,
        type: 'text',
        x: (node.absoluteBoundingBox?.x || 0) - originX,
        y: (node.absoluteBoundingBox?.y || 0) - originY,
        width: node.absoluteBoundingBox?.width || 100,
        height: node.absoluteBoundingBox?.height || 40,
        text: node.characters || '',
        fontSize: node.style?.fontSize || 16,
        fontFamily: node.style?.fontFamily || 'System',
        color: figmaColorToHex(node.fills?.[0]?.color),
        selected: false,
      });
    }
    // Image (rectangle with image fill)
    if (
      node.type === 'RECTANGLE' &&
      node.fills &&
      node.fills[0]?.type === 'IMAGE'
    ) {
      elements.push({
        id: node.id,
        type: 'image',
        x: (node.absoluteBoundingBox?.x || 0) - originX,
        y: (node.absoluteBoundingBox?.y || 0) - originY,
        width: node.absoluteBoundingBox?.width || 100,
        height: node.absoluteBoundingBox?.height || 100,
        uri: '', // Placeholder, should be filled by image API fetch
        selected: false,
      });
    }
    // Robustly walk all children for frames/groups/other containers
    if ((node.type === 'FRAME' || node.type === 'GROUP') && node.children) {
      node.children.forEach(walk);
    } else if (node.children) {
      node.children.forEach(walk);
    }
  }

  walk(frameNode);
  return elements;
} 