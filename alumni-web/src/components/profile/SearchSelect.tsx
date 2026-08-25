"use client"

import React, { useMemo, useRef, useState } from "react"

type Option = { value: string; label: string }

type Props = {
  label: string
  value: string
  options: Option[]
  placeholder?: string
  disabled?: boolean
  onChange: (value: string) => void
}

export default function SearchSelect({
  label,
  value,
  options,
  placeholder = "Buscar...",
  disabled = false,
  onChange
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const root = useRef<HTMLDivElement>(null)

  const selected = options.find((item) => item.value === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((item) => item.label.toLowerCase().includes(q))
  }, [options, query])

  return (
    <div ref={root} className="relative">
      <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.12em] text-black/45 dark:text-white/45">
        {label}
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((v) => !v)
            setQuery("")
          }
        }}
        className="flex w-full items-center justify-between border-0 border-b border-black/15 bg-transparent px-0 py-3 text-left text-[15px] outline-none transition-colors hover:border-black/35 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/15 dark:hover:border-white/35"
      >
        <span className={selected ? "" : "text-black/40 dark:text-white/40"}>
          {selected?.label || placeholder}
        </span>
        <span className="text-black/35 dark:text-white/35">⌄</span>
      </button>

      {open && (
        <>
          <button
            aria-label="Cerrar selector"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_16px_50px_rgba(0,0,0,0.12)] dark:border-white/10 dark:bg-[#111]">
            <div className="border-b border-black/10 p-3 dark:border-white/10">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl bg-black/[0.045] px-3 py-2.5 text-[14px] outline-none placeholder:text-black/35 dark:bg-white/[0.06] dark:placeholder:text-white/35"
              />
            </div>
            <div className="max-h-64 overflow-y-auto p-1.5">
              {filtered.length ? (
                filtered.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      onChange(item.value)
                      setOpen(false)
                      setQuery("")
                    }}
                    className={`w-full rounded-xl px-3 py-2.5 text-left text-[14px] transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.07] ${
                      item.value === value ? "font-semibold" : ""
                    }`}
                  >
                    {item.label}
                  </button>
                ))
              ) : (
                <div className="px-3 py-5 text-center text-sm text-black/40 dark:text-white/40">
                  No se encontraron resultados
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
