import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Keyboard, Modal, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useTimerStore } from '../stores/timerStore';

interface TimeGoalPopupProps {
  visible: boolean;
  onClose: () => void;
}

const timeOptions = [
  { label: '15m', value: 15 },
  { label: '30m', value: 30 },
  { label: '45m', value: 45 },
  { label: '1h', value: 60 },
  { label: '1.5h', value: 90 },
  { label: '2h', value: 120 },
];

export default function TimeGoalPopup({ visible, onClose }: TimeGoalPopupProps) {
  const router = useRouter();
  const { setCountdownDuration, start, reset } = useTimerStore();
  const [selectedTime, setSelectedTime] = useState<number | null>(60); // Default to 60 minutes
  const [customMinutes, setCustomMinutes] = useState('60'); // Default to 60 minutes
  const [customHours, setCustomHours] = useState('');

  const handleTimeSelect = (minutes: number) => {
    setSelectedTime(minutes);
    // Calculate hours and minutes from total minutes
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    setCustomHours(String(hrs));
    setCustomMinutes(String(mins));
    Keyboard.dismiss();
  };

  const handleCustomTimeChange = () => {
    const hours = parseInt(customHours) || 0;
    const minutes = parseInt(customMinutes) || 0;
    const totalMinutes = hours * 60 + minutes;
    // Allow 0 minutes (user might want a very short timer)
    setSelectedTime(totalMinutes);
  };

  const handleStartSession = () => {
    
    try {
      if (selectedTime !== null && selectedTime >= 0) {
        
        // Reset the timer first to ensure clean state
        reset();
        
        // Set the countdown duration in milliseconds
        const durationMs = selectedTime * 60 * 1000;
        setCountdownDuration(durationMs);
        
        // Wait for state to update before starting
        setTimeout(() => {
          start();
          Keyboard.dismiss();
          onClose();
          router.push('/(drawer)/TimerScreen');
        }, 50);
      } else {
        alert('Please select a valid time duration');
      }
    } catch (error) {
      alert('Error starting timer: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleSkip = () => {
    Keyboard.dismiss();
    onClose();
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <LinearGradient
              colors={['rgba(167, 139, 250, 0.95)', 'rgba(99, 102, 241, 0.95)', 'rgba(247, 244, 255, 0.95)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.popupContainer}
            >
              <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="timer-outline" size={24} color="#6366F1" />
                  </View>
                  <Text style={styles.title}>Set Timer</Text>
                  <Text style={styles.subtitle}>
                    Choose your design session duration
                  </Text>
                </View>

                {/* Quick Time Options */}
                <View style={styles.timeOptionsContainer}>
                  <Text style={styles.sectionTitle}>Quick Options</Text>
                  <View style={styles.timeGrid}>
                    {timeOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.timeOption,
                          selectedTime === option.value && styles.selectedTimeOption
                        ]}
                        onPress={() => handleTimeSelect(option.value)}
                      >
                        <Text style={[
                          styles.timeOptionText,
                          selectedTime === option.value && styles.selectedTimeOptionText
                        ]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Custom Time Input */}
                <View style={styles.customTimeContainer}>
                  <Text style={styles.sectionTitle}>Custom Time</Text>
                  <View style={styles.customTimeInputs}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Hours</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={customHours}
                        onChangeText={(text) => {
                          setCustomHours(text);
                          handleCustomTimeChange();
                        }}
                        placeholder="0"
                        keyboardType="numeric"
                        maxLength={2}
                        returnKeyType="done"
                        onSubmitEditing={dismissKeyboard}
                        blurOnSubmit={true}
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Minutes</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={customMinutes}
                        onChangeText={(text) => {
                          setCustomMinutes(text);
                          handleCustomTimeChange();
                        }}
                        placeholder="60"
                        keyboardType="numeric"
                        maxLength={2}
                        returnKeyType="done"
                        onSubmitEditing={dismissKeyboard}
                        blurOnSubmit={true}
                      />
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipButtonText}>Skip</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.startButton,
                      (selectedTime === null || selectedTime < 0) && styles.disabledButton
                    ]} 
                    onPress={handleStartSession}
                    disabled={selectedTime === null || selectedTime < 0}
                  >
                    <Text style={styles.startButtonText}>Start</Text>
                    <Ionicons name="play" size={14} color="#fff" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popupContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#23235B',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#23235B',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  timeOptionsContainer: {
    width: '100%',
    marginBottom: 16,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  timeOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 10,
    minWidth: 60,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedTimeOption: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#23235B',
  },
  selectedTimeOptionText: {
    color: '#fff',
  },
  customTimeContainer: {
    width: '100%',
    marginBottom: 20,
  },
  customTimeInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 6,
    fontWeight: '500',
  },
  timeInput: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  startButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
}); 