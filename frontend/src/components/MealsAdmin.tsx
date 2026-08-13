"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { MealOption, MealOptionRequest, DietaryPreference } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { DIETARY_BADGE, DIETARY_LABEL } from "@/lib/ancillaries";

const DIETARY_OPTIONS: DietaryPreference[] = [
  "VEGETARIAN",
  "VEGAN",
  "NON_VEGETARIAN",
  "GLUTEN_FREE",
];

const emptyForm = (): MealOptionRequest => ({
  name: "",
  description: "",
  dietary: "VEGETARIAN",
  price: 0,
  imageUrl: "https://loremflickr.com/400/300/food",
  available: true,
});

export function MealsAdmin() {
  const [meals, setMeals] = useState<MealOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MealOption | null>(null);
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setMeals(await api.getMeals(true));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load meals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!window.confirm("Delete this meal option?")) return;
    try {
      await api.deleteMeal(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete meal.");
    }
  }

  if (loading) {
    return <div className="text-sm text-slate-400">Loading meals…</div>;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          Meals{" "}
          <span className="text-sm font-normal text-slate-400">
            ({meals.length})
          </span>
        </h2>
        <button
          onClick={() => {
            setAdding(true);
            setEditing(null);
          }}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-95"
        >
          + Add meal
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {(adding || editing) && (
        <MealForm
          initial={editing ?? undefined}
          onCancel={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSaved={async () => {
            setAdding(false);
            setEditing(null);
            await load();
          }}
        />
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {meals.map((meal) => (
          <div
            key={meal.id}
            className="flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={meal.imageUrl}
              alt={meal.name}
              loading="lazy"
              className="h-32 w-full object-cover"
            />
            <div className="flex flex-1 flex-col p-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-slate-800">
                  {meal.name}
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {formatMoney(meal.price, "EUR")}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${DIETARY_BADGE[meal.dietary]}`}
                >
                  {DIETARY_LABEL[meal.dietary]}
                </span>
                {!meal.available && (
                  <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                    Unavailable
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                {meal.description}
              </p>
              <div className="mt-3 flex gap-2 border-t border-slate-100 pt-2">
                <button
                  onClick={() => {
                    setEditing(meal);
                    setAdding(false);
                  }}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(meal.id)}
                  className="text-xs font-medium text-rose-500 hover:text-rose-400"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MealForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: MealOption;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<MealOptionRequest>(
    initial
      ? {
          name: initial.name,
          description: initial.description,
          dietary: initial.dietary,
          price: initial.price,
          imageUrl: initial.imageUrl,
          available: initial.available,
        }
      : emptyForm(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      if (initial) await api.updateMeal(initial.id, form);
      else await api.createMeal(form);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save meal.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
      <h3 className="text-sm font-semibold text-slate-700">
        {initial ? "Edit meal" : "New meal"}
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Name">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={input}
          />
        </Field>
        <Field label="Price (EUR)">
          <input
            type="number"
            min={0}
            step="0.5"
            value={form.price}
            onChange={(e) =>
              setForm({ ...form, price: Number(e.target.value) })
            }
            className={input}
          />
        </Field>
        <Field label="Dietary preference">
          <select
            value={form.dietary}
            onChange={(e) =>
              setForm({ ...form, dietary: e.target.value as DietaryPreference })
            }
            className={input}
          >
            {DIETARY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {DIETARY_LABEL[d]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Image URL">
          <input
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            className={input}
          />
        </Field>
      </div>
      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          className={input}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={form.available}
          onChange={(e) => setForm({ ...form, available: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300"
        />
        Available for travellers to order
      </label>
      {error && <div className="text-sm text-rose-600">{error}</div>}
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving || !form.name.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const input =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
