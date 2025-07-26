import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSettings } from '../../contexts/SettingsContext';

const options = [
  { label: 'Low', value: 'low', size: '~0.5MB' },
  { label: 'Medium', value: 'medium', size: '~1.5MB' },
  { label: 'High', value: 'high', size: '~3MB' },
];

const ExportQualityScreen = () => {
  const { exportQuality, setExportQuality } = useSettings();
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={24} color="#23235B" />
      </TouchableOpacity>
      <Text style={styles.title}>Export Quality</Text>
      <Text style={styles.subtitle}>Choose your default export quality:</Text>
      <View style={{ marginTop: 24 }}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={styles.radioRow}
            onPress={() => setExportQuality(opt.value as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.radioOuter, exportQuality === opt.value && styles.radioOuterActive]}>
              {exportQuality === opt.value && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel}>{opt.label}</Text>
            <Text style={styles.radioSize}>{opt.size}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  backButton: { padding: 4, position: 'absolute', top: 24, left: 16, zIndex: 10 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 12, color: '#23235B', marginTop: 48 },
  subtitle: { fontSize: 16, color: '#6366F1' },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#6366F1', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  radioOuterActive: { borderColor: '#23235B' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#23235B' },
  radioLabel: { fontSize: 16, fontWeight: '500', color: '#23235B', flex: 1 },
  radioSize: { fontSize: 14, color: '#6366F1' },
});

export default ExportQualityScreen; 