"use client";

type SocialProfile = {
  website?: string | null;
  github?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
};

type Props = {
  profile: SocialProfile;
  className?: string;
};

function normalizeWebsite(value: string) {
  const clean = value.trim();
  if (!clean) return "";
  return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
}

function normalizeSocial(
  value: string,
  baseUrl: string,
  stripPrefixes: string[] = []
) {
  const clean = value.trim();
  if (!clean) return "";

  if (/^https?:\/\//i.test(clean)) return clean;

  let handle = clean.replace(/^@/, "");
  for (const prefix of stripPrefixes) {
    handle = handle.replace(prefix, "");
  }

  return `${baseUrl}${handle.replace(/^\/+/, "")}`;
}

function shortValue(value: string, fallback: string) {
  const clean = value.trim();
  if (!clean) return fallback;

  try {
    const url = new URL(normalizeWebsite(clean));
    const path = url.pathname.replace(/^\/|\/$/g, "");
    return path || url.hostname.replace(/^www\./, "");
  } catch {
    return clean.replace(/^@/, "");
  }
}

export default function ProfileSocialLinks({
  profile,
  className = "",
}: Props) {
  const links = [
    profile.website
      ? {
          key: "website",
          label: "Sitio web",
          display: shortValue(profile.website, "Sitio web"),
          href: normalizeWebsite(profile.website),
          icon: <WebsiteIcon />,
        }
      : null,
    profile.github
      ? {
          key: "github",
          label: "GitHub",
          display: shortValue(profile.github, "GitHub"),
          href: normalizeSocial(
            profile.github,
            "https://github.com/",
            ["github.com/", "www.github.com/"]
          ),
          icon: <GitHubIcon />,
        }
      : null,
    profile.linkedin
      ? {
          key: "linkedin",
          label: "LinkedIn",
          display: shortValue(profile.linkedin, "LinkedIn"),
          href: normalizeSocial(
            profile.linkedin,
            "https://www.linkedin.com/in/",
            [
              "linkedin.com/in/",
              "www.linkedin.com/in/",
              "linkedin.com/",
              "www.linkedin.com/",
            ]
          ),
          icon: <LinkedInIcon />,
        }
      : null,
    profile.instagram
      ? {
          key: "instagram",
          label: "Instagram",
          display: shortValue(profile.instagram, "Instagram"),
          href: normalizeSocial(
            profile.instagram,
            "https://www.instagram.com/",
            ["instagram.com/", "www.instagram.com/"]
          ),
          icon: <InstagramIcon />,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    display: string;
    href: string;
    icon: React.ReactNode;
  }>;

  if (!links.length) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {links.map((link) => (
        <a
          key={link.key}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`Abrir ${link.label}`}
          title={link.label}
          className="group flex h-9 max-w-full items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-xs font-bold text-zinc-500 transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-zinc-200"
        >
          <span className="flex h-4 w-4 shrink-0 items-center justify-center text-zinc-500 transition group-hover:text-white">
            {link.icon}
          </span>
          <span className="max-w-[170px] truncate">{link.display}</span>
        </a>
      ))}
    </div>
  );
}

function WebsiteIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3.5 12h17M12 3c2.4 2.55 3.6 5.55 3.6 9S14.4 18.45 12 21M12 3C9.6 5.55 8.4 8.55 8.4 12S9.6 18.45 12 21"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.2-3.37-1.2-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.56 2.35 1.11 2.92.85.09-.66.35-1.11.64-1.36-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.97c.85 0 1.7.12 2.5.34 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.95.68 1.92 0 1.39-.01 2.51-.01 2.85 0 .27.18.59.69.49A10.19 10.19 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M5.25 3.5A2.25 2.25 0 1 1 5.25 8a2.25 2.25 0 0 1 0-4.5ZM3.3 9.5h3.9V21H3.3V9.5Zm6.2 0h3.74v1.57h.05c.52-.99 1.8-2.03 3.7-2.03 3.96 0 4.69 2.64 4.69 6.07V21h-3.9v-5.22c0-1.25-.02-2.85-1.72-2.85-1.72 0-1.98 1.36-1.98 2.76V21H9.5V9.5Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <rect
        x="3.3"
        y="3.3"
        width="17.4"
        height="17.4"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.4" cy="6.8" r="1.05" fill="currentColor" />
    </svg>
  );
}
