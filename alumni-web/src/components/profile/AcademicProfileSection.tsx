"use client"

import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import MonochromeBrandMark from "@/components/profile/MonochromeBrandMark"

type AcademicData = {
  university: string | null
  career: string | null
  program: string | null
}

export default function AcademicProfileSection() {
  const [data, setData] = useState<AcademicData>({
    university: null,
    career: null,
    program: null
  })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: auth } = await supabase.auth.getUser()
      const user = auth.user
      if (!user) {
        if (!cancelled) setLoaded(true)
        return
      }

      const result = await supabase
        .from("profiles")
        .select("university, career, program")
        .eq("id", user.id)
        .maybeSingle()

      if (!cancelled && result.data) {
        setData({
          university: result.data.university ?? null,
          career: result.data.career ?? null,
          program: result.data.program ?? null
        })
      }
      if (!cancelled) setLoaded(true)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (!loaded || (!data.university && !data.career && !data.program)) return null

  return (
    <section className="my-7 border-y border-black/[0.08] py-5 dark:border-white/[0.09]">
      <div className="space-y-4">
        {data.university && (
          <div className="flex items-center gap-3.5">
            <MonochromeBrandMark name={data.university} size={42} />
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-black/40 dark:text-white/40">
                Universidad
              </div>
              <div className="mt-0.5 truncate text-[15px] font-semibold">
                {data.university}
              </div>
              {data.career && (
                <div className="mt-0.5 text-[14px] leading-snug text-black/58 dark:text-white/58">
                  {data.career}
                </div>
              )}
            </div>
          </div>
        )}

        {data.program && (
          <div className="flex items-center gap-3.5">
            <MonochromeBrandMark name={data.program} kind="program" size={38} />
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-black/40 dark:text-white/40">
                Programa
              </div>
              <div className="mt-0.5 truncate text-[14px] font-medium">
                {data.program}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
