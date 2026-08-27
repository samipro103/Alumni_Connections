"use client";

import { ArrowRight, Pencil, Plane, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { flagEmoji } from "@/lib/countries";
import styles from "./ProfilePassportPreview.module.css";

type Props = {
  userId: string;
  username: string;
  own?: boolean;
};

export default function ProfilePassportPreview({
  userId,
  username,
  own = false,
}: Props) {
  const [countries, setCountries] = useState<any[]>([]);
  const [travel, setTravel] = useState<any>(null);
  const [editingDestination, setEditingDestination] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", code: "" });

  useEffect(() => {
    void load();
  }, [userId]);

  async function load() {
    const [countryResult, travelResult] = await Promise.all([
      supabase
        .from("passport_countries")
        .select("id,country_name,country_code,city,note,theme_style,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("profile_travel_status")
        .select("next_destination_name,next_destination_code,source_passport_country_id")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    setCountries(countryResult.data || []);
    setTravel(travelResult.data || null);

    if (travelResult.data) {
      setForm({
        name: travelResult.data.next_destination_name || "",
        code: travelResult.data.next_destination_code || "",
      });
    }
  }

  async function saveDestination() {
    if (!own || !form.name.trim() || saving) return;

    setSaving(true);
    const { error } = await supabase
      .from("profile_travel_status")
      .upsert(
        {
          user_id: userId,
          next_destination_name: form.name.trim(),
          next_destination_code: form.code.trim().toUpperCase() || null,
          source_passport_country_id: null,
        },
        { onConflict: "user_id" }
      );

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setEditingDestination(false);
    await load();
  }

  if (!own && countries.length === 0 && !travel?.next_destination_name) {
    return null;
  }

  return (
    <section className={styles.root}>
      <header className={styles.header}>
        <Link href={own ? "/passport" : `/passport/${username}`}>
          Pasaporte Alumni
          <ArrowRight size={13} />
        </Link>

        {travel?.next_destination_name ? (
          <div className={styles.next}>
            <span className={styles.flag}>
              {flagEmoji(travel.next_destination_code)}
            </span>
            <span>Próximo destino:</span>
            <strong>{travel.next_destination_name}</strong>
            {own && (
              <button
                type="button"
                onClick={() => setEditingDestination(true)}
                aria-label="Editar próximo destino"
              >
                <Pencil size={12} />
              </button>
            )}
          </div>
        ) : own ? (
          <button
            type="button"
            className={styles.addNext}
            onClick={() => setEditingDestination(true)}
          >
            <Plane size={13} />
            Próximo destino
          </button>
        ) : null}
      </header>

      {countries.length > 0 && (
        <div className={styles.strip}>
          {countries.map((country: any) => (
            <Link
              key={country.id}
              href={own ? "/passport" : `/passport/${username}?country=${country.id}`}
              className={styles.country}
            >
              <span className={styles.countryFlag}>
                {flagEmoji(country.country_code)}
              </span>
              <span>
                <strong>{country.country_name}</strong>
                {country.city && <small>{country.city}</small>}
              </span>
            </Link>
          ))}
        </div>
      )}

      {editingDestination && own && (
        <div
          className={styles.backdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setEditingDestination(false);
            }
          }}
        >
          <section className={styles.modal}>
            <header>
              <div>
                <span>Próximo destino</span>
                <h4>¿A dónde quieres ir?</h4>
              </div>
              <button type="button" onClick={() => setEditingDestination(false)}>
                <X size={17} />
              </button>
            </header>

            <label>
              <span>Destino</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Ej. Japón"
                autoFocus
              />
            </label>

            <label>
              <span>Código del país · opcional</span>
              <input
                value={form.code}
                maxLength={2}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value }))
                }
                placeholder="JP"
              />
            </label>

            <button
              type="button"
              className={styles.save}
              disabled={saving || !form.name.trim()}
              onClick={() => void saveDestination()}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
