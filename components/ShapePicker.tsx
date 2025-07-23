import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

const shapes = [
  { type: 'rectangle', icon: <MaterialCommunityIcons name="rectangle-outline" size={28} color="#6366F1" /> },
  { type: 'circle', icon: <MaterialCommunityIcons name="circle-outline" size={28} color="#6366F1" /> },
  { type: 'ellipse', icon: <MaterialCommunityIcons name="ellipse-outline" size={28} color="#6366F1" /> },
  { type: 'triangle', icon: <MaterialCommunityIcons name="triangle-outline" size={28} color="#6366F1" /> },
  { type: 'line', icon: <MaterialCommunityIcons name="minus" size={28} color="#6366F1" /> },
  { type: 'star', icon: <MaterialCommunityIcons name="star-outline" size={28} color="#6366F1" /> },
  { type: 'pentagon', icon: <MaterialCommunityIcons name="pentagon-outline" size={28} color="#6366F1" /> },
  { type: 'hexagon', icon: <MaterialCommunityIcons name="hexagon-outline" size={28} color="#6366F1" /> },
  { type: 'octagon', icon: <MaterialCommunityIcons name="octagon-outline" size={28} color="#6366F1" /> },
  { type: 'heart', icon: <MaterialCommunityIcons name="heart-outline" size={28} color="#6366F1" /> },
  { type: 'diamond', icon: <MaterialCommunityIcons name="diamond-outline" size={28} color="#6366F1" /> },
  { type: 'arrow', icon: <MaterialCommunityIcons name="arrow-right-bold-outline" size={28} color="#6366F1" /> },
  { type: 'parallelogram', icon: <MaterialCommunityIcons name="rhombus-outline" size={28} color="#6366F1" /> },
];

export default function ShapePicker({ selected, onSelect }: { selected: string; onSelect: (type: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={styles.scroll}>
      {shapes.map((shape) => (
        <TouchableOpacity
          key={shape.type}
          style={[styles.btn, selected === shape.type && styles.selected]}
          onPress={() => onSelect(shape.type)}
        >
          {shape.icon}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginVertical: 8,
    alignSelf: 'center',
    maxWidth: 340,
  },
  row: { flexDirection: 'row', padding: 8, alignItems: 'center' },
  btn: { marginHorizontal: 6, padding: 6, borderRadius: 8 },
  selected: { backgroundColor: '#6366F1', },
}); 