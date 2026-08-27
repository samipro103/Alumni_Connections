"use client";

import {
  ArrowRight,
  Globe2,
  MapPinned,
  Pencil,
  Plane,
  Plus,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { COUNTRIES, flagEmoji } from "@/lib/countries";
import styles from "./ProfilePassportPreview.module.css";

type Props = {
  userId: string;
  username: string;
  own?: boolean;
};

async function sign(path?: string | null) {
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from("passport-media")
    .createSignedUrl(path, 60 * 30);

  return error ? null : data?.signedUrl || null;
}

export default function ProfilePassportPreview({
  userId,
  username,
  own = false,
}: Props) {
  const [countries, setCountries] = useState<any[]>([]);
  const [travel, setTravel] = useState<any>(null);
  const [editingDestination, setEditingDestination] =
    useState(false);
  const [savingDestination, setSavingDestination] =
    useState(false);
  const [destinationForm, setDestinationForm] = useState({
    code: "",
  });

  useEffect(() => {
    void load();
  }, [userId]);

  async function load() {
    const [countryResult, travelResult] =
      await Promise.all([
        supabase
          .from("passport_countries")
          .select(
            "id,country_name,country_code,note,theme_style,cover_media_path,created_at"
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("profile_travel_status")
          .select(
            "next_destination_name,next_destination_code,source_passport_country_id"
          )
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

    const hydrated = await Promise.all(
      (countryResult.data || []).map(
        async (row: any) => ({
          ...row,
          cover_url: await sign(
            row.cover_media_path
          ),
        })
      )
    );

    setCountries(hydrated);
    setTravel(travelResult.data || null);

    if (travelResult.data) {
      setDestinationForm({
        code:
          travelResult.data
            .next_destination_code || "",
      });
    }
  }

  async function saveDestination() {
    const selected = COUNTRIES.find(
      (item) =>
        item.code === destinationForm.code
    );

    if (
      !own ||
      !selected ||
      savingDestination
    ) {
      return;
    }

    setSavingDestination(true);

    const { error } = await supabase
      .from("profile_travel_status")
      .upsert(
        {
          user_id: userId,
          next_destination_name:
            selected.name,
          next_destination_code:
            selected.code,
          source_passport_country_id: null,
        },
        { onConflict: "user_id" }
      );

    setSavingDestination(false);

    if (error) {
      alert(error.message);
      return;
    }

    setEditingDestination(false);
    await load();
  }

  if (
    !own &&
    countries.length === 0 &&
    !travel?.next_destination_name
  ) {
    return null;
  }

  return (
    <section className={styles.root}>
      <div className={styles.compactLine}>
        <Link
          href={
            own
              ? "/passport"
              : `/passport/${username}`
          }
          className={styles.passportLink}
        >
          Pasaporte Alumni
          <ArrowRight size={13} />
        </Link>

        {travel?.next_destination_name ? (
          <button
            type="button"
            className={styles.nextCompact}
            onClick={() => {
              if (own) {
                setEditingDestination(
                  (value) => !value
                );
              }
            }}
            disabled={!own}
          >
            <span>Próximo destino:</span>
            <b className={styles.flag}>
              {flagEmoji(
                travel.next_destination_code
              )}
            </b>
            <strong>
              {travel.next_destination_name}
            </strong>
            {own && <Pencil size={12} />}
          </button>
        ) : own ? (
          <button
            type="button"
            className={styles.nextCompact}
            onClick={() =>
              setEditingDestination(
                (value) => !value
              )
            }
          >
            <span>Próximo destino:</span>
            <Plane size={13} />
            <strong>Elegir país</strong>
          </button>
        ) : null}
      </div>

      {editingDestination && own && (
        <div className={styles.destinationEditor}>
          <label>
            <span>Próximo destino</span>
            <select
              value={destinationForm.code}
              onChange={(event) =>
                setDestinationForm({
                  code: event.target.value,
                })
              }
            >
              <option value="">
                Selecciona un país
              </option>

              {COUNTRIES.map((country) => (
                <option
                  key={country.code}
                  value={country.code}
                >
                  {flagEmoji(country.code)}{" "}
                  {country.name}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.destinationActions}>
            <button
              type="button"
              onClick={() =>
                setEditingDestination(false)
              }
            >
              Cancelar
            </button>

            <button
              type="button"
              className={styles.destinationSave}
              disabled={
                savingDestination ||
                !destinationForm.code
              }
              onClick={() =>
                void saveDestination()
              }
            >
              {savingDestination
                ? "Guardando..."
                : "Guardar"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ALUMNI_2_3_0_PROFILE_PASSPORT_PREVIEW */

/* ALUMNI_2_3_2_RECOVERY_PROFILE_PASSPORT_NAV:PASSPORT_PREVIEW */
