// weekSchedule indexed by JS getDay(): [Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6]
// Cycles start on Monday (index 1), Sunday is rest.
const SPLIT_TYPES = {
  ppl: {
    id: "ppl",
    name: "Push / Pull / Legs",
    shortName: "PPL",
    description: "Classic 6-day split hitting each movement pattern twice per week",
    dayTypes: ["Push", "Pull", "Legs"],
    weekSchedule: ["Rest", "Push", "Pull", "Legs", "Push", "Pull", "Legs"],
    frequency: { beginner: 3, intermediate: 6, advanced: 6 },
  },
  arnold: {
    id: "arnold",
    name: "Arnold Split",
    shortName: "Arnold",
    description: "Chest/Back, Shoulders/Arms, Legs — inspired by the classic Arnold routine",
    dayTypes: ["Chest/Back", "Shoulders/Arms", "Legs"],
    weekSchedule: ["Rest", "Chest/Back", "Shoulders/Arms", "Legs", "Chest/Back", "Shoulders/Arms", "Legs"],
    frequency: { beginner: 3, intermediate: 6, advanced: 6 },
  },
  ppl_arnold: {
    id: "ppl_arnold",
    name: "PPL x Arnold",
    shortName: "PPL×Arnold",
    description: "Push/Pull/Legs first half, Arnold split second half — best of both worlds",
    dayTypes: ["Push", "Pull", "Legs", "Chest/Back", "Shoulders/Arms"],
    weekSchedule: ["Rest", "Push", "Pull", "Legs", "Chest/Back", "Shoulders/Arms", "Legs"],
    frequency: { beginner: 3, intermediate: 6, advanced: 6 },
  },
  bro: {
    id: "bro",
    name: "Bro Split",
    shortName: "Bro",
    description: "One muscle group per day — maximum volume for each body part",
    dayTypes: ["Chest", "Back", "Shoulders", "Arms", "Legs"],
    weekSchedule: ["Rest", "Chest", "Back", "Shoulders", "Arms", "Legs", "Rest"],
    frequency: { beginner: 3, intermediate: 5, advanced: 5 },
  },
  upper_lower: {
    id: "upper_lower",
    name: "Upper / Lower",
    shortName: "U/L",
    description: "Alternate upper and lower body — great balance of frequency and recovery",
    dayTypes: ["Upper", "Lower"],
    weekSchedule: ["Rest", "Upper", "Lower", "Rest", "Upper", "Lower", "Rest"],
    frequency: { beginner: 2, intermediate: 4, advanced: 4 },
  },
  full_body: {
    id: "full_body",
    name: "Full Body",
    shortName: "Full Body",
    description: "Hit every muscle group each session — ideal for beginners or busy schedules",
    dayTypes: ["Full Body"],
    weekSchedule: ["Rest", "Full Body", "Rest", "Full Body", "Rest", "Full Body", "Rest"],
    frequency: { beginner: 3, intermediate: 3, advanced: 4 },
  },
};

const DAY_TYPE_KEYWORDS = {
  Push:             ["chest", "shoulder", "triceps", "pectoral", "deltoid", "pec", "press", "fly", "dip"],
  Pull:             ["back", "biceps", "bicep", "trap", "lats", "latissimus", "lat pulldown", "rhomboid", "rear delt", "row", "pull-up", "pull up", "chin", "curl"],
  Legs:             ["leg", "quad", "hamstring", "glute", "calf", "calves", "thigh", "hip", "squat", "lunge", "deadlift"],
  "Chest/Back":     ["chest", "pectoral", "pec", "bench", "fly", "back", "lats", "lat pulldown", "row", "pull-up", "rhomboid", "trap"],
  "Shoulders/Arms": ["shoulder", "deltoid", "lateral raise", "press", "biceps", "bicep", "triceps", "curl", "extension", "dip"],
  Chest:            ["chest", "pectoral", "pec", "bench", "fly", "incline", "decline"],
  Back:             ["back", "lats", "latissimus", "lat pulldown", "row", "pull-up", "pull up", "rhomboid", "trap", "chin", "deadlift"],
  Shoulders:        ["shoulder", "deltoid", "lateral raise", "overhead", "military", "face pull", "shrug"],
  Arms:             ["biceps", "bicep", "triceps", "curl", "extension", "hammer", "preacher", "dip", "pushdown"],
  Upper:            ["chest", "shoulder", "triceps", "back", "biceps", "bicep", "lats", "pectoral", "deltoid", "trap", "row", "press", "fly"],
  Lower:            ["leg", "quad", "hamstring", "glute", "calf", "calves", "thigh", "hip", "squat", "lunge", "deadlift"],
  "Full Body":      ["chest", "back", "shoulder", "leg", "quad", "hamstring", "glute", "biceps", "triceps", "squat", "press", "row"],
};

