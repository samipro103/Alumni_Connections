"use client";

export type LocalImageModerationSignal = {
  source: "nsfwjs-client-shadow";
  status: "completed" | "error";
  risk_score: number;
  flagged: boolean;
  classes: Record<string, number>;
  error: string | null;
};

let modelPromise: Promise<any> | null = null;

async function getModel() {
  if (modelPromise) return modelPromise;

  modelPromise = (async () => {
    const tf = await import("@tensorflow/tfjs");
    const nsfwjs = await import("nsfwjs");

    tf.enableProdMode();
    await tf.ready();
    return nsfwjs.load();
  })().catch((error) => {
    modelPromise = null;
    throw error;
  });

  return modelPromise;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen localmente."));
    };

    image.src = url;
  });
}

export async function analyzeImageLocally(
  file: File
): Promise<LocalImageModerationSignal> {
  if (!file.type.startsWith("image/")) {
    return {
      source: "nsfwjs-client-shadow",
      status: "error",
      risk_score: 0,
      flagged: false,
      classes: {},
      error: "El archivo no es una imagen.",
    };
  }

  try {
    const [model, image] = await Promise.all([getModel(), loadImage(file)]);
    const predictions = await model.classify(image);
    const classes: Record<string, number> = {};

    for (const prediction of predictions || []) {
      classes[String(prediction.className)] = Number(prediction.probability || 0);
    }

    const porn = Number(classes.Porn || 0);
    const hentai = Number(classes.Hentai || 0);
    const sexy = Number(classes.Sexy || 0);
    const risk = Math.max(porn, hentai, sexy * 0.72);
    const flagged = porn >= 0.42 || hentai >= 0.42 || risk >= 0.58;

    return {
      source: "nsfwjs-client-shadow",
      status: "completed",
      risk_score: Number(risk.toFixed(4)),
      flagged,
      classes,
      error: null,
    };
  } catch (error: any) {
    return {
      source: "nsfwjs-client-shadow",
      status: "error",
      risk_score: 0,
      flagged: false,
      classes: {},
      error: error?.message || "No se pudo ejecutar el filtro local de imagen.",
    };
  }
}
