"use client";

import {
  Check,
  RotateCcw,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

type Point = {
  x: number;
  y: number;
};

type Size = {
  width: number;
  height: number;
};

type DragState = {
  pointerId: number;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
};

type PinchState = {
  distance: number;
  zoom: number;
  anchorVector: Point;
};

type Props = {
  file: File;
  position: number;
  total: number;
  onApply: (file: File) => void;
  onSkip: () => void;
  onClose: () => void;
};

const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1350;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distanceBetween(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function midpoint(a: Point, b: Point): Point {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

function outputName(file: File, type: string) {
  const base = file.name.replace(/\.[^.]+$/, "").slice(0, 80) || "foto";
  const extension = type === "image/webp" ? "webp" : "jpg";
  return `alumni-${base}-${Date.now()}.${extension}`;
}

export default function ImageCropEditor({
  file,
  position,
  total,
  onApply,
  onSkip,
  onClose,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const pinchRef = useRef<PinchState | null>(null);
  const pointersRef = useRef<Map<number, Point>>(new Map());
  const zoomRef = useRef(1);
  const offsetRef = useRef<Point>({ x: 0, y: 0 });

  const [natural, setNatural] = useState<Size>({ width: 0, height: 0 });
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const objectUrl = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    zoomRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    pointersRef.current.clear();
    dragRef.current = null;
    pinchRef.current = null;
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setNatural({ width: 0, height: 0 });
    setError("");
  }, [file]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const stage = node;

    function measure() {
      const rect = stage.getBoundingClientRect();
      setViewport({
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
      });
    }

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(stage);

    return () => observer.disconnect();
  }, []);

  function metricsForZoom(nextZoom: number) {
    if (!natural.width || !natural.height || !viewport.width || !viewport.height) {
      return {
        scale: 1,
        width: 0,
        height: 0,
        maxX: 0,
        maxY: 0,
      };
    }

    const coverScale = Math.max(
      viewport.width / natural.width,
      viewport.height / natural.height
    );
    const scale = coverScale * nextZoom;
    const width = natural.width * scale;
    const height = natural.height * scale;

    return {
      scale,
      width,
      height,
      maxX: Math.max(0, (width - viewport.width) / 2),
      maxY: Math.max(0, (height - viewport.height) / 2),
    };
  }

  const metrics = useMemo(
    () => metricsForZoom(zoom),
    [natural, viewport, zoom]
  );

  function commitOffset(next: Point, nextZoom = zoomRef.current) {
    const bounds = metricsForZoom(nextZoom);
    const clamped = {
      x: clamp(next.x, -bounds.maxX, bounds.maxX),
      y: clamp(next.y, -bounds.maxY, bounds.maxY),
    };

    offsetRef.current = clamped;
    setOffset(clamped);
  }

  useEffect(() => {
    setOffset((current) => {
      const next = {
        x: clamp(current.x, -metrics.maxX, metrics.maxX),
        y: clamp(current.y, -metrics.maxY, metrics.maxY),
      };
      offsetRef.current = next;
      return next;
    });
  }, [metrics.maxX, metrics.maxY]);

  function reset() {
    zoomRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  function beginPinch() {
    const points = [...pointersRef.current.values()];
    const stage = stageRef.current;

    if (points.length < 2 || !stage) {
      pinchRef.current = null;
      return;
    }

    const first = points[0];
    const second = points[1];
    const center = midpoint(first, second);
    const rect = stage.getBoundingClientRect();

    pinchRef.current = {
      distance: Math.max(1, distanceBetween(first, second)),
      zoom: zoomRef.current,
      anchorVector: {
        x: center.x - (rect.left + rect.width / 2) - offsetRef.current.x,
        y: center.y - (rect.top + rect.height / 2) - offsetRef.current.y,
      },
    };
    dragRef.current = null;
  }

  function pointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (saving) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (pointersRef.current.size >= 2) {
      beginPinch();
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      offsetX: offsetRef.current.x,
      offsetY: offsetRef.current.y,
    };
  }

  function pointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) return;

    event.preventDefault();
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (pointersRef.current.size >= 2) {
      if (!pinchRef.current) beginPinch();

      const pinch = pinchRef.current;
      const stage = stageRef.current;
      const points = [...pointersRef.current.values()];

      if (!pinch || !stage || points.length < 2) return;

      const first = points[0];
      const second = points[1];
      const nextDistance = Math.max(1, distanceBetween(first, second));
      const nextZoom = clamp(
        pinch.zoom * (nextDistance / pinch.distance),
        MIN_ZOOM,
        MAX_ZOOM
      );
      const currentCenter = midpoint(first, second);
      const rect = stage.getBoundingClientRect();
      const relativeCenter = {
        x: currentCenter.x - (rect.left + rect.width / 2),
        y: currentCenter.y - (rect.top + rect.height / 2),
      };
      const scaleRatio = nextZoom / pinch.zoom;
      const nextOffset = {
        x: relativeCenter.x - pinch.anchorVector.x * scaleRatio,
        y: relativeCenter.y - pinch.anchorVector.y * scaleRatio,
      };

      zoomRef.current = nextZoom;
      setZoom(nextZoom);
      commitOffset(nextOffset, nextZoom);
      return;
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    commitOffset({
      x: drag.offsetX + event.clientX - drag.x,
      y: drag.offsetY + event.clientY - drag.y,
    });
  }

  function pointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(event.pointerId);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    pinchRef.current = null;

    const remaining = [...pointersRef.current.entries()];
    if (remaining.length === 1) {
      const [pointerId, point] = remaining[0];
      dragRef.current = {
        pointerId,
        x: point.x,
        y: point.y,
        offsetX: offsetRef.current.x,
        offsetY: offsetRef.current.y,
      };
    } else {
      dragRef.current = null;
    }
  }

  async function applyCrop() {
    const image = imageRef.current;

    if (
      !image ||
      !natural.width ||
      !natural.height ||
      !viewport.width ||
      !viewport.height ||
      !metrics.scale ||
      saving
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const imageLeft = viewport.width / 2 + offset.x - metrics.width / 2;
      const imageTop = viewport.height / 2 + offset.y - metrics.height / 2;

      const sourceX = clamp(-imageLeft / metrics.scale, 0, natural.width);
      const sourceY = clamp(-imageTop / metrics.scale, 0, natural.height);
      const sourceWidth = Math.min(
        viewport.width / metrics.scale,
        natural.width - sourceX
      );
      const sourceHeight = Math.min(
        viewport.height / metrics.scale,
        natural.height - sourceY
      );

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("No se pudo preparar el recorte.");
      }

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        OUTPUT_WIDTH,
        OUTPUT_HEIGHT
      );

      let blob = await canvasToBlob(canvas, "image/webp", 0.94);

      if (!blob || blob.type !== "image/webp") {
        blob = await canvasToBlob(canvas, "image/jpeg", 0.96);
      }

      if (!blob) {
        throw new Error("No se pudo guardar el recorte.");
      }

      onApply(
        new File([blob], outputName(file, blob.type), {
          type: blob.type,
          lastModified: Date.now(),
        })
      );
    } catch (cropError: any) {
      setError(cropError?.message || "No se pudo recortar la fotografía.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="alumni-feed-crop-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Ajustar fotografía"
      data-pull-refresh-lock="true"
    >
      <div className="alumni-feed-crop-dialog">
        <header className="alumni-feed-crop-header">
          <div>
            <strong>Ajustar foto</strong>
            <span>
              {total > 1 ? `Foto ${position} de ${total}` : "Formato 4:5"}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar editor"
          >
            <X size={20} />
          </button>
        </header>

        <div
          ref={stageRef}
          className="alumni-feed-crop-stage"
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerEnd}
          onPointerCancel={pointerEnd}
        >
          <img
            ref={imageRef}
            src={objectUrl}
            alt="Vista previa del recorte"
            draggable={false}
            onLoad={(event) => {
              setNatural({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              });
            }}
            style={{
              width: metrics.width || undefined,
              height: metrics.height || undefined,
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
            }}
          />

          <div className="alumni-feed-crop-grid" aria-hidden="true" />
          <span className="alumni-feed-crop-hint">
            Arrastra · pellizca para acercar
          </span>
        </div>

        <div className="alumni-feed-crop-controls">
          <button
            type="button"
            className="alumni-feed-crop-reset"
            onClick={reset}
            disabled={saving}
          >
            <RotateCcw size={16} />
            Restablecer
          </button>

          <label className="alumni-feed-crop-zoom">
            <span>Zoom</span>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step="0.01"
              value={zoom}
              disabled={saving}
              onChange={(event) => {
                const nextZoom = clamp(
                  Number(event.target.value),
                  MIN_ZOOM,
                  MAX_ZOOM
                );
                zoomRef.current = nextZoom;
                setZoom(nextZoom);
              }}
              aria-label="Zoom de la fotografía"
            />
          </label>
        </div>

        <p className="alumni-feed-crop-copy">
          La publicación se mostrará en 4:5. Mueve la foto, usa dos dedos para
          acercar o ajustar el encuadre y guarda cuando esté lista.
        </p>

        {error && <p className="alumni-feed-crop-error">{error}</p>}

        <footer className="alumni-feed-crop-footer">
          <button
            type="button"
            onClick={onSkip}
            disabled={saving}
          >
            Omitir
          </button>

          <button
            type="button"
            className="is-primary"
            onClick={applyCrop}
            disabled={saving || !natural.width}
          >
            <Check size={17} />
            {saving ? "Guardando..." : "Usar recorte"}
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ALUMNI_2_5_0_IMAGE_CROP_EDITOR */
