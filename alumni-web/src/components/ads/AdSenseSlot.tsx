"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect, useRef, useState } from "react";
import styles from "./AdSenseSlot.module.css";

type AdPlacement = "stories" | "feed";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

const ENABLED = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "1";
const CLIENT = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "").trim();
const FEED_SLOT = (process.env.NEXT_PUBLIC_ADSENSE_FEED_SLOT || "").trim();
const STORIES_SLOT = (process.env.NEXT_PUBLIC_ADSENSE_STORIES_SLOT || "").trim();
const FEED_LAYOUT_KEY = (process.env.NEXT_PUBLIC_ADSENSE_FEED_LAYOUT_KEY || "").trim();
const PREVIEW =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_ADSENSE_PREVIEW === "1";

function validClient(value: string) {
  return /^ca-pub-\d+$/.test(value);
}

function validSlot(value: string) {
  return /^\d+$/.test(value);
}

function slotFor(placement: AdPlacement) {
  return placement === "stories" ? STORIES_SLOT : FEED_SLOT;
}

function ensureScript(client: string) {
  if (typeof document === "undefined") return;

  const id = "alumni-adsense-script";
  if (document.getElementById(id)) return;

  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src =
    "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
    encodeURIComponent(client);

  document.head.appendChild(script);
}

export default function AdSenseSlot({
  placement,
}: {
  placement: AdPlacement;
}) {
  const requestedRef = useRef(false);
  const [platformReady, setPlatformReady] = useState(false);
  const [nativePlatform, setNativePlatform] = useState(true);
  const slot = slotFor(placement);

  useEffect(() => {
    let native = false;

    try {
      native = Capacitor.isNativePlatform();
    } catch {
      native = false;
    }

    setNativePlatform(native);
    setPlatformReady(true);
  }, []);

  useEffect(() => {
    if (
      !platformReady ||
      nativePlatform ||
      PREVIEW ||
      !ENABLED ||
      !validClient(CLIENT) ||
      !validSlot(slot) ||
      requestedRef.current
    ) {
      return;
    }

    requestedRef.current = true;
    ensureScript(CLIENT);

    const frame = window.requestAnimationFrame(() => {
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      } catch (error) {
        console.warn("[Alumni Ads] AdSense:", error);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [platformReady, nativePlatform, placement, slot]);

  if (!platformReady || nativePlatform) return null;

  if (PREVIEW) {
    return (
      <section
        className={`${styles.slot} ${styles[placement]}`}
        aria-label="Vista previa de publicidad"
      >
        <div className={styles.label}>Publicidad</div>
        <div className={styles.preview}>Espacio publicitario</div>
      </section>
    );
  }

  if (!ENABLED || !validClient(CLIENT) || !validSlot(slot)) {
    return null;
  }

  const fluidFeed =
    placement === "feed" && Boolean(FEED_LAYOUT_KEY);

  return (
    <section
      className={`${styles.slot} ${styles[placement]}`}
      aria-label="Publicidad"
    >
      <div className={styles.label}>Publicidad</div>

      <ins
        className={`adsbygoogle ${styles.ad}`}
        style={{ display: "block" }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format={fluidFeed ? "fluid" : "auto"}
        data-ad-layout-key={fluidFeed ? FEED_LAYOUT_KEY : undefined}
        data-full-width-responsive={fluidFeed ? undefined : "true"}
      />
    </section>
  );
}

/* ALUMNI_3_3_0_WEB_ADS:SLOT */
