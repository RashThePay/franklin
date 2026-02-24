import type { TaskResult, PassageDistance } from './types';

export function getTaskResult(assignedCount: number, requiredCount: number): TaskResult {
  if (assignedCount >= requiredCount) return 'FULL';
  if (assignedCount > requiredCount / 2) return 'PARTIAL';
  return 'FAILED';
}

export function calculateShipMovement(
  direction: 'NORTH' | 'SOUTH',
  navResult: TaskResult,
  iceResult: TaskResult,
  navAssigned: number,
  navRequired: number,
  illCrewInNav: number,
  pessimisticInNav: number
): { miles: number; damage: number; iceSuccess: boolean } {
  let miles = 0;
  let damage = 0;
  let iceSuccess = true;

  if (direction === 'NORTH') {
    if (iceResult === 'FULL') {
      damage = 10;
    } else if (iceResult === 'PARTIAL') {
      damage = 30;
      iceSuccess = false;
    } else {
      damage = 50;
      iceSuccess = false;
      return { miles: 0, damage, iceSuccess };
    }

    if (navResult === 'FULL') {
      miles = 10 + (navAssigned - navRequired);
      if (miles > 15) miles = 15;
    } else if (navResult === 'PARTIAL') {
      miles = 3 + (navAssigned - Math.ceil(navRequired / 2));
      if (miles > 5) miles = 5;
    }

    if (!iceSuccess) {
        miles = Math.floor(miles / 2);
    }

    miles -= illCrewInNav * 2;
    miles -= Math.floor(pessimisticInNav / 2);

    if (miles < 0) miles = 0;

  } else {
    damage = 10;
    if (navResult === 'FULL') {
      miles = 10 + (navAssigned - navRequired);
      if (miles > 15) miles = 15;
    } else if (navResult === 'PARTIAL') {
      miles = 3 + (navAssigned - Math.ceil(navRequired / 2));
      if (miles > 5) miles = 5;
    }

    miles -= illCrewInNav * 2;
    if (miles < 0) miles = 0;

    miles = -miles;
  }

  return { miles, damage, iceSuccess: direction === 'NORTH' ? (iceResult === 'FULL') : true };
}

export function calculateRepair(
    repairResult: TaskResult,
    assignedCount: number,
    requiredCount: number,
    illCrewCount: number
): number {
    let repairAmount = 0;
    if (repairResult === 'FULL') {
        repairAmount = 25 + (assignedCount - requiredCount) * 5;
    } else if (repairResult === 'PARTIAL') {
        repairAmount = 5;
    }

    repairAmount -= illCrewCount * 2;
    return Math.max(0, repairAmount);
}

export function calculateLogistics(
    logisticsResult: TaskResult,
    totalCrew: number
): { provisionLoss: number; healthChange: number; moraleChange: number } {
    if (logisticsResult === 'FULL') {
        return { provisionLoss: totalCrew * 7, healthChange: 0, moraleChange: 0 };
    } else if (logisticsResult === 'PARTIAL') {
        return { provisionLoss: totalCrew * 4, healthChange: -0.2, moraleChange: -0.2 };
    } else {
        return { provisionLoss: totalCrew * 2, healthChange: -0.5, moraleChange: -0.5 };
    }
}

export const PASSAGE_SIGNS = [
    { text: "جریان آب مداوم رو به شمال", distance: 60, fp: 0.1, fn: 0.4 },
    { text: "آب عمیق و تیره در شمال", distance: 45, fp: 0.3, fn: 0.3 },
    { text: "انعکاس آب‌های اقیانوسی در افق شمالی", distance: 30, fp: 0.1, fn: 0.3 },
    { text: "پرواز پرندگان مهاجر به شمال", distance: 80, fp: 0.4, fn: 0.1 },
    { text: "نشانه‌هایی از گیاهان در ساحل غربی", distance: 70, fp: 0.1, fn: 0.4 },
    { text: "کاهش تدریجی استحکام یخ‌ها رو‌ به شمال", distance: 50, fp: 0.4, fn: 0.1 }
];

export const NO_PASSAGE_SIGNS = [
    { text: "یخ درخشان در افق شمالی", distance: 20, fp: 0.1, fn: 0.3 },
    { text: "آب کم عمق و روشن در مسیر شمال", distance: 30, fp: 0.4, fn: 0.3 },
    { text: "تغییر مسیر یا تلاطم جریان آب", distance: 25, fp: 0.4, fn: 0.1 },
    { text: "غیبت موجودات دریایی", distance: 40, fp: 0.4, fn: 0.3 }
];

export function generateSign(
    currentPos: number,
    passageDistanceType: PassageDistance,
    isFullLookout: boolean
): string | null {
    if (!isFullLookout) return null;

    // Actual distance to passage
    let actualPassagePos = 0;
    if (passageDistanceType === 'NEAR') actualPassagePos = 50;
    else if (passageDistanceType === 'FAR') actualPassagePos = 80;
    else actualPassagePos = 999;

    const distToPassage = actualPassagePos - currentPos;
    const hasPassageNearby = distToPassage > 0 && distToPassage <= 80;

    if (hasPassageNearby) {
        // Pick a positive sign
        const candidate = PASSAGE_SIGNS.filter(s => distToPassage <= s.distance).sort(() => Math.random() - 0.5)[0];
        if (candidate) {
            // Check FN (False Negative)
            if (Math.random() > candidate.fn) return candidate.text;
        }
    } else if (passageDistanceType === 'NONE' || distToPassage <= 0) {
        // Pick a negative sign
        const candidate = NO_PASSAGE_SIGNS.sort(() => Math.random() - 0.5)[0];
        if (candidate) {
            if (Math.random() > candidate.fn) return candidate.text;
        }
    }

    // FP (False Positives) - small chance to see a positive sign when none or far
    if (Math.random() < 0.1) {
        return PASSAGE_SIGNS[Math.floor(Math.random() * PASSAGE_SIGNS.length)].text;
    }

    return null;
}
