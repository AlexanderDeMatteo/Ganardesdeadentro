'use client';

import { useCoachNutritionContext } from '@/app/context/coach-nutrition-context';
import { PlanDayMeals } from '@/components/nutrition/plan-day-meals';
import { SlotTimesEditor } from '@/components/nutrition/slot-times-editor';
import { WeeklyShoppingList } from '@/components/nutrition/weekly-shopping-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  collectShoppingList,
  createEmptyWeekPlan,
  createMealItem,
  duplicateDay,
  getBasicMealTemplates,
  getProMealTemplates,
} from '@/lib/nutrition/meal-plan';
import { DAY_LABELS, MEAL_SLOT_LABELS, type DayPlan, type MealPlan, type MealSlot } from '@/lib/nutrition/types';
import { Copy, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';

export function MealPlanEditor() {
  const {
    state,
    slotTimes,
    setSlotTimes,
    publish,
    upsertMealPlan,
    deleteMealPlan,
    setActiveMealPlan,
    isProMember,
    canAddMealPlan,
    canEdit,
  } = useCoachNutritionContext();

  const activePlan = useMemo(
    () => state.mealPlans.find((p) => p.id === state.activeMealPlanId) ?? state.mealPlans[0] ?? null,
    [state.mealPlans, state.activeMealPlanId],
  );

  const [selectedDay, setSelectedDay] = useState(0);
  const [newItemName, setNewItemName] = useState('');
  const [newItemGrams, setNewItemGrams] = useState('');
  const [newItemSlot, setNewItemSlot] = useState<MealSlot>('breakfast');
  const [newItemTime, setNewItemTime] = useState(slotTimes.breakfast);
  const [confirmDeletePlan, setConfirmDeletePlan] = useState(false);

  const applyTemplate = (template: MealPlan) => {
    if (!canEdit) return;
    if (!canAddMealPlan && !state.mealPlans.some((p) => p.id === template.id)) {
      toast.error('Con tu plan actual solo puedes tener 1 plan activo. Mejora a Pro para más.');
      return;
    }
    upsertMealPlan({ ...template, id: `plan-${Date.now()}`, createdAt: new Date().toISOString() });
    toast.success(`Plantilla "${template.name}" aplicada.`);
  };

  const updateActivePlan = (updater: (plan: MealPlan) => MealPlan) => {
    if (!activePlan || !canEdit) return;
    upsertMealPlan(updater(activePlan));
  };

  const addItemToDay = () => {
    const name = newItemName.trim();
    if (!name || !activePlan) return;
    const grams = newItemGrams ? Number(newItemGrams) : undefined;
    updateActivePlan((plan) => ({
      ...plan,
      days: plan.days.map((d) =>
        d.day === selectedDay
          ? {
              ...d,
              meals: {
                ...d.meals,
                [newItemSlot]: [
                  ...d.meals[newItemSlot],
                  createMealItem(name, {
                    quantityG: grams && Number.isFinite(grams) ? grams : undefined,
                    scheduledTime: newItemTime || slotTimes[newItemSlot],
                  }),
                ],
              },
            }
          : d,
      ),
    }));
    setNewItemName('');
    setNewItemGrams('');
    setNewItemTime(slotTimes[newItemSlot]);
  };

  const removeItem = (day: number, slot: MealSlot, itemId: string) => {
    updateActivePlan((plan) => ({
      ...plan,
      days: plan.days.map((d) =>
        d.day === day
          ? { ...d, meals: { ...d.meals, [slot]: d.meals[slot].filter((i) => i.id !== itemId) } }
          : d,
      ),
    }));
  };

  const copyDayToAll = (sourceDay: number) => {
    const source = activePlan?.days.find((d) => d.day === sourceDay);
    if (!source) return;
    updateActivePlan((plan) => ({
      ...plan,
      days: plan.days.map((d) => ({ ...duplicateDay({ ...source, day: d.day }), day: d.day })),
    }));
    toast.success('Día copiado a toda la semana.');
  };

  const handleNewPlan = () => {
    if (!canEdit) return;
    if (!canAddMealPlan) {
      toast.error('Límite de 1 plan. Activa Pro para planes ilimitados.');
      return;
    }
    const plan = createEmptyWeekPlan(`Plan ${state.mealPlans.length + 1}`);
    upsertMealPlan(plan);
    setActiveMealPlan(plan.id);
  };

  const legacyNames = activePlan ? collectShoppingList(activePlan) : [];
  const canSavePlan = canEdit && !!activePlan && !!state.macroTargets;

  return (
    <div className="brand-card space-y-6 rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Plan de alimentación</h2>
          <p className="mt-1 text-sm text-muted-foreground">Organiza la semana del atleta por comidas y horarios.</p>
        </div>
        <Button type="button" size="sm" onClick={handleNewPlan} disabled={!canAddMealPlan || !canEdit}>
          <Plus className="size-4" aria-hidden />
          Nuevo plan
        </Button>
      </div>

      {activePlan && (
        <div className="max-w-md space-y-1">
          <Label htmlFor="plan-name">Nombre del plan</Label>
          <Input
            id="plan-name"
            value={activePlan.name}
            onChange={(e) => updateActivePlan((plan) => ({ ...plan, name: e.target.value }))}
            placeholder="Ej. Definición atleta mayo"
            disabled={!canEdit}
          />
        </div>
      )}

      {!isProMember && (
        <p className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
          Plan básico: 1 plan activo.{' '}
          <Link href="/memberships" className="font-semibold text-primary hover:underline">
            Pro
          </Link>{' '}
          desbloquea plantillas avanzadas y planes ilimitados.
        </p>
      )}

      <div className="space-y-2">
        <Label>Horarios de comidas</Label>
        <SlotTimesEditor slotTimes={slotTimes} onChange={setSlotTimes} />
      </div>

      <div className="space-y-2">
        <Label>Plantillas rápidas</Label>
        <div className="flex flex-wrap gap-2">
          {getBasicMealTemplates().map((t) => (
            <Button
              key={t.name}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => applyTemplate(t)}
              disabled={!canEdit}
            >
              {t.name}
            </Button>
          ))}
          {isProMember &&
            getProMealTemplates().map((t) => (
              <Button
                key={t.name}
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => applyTemplate(t)}
                disabled={!canEdit}
              >
                {t.name} (Pro)
              </Button>
            ))}
        </div>
      </div>

      {state.mealPlans.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {state.mealPlans.map((p) => (
            <Button
              key={p.id}
              type="button"
              size="sm"
              variant={activePlan?.id === p.id ? 'default' : 'outline'}
              onClick={() => setActiveMealPlan(p.id)}
              disabled={!canEdit}
            >
              {p.name}
            </Button>
          ))}
        </div>
      )}

      {!activePlan ? (
        <p className="text-sm text-muted-foreground">Elige una plantilla o crea un plan nuevo.</p>
      ) : (
        <>
          <Tabs value={String(selectedDay)} onValueChange={(v) => setSelectedDay(Number(v))}>
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
              {DAY_LABELS.map((label, i) => (
                <TabsTrigger key={label} value={String(i)} className="text-xs">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            {activePlan.days.map((dayPlan: DayPlan) => (
              <TabsContent key={dayPlan.day} value={String(dayPlan.day)} className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => copyDayToAll(dayPlan.day)}
                    disabled={!canEdit}
                  >
                    <Copy className="size-3.5" aria-hidden />
                    Copiar día a toda la semana
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => setConfirmDeletePlan(true)}
                    disabled={!canEdit}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Eliminar plan
                  </Button>
                </div>
                <PlanDayMeals
                  dayPlan={dayPlan}
                  slotTimes={slotTimes}
                  mode="edit"
                  onRemove={removeItem}
                />
              </TabsContent>
            ))}
          </Tabs>

          <div className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
            <div className="w-full max-w-xs space-y-1">
              <Label htmlFor="new-food">Añadir alimento</Label>
              <Input
                id="new-food"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Ej. Pechuga con arroz"
                disabled={!canEdit}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItemToDay())}
              />
            </div>
            <div className="w-24 space-y-1">
              <Label htmlFor="new-grams">Gramos</Label>
              <Input
                id="new-grams"
                type="number"
                min={0}
                value={newItemGrams}
                onChange={(e) => setNewItemGrams(e.target.value)}
                placeholder="g"
                disabled={!canEdit}
              />
            </div>
            <div className="w-32 space-y-1">
              <Label htmlFor="new-food-time">Horario</Label>
              <Input
                id="new-food-time"
                type="time"
                value={newItemTime}
                onChange={(e) => setNewItemTime(e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={newItemSlot}
              onChange={(e) => {
                const slot = e.target.value as MealSlot;
                setNewItemSlot(slot);
                setNewItemTime(slotTimes[slot]);
              }}
              aria-label="Momento del día"
              disabled={!canEdit}
            >
              {(Object.keys(MEAL_SLOT_LABELS) as MealSlot[]).map((slot) => (
                <option key={slot} value={slot}>
                  {MEAL_SLOT_LABELS[slot]}
                </option>
              ))}
            </select>
            <Button type="button" onClick={addItemToDay} disabled={!canEdit}>
              Añadir
            </Button>
          </div>

          <div className="border-t border-border pt-4">
            <Button
              type="button"
              onClick={() => publish()}
              disabled={!canSavePlan}
              className="w-full sm:w-auto"
            >
              Guardar plan para el atleta
            </Button>
            {!state.macroTargets && (
              <p className="mt-2 text-xs text-muted-foreground">
                Primero define macros en la pestaña Macros para poder guardar el plan visible al atleta.
              </p>
            )}
          </div>

          <WeeklyShoppingList mealPlan={activePlan} slotTimes={slotTimes} />

          {legacyNames.length > 0 && activePlan && (
            <p className="text-xs text-muted-foreground">
              {legacyNames.length} alimentos distintos en el plan semanal.
            </p>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmDeletePlan}
        onOpenChange={setConfirmDeletePlan}
        title="Eliminar plan de comidas"
        description={
          activePlan
            ? `¿Eliminar "${activePlan.name}"? El atleta dejará de ver este plan.`
            : '¿Eliminar este plan de comidas?'
        }
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          if (activePlan) {
            deleteMealPlan(activePlan.id);
            toast.success('Plan eliminado.');
          }
          setConfirmDeletePlan(false);
        }}
      />
    </div>
  );
}
