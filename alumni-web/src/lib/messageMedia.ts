"use client";

const PREVIEW_SIZE = 96;

function canvasPreview(
  source: CanvasImageSource,
  width: number,
  height: number
) {
  const scale =
    Math.min(
      1,
      PREVIEW_SIZE /
        Math.max(
          width,
          height
        )
    );

  const targetWidth =
    Math.max(
      1,
      Math.round(
        width * scale
      )
    );

  const targetHeight =
    Math.max(
      1,
      Math.round(
        height * scale
      )
    );

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    targetWidth;
  canvas.height =
    targetHeight;

  const context =
    canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.drawImage(
    source,
    0,
    0,
    targetWidth,
    targetHeight
  );

  const result =
    canvas.toDataURL(
      "image/jpeg",
      0.42
    );

  return result.length <=
    50000
    ? result
    : null;
}

async function imagePreview(
  file: File
) {
  const url =
    URL.createObjectURL(file);

  try {
    const image =
      new Image();

    image.decoding =
      "async";

    await new Promise<void>(
      (
        resolve,
        reject
      ) => {
        image.onload =
          () => resolve();
        image.onerror =
          () =>
            reject(
              new Error(
                "IMAGE_PREVIEW_FAILED"
              )
            );
        image.src = url;
      }
    );

    return canvasPreview(
      image,
      image.naturalWidth ||
        image.width,
      image.naturalHeight ||
        image.height
    );
  } finally {
    URL.revokeObjectURL(
      url
    );
  }
}

async function videoPreview(
  file: File
) {
  const url =
    URL.createObjectURL(file);

  try {
    const video =
      document.createElement(
        "video"
      );

    video.muted = true;
    video.playsInline = true;
    video.preload =
      "metadata";

    await new Promise<void>(
      (
        resolve,
        reject
      ) => {
        const timeout =
          window.setTimeout(
            () =>
              reject(
                new Error(
                  "VIDEO_PREVIEW_TIMEOUT"
                )
              ),
            4500
          );

        video.onloadeddata =
          () => {
            window.clearTimeout(
              timeout
            );

            if (
              Number.isFinite(
                video.duration
              ) &&
              video.duration >
                0.25
            ) {
              try {
                video.currentTime =
                  Math.min(
                    0.2,
                    video.duration /
                      4
                  );
              } catch {
                resolve();
              }
            } else {
              resolve();
            }
          };

        video.onseeked =
          () => {
            window.clearTimeout(
              timeout
            );
            resolve();
          };

        video.onerror =
          () => {
            window.clearTimeout(
              timeout
            );
            reject(
              new Error(
                "VIDEO_PREVIEW_FAILED"
              )
            );
          };

        video.src = url;
      }
    );

    return canvasPreview(
      video,
      video.videoWidth ||
        PREVIEW_SIZE,
      video.videoHeight ||
        PREVIEW_SIZE
    );
  } finally {
    URL.revokeObjectURL(
      url
    );
  }
}

export async function createMessageMediaPreview(
  file: File
) {
  try {
    if (
      file.type.startsWith(
        "image/"
      )
    ) {
      return await imagePreview(
        file
      );
    }

    if (
      file.type.startsWith(
        "video/"
      )
    ) {
      return await videoPreview(
        file
      );
    }
  } catch (error) {
    console.warn(
      "Media preview:",
      error
    );
  }

  return null;
}

export function formatMediaSize(
  size?: number | null
) {
  if (
    !size ||
    size < 1
  ) {
    return "";
  }

  if (
    size <
    1024 * 1024
  ) {
    return `${Math.max(
      1,
      Math.round(
        size / 1024
      )
    )} KB`;
  }

  return `${(
    size /
    1024 /
    1024
  ).toFixed(1)} MB`;
}
