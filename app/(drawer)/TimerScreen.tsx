import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, BackHandler, Dimensions, Easing, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTimerStore } from '../../stores/timerStore';

const { width: screenWidth } = Dimensions.get('window');

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map(unit => unit.toString().padStart(2, '0'))
    .join(':');
}

async function playTimerSound() {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/timer-done.wav')
    );
    let playCount = 0;
    sound.setOnPlaybackStatusUpdate(async status => {
      if (status.isLoaded && status.didJustFinish) {
        playCount++;
        if (playCount < 2) {
          await sound.replayAsync();
        } else {
          await sound.unloadAsync();
        }
      }
    });
    await sound.playAsync();
  } catch (error) {
    console.log('Error playing sound:', error);
  }
}

function showTimerAlert() {
  Alert.alert('Time is up!', 'Your timer session has ended.');
}

export default function TimerScreen() {
  const router = useRouter();
  const {
    mode,
    isRunning,
    elapsedTime,
    remainingTime,
    setMode,
    start,
    pause,
    reset,
    isFocusMode,
    toggleFocusMode,
    setCountdownDuration,
    countdownDuration,
  } = useTimerStore();
  const [notify, setNotify] = useState(true);
  // --- Notification permission state ---
  const [notificationPermission, setNotificationPermission] = useState(false);
  const notificationSentRef = useRef(false);
  const [notificationSent, setNotificationSent] = useState(false);

  // Request notification permissions
  useEffect(() => {
    if (notify) {
      // Notifications.requestPermissionsAsync().then((status) => {
      //   setNotificationPermission(status.granted);
      // });
    }
  }, [notify]);

  // Show notification helper
  const showNotification = async () => {
    try {
      // await Notifications.scheduleNotificationAsync({
      //   content: {
      //     title: 'Time is up!',
      //     body: 'Your timer session has ended.',
      //     sound: 'default', // This will play the system notification sound
      //   },
      //   trigger: null,
      // });
    } catch (e) {
      console.log('Error showing notification:', e);
    }
  };

  // Watch for timer reaching zero
  const [showTopNotification, setShowTopNotification] = useState(false);
  const notificationAnim = useRef(new Animated.Value(-100)).current;

  // Show glassy notification when timer is up
  useEffect(() => {
    if (
      mode === 'countdown' &&
      remainingTime === 0 &&
      isRunning === false &&
      notify &&
      !notificationSent
    ) {
      playTimerSound();
      showTimerAlert();
      setNotificationSent(true);
      setShowTopNotification(true);
      Animated.timing(notificationAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start();
    }
    if (remainingTime > 0 && notificationSent) {
      setNotificationSent(false);
    }
  }, [remainingTime, isRunning, mode, notify, notificationSent]);

  const handleAddFiveMinutes = () => {
    setCountdownDuration(5 * 60 * 1000 + remainingTime);
    setShowTopNotification(false);
    Animated.timing(notificationAnim, {
      toValue: -100,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const handleDismissNotification = () => {
    setShowTopNotification(false);
    Animated.timing(notificationAnim, {
      toValue: -100,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  // Calculate hours and minutes from countdown duration for display
  const totalMinutes = Math.floor(countdownDuration / (60 * 1000));
  const customHours = Math.floor(totalMinutes / 60);
  const customMinutes = totalMinutes % 60;

  // Handle hardware back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        console.log('Hardware back button pressed');
        try {
          router.back();
        } catch (error) {
          console.log('Hardware back navigation failed, trying alternative');
          router.push('/(drawer)/(tabs)');
        }
        return true; // Prevent default behavior
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [router])
  );

  // Animation for timer digits
  const animatedValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
      easing: Easing.out(Easing.exp),
    }).start(() => animatedValue.setValue(0));
  }, [mode === 'stopwatch' ? elapsedTime : remainingTime]);

  // Progress ring
  const progress = mode === 'countdown' && countdownDuration > 0
    ? (countdownDuration - remainingTime) / countdownDuration
    : 0;

  // Timer interval
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      useTimerStore.getState().tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, mode]);

  // Display correct time
  const timeDisplay = mode === 'stopwatch' ? formatTime(elapsedTime) : formatTime(remainingTime);

  // Update countdown duration when hours/minutes change
  const updateTimerDuration = (hours: number, minutes: number) => {
    const totalMs = (hours * 60 + minutes) * 60 * 1000;
    setCountdownDuration(totalMs);
  };

  // Animated timer style
  const animatedTimerStyle = {
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.08],
        }),
      },
    ],
  };

  // Beautiful popup for "almost done" (1 min left)
  const [showAlmostDone, setShowAlmostDone] = useState(false);
  useEffect(() => {
    if (mode === 'countdown' && remainingTime <= 60000 && remainingTime > 0 && isRunning) {
      setShowAlmostDone(true);
      const timeout = setTimeout(() => setShowAlmostDone(false), 5000);
      return () => clearTimeout(timeout);
    }
    if (remainingTime > 60000) setShowAlmostDone(false);
  }, [remainingTime, mode, isRunning]);

  return (
    <View style={styles.plainBg}>
      {showTopNotification && (
        <Animated.View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          transform: [{ translateY: notificationAnim }],
          alignItems: 'center',
        }}>
          <BlurView intensity={90} tint="light" style={{
            marginTop: 40,
            marginHorizontal: 16,
            borderRadius: 20,
            padding: 20,
            width: '90%',
            alignItems: 'center',
            shadowColor: '#A78BFA',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 24,
            elevation: 10,
            borderWidth: 1.5,
            borderColor: 'rgba(163,139,255,0.25)',
            backgroundColor: 'rgba(255,255,255,0.25)',
          }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#6366F1', marginBottom: 6 }}>⏰ Time’s Up!</Text>
            <Text style={{ fontSize: 16, color: '#23235B', marginBottom: 16, textAlign: 'center' }}>
              Your timer session has ended. Would you like to add more time?
            </Text>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#6366F1',
                  paddingVertical: 8,
                  paddingHorizontal: 20,
                  borderRadius: 12,
                  marginRight: 8,
                  shadowColor: '#A78BFA',
                  shadowOpacity: 0.18,
                  shadowRadius: 8,
                  elevation: 2,
                }}
                onPress={handleAddFiveMinutes}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>+5 min</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: 'rgba(99,102,241,0.08)',
                  paddingVertical: 8,
                  paddingHorizontal: 20,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#6366F1',
                }}
                onPress={handleDismissNotification}
              >
                <Text style={{ color: '#6366F1', fontWeight: 'bold', fontSize: 16 }}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>
      )}
      {/* Top Bar with Back Icon */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          onPress={() => {
            console.log('Back button pressed');
            try {
              router.back();
            } catch (error) {
              console.log('router.back() failed, trying alternative navigation');
              // Fallback navigation to home
              router.push('/(drawer)/(tabs)');
            }
          }} 
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={28} color="#23235B" />
        </TouchableOpacity>
        <Text style={styles.title}>Design Timer</Text>
        <View style={{ width: 28 }} /> {/* Spacer for symmetry */}
      </View>
      {/* Hours/Minutes Selection Section */}
      <View style={styles.timeSelectRow}>
        <Text style={styles.timeSelectLabel}>Set Timer:</Text>
        <View style={styles.timeSelectGroup}>
          <TouchableOpacity style={styles.timeSelectBtn} onPress={() => updateTimerDuration(Math.max(0, customHours - 1), customMinutes)}>
            <Ionicons name="remove" size={22} color="#6366F1" />
          </TouchableOpacity>
          <Text style={styles.timeSelectValue}>{customHours}h</Text>
          <TouchableOpacity style={styles.timeSelectBtn} onPress={() => updateTimerDuration(customHours + 1, customMinutes)}>
            <Ionicons name="add" size={22} color="#6366F1" />
          </TouchableOpacity>
        </View>
        <View style={styles.timeSelectGroup}>
          <TouchableOpacity style={styles.timeSelectBtn} onPress={() => updateTimerDuration(customHours, Math.max(0, customMinutes - 1))}>
            <Ionicons name="remove" size={22} color="#6366F1" />
          </TouchableOpacity>
          <Text style={styles.timeSelectValue}>{customMinutes}m</Text>
          <TouchableOpacity style={styles.timeSelectBtn} onPress={() => updateTimerDuration(customHours, customMinutes + 1)}>
            <Ionicons name="add" size={22} color="#6366F1" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Main Card with Glassmorphism Timer */}
      <Animated.Text style={[styles.timeTextGlass, animatedTimerStyle]}>{timeDisplay}</Animated.Text>
      {/* Action Buttons */}
      <View style={styles.actionRowGlass}>
        <TouchableOpacity style={styles.iconBtnGlass} onPress={start} activeOpacity={0.7}>
          <Ionicons name="play" size={28} color="#6366F1" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtnGlass} onPress={pause} activeOpacity={0.7}>
          <Ionicons name="pause" size={28} color="#6366F1" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtnGlass} onPress={reset} activeOpacity={0.7}>
          <Ionicons name="stop" size={28} color="#6366F1" />
        </TouchableOpacity>
      </View>
      {/* Notify Me When Done */}
      <View style={styles.notifyRow}>
        <Text style={styles.notifyText}>Notify Me When Done</Text>
        <Switch value={notify} onValueChange={setNotify} thumbColor={notify ? '#A78BFA' : '#ccc'} trackColor={{ true: '#E9D5FF', false: '#ccc' }} />
      </View>
      {/* Menu List */}
      <View style={styles.menuList}>
        <TouchableOpacity style={styles.menuItem} onPress={toggleFocusMode}>
          <MaterialIcons name="check-circle" size={22} color={isFocusMode ? '#6366F1' : '#ccc'} style={{ marginRight: 12 }} />
          <Text style={styles.menuText}>Focus Mode</Text>
          <Ionicons name="chevron-forward" size={22} color="#B4B4C6" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(drawer)/LogsScreen')}>
          <FontAwesome5 name="clipboard-list" size={20} color="#6366F1" style={{ marginRight: 14 }} />
          <Text style={styles.menuText}>View Logs</Text>
          <Ionicons name="chevron-forward" size={22} color="#B4B4C6" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(drawer)/AchievementsScreen')}>
          <Ionicons name="trophy-outline" size={22} color="#6366F1" style={{ marginRight: 12 }} />
          <Text style={styles.menuText}>Achievements</Text>
          <Ionicons name="chevron-forward" size={22} color="#B4B4C6" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const RING_THICKNESS = 10;

