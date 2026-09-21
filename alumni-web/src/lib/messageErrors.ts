"use client";

export function getMessageErrorText(
  error: unknown,
  fallback: string
) {
  let message = "";

  if (
    error instanceof Error
  ) {
    message =
      error.message;
  } else if (
    typeof error ===
      "object" &&
    error !== null &&
    "message" in error
  ) {
    const value =
      (error as {
        message?: unknown;
      }).message;

    if (
      typeof value ===
      "string"
    ) {
      message = value;
    }
  }

  const normalized =
    message
      .trim()
      .toLowerCase();

  if (
    normalized.includes(
      "failed to fetch"
    ) ||
    normalized.includes(
      "network"
    )
  ) {
    return "No pudimos conectar con Alumni. Revisa tu conexión e intenta de nuevo.";
  }

  if (
    normalized.includes(
      "payload too large"
    ) ||
    normalized.includes(
      "request entity too large"
    )
  ) {
    return "El archivo es demasiado grande para enviarlo.";
  }

  return (
    message.trim() ||
    fallback
  );
}

/* ALUMNI_10_2_2_MESSAGE_ERRORS */