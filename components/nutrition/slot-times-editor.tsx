'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MEAL_SLOT_LABELS, type MealSlot, type MealSlotTimes } from '@/lib/nutrition/types';

export function SlotTimesEditor({
  slotTimes,
  onChange,
}: {
  slotTimes: MealSlotTimes;
  onChange: (times: MealSlotTimes) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {(Object.keys(MEAL_SLOT_LABELS) as MealSlot[]).map((slot) => (
        <div key={slot} className="space-y-1">
          <Label htmlFor={`slot-time-${slot}`}>{MEAL_SLOT_LABELS[slot]}</Label>
          <Input
            id={`slot-time-${slot}`}
            type="time"
            value={slotTimes[slot]}
            onChange={(e) => onChange({ ...slotTimes, [slot]: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}