// ─── Strict per-muscle-group keywords ──────────────────────────────
const MUSCLE_GROUP_KEYWORDS = {
  chest:       ["chest", "pectoral", "pec", "bench press", "dumbbell fly", "cable fly", "chest fly", "pec fly", "incline fly", "decline fly", "incline press", "decline press", "push-up", "push up", "dumbbell press", "chest press", "incline dumbbell", "floor press"],
  back:        ["back", "lats", "latissimus", "lat pulldown", "row", "pull-up", "pull up", "rhomboid", "trap", "chin-up", "chin up", "pulldown", "pull down", "t-bar", "reverse fly"],
  shoulder:    ["shoulder", "deltoid", "lateral raise", "overhead press", "military press", "face pull", "shrug", "front raise", "rear delt", "arnold press", "upright row"],
  triceps:     ["triceps", "tricep", "pushdown", "skull crusher", "dip", "tricep extension", "close grip", "kickback", "overhead extension"],
  biceps:      ["biceps", "bicep", "curl", "hammer curl", "preacher", "concentration curl", "barbell curl", "ez curl"],
  quads:       ["quad", "squat", "leg press", "leg extension", "lunge", "front squat", "hack squat", "goblet squat", "split squat", "step up"],
  hamstrings:  ["hamstring", "leg curl", "romanian deadlift", "stiff leg", "good morning", "nordic curl", "lying curl"],
  glutes:      ["glute", "hip thrust", "glute bridge", "kickback", "cable pull-through"],
  calves:      ["calf", "calves", "calf raise", "seated calf", "standing calf"],
  chest_press:   ["bench press", "dumbbell press", "incline press", "incline dumbbell", "chest press", "floor press", "low incline"],
  squat_move:    ["squat", "goblet squat", "front squat", "leg press", "hack squat", "split squat"],
  vertical_pull: ["pull-up", "pull up", "chin-up", "chin up", "lat pulldown", "pulldown", "pull down"],
  hip_hinge:     ["deadlift", "romanian deadlift", "hip hinge", "good morning", "kettlebell swing", "stiff leg"],
  row_move:      ["cable row", "barbell row", "dumbbell row", "t-bar row", "seated row", "bent over row", "pendlay row"],
  shoulder_iso:  ["lateral raise", "front raise", "face pull", "rear delt fly", "shoulder fly", "upright row", "rear delt"],
};

// Exercises matching a group but also matching any of its exclusion keywords are rejected.
// Prevents mixed movements (e.g. "Push-Up to Row" on Chest day, "Reverse Fly" on Chest day).
const MUSCLE_GROUP_EXCLUSIONS = {
  chest:    ["reverse fly", "rear delt", "row", "pull-up", "pull up", "pulldown", "chin-up", "chin up", "lat pulldown", "t-bar"],
  back:     ["bench press", "chest press", "dumbbell press", "incline press", "decline press", "chest fly", "push-up", "push up", "pectoral"],
  shoulder: ["bench press", "chest press", "lat pulldown", "chest fly"],
  triceps:  ["bicep curl", "hammer curl", "preacher curl", "concentration curl"],
  biceps:   ["pushdown", "tricep extension", "skull crusher"],
};

