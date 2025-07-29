import { Element } from '../stores/designStore';

// Helper to convert Figma color to hex
function figmaColorToHex(color: any) {
  if (!color) return '#000000';
  const r = Math.round((color.r || 0) * 255);
  const g = Math.round((color.g || 0) * 255);
  const b = Math.round((color.b || 0) * 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Helper to extract table data from Figma frame
function extractTableData(node: any) {
  if (!node.children || !Array.isArray(node.children)) {
    return null;
  }

  const tableData: {
    title?: string;
    columns?: string[];
    rows?: string[][];
    titleBackgroundColor?: string;
  } = {};

  // Look for title (usually the first text element)
  const titleElement = node.children.find((child: any) => 
    child.type === 'TEXT' && child.characters && 
    (child.name?.toLowerCase().includes('title') || child.characters.length < 50)
  );
  if (titleElement) {
    tableData.title = titleElement.characters;
    tableData.titleBackgroundColor = figmaColorToHex(titleElement.fills?.[0]?.color);
  }

  // Look for column headers
  const columnElements = node.children.filter((child: any) => 
    child.type === 'TEXT' && child.characters && 
    child.name?.toLowerCase().includes('column')
  );
  if (columnElements.length > 0) {
    tableData.columns = columnElements.map((col: any) => col.characters);
  }

  // Look for row data
  const rowElements = node.children.filter((child: any) => 
    child.type === 'TEXT' && child.characters && 
    child.name?.toLowerCase().includes('row')
  );
  if (rowElements.length > 0) {
    // Group row elements by their y position to form rows
    const rowGroups: { [key: number]: string[] } = {};
    rowElements.forEach((row: any) => {
      const y = Math.round(row.absoluteBoundingBox?.y || 0);
      if (!rowGroups[y]) rowGroups[y] = [];
      rowGroups[y].push(row.characters);
    });
    tableData.rows = Object.values(rowGroups);
  }

  return tableData;
}

// Recursively parse Figma nodes to your Element[]
export function parseFigmaFrameToElements(frameNode: any): Element[] {
  const elements: Element[] = [];

  // Get the frame's top-left as origin
  const originX = frameNode.absoluteBoundingBox?.x || 0;
  const originY = frameNode.absoluteBoundingBox?.y || 0;

  function walk(node: any) {
    // If node has fills and any fill is an IMAGE, treat as image element
    if (node.fills && Array.isArray(node.fills)) {
      const imageFill = node.fills.find((fill: any) => fill.type === 'IMAGE');
      if (imageFill) {
        elements.push({
          id: node.id,
          type: 'image',
          x: (node.absoluteBoundingBox?.x || 0) - originX,
          y: (node.absoluteBoundingBox?.y || 0) - originY,
          width: node.absoluteBoundingBox?.width || 100,
          height: node.absoluteBoundingBox?.height || 100,
          uri: '', // Placeholder, should be filled by image API fetch
          selected: false,
        } as Element);
        // Do not return; a node with an image fill may also have children with images
      }
    }
    // Rectangle (with color fill)
    if (node.type === 'RECTANGLE' && (!node.fills || !node.fills.some((fill: any) => fill.type === 'IMAGE'))) {
      elements.push({
        id: node.id,
        type: 'rectangle',
        x: (node.absoluteBoundingBox?.x || 0) - originX,
        y: (node.absoluteBoundingBox?.y || 0) - originY,
        width: node.absoluteBoundingBox?.width || 100,
        height: node.absoluteBoundingBox?.height || 100,
        backgroundColor: figmaColorToHex(node.fills?.[0]?.color),
        selected: false,
      } as Element);
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
      } as Element);
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
      } as Element);
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
      } as Element);
    }
    
    // Table - detect table-like structures
    if (node.type === 'FRAME' && node.name?.toLowerCase().includes('table')) {
      // Extract table data from children
      const tableData = extractTableData(node);
      if (tableData) {
        elements.push({
          id: node.id,
          type: 'table',
          x: (node.absoluteBoundingBox?.x || 0) - originX,
          y: (node.absoluteBoundingBox?.y || 0) - originY,
          width: node.absoluteBoundingBox?.width || 300,
          height: node.absoluteBoundingBox?.height || 200,
          title: tableData.title || 'Table',
          columns: tableData.columns || ['Column 1', 'Column 2', 'Column 3'],
          rows: tableData.rows || [],
          backgroundColor: figmaColorToHex(node.fills?.[0]?.color) || '#ffffff',
          borderColor: figmaColorToHex(node.strokes?.[0]?.color) || '#000000',
          titleBackgroundColor: tableData.titleBackgroundColor || '#4CAF50',
          selected: false,
        } as Element);
      }
    }
    
    // Recursively walk all children for frames/groups/components/instances
    if ((['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE'].includes(node.type)) && node.children) {
      if (Array.isArray(node.children)) {
        node.children.forEach(walk);
      }
      return;
    }
    // Fallback: walk children if present
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(walk);
    }
  }

  walk(frameNode);
  return elements;
} 