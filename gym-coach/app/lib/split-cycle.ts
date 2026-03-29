export type SplitId =
  | "ppl"
  | "arnold"
  | "ppl_arnold"
  | "bro"
  | "upper_lower"
  | "full_body";

export type DayType =
  | "Push"
  | "Pull"
  | "Legs"
  | "Chest/Back"
  | "Shoulders/Arms"
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Arms"
  | "Upper"
  | "Lower"
  | "Full Body"
  | "Rest";

export interface SplitDefinition {
  id: SplitId;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  dayTypes: DayType[];
  weekSchedule: DayType[];
  frequency: { beginner: number; intermediate: number; advanced: number };
}

// weekSchedule is indexed by Date.getDay(): [Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6]
// Cycles start on Monday (index 1), Sunday is rest.
export const SPLIT_DEFINITIONS: Record<SplitId, SplitDefinition> = {
  ppl: {
    id: "ppl",
    name: "Push / Pull / Legs",
    shortName: "PPL",
    description: "Classic 6-day split hitting each movement pattern twice per week",
    icon: "dumbbell",
    dayTypes: ["Push", "Pull", "Legs"],
    weekSchedule: ["Rest", "Push", "Pull", "Legs", "Push", "Pull", "Legs"],
    frequency: { beginner: 3, intermediate: 6, advanced: 6 },
  },
  arnold: {
    id: "arnold",
    name: "Arnold Split",
    shortName: "Arnold",
    description: "Chest/Back, Shoulders/Arms, Legs — the classic Arnold routine",
    icon: "arm-flex",
    dayTypes: ["Chest/Back", "Shoulders/Arms", "Legs"],
    weekSchedule: ["Rest", "Chest/Back", "Shoulders/Arms", "Legs", "Chest/Back", "Shoulders/Arms", "Legs"],
    frequency: { beginner: 3, intermediate: 6, advanced: 6 },
  },
  ppl_arnold: {
    id: "ppl_arnold",
    name: "PPL x Arnold",
    shortName: "PPL×Arnold",
    description: "Push/Pull/Legs first half, Arnold split second half — best of both",
    icon: "swap-horizontal",
    dayTypes: ["Push", "Pull", "Legs", "Chest/Back", "Shoulders/Arms"],
    weekSchedule: ["Rest", "Push", "Pull", "Legs", "Chest/Back", "Shoulders/Arms", "Legs"],
    frequency: { beginner: 3, intermediate: 6, advanced: 6 },
  },
  bro: {
    id: "bro",
    name: "Bro Split",
    shortName: "Bro",
    description: "One muscle group per day — maximum volume for each body part",
    icon: "weight-lifter",
    dayTypes: ["Chest", "Back", "Shoulders", "Arms", "Legs"],
    weekSchedule: ["Rest", "Chest", "Back", "Shoulders", "Arms", "Legs", "Rest"],
    frequency: { beginner: 3, intermediate: 5, advanced: 5 },
  },
  upper_lower: {
    id: "upper_lower",
    name: "Upper / Lower",
    shortName: "U/L",
    description: "Alternate upper and lower body — great balance of frequency and recovery",
    icon: "human",
    dayTypes: ["Upper", "Lower"],
    weekSchedule: ["Rest", "Upper", "Lower", "Rest", "Upper", "Lower", "Rest"],
    frequency: { beginner: 2, intermediate: 4, advanced: 4 },
  },
  full_body: {
    id: "full_body",
    name: "Full Body",
    shortName: "Full Body",
    description: "Hit every muscle each session — ideal for beginners or busy schedules",
    icon: "run",
    dayTypes: ["Full Body"],
    weekSchedule: ["Rest", "Full Body", "Rest", "Full Body", "Rest", "Full Body", "Rest"],
    frequency: { beginner: 3, intermediate: 3, advanced: 4 },
  },
};

export const DAY_COLORS: Record<string, string> = {
  Push:              "#EF4444",
  Pull:              "#3B82F6",
  Legs:              "#10B981",
  "Chest/Back":      "#F59E0B",
  "Shoulders/Arms":  "#8B5CF6",
  Chest:             "#EF4444",
  Back:              "#3B82F6",
  Shoulders:         "#F59E0B",
  Arms:              "#8B5CF6",
  Upper:             "#6366F1",
  Lower:             "#10B981",
  "Full Body":       "#EC4899",
  Rest:              "#9CA3AF",
};