// ─── Strict exercise distribution per day type ────────────────────
// Each entry: { group: key in MUSCLE_GROUP_KEYWORDS, count: base count (Gain Muscle / full volume) }
const DAY_EXERCISE_DISTRIBUTION = {
  // PPL
  Push: [
    { group: "chest",    count: 3 },
    { group: "shoulder", count: 2 },
    { group: "triceps",  count: 1 },
  ],
  Pull: [
    { group: "back",   count: 4 },
    { group: "biceps", count: 2 },
  ],
  // Legs — shared by PPL, Arnold, Bro, Lower
  Legs: [
    { group: "quads",      count: 2 },
    { group: "hamstrings", count: 2 },
    { group: "glutes",     count: 1 },
    { group: "calves",     count: 1 },
  ],
  // Arnold
  "Chest/Back": [
    { group: "chest", count: 3 },
    { group: "back",  count: 3 },
  ],
  "Shoulders/Arms": [
    { group: "shoulder", count: 4 },
    { group: "triceps",  count: 2 },
    { group: "biceps",   count: 2 },
  ],
  // Bro Split
  Chest: [
    { group: "chest", count: 6 },
  ],
  Back: [
    { group: "back", count: 6 },
  ],
  Shoulders: [
    { group: "shoulder", count: 6 },
  ],
  Arms: [
    { group: "biceps",  count: 3 },
    { group: "triceps", count: 3 },
  ],
  // Upper / Lower
  Upper: [
    { group: "chest",   count: 2 },
    { group: "back",    count: 2 },
    { group: "triceps", count: 1 },
    { group: "biceps",  count: 1 },
  ],
  Lower: [
    { group: "quads",      count: 2 },
    { group: "hamstrings", count: 2 },
    { group: "glutes",     count: 1 },
    { group: "calves",     count: 1 },
  ],
  // Full Body — movement-pattern based
  "Full Body": [
    { group: "chest_press",   count: 1 },
    { group: "squat_move",    count: 1 },
    { group: "vertical_pull", count: 1 },
    { group: "hip_hinge",     count: 1 },
    { group: "row_move",      count: 1 },
    { group: "shoulder_iso",  count: 1 },
  ],
};

const DAY_TYPE_FOCUS = {
  Push:             { title: "Push Day",           muscleGroups: ["Chest", "Shoulders", "Triceps"],                      tip: "Focus on compound presses first, then isolation for triceps." },
  Pull:             { title: "Pull Day",           muscleGroups: ["Back", "Biceps", "Rear Delts"],                       tip: "Start with rows and pull-ups, then biceps and rear delt work." },
  Legs:             { title: "Leg Day",            muscleGroups: ["Quads", "Hamstrings", "Glutes", "Calves"],            tip: "Squats and hinges first, then isolation and calves." },
  "Chest/Back":     { title: "Chest & Back Day",   muscleGroups: ["Chest", "Back", "Lats"],                             tip: "Superset chest presses with rows for an efficient pump." },
  "Shoulders/Arms": { title: "Shoulders & Arms",   muscleGroups: ["Shoulders", "Biceps", "Triceps"],                    tip: "Hit overhead presses first, then supersets of curls and extensions." },
  Chest:            { title: "Chest Day",          muscleGroups: ["Chest", "Front Delts"],                               tip: "Flat, incline, and decline presses, then flyes for the stretch." },
  Back:             { title: "Back Day",           muscleGroups: ["Lats", "Traps", "Rhomboids", "Rear Delts"],           tip: "Pull-ups, rows, then isolation — squeeze every rep." },
  Shoulders:        { title: "Shoulder Day",       muscleGroups: ["Front Delts", "Side Delts", "Rear Delts"],            tip: "Overhead presses then lateral raises. Don't neglect rear delts." },
  Arms:             { title: "Arms Day",           muscleGroups: ["Biceps", "Triceps", "Forearms"],                      tip: "Superset curls with extensions for maximum pump." },
  Upper:            { title: "Upper Body Day",     muscleGroups: ["Chest", "Back", "Shoulders", "Biceps", "Triceps"],    tip: "Compound lifts: bench, rows, overhead press, then accessories." },
  Lower:            { title: "Lower Body Day",     muscleGroups: ["Quads", "Hamstrings", "Glutes", "Calves"],            tip: "Squats and deadlifts first, then isolation and calves." },
  "Full Body":      { title: "Full Body Day",      muscleGroups: ["Chest", "Back", "Legs", "Shoulders", "Arms"],         tip: "One compound per muscle group: squat, bench, row, press, pull-up." },
  Rest:             { title: "Rest Day",           muscleGroups: [],                                                      tip: "Rest or light activity: walk, stretch, or yoga." },
};

