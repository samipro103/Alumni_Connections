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
    name: "",
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
        name:
          travelResult.data
            .next_destination_name || "",
        code:
          travelResult.data
            .next_destination_code || "",
      });
    }
  }

  async function saveDestination() {
    const name =
      destinationForm.name.trim();

    if (!own || !name || savingDestination) {
      return;
    }

    setSavingDestination(true);

    const { error } = await supabase
      .from("profile_travel_status")
      .upsert(
        {
          user_id: userId,
          next_destination_name: name,
          next_destination_code:
            destinationForm.code
              .trim()
              .toUpperCase() || null,
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
      <header className={styles.header}>
        <div>
          <span>Pasaporte Alumni</span>
          <h3>
            {own
              ? "Tus lugares cuentan parte de tu historia."
              : `Los lugares de @${username}.`}
          </h3>
        </div>

        <Link
          href={
            own
              ? "/passport"
              : `/passport/${username}`
          }
        >
          {own
            ? "Gestionar"
            : "Ver pasaporte"}
          <ArrowRight size={14} />
        </Link>
      </header>

      {travel?.next_destination_name ? (
        <div className={styles.nextDestination}>
          <div className={styles.nextIcon}>
            <Plane size={18} />
          </div>

          <div>
            <span>Próximo destino</span>
            <strong>
              {travel.next_destination_name}
            </strong>
            {travel.next_destination_code && (
              <small>
                {travel.next_destination_code}
              </small>
            )}
          </div>

          {own && (
            <button
              type="button"
              onClick={() =>
                setEditingDestination(true)
              }
              aria-label="Editar próximo destino"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      ) : own ? (
        <button
          type="button"
          className={styles.addDestination}
          onClick={() =>
            setEditingDestination(true)
          }
        >
          <Plane size={16} />
          <span>
            <strong>
              Añadir próximo destino
            </strong>
            <small>
              Cuéntale a tu red dónde te gustaría ir.
            </small>
          </span>
          <Plus size={15} />
        </button>
      ) : null}

      {countries.length > 0 ? (
        <div className={styles.countryStrip}>
          {countries.map((country: any) => (
            <Link
              key={country.id}
              href={
                own
                  ? `/passport`
                  : `/passport/${username}?country=${country.id}`
              }
              className={`${styles.country} ${
                styles[
                  `theme_${country.theme_style || "aurora"}`
                ]
              }`}
            >
              <div className={styles.countryMedia}>
                {country.cover_url ? (
                  <img
                    src={country.cover_url}
                    alt={country.country_name}
                  />
                ) : (
                  <Globe2 size={21} />
                )}
              </div>

              <span>
                {country.country_code}
              </span>
              <strong>
                {country.country_name}
              </strong>
            </Link>
          ))}
        </div>
      ) : own ? (
        <Link
          href="/passport"
          className={styles.emptyPassport}
        >
          <MapPinned size={17} />
          <span>
            <strong>
              Empieza tu Pasaporte
            </strong>
            <small>
              Crea tu primer país y álbum.
            </small>
          </span>
          <ArrowRight size={15} />
        </Link>
      ) : null}

      {editingDestination && own && (
        <div
          className={styles.backdrop}
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setEditingDestination(false);
            }
          }}
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
          >
            <header>
              <div>
                <span>Próximo destino</span>
                <h4>
                  ¿A dónde quieres ir después?
                </h4>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditingDestination(false)
                }
              >
                <X size={17} />
              </button>
            </header>

            <label>
              <span>Destino</span>
              <input
                value={destinationForm.name}
                onChange={(event) =>
                  setDestinationForm(
                    (current) => ({
                      ...current,
                      name: event.target.value,
                    })
                  )
                }
                placeholder="Ej. Japón"
                autoFocus
              />
            </label>

            <label>
              <span>Código · opcional</span>
              <input
                value={destinationForm.code}
                maxLength={3}
                onChange={(event) =>
                  setDestinationForm(
                    (current) => ({
                      ...current,
                      code: event.target.value,
                    })
                  )
                }
                placeholder="JP"
              />
            </label>

            <button
              type="button"
              className={styles.save}
              disabled={
                savingDestination ||
                !destinationForm.name.trim()
              }
              onClick={() =>
                void saveDestination()
              }
            >
              {savingDestination
                ? "Guardando..."
                : "Guardar próximo destino"}
            </button>
          </section>
        </div>
      )}
    </section>
  );
}

/* ALUMNI_2_3_0_PROFILE_PASSPORT_PREVIEW */
