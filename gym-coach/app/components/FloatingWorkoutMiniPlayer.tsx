import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkout } from '@/app/context/WorkoutContext';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PLAYER_WIDTH = 300;
const PLAYER_HEIGHT = 56;
const TOP_GAP = 60;

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function FloatingWorkoutMiniPlayer() {
  const { activeWorkout, pauseWorkout, resumeWorkout, cancelWorkout, isWorkoutActive, showMiniPlayer, setShowMiniPlayer } = useWorkout();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (isWorkoutActive && activeWorkout && showMiniPlayer) {
      // Animate in from top
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out to top
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isWorkoutActive, activeWorkout, showMiniPlayer]);

  if (!isWorkoutActive || !activeWorkout || !showMiniPlayer) return null;

  const handleCancel = () => {
    Alert.alert(
      'Cancel Workout',
      'Are you sure you want to cancel this workout? Your progress will be lost.',
      [
        { text: 'Continue Workout', style: 'cancel' },
        {
          text: 'Cancel Workout',
          style: 'destructive',
          onPress: () => {
            cancelWorkout();
            setShowMiniPlayer(false);
            // Navigate to home screen after canceling
            router.replace('/(tabs)/home');
          },
        },
      ]
    );
  };

  const handleTap = () => {
    setShowMiniPlayer(false); // Hide mini-player when returning to workout
    router.push('/today-workout');
  };

  const handlePauseResume = (e: any) => {
    e.stopPropagation();
    if (activeWorkout.isPaused) {
      resumeWorkout();
    } else {
      pauseWorkout();
    }
  };

  const completedSetsCount = Object.values(activeWorkout.completedSets)
    .flat()
    .filter(Boolean).length;
  const progress = activeWorkout.totalSets > 0 
    ? (completedSetsCount / activeWorkout.totalSets) * 100 
    : 0;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: TOP_GAP,
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <Pressable style={styles.content} onPress={handleTap}>
        <View style={styles.leftSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="barbell" size={18} color="#2AA8FF" />
          </View>
          <View style={styles.info}>
            <Text style={styles.workoutName} numberOfLines={1}>
              {activeWorkout.plan.name}
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progress}%` }
                ]} 
              />
            </View>
          </View>
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.timer}>
            {formatTime(activeWorkout.elapsedSeconds)}
          </Text>
          <View style={styles.buttons}>
            <Pressable 
              onPress={handlePauseResume} 
              style={[styles.iconButton, activeWorkout.isPaused && styles.iconButtonResume]}
            >
              <Ionicons
                name={activeWorkout.isPaused ? 'play' : 'pause'}
                size={16}
                color="#fff"
              />
            </Pressable>
            <Pressable 
              onPress={handleCancel} 
              style={[styles.iconButton, styles.iconButtonCancel]}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 28,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    borderWidth: 1,
    borderColor: '#2AA8FF30',
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2AA8FF20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  workoutName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#2AA8FF40',
    borderRadius: 1.5,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2AA8FF',
    borderRadius: 1.5,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timer: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2AA8FF',
    fontVariant: ['tabular-nums'],
  },
  buttons: {
    flexDirection: 'row',
    gap: 6,
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2AA8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonResume: {
    backgroundColor: '#10B981',
  },
  iconButtonCancel: {
    backgroundColor: '#EF4444',
  },
});