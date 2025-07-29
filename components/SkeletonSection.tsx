import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import SkeletonCard from './SkeletonCard';

interface SkeletonSectionProps {
  title: string;
  count?: number;
}

export default function SkeletonSection({ title, count = 4 }: SkeletonSectionProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.section, { backgroundColor: 'transparent' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#6366F1' : colors.text }]}>{title}</Text>
      </View>
      <View style={styles.cardsContainer}>
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { 
    marginVertical: 10, 
    backgroundColor: 'transparent' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginHorizontal: 16, 
    marginBottom: 6 
  },
  title: { 
    fontWeight: 'bold', 
    fontSize: 18 
  },
  cardsContainer: {
    flexDirection: 'row',
    paddingLeft: 16,
  },
});