export interface DayFocusInfo {
  type: DayType;
  title: string;
  subtitle: string;
  muscleGroups: string[];
  tip: string;
}

const DAY_TYPE_FOCUS: Record<string, Omit<DayFocusInfo, "type" | "subtitle">> = {
  Push:              { title: "Push Day",          muscleGroups: ["Chest", "Shoulders", "Triceps"],                   tip: "Focus on compound presses first, then isolation for triceps." },
  Pull:              { title: "Pull Day",          muscleGroups: ["Back", "Biceps", "Rear Delts"],                    tip: "Start with rows and pull-ups, then biceps and rear delt work." },
  Legs:              { title: "Leg Day",           muscleGroups: ["Quads", "Hamstrings", "Glutes", "Calves"],         tip: "Squats and hinges first, then isolation and calves." },
  "Chest/Back":      { title: "Chest & Back Day",  muscleGroups: ["Chest", "Back", "Lats"],                          tip: "Superset chest presses with rows for an efficient pump." },
  "Shoulders/Arms":  { title: "Shoulders & Arms",  muscleGroups: ["Shoulders", "Biceps", "Triceps"],                 tip: "Hit overhead presses first, then supersets of curls and extensions." },
  Chest:             { title: "Chest Day",         muscleGroups: ["Chest", "Front Delts"],                            tip: "Flat, incline, and decline presses, then flyes for the stretch." },
  Back:              { title: "Back Day",          muscleGroups: ["Lats", "Traps", "Rhomboids", "Rear Delts"],        tip: "Pull-ups, rows, then isolation — squeeze every rep." },
  Shoulders:         { title: "Shoulder Day",      muscleGroups: ["Front Delts", "Side Delts", "Rear Delts"],         tip: "Overhead presses then lateral raises. Don't neglect rear delts." },
  Arms:              { title: "Arms Day",          muscleGroups: ["Biceps", "Triceps", "Forearms"],                   tip: "Superset curls with extensions for maximum pump." },
  Upper:             { title: "Upper Body Day",    muscleGroups: ["Chest", "Back", "Shoulders", "Biceps", "Triceps"], tip: "Compound lifts: bench, rows, overhead press, then accessories." },
  Lower:             { title: "Lower Body Day",    muscleGroups: ["Quads", "Hamstrings", "Glutes", "Calves"],         tip: "Squats and deadlifts first, then isolation and calves." },
  "Full Body":       { title: "Full Body Day",     muscleGroups: ["Chest", "Back", "Legs", "Shoulders", "Arms"],      tip: "One compound per muscle group: squat, bench, row, press, pull-up." },
  Rest:              { title: "Rest Day",          muscleGroups: [],                                                   tip: "Rest or light activity: walk, stretch, or yoga." },
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function getWeekSchedule(splitId: SplitId, fitnessLevel?: string): DayType[] {
  const split = SPLIT_DEFINITIONS[splitId];
  if (!split) return SPLIT_DEFINITIONS.ppl.weekSchedule;

  const level = (fitnessLevel || "intermediate").toLowerCase();
  const maxDays = (split.frequency as any)[level] ?? split.frequency.intermediate;

  const schedule = [...split.weekSchedule];
  let activeDays = schedule.filter((d) => d !== "Rest").length;

  if (activeDays > maxDays) {
    let reduced = 0;
    for (let i = schedule.length - 1; i >= 0 && reduced < activeDays - maxDays; i--) {
      if (schedule[i] !== "Rest") {
        schedule[i] = "Rest";
        reduced++;
      }
    }
  }

  return schedule;
}

export function getDayType(date: Date, splitId: SplitId = "ppl", fitnessLevel?: string): DayType {
  const schedule = getWeekSchedule(splitId, fitnessLevel);
  const weekday = date.getDay();
  return schedule[weekday];
}

export function getDayName(date: Date): string {
  return DAY_NAMES[date.getDay()];
}

export function getDayFocus(date: Date, splitId: SplitId = "ppl", fitnessLevel?: string): DayFocusInfo {
  const type = getDayType(date, splitId, fitnessLevel);
  const dayName = getDayName(date);
  const focus = DAY_TYPE_FOCUS[type] || DAY_TYPE_FOCUS.Rest;

  return {
    type,
    title: focus.title,
    subtitle: `${dayName} · ${focus.muscleGroups.length > 0 ? focus.muscleGroups.join(", ") : "Recovery"}`,
    muscleGroups: focus.muscleGroups,
    tip: focus.tip,
  };
}

export type WeekDayEntry = {
  dayName: string;
  date: Date;
  type: DayType;
  isToday: boolean;
  isTomorrow: boolean;
};

/** Returns Mon–Sun week entries. */
export function getWeekEntries(anchorDate: Date, splitId: SplitId = "ppl", fitnessLevel?: string): WeekDayEntry[] {
  const result: WeekDayEntry[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const schedule = getWeekSchedule(splitId, fitnessLevel);

  const anchorDay = anchorDate.getDay();
  const mondayOffset = anchorDay === 0 ? -6 : 1 - anchorDay;

  for (let d = 0; d < 7; d++) {
    const date = new Date(anchorDate);
    date.setDate(anchorDate.getDate() + mondayOffset + d);
    date.setHours(0, 0, 0, 0);
    const weekday = date.getDay();
    result.push({
      dayName: getDayName(date),
      date,
      type: schedule[weekday],
      isToday: date.getTime() === today.getTime(),
      isTomorrow: date.getTime() === tomorrow.getTime(),
    });
  }
  return result;
}

export function getSplitDefinition(splitId: SplitId): SplitDefinition {
  return SPLIT_DEFINITIONS[splitId] || SPLIT_DEFINITIONS.ppl;
}

export function getAllSplits(): SplitDefinition[] {
  return Object.values(SPLIT_DEFINITIONS);
}

// ─── Goal definitions ──────────────────────────────────────────────
export type GoalId = "lose_weight" | "gain_muscle" | "endurance" | "hybrid";

export interface GoalDefinition {
  id: GoalId;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  strengthLabel: string;
  cardioCount: number;
  coreCount: number;
  repRange: string;
  restLabel: string;
  estimatedMinutes: { beginner: number; intermediate: number; advanced: number };
}

export const GOAL_DEFINITIONS: Record<GoalId, GoalDefinition> = {
  lose_weight: {
    id: "lose_weight",
    name: "Lose Weight",
    shortName: "Fat Loss",
    description: "4 strength exercises (split-based) + cardio & core for fat burn",
    icon: "fire",
    strengthLabel: "4 from split",
    cardioCount: 1,
    coreCount: 1,
    repRange: "10–15 reps",
    restLabel: "Short rest (30–45s)",
    estimatedMinutes: { beginner: 40, intermediate: 45, advanced: 50 },
  },
  gain_muscle: {
    id: "gain_muscle",
    name: "Gain Muscle",
    shortName: "Hypertrophy",
    description: "Full volume from your split — strict muscle-group targeting",
    icon: "arm-flex",
    strengthLabel: "Full split volume",
    cardioCount: 0,
    coreCount: 0,
    repRange: "6–12 reps",
    restLabel: "Long rest (90–120s)",
    estimatedMinutes: { beginner: 45, intermediate: 55, advanced: 65 },
  },
  endurance: {
    id: "endurance",
    name: "Endurance",
    shortName: "Endurance",
    description: "Full split structure with high reps + cardio for stamina",
    icon: "run-fast",
    strengthLabel: "Full split volume",
    cardioCount: 1,
    coreCount: 0,
    repRange: "15–20 reps",
    restLabel: "Short rest (25–30s)",
    estimatedMinutes: { beginner: 35, intermediate: 40, advanced: 50 },
  },
  hybrid: {
    id: "hybrid",
    name: "Hybrid Training",
    shortName: "Hybrid",
    description: "Full split structure + cardio & core for balanced fitness",
    icon: "sync",
    strengthLabel: "Full split volume",
    cardioCount: 1,
    coreCount: 1,
    repRange: "8–15 reps",
    restLabel: "Moderate rest (50–60s)",
    estimatedMinutes: { beginner: 40, intermediate: 50, advanced: 55 },
  },
};

export const GOAL_COLORS: Record<GoalId, string> = {
  lose_weight:  "#EF4444",
  gain_muscle:  "#8B5CF6",
  endurance:    "#10B981",
  hybrid:       "#F59E0B",
};

export function getGoalDefinition(goalId: GoalId): GoalDefinition {
  return GOAL_DEFINITIONS[goalId] || GOAL_DEFINITIONS.gain_muscle;
}

export function getAllGoals(): GoalDefinition[] {
  return Object.values(GOAL_DEFINITIONS);
}
