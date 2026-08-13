"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Amenity, AmenityRequest } from "@/lib/types";
import { formatMoney } from "@/lib/format";

const emptyForm = (): AmenityRequest => ({
  name: "",
  description: "",
  price: 0,
  available: true,
});

export function AmenitiesAdmin() {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Amenity | null>(null);
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setAmenities(await api.getAmenities(true));
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load amenities.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!window.confirm("Delete this amenity?")) return;
    try {
      await api.deleteAmenity(id);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not delete amenity.",
      );
    }
  }

  if (loading) {
    return <div className="text-sm text-slate-400">Loading amenities…</div>;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          Amenities{" "}
          <span className="text-sm font-normal text-slate-400">
            ({amenities.length})
          </span>
        </h2>
        <button
          onClick={() => {
            setAdding(true);
            setEditing(null);
          }}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-95"
        >
          + Add amenity
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {(adding || editing) && (
        <AmenityForm
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

      <div className="overflow-x-auto rounded-2xl border border-white/60 bg-white/85 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {amenities.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3 font-medium text-slate-700">
                  {a.name}
                </td>
                <td className="px-4 py-3 text-slate-500">{a.description}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">
                  {formatMoney(a.price, "EUR")}
                </td>
                <td className="px-4 py-3">
                  {a.available ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Available
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                      Hidden
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      setEditing(a);
                      setAdding(false);
                    }}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(a.id)}
                    className="ml-3 text-xs font-medium text-rose-500 hover:text-rose-400"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AmenityForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: Amenity;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<AmenityRequest>(
    initial
      ? {
          name: initial.name,
          description: initial.description,
          price: initial.price,
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
      if (initial) await api.updateAmenity(initial.id, form);
      else await api.createAmenity(form);
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not save amenity.",
      );
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
      <h3 className="text-sm font-semibold text-slate-700">
        {initial ? "Edit amenity" : "New amenity"}
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Name
          </span>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={input}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Price (EUR)
          </span>
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
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Description
        </span>
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={input}
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={form.available}
          onChange={(e) => setForm({ ...form, available: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300"
        />
        Available for travellers to add
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

const input =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