// ─── Goal definitions ──────────────────────────────────────────────
const GOAL_TYPES = {
  lose_weight: {
    id: "lose_weight",
    name: "Lose Weight",
    shortName: "Fat Loss",
    description: "Burn fat with a mix of strength, cardio, and core work",
    icon: "fire",
    strengthCount: 4,
    cardioCount: 1,
    coreCount: 1,
    prescription: {
      beginner:     { sets: 3, reps: 12, restSeconds: 45, durationSeconds: 40 },
      intermediate: { sets: 3, reps: 15, restSeconds: 40, durationSeconds: 45 },
      advanced:     { sets: 4, reps: 15, restSeconds: 30, durationSeconds: 50 },
    },
    estimatedMinutes: { beginner: 40, intermediate: 45, advanced: 50 },
  },
  gain_muscle: {
    id: "gain_muscle",
    name: "Gain Muscle",
    shortName: "Hypertrophy",
    description: "Maximize muscle growth with focused hypertrophy training",
    icon: "arm-flex",
    strengthCount: 6,
    cardioCount: 0,
    coreCount: 0,
    prescription: {
      beginner:     { sets: 3, reps: 10, restSeconds: 90,  durationSeconds: 50 },
      intermediate: { sets: 4, reps: 8,  restSeconds: 90,  durationSeconds: 55 },
      advanced:     { sets: 5, reps: 6,  restSeconds: 120, durationSeconds: 60 },
    },
    estimatedMinutes: { beginner: 45, intermediate: 55, advanced: 65 },
  },
  endurance: {
    id: "endurance",
    name: "Endurance",
    shortName: "Endurance",
    description: "Build stamina with high reps, light weight, and cardio",
    icon: "run-fast",
    strengthCount: 4,
    cardioCount: 1,
    coreCount: 0,
    prescription: {
      beginner:     { sets: 3, reps: 15, restSeconds: 30, durationSeconds: 45 },
      intermediate: { sets: 3, reps: 18, restSeconds: 30, durationSeconds: 50 },
      advanced:     { sets: 4, reps: 20, restSeconds: 25, durationSeconds: 55 },
    },
    estimatedMinutes: { beginner: 35, intermediate: 40, advanced: 50 },
  },
  hybrid: {
    id: "hybrid",
    name: "Hybrid Training",
    shortName: "Hybrid",
    description: "Balanced mix of strength and cardio for all-round fitness",
    icon: "sync",
    strengthCount: 4,
    cardioCount: 1,
    coreCount: 1,
    prescription: {
      beginner:     { sets: 3, reps: 12, restSeconds: 60, durationSeconds: 45 },
      intermediate: { sets: 4, reps: 10, restSeconds: 60, durationSeconds: 50 },
      advanced:     { sets: 4, reps: 12, restSeconds: 50, durationSeconds: 55 },
    },
    estimatedMinutes: { beginner: 40, intermediate: 50, advanced: 55 },
  },
};

const CARDIO_KEYWORDS = [
  "cardio", "running", "cycling", "hiit", "jump", "burpee", "rowing",
  "elliptical", "treadmill", "sprint", "jumping jack", "mountain climber",
  "skipping", "rope", "box jump", "high knees", "battle rope",
];

const CORE_KEYWORDS = [
  "core", "abs", "abdominal", "plank", "crunch", "sit-up", "sit up",
  "oblique", "russian twist", "leg raise", "dead bug", "hollow", "v-up",
  "wood chop", "pallof", "ab wheel", "cable crunch",
];

