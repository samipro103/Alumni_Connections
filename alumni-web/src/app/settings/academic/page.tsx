"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import SearchSelect from "@/components/profile/SearchSelect"
import MonochromeBrandMark from "@/components/profile/MonochromeBrandMark"
import {
  ACADEMIC_UNIVERSITIES,
  careersForUniversity,
  findUniversity
} from "@/data/academicCatalog"

export default function AcademicSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [university, setUniversity] = useState("")
  const [career, setCareer] = useState("")
  const [program, setProgram] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: auth } = await supabase.auth.getUser()
      const user = auth.user
      if (!user) {
        if (!cancelled) setLoading(false)
        return
      }

      const { data } = await supabase
        .from("profiles")
        .select("university, career, program")
        .eq("id", user.id)
        .maybeSingle()

      if (!cancelled && data) {
        setUniversity(data.university ?? "")
        setCareer(data.career ?? "")
        setProgram(data.program ?? "")
      }
      if (!cancelled) setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const careerOptions = useMemo(
    () => careersForUniversity(university).map((name) => ({ value: name, label: name })),
    [university]
  )

  const universityOptions = ACADEMIC_UNIVERSITIES.map((item) => ({
    value: item.name,
    label: item.name
  }))

  async function save() {
    setSaved(false)
    setSaving(true)

    const { data: auth } = await supabase.auth.getUser()
    const user = auth.user
    if (!user) {
      setSaving(false)
      return
    }

    const allowed = careersForUniversity(university)
    const safeCareer = allowed.includes(career) ? career : ""

    const { error } = await supabase
      .from("profiles")
      .update({
        university: university || null,
        career: safeCareer || null,
        program: program.trim() || null
      })
      .eq("id", user.id)

    setSaving(false)
    if (!error) {
      setCareer(safeCareer)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2200)
    } else {
      alert(`No se pudo guardar: ${error.message}`)
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-2xl px-5 py-8 text-sm text-black/45 dark:text-white/45">Cargando…</main>
  }

  const universityInfo = findUniversity(university)

  return (
    <main className="mx-auto max-w-2xl px-5 pb-24 pt-5 sm:px-7">
      <div className="mb-8 flex items-center gap-3">
        <Link
          href="/settings"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
          aria-label="Volver"
        >
          ←
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.025em]">Información académica</h1>
          <p className="mt-0.5 text-sm text-black/45 dark:text-white/45">
            Universidad, carrera y programa
          </p>
        </div>
      </div>

      {universityInfo && (
        <div className="mb-7 flex items-center gap-3 border-b border-black/[0.08] pb-5 dark:border-white/[0.09]">
          <MonochromeBrandMark name={universityInfo.name} size={46} />
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-black/40 dark:text-white/40">
              Institución seleccionada
            </div>
            <div className="mt-0.5 font-semibold">{universityInfo.name}</div>
          </div>
        </div>
      )}

      <div className="space-y-7">
        <SearchSelect
          label="Universidad"
          value={university}
          options={universityOptions}
          placeholder="Selecciona tu universidad"
          onChange={(value) => {
            setUniversity(value)
            setCareer("")
          }}
        />

        <SearchSelect
          label="Carrera"
          value={career}
          options={careerOptions}
          placeholder={university ? "Selecciona tu carrera" : "Selecciona primero la universidad"}
          disabled={!university}
          onChange={setCareer}
        />

        <div>
          <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.12em] text-black/45 dark:text-white/45">
            Programa
          </label>
          <div className="flex items-center gap-3 border-b border-black/15 py-2.5 dark:border-white/15">
            {program.trim() && (
              <MonochromeBrandMark name={program} kind="program" size={34} />
            )}
            <input
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              placeholder="Nombre del programa"
              className="min-w-0 flex-1 bg-transparent py-1 text-[15px] outline-none placeholder:text-black/35 dark:placeholder:text-white/35"
            />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-black/40 dark:text-white/40">
            La marca del programa se muestra en estilo monocromático y transparente.
          </p>
        </div>
      </div>

      <div className="mt-10 flex items-center gap-3 border-t border-black/[0.08] pt-5 dark:border-white/[0.09]">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
        {saved && <span className="text-sm text-black/50 dark:text-white/50">Guardado</span>}
      </div>
    </main>
  )
}
