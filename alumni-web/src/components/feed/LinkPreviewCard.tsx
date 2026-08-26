"use client";

import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

type Preview = {
  url: string;
  domain: string;
  title: string;
  description: string;
  image: string;
};

const cache = new Map<string, Preview | null>();

export default function LinkPreviewCard({
  url,
}: {
  url: string;
}) {
  const [preview, setPreview] = useState<Preview | null | undefined>(
    cache.has(url) ? cache.get(url) : undefined
  );

  useEffect(() => {
    if (cache.has(url)) return;

    let active = true;

    void fetch(
      `/api/feed/link-preview?url=${encodeURIComponent(url)}`,
      {
        cache: "force-cache",
      }
    )
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as Preview;
      })
      .catch(() => null)
      .then((value) => {
        cache.set(url, value);
        if (active) setPreview(value);
      });

    return () => {
      active = false;
    };
  }, [url]);

  if (preview === null) {
    return null;
  }

  if (preview === undefined) {
    return (
      <div className="alumni-link-preview alumni-link-preview-loading">
        <div />
        <div />
      </div>
    );
  }

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="alumni-link-preview"
    >
      {preview.image && (
        <img
          src={preview.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="alumni-link-preview-image"
        />
      )}

      <div className="alumni-link-preview-copy">
        <span className="alumni-link-preview-domain">
          {preview.domain}
        </span>

        <strong>{preview.title}</strong>

        {preview.description && (
          <p>{preview.description}</p>
        )}
      </div>

      <ExternalLink
        size={15}
        className="alumni-link-preview-external"
      />
    </a>
  );
}

/* ALUMNI_1_4_0_LINK_PREVIEW_CARD */