function isCardio(exerciseRow) {
  const str = [exerciseRow.target_muscles, exerciseRow.category, exerciseRow.name]
    .filter(Boolean).join(" ").toLowerCase();
  return CARDIO_KEYWORDS.some((k) => str.includes(k));
}

function isCore(exerciseRow) {
  const str = [exerciseRow.target_muscles, exerciseRow.category, exerciseRow.name]
    .filter(Boolean).join(" ").toLowerCase();
  return CORE_KEYWORDS.some((k) => str.includes(k));
}

function matchesDayType(exerciseRow, dayType) {
  const keywords = DAY_TYPE_KEYWORDS[dayType];
  if (!keywords) return false;
  const str = [exerciseRow.target_muscles, exerciseRow.category, exerciseRow.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return keywords.some((k) => str.includes(k));
}

function matchesMuscleGroup(exerciseRow, group) {
  const keywords = MUSCLE_GROUP_KEYWORDS[group];
  if (!keywords) return false;
  const str = [exerciseRow.target_muscles, exerciseRow.category, exerciseRow.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (!keywords.some((k) => str.includes(k))) return false;
  const exclusions = MUSCLE_GROUP_EXCLUSIONS[group];
  if (exclusions && exclusions.some((k) => str.includes(k))) return false;
  return true;
}

function getGoalDefinition(goalId) {
  return GOAL_TYPES[goalId] || null;
}

function getGoalPrescription(goalId, fitnessLevel) {
  const goal = GOAL_TYPES[goalId];
  if (!goal) return null;
  const level = (fitnessLevel || "intermediate").toLowerCase();
  return goal.prescription[level] || goal.prescription.intermediate;
}

function getAllGoalTypes() {
  return Object.values(GOAL_TYPES);
}

function pickRandom(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Proportionally scale a distribution array down to `targetCount` total exercises,
 * keeping at least 1 per group.
 */
function scaleDistribution(distribution, targetCount) {
  const totalFull = distribution.reduce((s, d) => s + d.count, 0);
  if (totalFull <= targetCount) return distribution.map((d) => ({ ...d }));

  const ratio = targetCount / totalFull;
  const scaled = distribution.map((d) => ({
    ...d,
    count: Math.max(1, Math.round(d.count * ratio)),
  }));

  let total = scaled.reduce((s, d) => s + d.count, 0);

  while (total > targetCount) {
    const maxIdx = scaled.reduce((best, d, i) => (d.count > scaled[best].count ? i : best), 0);
    if (scaled[maxIdx].count > 1) { scaled[maxIdx].count--; total--; }
    else break;
  }
  while (total < targetCount) {
    const maxOrigIdx = distribution.reduce((best, d, i) => (d.count > distribution[best].count ? i : best), 0);
    scaled[maxOrigIdx].count++;
    total++;
  }

  return scaled;
}

/**
 * Build a day's exercise list with strict per-muscle-group distribution,
 * then apply goal-based adjustments (cardio, core, prescription).
 *
 * 1. Look up DAY_EXERCISE_DISTRIBUTION for the dayType.
 * 2. For lose_weight → scale strength slots to 4, add 1 cardio + 1 core.
 *    For gain_muscle → keep full distribution as-is.
 *    For endurance   → keep full distribution, add 1 cardio.
 *    For hybrid      → keep full distribution, add 1 cardio + 1 core.
 * 3. Pick exercises per slot from the DB, avoiding duplicates.
 * 4. Return { exercises, prescription, estimatedMinutes }.
 */
function buildDayExercises(allRows, dayType, goalId, fitnessLevel) {
  const goal = GOAL_TYPES[goalId];
  const level = (fitnessLevel || "intermediate").toLowerCase();

  const fallbackRx = {
    beginner:     { sets: 3, reps: 10, restSeconds: 75, durationSeconds: 45 },
    intermediate: { sets: 4, reps: 8,  restSeconds: 90, durationSeconds: 50 },
    advanced:     { sets: 5, reps: 5,  restSeconds: 120, durationSeconds: 60 },
  };

  const baseDist = DAY_EXERCISE_DISTRIBUTION[dayType];

  if (!baseDist) {
    const rx = goal
      ? (goal.prescription[level] || goal.prescription.intermediate)
      : (fallbackRx[level] || fallbackRx.intermediate);
    const matched = allRows.filter((r) => matchesDayType(r, dayType));
    return {
      exercises: pickRandom(matched.length >= 6 ? matched : allRows, 6),
      prescription: rx,
      estimatedMinutes: goal ? (goal.estimatedMinutes[level] || 50) : 50,
    };
  }

  let strengthTarget = null;
  let addCardio = 0;
  let addCore = 0;

  switch (goalId) {
    case "lose_weight":
      strengthTarget = 4;
      addCardio = 1;
      addCore = 1;
      break;
    case "gain_muscle":
      break;
    case "endurance":
      addCardio = 1;
      break;
    case "hybrid":
      addCardio = 1;
      addCore = 1;
      break;
  }

  const activeDist = strengthTarget !== null
    ? scaleDistribution(baseDist, strengthTarget)
    : baseDist.map((d) => ({ ...d }));

  const usedIds = new Set();
  const chosen = [];

  for (const { group, count } of activeDist) {
    const pool = allRows.filter((r) => matchesMuscleGroup(r, group) && !usedIds.has(r.exercise_id));

    let picks;
    if (pool.length >= count) {
      picks = pickRandom(pool, count);
    } else {
      picks = [...pool];
      if (picks.length < count) {
        const broader = allRows.filter(
          (r) => matchesDayType(r, dayType) && !usedIds.has(r.exercise_id) && !pool.includes(r)
        );
        picks = picks.concat(pickRandom(broader, count - picks.length));
      }
    }

    picks.forEach((e) => { usedIds.add(e.exercise_id); chosen.push(e); });
  }

  if (addCardio > 0) {
    const pool = allRows.filter((r) => isCardio(r) && !usedIds.has(r.exercise_id));
    const picks = pickRandom(pool.length > 0 ? pool : allRows.filter((r) => isCardio(r)), addCardio);
    picks.forEach((e) => { usedIds.add(e.exercise_id); chosen.push(e); });
  }

  if (addCore > 0) {
    const pool = allRows.filter((r) => isCore(r) && !usedIds.has(r.exercise_id));
    const picks = pickRandom(pool.length > 0 ? pool : allRows.filter((r) => isCore(r)), addCore);
    picks.forEach((e) => { usedIds.add(e.exercise_id); chosen.push(e); });
  }

  const rx = goal
    ? (goal.prescription[level] || goal.prescription.intermediate)
    : (fallbackRx[level] || fallbackRx.intermediate);

  const estMin = goal
    ? (goal.estimatedMinutes[level] || goal.estimatedMinutes.intermediate)
    : 50;

  return { exercises: chosen, prescription: rx, estimatedMinutes: estMin };
}

function getWeekSchedule(splitId, fitnessLevel) {
  const split = SPLIT_TYPES[splitId];
  if (!split) return SPLIT_TYPES.ppl.weekSchedule;

  const level = (fitnessLevel || "intermediate").toLowerCase();
  const maxDays = split.frequency[level] ?? split.frequency.intermediate;

  let schedule = [...split.weekSchedule];
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

function getSplitDefinition(splitId) {
  return SPLIT_TYPES[splitId] || SPLIT_TYPES.ppl;
}

function getAllSplitTypes() {
  return Object.values(SPLIT_TYPES);
}

module.exports = {
  SPLIT_TYPES,
  DAY_TYPE_KEYWORDS,
  DAY_TYPE_FOCUS,
  MUSCLE_GROUP_KEYWORDS,
  DAY_EXERCISE_DISTRIBUTION,
  GOAL_TYPES,
  CARDIO_KEYWORDS,
  CORE_KEYWORDS,
  matchesDayType,
  matchesMuscleGroup,
  isCardio,
  isCore,
  getWeekSchedule,
  getSplitDefinition,
  getAllSplitTypes,
  getGoalDefinition,
  getGoalPrescription,
  getAllGoalTypes,
  buildDayExercises,
};