const styles = StyleSheet.create({
  plainBg: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  gradientBg: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#23235B',
  },
  timeSelectRow: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    marginBottom: 16,
    gap: 12,
  },
  timeSelectLabel: {
    fontSize: 16,
    color: '#23235B',
    fontWeight: 'bold',
    marginRight: 8,
  },
  timeSelectGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F4FF',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 4,
  },
  timeSelectBtn: {
    padding: 4,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  timeSelectValue: {
    fontSize: 18,
    color: '#6366F1',
    fontWeight: 'bold',
    marginHorizontal: 6,
  },
  card: {
    width: '98%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    marginTop: 16,
  },
  timerGradient: {
    width: 380,
    height: 130,
    borderRadius: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    marginVertical: 8,
  },
  timeText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  iconBtn: {
    backgroundColor: '#F7F4FF',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  notifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  notifyText: {
    fontSize: 16,
    color: '#23235B',
    fontWeight: '500',
  },
  menuList: {
    width: '100%',
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: '#F7F4FF',
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuText: {
    fontSize: 16,
    color: '#23235B',
    fontWeight: '500',
  },
  popupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  popupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#23235B',
    marginBottom: 8,
  },
  popupText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 16,
  },
  glassCardWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 32,
  },
  glassCard: {
    width: 320,
    height: 140,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(163,139,255,0.25)',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden',
  },
  timeTextGlass: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#23235B',
    letterSpacing: 2,
    textAlign: 'center',
    backgroundColor: 'transparent',
    textShadowColor: 'rgba(163,139,255,0.18)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginVertical: 40,
  },
  actionRowGlass: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 24,
  },
  iconBtnGlass: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#A78BFA',
    shadowOpacity: 0.10,
    shadowRadius: 8,
  },
  backButton: {
    padding: 4,
  },
}); 