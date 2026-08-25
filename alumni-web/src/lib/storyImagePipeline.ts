"use client";

export type PreparedStoryImage = {
  file: File;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  processed: boolean;
};

const MAX_INPUT_BYTES =
  40 * 1024 * 1024;

const MAX_LONG_EDGE = 2560;

const PASSTHROUGH_BYTES =
  8 * 1024 * 1024;

const OUTPUT_QUALITY = 0.96;

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

async function decodeImage(
  file: File
): Promise<DecodedImage> {
  if (
    typeof createImageBitmap ===
    "function"
  ) {
    try {
      const bitmap =
        await createImageBitmap(file);

      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () =>
          bitmap.close(),
      };
    } catch {
      // Fallback debajo.
    }
  }

  const url =
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
                "No se pudo leer la fotografía."
              )
            );

          img.src = url;
        }
      );

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function createCanvas(
  width: number,
  height: number
) {
  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    Math.max(
      1,
      Math.round(width)
    );

  canvas.height =
    Math.max(
      1,
      Math.round(height)
    );

  return canvas;
}

function highQualityResize(
  source: CanvasImageSource,
  width: number,
  height: number
) {
  const canvas =
    createCanvas(
      width,
      height
    );

  const ctx =
    canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "No se pudo preparar la fotografía."
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
    canvas.width,
    canvas.height
  );

  return canvas;
}

function targetDimensions(
  width: number,
  height: number
) {
  const longEdge =
    Math.max(width, height);

  if (
    longEdge <= MAX_LONG_EDGE
  ) {
    return {
      width,
      height,
    };
  }

  const scale =
    MAX_LONG_EDGE / longEdge;

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

function toBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
) {
  return new Promise<Blob | null>(
    (resolve) => {
      canvas.toBlob(
        resolve,
        type,
        quality
      );
    }
  );
}

async function encodeFinal(
  canvas: HTMLCanvasElement
) {
  const webp =
    await toBlob(
      canvas,
      "image/webp",
      OUTPUT_QUALITY
    );

  if (
    webp &&
    webp.type === "image/webp"
  ) {
    return webp;
  }

  const jpeg =
    await toBlob(
      canvas,
      "image/jpeg",
      0.97
    );

  if (!jpeg) {
    throw new Error(
      "No se pudo optimizar la fotografía."
    );
  }

  return jpeg;
}

function outputName(
  type: string
) {
  const extension =
    type === "image/webp"
      ? "webp"
      : "jpg";

  return `alumni-story-${Date.now()}.${extension}`;
}

export async function prepareStoryImage(
  file: File
): Promise<PreparedStoryImage> {
  if (
    !file.type.startsWith(
      "image/"
    )
  ) {
    throw new Error(
      "Selecciona una fotografía válida."
    );
  }

  if (
    file.size >
    MAX_INPUT_BYTES
  ) {
    throw new Error(
      "La fotografía supera 40 MB."
    );
  }

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
        "La fotografía no tiene dimensiones válidas."
      );
    }

    const target =
      targetDimensions(
        originalWidth,
        originalHeight
      );

    const needsResize =
      target.width !==
        originalWidth ||
      target.height !==
        originalHeight;

    /*
      Si la foto ya está en un tamaño ideal,
      no se vuelve a comprimir.
      Se conserva byte por byte.
    */
    if (
      !needsResize &&
      file.size <=
        PASSTHROUGH_BYTES &&
      PASSTHROUGH_TYPES.has(
        file.type
      )
    ) {
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
      Downscale progresivo:
      evita saltar directamente de 4K/8K
      a tamaño web y conserva más detalle.
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
        highQualityResize(
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
      highQualityResize(
        currentSource,
        target.width,
        target.height
      );

    const blob =
      await encodeFinal(
        finalCanvas
      );

    const optimizedFile =
      new File(
        [blob],
        outputName(blob.type),
        {
          type: blob.type,
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
