"use client";

export type ProfileImageKind =
  | "avatar"
  | "banner";

export type PreparedProfileImage = {
  file: File;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  processed: boolean;
};

const MAX_INPUT_BYTES =
  35 * 1024 * 1024;

const PROFILE_LIMITS = {
  avatar: {
    maxLongEdge: 2048,
    passthroughBytes:
      5 * 1024 * 1024,
    quality: 0.96,
  },
  banner: {
    maxLongEdge: 2560,
    passthroughBytes:
      8 * 1024 * 1024,
    quality: 0.96,
  },
} as const;

const PASSTHROUGH_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  close?: () => void;
};

function imageSize(
  source:
    | ImageBitmap
    | HTMLImageElement
) {
  if ("naturalWidth" in source) {
    return {
      width: source.naturalWidth,
      height: source.naturalHeight,
    };
  }

  return {
    width: source.width,
    height: source.height,
  };
}

async function decodeImage(
  file: File
): Promise<DecodedImage> {
  if (
    typeof createImageBitmap ===
    "function"
  ) {
    try {
      const bitmap =
        await createImageBitmap(
          file
        );

      const size =
        imageSize(bitmap);

      return {
        source: bitmap,
        width: size.width,
        height: size.height,
        close: () => bitmap.close(),
      };
    } catch {
      // Fallback a HTMLImageElement.
    }
  }

  const objectUrl =
    URL.createObjectURL(file);

  try {
    const image =
      await new Promise<HTMLImageElement>(
        (resolve, reject) => {
          const img = new Image();

          img.onload = () =>
            resolve(img);

          img.onerror = () =>
            reject(
              new Error(
                "No se pudo leer la imagen."
              )
            );

          img.src = objectUrl;
        }
      );

    const size =
      imageSize(image);

    return {
      source: image,
      width: size.width,
      height: size.height,
    };
  } finally {
    URL.revokeObjectURL(
      objectUrl
    );
  }
}

function canvas(
  width: number,
  height: number
) {
  const element =
    document.createElement(
      "canvas"
    );

  element.width =
    Math.max(
      1,
      Math.round(width)
    );

  element.height =
    Math.max(
      1,
      Math.round(height)
    );

  return element;
}

function drawHighQuality(
  source: CanvasImageSource,
  width: number,
  height: number
) {
  const output =
    canvas(width, height);

  const ctx =
    output.getContext("2d");

  if (!ctx) {
    throw new Error(
      "No se pudo preparar la imagen."
    );
  }

  ctx.imageSmoothingEnabled =
    true;

  ctx.imageSmoothingQuality =
    "high";

  ctx.drawImage(
    source,
    0,
    0,
    output.width,
    output.height
  );

  return output;
}

function encodeCanvas(
  source: HTMLCanvasElement,
  quality: number
) {
  return new Promise<Blob>(
    (resolve, reject) => {
      source.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                "No se pudo optimizar la imagen."
              )
            );
            return;
          }

          resolve(blob);
        },
        "image/webp",
        quality
      );
    }
  );
}

function targetDimensions(
  width: number,
  height: number,
  maxLongEdge: number
) {
  const longEdge =
    Math.max(width, height);

  if (
    longEdge <= maxLongEdge
  ) {
    return {
      width,
      height,
    };
  }

  const scale =
    maxLongEdge / longEdge;

  return {
    width:
      Math.round(
        width * scale
      ),
    height:
      Math.round(
        height * scale
      ),
  };
}

function optimizedName(
  kind: ProfileImageKind
) {
  return `alumni-${kind}-${Date.now()}.webp`;
}

export async function prepareProfileImage(
  file: File,
  kind: ProfileImageKind
): Promise<PreparedProfileImage> {
  if (
    !file.type.startsWith(
      "image/"
    )
  ) {
    throw new Error(
      "Selecciona una imagen válida."
    );
  }

  if (
    file.size >
    MAX_INPUT_BYTES
  ) {
    throw new Error(
      "La imagen supera 35 MB."
    );
  }

  const config =
    PROFILE_LIMITS[kind];

  const decoded =
    await decodeImage(file);

  try {
    const originalWidth =
      decoded.width;

    const originalHeight =
      decoded.height;

    if (
      !originalWidth ||
      !originalHeight
    ) {
      throw new Error(
        "La imagen no tiene dimensiones válidas."
      );
    }

    const target =
      targetDimensions(
        originalWidth,
        originalHeight,
        config.maxLongEdge
      );

    const needsResize =
      target.width !==
        originalWidth ||
      target.height !==
        originalHeight;

    const canPassThrough =
      !needsResize &&
      file.size <=
        config.passthroughBytes &&
      PASSTHROUGH_TYPES.has(
        file.type
      );

    /*
      Regla principal:
      si ya está optimizada, NO se vuelve
      a comprimir. Se conserva byte a byte.
    */
    if (canPassThrough) {
      return {
        file,
        originalWidth,
        originalHeight,
        width: originalWidth,
        height: originalHeight,
        processed: false,
      };
    }

    /*
      Downscale progresivo.
      Reducir en pasos evita perder detalle
      al pasar de una foto 4K/8K a tamaño web.
    */
    let currentSource =
      decoded.source;

    let currentWidth =
      originalWidth;

    let currentHeight =
      originalHeight;

    let workingCanvas:
      | HTMLCanvasElement
      | null = null;

    while (
      currentWidth >
        target.width * 1.75 ||
      currentHeight >
        target.height * 1.75
    ) {
      const nextWidth =
        Math.max(
          target.width,
          Math.round(
            currentWidth / 2
          )
        );

      const nextHeight =
        Math.max(
          target.height,
          Math.round(
            currentHeight / 2
          )
        );

      workingCanvas =
        drawHighQuality(
          currentSource,
          nextWidth,
          nextHeight
        );

      currentSource =
        workingCanvas;

      currentWidth =
        workingCanvas.width;

      currentHeight =
        workingCanvas.height;
    }

    const finalCanvas =
      drawHighQuality(
        currentSource,
        target.width,
        target.height
      );

    const blob =
      await encodeCanvas(
        finalCanvas,
        config.quality
      );

    const optimizedFile =
      new File(
        [blob],
        optimizedName(kind),
        {
          type: "image/webp",
          lastModified:
            Date.now(),
        }
      );

    return {
      file: optimizedFile,
      originalWidth,
      originalHeight,
      width:
        finalCanvas.width,
      height:
        finalCanvas.height,
      processed: true,
    };
  } finally {
    decoded.close?.();
  }
}
