import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export type ActiveWorkout = {
  plan: {
    plan_id: number;
    name: string;
  };
  day: {
    plan_day_id: number;
    day_number: number;
    day_label: string;
    exercises: Array<{
      exercise_id: number;
      name: string;
      target_muscles: string | null;
      prescription: { sets: number; reps: number };
    }>;
  };
  startedAt: number;
  elapsedSeconds: number;
  completedSets: Record<string, boolean[]>;
  isPaused: boolean;
  totalSets: number;
};

type WorkoutContextType = {
  activeWorkout: ActiveWorkout | null;
  startWorkout: (plan: any, day: any) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  cancelWorkout: () => void;
  completeSet: (exerciseId: number, setIndex: number) => void;
  updateElapsedTime: (seconds: number) => void;
  finishWorkout: () => void;
  isWorkoutActive: boolean;
  showMiniPlayer: boolean;
  setShowMiniPlayer: (show: boolean) => void;
};

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

const ACTIVE_WORKOUT_KEY = 'active_workout_state';

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | number | null>(null);
  const router = useRouter();

  // Load saved workout on app start
  useEffect(() => {
    const loadSavedWorkout = async () => {
      try {
        const saved = await AsyncStorage.getItem(ACTIVE_WORKOUT_KEY);
        if (saved) {
          const workout = JSON.parse(saved);
          setActiveWorkout(workout);
          setIsWorkoutActive(true);
          
          // Resume timer if not paused
          if (!workout.isPaused && workout.startedAt) {
            const elapsed = Math.floor((Date.now() - workout.startedAt) / 1000);
            if (timerRef.current) clearInterval(timerRef.current as any);
            timerRef.current = setInterval(() => {
              setActiveWorkout(prev => {
                if (!prev || prev.isPaused) return prev;
                const newElapsed = Math.floor((Date.now() - prev.startedAt) / 1000);
                return { ...prev, elapsedSeconds: newElapsed };
              });
            }, 1000);
          }
        }
      } catch (e) {
        console.warn('Failed to load saved workout', e);
      }
    };
    loadSavedWorkout();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current as any);
    };
  }, []);

  // Save workout state whenever it changes
  useEffect(() => {
    const saveWorkout = async () => {
      if (activeWorkout) {
        await AsyncStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(activeWorkout));
      } else {
        await AsyncStorage.removeItem(ACTIVE_WORKOUT_KEY);
      }
    };
    saveWorkout();
  }, [activeWorkout]);

  const startWorkout = (plan: any, day: any) => {
    const totalSets = day.exercises.reduce(
      (sum: number, ex: any) => sum + (ex.prescription?.sets ?? 0),
      0
    );
    
    const workout: ActiveWorkout = {
      plan,
      day,
      startedAt: Date.now(),
      elapsedSeconds: 0,
      completedSets: {},
      isPaused: false,
      totalSets,
    };
    
    setActiveWorkout(workout);
    setIsWorkoutActive(true);
    setShowMiniPlayer(false); // Reset mini-player visibility when starting new workout
    
    if (timerRef.current) clearInterval(timerRef.current as any);
    timerRef.current = setInterval(() => {
      setActiveWorkout(prev => {
        if (!prev || prev.isPaused) return prev;
        const newElapsed = Math.floor((Date.now() - prev.startedAt) / 1000);
        return { ...prev, elapsedSeconds: newElapsed };
      });
    }, 1000);
  };

  const pauseWorkout = () => {
    if (!activeWorkout) return;
    setActiveWorkout(prev => {
      if (!prev) return null;
      return { ...prev, isPaused: true };
    });
  };

  const resumeWorkout = () => {
    if (!activeWorkout) return;
    setActiveWorkout(prev => {
      if (!prev) return null;
      return { 
        ...prev, 
        startedAt: Date.now() - (prev.elapsedSeconds * 1000),
        isPaused: false 
      };
    });
  };

  const cancelWorkout = () => {
    if (timerRef.current) clearInterval(timerRef.current as any);
    setActiveWorkout(null);
    setIsWorkoutActive(false);
    setShowMiniPlayer(false); // Hide mini-player when canceling
    AsyncStorage.removeItem(ACTIVE_WORKOUT_KEY);
    AsyncStorage.removeItem('active_workout_plan');
  };

  const completeSet = (exerciseId: number, setIndex: number) => {
    setActiveWorkout(prev => {
      if (!prev) return null;
      const exerciseKey = String(exerciseId);
      const currentSets = prev.completedSets[exerciseKey] || [];
      const updatedSets = [...currentSets];
      while (updatedSets.length <= setIndex) updatedSets.push(false);
      updatedSets[setIndex] = !updatedSets[setIndex];
      
      return {
        ...prev,
        completedSets: { ...prev.completedSets, [exerciseKey]: updatedSets }
      };
    });
  };

  const updateElapsedTime = (seconds: number) => {
    setActiveWorkout(prev => {
      if (!prev) return null;
      return { ...prev, elapsedSeconds: seconds };
    });
  };

  const finishWorkout = () => {
    if (timerRef.current) clearInterval(timerRef.current as any);
    setActiveWorkout(null);
    setIsWorkoutActive(false);
    setShowMiniPlayer(false); // Hide mini-player when finishing
    AsyncStorage.removeItem(ACTIVE_WORKOUT_KEY);
    AsyncStorage.removeItem('active_workout_plan');
  };

  return (
    <WorkoutContext.Provider
      value={{
        activeWorkout,
        startWorkout,
        pauseWorkout,
        resumeWorkout,
        cancelWorkout,
        completeSet,
        updateElapsedTime,
        finishWorkout,
        isWorkoutActive,
        showMiniPlayer,
        setShowMiniPlayer,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
}