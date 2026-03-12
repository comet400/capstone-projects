/**
 * Push / Pull / Legs weekly split.
 * Sunday = Rest day; cycle restarts after Sunday.
 * Mon=Push, Tue=Pull, Wed=Legs, Thu=Push, Fri=Pull, Sat=Legs, Sun=Rest
 */
export type PPLDayType = "Push" | "Pull" | "Legs" | "Rest";

const WEEKDAY_ORDER: PPLDayType[] = [
  "Rest",  // 0 Sunday
  "Push",  // 1 Monday
  "Pull",  // 2 Tuesday
  "Legs",  // 3 Wednesday
  "Push",  // 4 Thursday
  "Pull",  // 5 Friday
  "Legs",  // 6 Saturday
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function getDayType(date: Date): PPLDayType {
  const weekday = date.getDay();
  return WEEKDAY_ORDER[weekday];
}

export function getDayName(date: Date): string {
  return DAY_NAMES[date.getDay()];
}

export type WeekDayEntry = {
  dayName: string;
  date: Date;
  type: PPLDayType;
  isToday: boolean;
  isTomorrow: boolean;
};

/** Returns the current week Sun–Sat with types. */
export function getWeekSchedule(anchorDate: Date): WeekDayEntry[] {
  const result: WeekDayEntry[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (let d = 0; d < 7; d++) {
    const date = new Date(anchorDate);
    date.setDate(anchorDate.getDate() - anchorDate.getDay() + d);
    date.setHours(0, 0, 0, 0);
    result.push({
      dayName: getDayName(date),
      date,
      type: getDayType(date),
      isToday: date.getTime() === today.getTime(),
      isTomorrow: date.getTime() === tomorrow.getTime(),
    });
  }
  return result;
}

export type DayFocusInfo = {
  type: PPLDayType;
  title: string;
  subtitle: string;
  muscleGroups: string[];
  tip: string;
};

export function getDayFocus(date: Date): DayFocusInfo {
  const type = getDayType(date);
  const dayName = getDayName(date);

  switch (type) {
    case "Push":
      return {
        type: "Push",
        title: "Push Day",
        subtitle: `${dayName} · Chest, Shoulders & Triceps`,
        muscleGroups: ["Chest", "Shoulders", "Triceps"],
        tip: "Focus on compound presses (bench, overhead) then isolation for triceps.",
      };
    case "Pull":
      return {
        type: "Pull",
        title: "Pull Day",
        subtitle: `${dayName} · Back & Biceps`,
        muscleGroups: ["Back", "Biceps", "Rear Delts"],
        tip: "Start with rows and pull-ups, then biceps and rear delt work.",
      };
    case "Legs":
      return {
        type: "Legs",
        title: "Leg Day",
        subtitle: `${dayName} · Lower Body`,
        muscleGroups: ["Quads", "Hamstrings", "Glutes", "Calves"],
        tip: "Squats and hinges first, then isolation and calves.",
      };
    case "Rest":
      return {
        type: "Rest",
        title: "Rest Day",
        subtitle: `${dayName} · Recovery`,
        muscleGroups: [],
        tip: "Rest or light activity: walk, stretch, or yoga. The cycle restarts tomorrow with Push.",
      };
  }
}
