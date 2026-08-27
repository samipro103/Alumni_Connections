"use client";

import {
  ArrowRight,
  Globe2,
  Pencil,
  Plane,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  COUNTRIES,
  flagEmoji,
} from "@/lib/countries";
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
  const [editingDestination, setEditingDestination] =
    useState(false);
  const [savingDestination, setSavingDestination] =
    useState(false);
  const [destinationCode, setDestinationCode] =
    useState("");

  useEffect(() => {
    void load();
  }, [userId]);

  async function load() {
    const [countryResult, travelResult] =
      await Promise.all([
        supabase
          .from("passport_countries")
          .select(
            "id,country_name,country_code,created_at"
          )
          .eq("user_id", userId)
          .order("created_at", {
            ascending: false,
          }),
        supabase
          .from("profile_travel_status")
          .select(
            "next_destination_name,next_destination_code"
          )
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

    setCountries(countryResult.data || []);
    setTravel(travelResult.data || null);
    setDestinationCode(
      travelResult.data
        ?.next_destination_code || ""
    );
  }

  async function saveDestination() {
    const selected = COUNTRIES.find(
      (country) =>
        country.code === destinationCode
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
          source_passport_country_id:
            null,
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
      <div className={styles.passportRow}>
        <Link
          href={
            own
              ? "/passport"
              : `/passport/${username}`
          }
          className={styles.passportBook}
          aria-label="Abrir Pasaporte Alumni"
        >
          <span className={styles.bookTop}>
            ALUMNI
          </span>

          <Globe2
            size={28}
            strokeWidth={1.45}
          />

          <strong>
            Pasaporte
          </strong>

          <small>
            {countries.length}{" "}
            {countries.length === 1
              ? "país"
              : "países"}
          </small>
        </Link>

        <div className={styles.passportInfo}>
          <div className={styles.passportTitle}>
            <Link
              href={
                own
                  ? "/passport"
                  : `/passport/${username}`
              }
            >
              Pasaporte Alumni
              <ArrowRight size={13} />
            </Link>

            {own && (
              <Link
                href="/passport?add=1"
                className={styles.addCountry}
              >
                <Plus size={13} />
                Añadir país
              </Link>
            )}
          </div>

          {travel?.next_destination_name ? (
            <button
              type="button"
              className={styles.nextDestination}
              onClick={() => {
                if (own) {
                  setEditingDestination(
                    (current) => !current
                  );
                }
              }}
              disabled={!own}
            >
              <Plane size={13} />

              <span>
                Próximo destino:
              </span>

              <b>
                {flagEmoji(
                  travel.next_destination_code
                )}
              </b>

              <strong>
                {travel.next_destination_name}
              </strong>

              {own && (
                <Pencil size={11} />
              )}
            </button>
          ) : own ? (
            <button
              type="button"
              className={styles.nextDestination}
              onClick={() =>
                setEditingDestination(
                  (current) => !current
                )
              }
            >
              <Plane size={13} />
              <span>
                Próximo destino:
              </span>
              <strong>
                Elegir país
              </strong>
            </button>
          ) : null}

          {editingDestination && own && (
            <div
              className={
                styles.destinationEditor
              }
            >
              <select
                value={destinationCode}
                onChange={(event) =>
                  setDestinationCode(
                    event.target.value
                  )
                }
                aria-label="Seleccionar próximo destino"
              >
                <option value="">
                  Selecciona un país
                </option>

                {COUNTRIES.map(
                  (country) => (
                    <option
                      key={country.code}
                      value={country.code}
                    >
                      {flagEmoji(
                        country.code
                      )}{" "}
                      {country.name}
                    </option>
                  )
                )}
              </select>

              <div
                className={
                  styles.destinationActions
                }
              >
                <button
                  type="button"
                  onClick={() =>
                    setEditingDestination(
                      false
                    )
                  }
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className={
                    styles.saveDestination
                  }
                  disabled={
                    savingDestination ||
                    !destinationCode
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
        </div>
      </div>
    </section>
  );
}

/* ALUMNI_2_3_3_PROFILE_PASSPORT_CARD */
