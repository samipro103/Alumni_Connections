export type CalendarEventInput = {
  id: string | number;
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt: string;
  endsAt?: string | null;
  url?: string | null;
};

function escapeIcsText(
  value?: string | null
) {
  return String(
    value || ""
  )
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function formatIcsDate(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      "Fecha de evento inválida."
    );
  }

  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function safeCalendarFileName(
  title: string
) {
  const clean =
    title
      .normalize("NFKD")
      .replace(
        /[^\w\s-]+/g,
        ""
      )
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase()
      .slice(0, 70);

  return clean ||
    "evento-alumni";
}

export function buildEventCalendarIcs(
  event: CalendarEventInput
) {
  const start =
    new Date(
      event.startsAt
    );

  if (
    Number.isNaN(
      start.getTime()
    )
  ) {
    throw new Error(
      "Fecha de evento inválida."
    );
  }

  const end =
    event.endsAt
      ? new Date(
          event.endsAt
        )
      : new Date(
          start.getTime() +
            60 *
              60 *
              1000
        );

  if (
    Number.isNaN(
      end.getTime()
    )
  ) {
    throw new Error(
      "Fecha final inválida."
    );
  }

  const created =
    formatIcsDate(
      new Date()
        .toISOString()
    );

  const descriptionParts = [
    event.description,
    event.url,
  ].filter(Boolean);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Alumni//Events//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:event-${event.id}@alumni`,
    `DTSTAMP:${created}`,
    `DTSTART:${formatIcsDate(
      start.toISOString()
    )}`,
    `DTEND:${formatIcsDate(
      end.toISOString()
    )}`,
    `SUMMARY:${escapeIcsText(
      event.title
    )}`,
    event.location
      ? `LOCATION:${escapeIcsText(
          event.location
        )}`
      : null,
    descriptionParts.length
      ? `DESCRIPTION:${escapeIcsText(
          descriptionParts.join(
            "\n\n"
          )
        )}`
      : null,
    event.url
      ? `URL:${escapeIcsText(
          event.url
        )}`
      : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(
      (line): line is string =>
        Boolean(line)
    )
    .join("\r\n");
}

export function downloadEventCalendarFile(
  event: CalendarEventInput
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  const content =
    buildEventCalendarIcs(
      event
    );

  const blob =
    new Blob(
      [content],
      {
        type:
          "text/calendar;charset=utf-8",
      }
    );

  const objectUrl =
    URL.createObjectURL(
      blob
    );

  const anchor =
    document.createElement(
      "a"
    );

  anchor.href =
    objectUrl;

  anchor.download =
    `${safeCalendarFileName(
      event.title
    )}.ics`;

  document.body.appendChild(
    anchor
  );

  anchor.click();
  anchor.remove();

  window.setTimeout(
    () =>
      URL.revokeObjectURL(
        objectUrl
      ),
    0
  );
}

/* ALUMNI_10_5_EVENT_CALENDAR */