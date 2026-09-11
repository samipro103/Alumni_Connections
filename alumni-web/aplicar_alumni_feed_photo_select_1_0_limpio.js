const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_FEED_PHOTO_SELECT_1_0_LIMPIO";

const composerPath = path.join(
  ROOT,
  "src",
  "components",
  "feed",
  "PostComposer.tsx"
);

const editorPath = path.join(
  ROOT,
  "src",
  "components",
  "feed",
  "ImageCropEditor.tsx"
);

const feedPagePath = path.join(
  ROOT,
  "src",
  "app",
  "feed",
  "page.tsx"
);

const cssPath = path.join(
  ROOT,
  "src",
  "app",
  "feed",
  "feed-photo-confirm-1-0.css"
);

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

function read(file) {
  if (!fs.existsSync(file)) {
    fail(
      "No encontré " +
      path.relative(ROOT, file) +
      ". Ejecutá este parche desde alumni-web."
    );
  }

  return fs
    .readFileSync(file, "utf8")
    .replace(/\r\n/g, "\n");
}

function replaceRequired(
  source,
  before,
  after,
  label
) {
  if (source.includes(after)) {
    return source;
  }

  if (!source.includes(before)) {
    fail(
      `No encontré el bloque esperado: ${label}. ` +
      "No escribí ningún archivo."
    );
  }

  return source.replace(
    before,
    after
  );
}

function backup(file) {
  const target =
    file +
    ".before-feed-photo-select-1.0.bak";

  if (!fs.existsSync(target)) {
    fs.copyFileSync(
      file,
      target
    );
  }
}

let composer = read(
  composerPath
);

let feedPage = read(
  feedPagePath
);

if (
  composer.includes(MARKER) &&
  fs.existsSync(cssPath) &&
  read(editorPath).includes(
    MARKER
  )
) {
  console.log(
    "✅ Feed Photo Select 1.0 ya estaba aplicado."
  );
  process.exit(0);
}

/* =========================================================
   1. POST COMPOSER
   ========================================================= */

if (
  !composer.includes(
    'ImageCropEditor from "@/components/feed/ImageCropEditor"'
  )
) {
  fail(
    "PostComposer no parece usar el editor de fotos esperado."
  );
}

/* Remove Crop icon import. */
composer = composer.replace(
  "  Crop,\n",
  ""
);

/* Remove re-open crop text button logic. */
const editFunction = `  function editFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setCropQueue([file]);
  }

`;

composer = composer.replace(
  editFunction,
  ""
);

const cropButton = `                        <>
                          <img
                            src={preview.url}
                            alt=""
                          />

                          <button
                            type="button"
                            className="alumni-feed-preview-crop"
                            onClick={() => editFile(preview.file)}
                            aria-label={\`Ajustar foto \${index + 1}\`}
                          >
                            <Crop size={14} />
                            <span>Ajustar</span>
                          </button>
                        </>`;

composer = replaceRequired(
  composer,
  cropButton,
  `                        <img
                          src={preview.url}
                          alt=""
                        />`,
  "botón Ajustar de la miniatura"
);

/* currentCropIndex is no longer needed. */
const cropIndexBlock = `  const currentCropFile = cropQueue[0] || null;
  const currentCropIndex = currentCropFile
    ? mediaFiles.indexOf(currentCropFile)
    : -1;
`;

composer = replaceRequired(
  composer,
  cropIndexBlock,
  `  const currentCropFile = cropQueue[0] || null;
`,
  "índice del editor de recorte"
);

/* Remove obsolete skip function. */
const skipFunction = `  function skipCrop() {
    setCropQueue((currentQueue) => currentQueue.slice(1));
  }

`;

composer = composer.replace(
  skipFunction,
  ""
);

/* Replace editor invocation. */
const oldEditorCall = `      {currentCropFile && currentCropIndex >= 0 && (
        <ImageCropEditor
          file={currentCropFile}
          position={Math.max(
            1,
            previews
              .filter((item) => item.file.type.startsWith("image/"))
              .findIndex((item) => item.file === currentCropFile) + 1
          )}
          total={
            previews.filter((item) => item.file.type.startsWith("image/"))
              .length
          }
          onApply={applyCrop}
          onSkip={skipCrop}
          onClose={() => setCropQueue([])}
        />
      )}`;

const newEditorCall = `      {currentCropFile && (
        <ImageCropEditor
          file={currentCropFile}
          onApply={applyCrop}
          onAddMore={() =>
            inputRef.current?.click()
          }
          onClose={() =>
            setCropQueue([])
          }
        />
      )}`;

composer = replaceRequired(
  composer,
  oldEditorCall,
  newEditorCall,
  "invocación de ImageCropEditor"
);

composer +=
  `\n/* ${MARKER} */\n`;

/* =========================================================
   2. SIMPLE PHOTO EDITOR
   no zoom / no explanatory text / grid always visible
   ========================================================= */

const editor = `"use client";

import {
  Check,
  Plus,
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

type Props = {
  file: File;
  onApply: (file: File) => void;
  onAddMore: () => void;
  onClose: () => void;
};

const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1350;

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.min(
    max,
    Math.max(
      min,
      value
    )
  );
}

function canvasToBlob(
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

function outputName(
  file: File,
  type: string
) {
  const base =
    file.name
      .replace(
        /\\.[^.]+$/,
        ""
      )
      .slice(
        0,
        80
      ) ||
    "foto";

  const extension =
    type === "image/webp"
      ? "webp"
      : "jpg";

  return \`alumni-\${base}-\${Date.now()}.\${extension}\`;
}

export default function ImageCropEditor({
  file,
  onApply,
  onAddMore,
  onClose,
}: Props) {
  const stageRef =
    useRef<HTMLDivElement>(
      null
    );

  const imageRef =
    useRef<HTMLImageElement>(
      null
    );

  const dragRef =
    useRef<DragState | null>(
      null
    );

  const offsetRef =
    useRef<Point>({
      x: 0,
      y: 0,
    });

  const [
    natural,
    setNatural,
  ] =
    useState<Size>({
      width: 0,
      height: 0,
    });

  const [
    viewport,
    setViewport,
  ] =
    useState<Size>({
      width: 0,
      height: 0,
    });

  const [
    offset,
    setOffset,
  ] =
    useState<Point>({
      x: 0,
      y: 0,
    });

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const objectUrl =
    useMemo(
      () =>
        URL.createObjectURL(
          file
        ),
      [file]
    );

  useEffect(() => {
    return () =>
      URL.revokeObjectURL(
        objectUrl
      );
  }, [objectUrl]);

  useEffect(() => {
    offsetRef.current = {
      x: 0,
      y: 0,
    };

    dragRef.current = null;

    setOffset({
      x: 0,
      y: 0,
    });

    setNatural({
      width: 0,
      height: 0,
    });

    setError("");
  }, [file]);

  useEffect(() => {
    const previous =
      document.body.style
        .overflow;

    document.body.style
      .overflow = "hidden";

    return () => {
      document.body.style
        .overflow =
        previous;
    };
  }, []);

  useEffect(() => {
    const node =
      stageRef.current;

    if (!node) {
      return;
    }

    function measure() {
      const rect =
        node.getBoundingClientRect();

      setViewport({
        width:
          Math.max(
            1,
            rect.width
          ),
        height:
          Math.max(
            1,
            rect.height
          ),
      });
    }

    measure();

    const observer =
      new ResizeObserver(
        measure
      );

    observer.observe(
      node
    );

    return () =>
      observer.disconnect();
  }, []);

  const metrics =
    useMemo(
      () => {
        if (
          !natural.width ||
          !natural.height ||
          !viewport.width ||
          !viewport.height
        ) {
          return {
            scale: 1,
            width: 0,
            height: 0,
            maxX: 0,
            maxY: 0,
          };
        }

        const scale =
          Math.max(
            viewport.width /
              natural.width,
            viewport.height /
              natural.height
          );

        const width =
          natural.width *
          scale;

        const height =
          natural.height *
          scale;

        return {
          scale,
          width,
          height,
          maxX:
            Math.max(
              0,
              (
                width -
                viewport.width
              ) /
                2
            ),
          maxY:
            Math.max(
              0,
              (
                height -
                viewport.height
              ) /
                2
            ),
        };
      },
      [
        natural,
        viewport,
      ]
    );

  function commitOffset(
    next: Point
  ) {
    const clamped = {
      x: clamp(
        next.x,
        -metrics.maxX,
        metrics.maxX
      ),
      y: clamp(
        next.y,
        -metrics.maxY,
        metrics.maxY
      ),
    };

    offsetRef.current =
      clamped;

    setOffset(
      clamped
    );
  }

  useEffect(() => {
    commitOffset(
      offsetRef.current
    );
  }, [
    metrics.maxX,
    metrics.maxY,
  ]);

  function pointerDown(
    event:
      ReactPointerEvent<HTMLDivElement>
  ) {
    if (saving) {
      return;
    }

    event.preventDefault();

    event.currentTarget
      .setPointerCapture(
        event.pointerId
      );

    dragRef.current = {
      pointerId:
        event.pointerId,
      x:
        event.clientX,
      y:
        event.clientY,
      offsetX:
        offsetRef.current.x,
      offsetY:
        offsetRef.current.y,
    };
  }

  function pointerMove(
    event:
      ReactPointerEvent<HTMLDivElement>
  ) {
    const drag =
      dragRef.current;

    if (
      !drag ||
      drag.pointerId !==
        event.pointerId
    ) {
      return;
    }

    event.preventDefault();

    commitOffset({
      x:
        drag.offsetX +
        event.clientX -
        drag.x,
      y:
        drag.offsetY +
        event.clientY -
        drag.y,
    });
  }

  function pointerEnd(
    event:
      ReactPointerEvent<HTMLDivElement>
  ) {
    const drag =
      dragRef.current;

    if (
      drag?.pointerId ===
      event.pointerId
    ) {
      dragRef.current =
        null;
    }

    if (
      event.currentTarget
        .hasPointerCapture(
          event.pointerId
        )
    ) {
      event.currentTarget
        .releasePointerCapture(
          event.pointerId
        );
    }
  }

  async function confirmPhoto() {
    const image =
      imageRef.current;

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
      const imageLeft =
        viewport.width /
          2 +
        offset.x -
        metrics.width /
          2;

      const imageTop =
        viewport.height /
          2 +
        offset.y -
        metrics.height /
          2;

      const sourceX =
        clamp(
          -imageLeft /
            metrics.scale,
          0,
          natural.width
        );

      const sourceY =
        clamp(
          -imageTop /
            metrics.scale,
          0,
          natural.height
        );

      const sourceWidth =
        Math.min(
          viewport.width /
            metrics.scale,
          natural.width -
            sourceX
        );

      const sourceHeight =
        Math.min(
          viewport.height /
            metrics.scale,
          natural.height -
            sourceY
        );

      const canvas =
        document.createElement(
          "canvas"
        );

      canvas.width =
        OUTPUT_WIDTH;

      canvas.height =
        OUTPUT_HEIGHT;

      const context =
        canvas.getContext(
          "2d"
        );

      if (!context) {
        throw new Error(
          "No se pudo preparar la foto."
        );
      }

      context
        .imageSmoothingEnabled =
        true;

      context
        .imageSmoothingQuality =
        "high";

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

      let blob =
        await canvasToBlob(
          canvas,
          "image/webp",
          0.94
        );

      if (
        !blob ||
        blob.type !==
          "image/webp"
      ) {
        blob =
          await canvasToBlob(
            canvas,
            "image/jpeg",
            0.96
          );
      }

      if (!blob) {
        throw new Error(
          "No se pudo confirmar la foto."
        );
      }

      onApply(
        new File(
          [blob],
          outputName(
            file,
            blob.type
          ),
          {
            type:
              blob.type,
            lastModified:
              Date.now(),
          }
        )
      );
    } catch (
      photoError: any
    ) {
      setError(
        photoError?.message ||
          "No se pudo confirmar la foto."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="alumni-photo-confirm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Confirmar fotografía"
      data-pull-refresh-lock="true"
    >
      <div className="alumni-photo-confirm-dialog">
        <header className="alumni-photo-confirm-topbar">
          <button
            type="button"
            className="alumni-photo-confirm-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Salir"
          >
            <X
              size={21}
              strokeWidth={2}
            />
          </button>

          <div className="alumni-photo-confirm-actions">
            <button
              type="button"
              className="alumni-photo-confirm-add"
              onClick={
                onAddMore
              }
              disabled={saving}
              aria-label="Agregar otra foto o video"
            >
              <Plus
                size={21}
                strokeWidth={2}
              />
            </button>

            <button
              type="button"
              className="alumni-photo-confirm-accept"
              onClick={() =>
                void confirmPhoto()
              }
              disabled={
                saving ||
                !natural.width
              }
            >
              <Check
                size={16}
                strokeWidth={2.8}
              />
              <span>
                {saving
                  ? "Confirmando"
                  : "Confirmar"}
              </span>
            </button>
          </div>
        </header>

        <div className="alumni-photo-confirm-body">
          <div
            ref={stageRef}
            className="alumni-photo-confirm-stage"
            onPointerDown={
              pointerDown
            }
            onPointerMove={
              pointerMove
            }
            onPointerUp={
              pointerEnd
            }
            onPointerCancel={
              pointerEnd
            }
          >
            <img
              ref={imageRef}
              src={objectUrl}
              alt=""
              draggable={false}
              onLoad={(
                event
              ) => {
                setNatural({
                  width:
                    event
                      .currentTarget
                      .naturalWidth,
                  height:
                    event
                      .currentTarget
                      .naturalHeight,
                });
              }}
              style={{
                width:
                  metrics.width ||
                  undefined,
                height:
                  metrics.height ||
                  undefined,
                transform:
                  \`translate(-50%, -50%) translate(\${offset.x}px, \${offset.y}px)\`,
              }}
            />

            <div
              className="alumni-photo-confirm-grid"
              aria-hidden="true"
            />
          </div>

          {error && (
            <p
              className="alumni-photo-confirm-error"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ${MARKER} */
`;

/* =========================================================
   3. IMPORT CSS LAST ON FEED
   ========================================================= */

const cssImport =
  'import "./feed-photo-confirm-1-0.css";';

if (
  !feedPage.includes(
    cssImport
  )
) {
  const preferredAnchor =
    'import "../media-rendering-1-0.css";';

  const fallbackAnchor =
    'import "./stories-visual-1-1.css";';

  if (
    feedPage.includes(
      preferredAnchor
    )
  ) {
    feedPage =
      feedPage.replace(
        preferredAnchor,
        preferredAnchor +
          "\n" +
          cssImport
      );
  } else if (
    feedPage.includes(
      fallbackAnchor
    )
  ) {
    feedPage =
      feedPage.replace(
        fallbackAnchor,
        fallbackAnchor +
          "\n" +
          cssImport
      );
  } else {
    fail(
      "No encontré un punto seguro para importar el CSS nuevo del Feed."
    );
  }
}

feedPage +=
  `\n/* ${MARKER} */\n`;

/* =========================================================
   4. CLEAN UI CSS
   ========================================================= */

const css = `/*
 * ${MARKER}
 * Selector / confirmación de foto limpio.
 * Mobile-first.
 */

.alumni-photo-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 2147483400;
  display: flex;
  align-items: stretch;
  justify-content: center;
  overflow: hidden;
  background: var(--app-bg);
  color: var(--app-text);
  overscroll-behavior: contain;
}

.alumni-photo-confirm-dialog {
  display: flex;
  width: 100%;
  max-width: 620px;
  height: 100dvh;
  min-height: 0;
  flex-direction: column;
  background: var(--app-bg);
}

.alumni-photo-confirm-topbar {
  display: flex;
  min-height: calc(
    58px +
    env(safe-area-inset-top)
  );
  flex: 0 0 auto;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding:
    env(safe-area-inset-top)
    12px
    8px;
  border-bottom:
    1px solid
    var(--app-border);
  background:
    color-mix(
      in srgb,
      var(--app-bg) 98%,
      transparent
    );
}

.alumni-photo-confirm-close,
.alumni-photo-confirm-add {
  display: inline-flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border:
    1px solid
    var(--app-border);
  border-radius: 999px;
  background:
    var(--app-surface);
  color:
    var(--app-text);
  box-shadow: none;
  -webkit-tap-highlight-color:
    transparent;
}

.alumni-photo-confirm-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.alumni-photo-confirm-accept {
  display: inline-flex;
  min-width: 112px;
  height: 40px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background:
    var(--app-accent-fill);
  color:
    var(--app-on-accent);
  font-size: 11px;
  font-weight: 900;
  box-shadow: none;
  -webkit-tap-highlight-color:
    transparent;
}

.alumni-photo-confirm-close:active,
.alumni-photo-confirm-add:active,
.alumni-photo-confirm-accept:active {
  transform: scale(.96);
}

.alumni-photo-confirm-close:disabled,
.alumni-photo-confirm-add:disabled,
.alumni-photo-confirm-accept:disabled {
  opacity: .42;
}

.alumni-photo-confirm-body {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background:
    var(--app-bg);
}

.alumni-photo-confirm-stage {
  position: relative;
  width: min(
    100vw,
    620px
  );
  max-width: 100%;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  flex: 0 0 auto;
  background: #05070b;
  touch-action: none;
  user-select: none;
  cursor: grab;
}

.alumni-photo-confirm-stage:active {
  cursor: grabbing;
}

.alumni-photo-confirm-stage
  > img {
  position: absolute;
  top: 50%;
  left: 50%;
  display: block;
  max-width: none;
  max-height: none;
  object-fit: cover;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

/*
 * La cuadrícula SIEMPRE permanece visible.
 * Regla de tercios, limpia, sin texto.
 */
.alumni-photo-confirm-grid {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  border:
    1px solid
    rgba(
      255,
      255,
      255,
      .42
    );
  background-image:
    linear-gradient(
      to right,
      transparent 33.1%,
      rgba(255,255,255,.48) 33.2%,
      rgba(255,255,255,.48) 33.45%,
      transparent 33.55%
    ),
    linear-gradient(
      to right,
      transparent 66.45%,
      rgba(255,255,255,.48) 66.55%,
      rgba(255,255,255,.48) 66.8%,
      transparent 66.9%
    ),
    linear-gradient(
      to bottom,
      transparent 33.1%,
      rgba(255,255,255,.48) 33.2%,
      rgba(255,255,255,.48) 33.45%,
      transparent 33.55%
    ),
    linear-gradient(
      to bottom,
      transparent 66.45%,
      rgba(255,255,255,.48) 66.55%,
      rgba(255,255,255,.48) 66.8%,
      transparent 66.9%
    );
}

.alumni-photo-confirm-error {
  max-width: 90%;
  margin: 10px auto 0;
  color: var(--app-danger);
  font-size: 11px;
  font-weight: 700;
  text-align: center;
}

/*
 * Neutraliza cualquier CSS viejo del editor anterior.
 */
.alumni-feed-crop-overlay,
.alumni-feed-crop-dialog,
.alumni-feed-crop-header,
.alumni-feed-crop-controls,
.alumni-feed-crop-copy,
.alumni-feed-crop-footer,
.alumni-feed-crop-hint,
.alumni-feed-crop-zoom,
.alumni-feed-crop-reset {
  /* El nuevo componente ya no usa estas clases. */
}

/*
 * El preview del compositor queda limpio:
 * no "Ajustar" encima de la fotografía.
 */
.alumni-feed-preview-crop {
  display: none !important;
}

/* Dark / Light: chrome follows ALUMNI theme. */
html[data-theme="dark"]
  .alumni-photo-confirm-overlay,
html[data-theme="dark"]
  .alumni-photo-confirm-dialog,
html[data-theme="dark"]
  .alumni-photo-confirm-body,
html[data-theme="light"]
  .alumni-photo-confirm-overlay,
html[data-theme="light"]
  .alumni-photo-confirm-dialog,
html[data-theme="light"]
  .alumni-photo-confirm-body {
  background:
    var(--app-bg);
}

@media (max-width: 639px) {
  .alumni-photo-confirm-dialog {
    max-width: none;
  }

  .alumni-photo-confirm-stage {
    width: 100vw;
  }

  .alumni-photo-confirm-topbar {
    padding-right: 10px;
    padding-left: 10px;
  }

  .alumni-photo-confirm-accept {
    min-width: 106px;
    padding-inline: 12px;
  }
}

@media (max-width: 360px) {
  .alumni-photo-confirm-close,
  .alumni-photo-confirm-add {
    width: 38px;
    height: 38px;
  }

  .alumni-photo-confirm-accept {
    min-width: 98px;
    height: 38px;
    padding-inline: 10px;
    font-size: 10.5px;
  }
}

@media (min-width: 640px) {
  .alumni-photo-confirm-dialog {
    border-right:
      1px solid
      var(--app-border);
    border-left:
      1px solid
      var(--app-border);
  }

  .alumni-photo-confirm-stage {
    width: min(
      70vh,
      560px
    );
  }
}

/* ${MARKER} */
`;

/* =========================================================
   5. PARSE TSX BEFORE WRITE
   ========================================================= */

try {
  const ts =
    require("typescript");

  for (
    const [name, source]
    of [
      [
        "PostComposer.tsx",
        composer,
      ],
      [
        "ImageCropEditor.tsx",
        editor,
      ],
      [
        "feed/page.tsx",
        feedPage,
      ],
    ]
  ) {
    const parsed =
      ts.createSourceFile(
        name,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

    const diagnostics =
      parsed.parseDiagnostics ||
      [];

    if (
      diagnostics.length
    ) {
      const first =
        diagnostics[0];

      const message =
        ts.flattenDiagnosticMessageText(
          first.messageText,
          "\n"
        );

      const pos =
        typeof first.start ===
        "number"
          ? parsed
              .getLineAndCharacterOfPosition(
                first.start
              )
          : null;

      fail(
        `${name}: sintaxis inválida` +
          (
            pos
              ? ` línea ${pos.line + 1}, columna ${pos.character + 1}`
              : ""
          ) +
          `: ${message}`
      );
    }
  }

  console.log(
    "✅ Parser TypeScript: compositor, editor y Feed válidos"
  );
} catch (error) {
  if (
    error &&
    typeof error === "object" &&
    error.code ===
      "MODULE_NOT_FOUND"
  ) {
    console.warn(
      "⚠️ TypeScript no disponible para validación extra."
    );
  } else {
    throw error;
  }
}

/* Validation */
for (
  const [label, source, token]
  of [
    [
      "PostComposer",
      composer,
      "onAddMore",
    ],
    [
      "Editor",
      editor,
      "alumni-photo-confirm-grid",
    ],
    [
      "Editor no zoom",
      editor,
      "Confirmar",
    ],
    [
      "Feed CSS import",
      feedPage,
      "feed-photo-confirm-1-0.css",
    ],
  ]
) {
  if (
    !source.includes(
      token
    )
  ) {
    fail(
      `Validación falló: ${label}.`
    );
  }
}

if (
  editor.includes(
    'type="range"'
  ) ||
  editor.includes(
    "pellizca"
  ) ||
  editor.includes(
    "Zoom"
  )
) {
  fail(
    "Validación: el editor todavía contiene controles de zoom."
  );
}

/* =========================================================
   6. BACKUP + WRITE
   ========================================================= */

for (const file of [
  composerPath,
  editorPath,
  feedPagePath,
]) {
  backup(file);
}

fs.writeFileSync(
  composerPath,
  composer,
  "utf8"
);

fs.writeFileSync(
  editorPath,
  editor,
  "utf8"
);

fs.writeFileSync(
  feedPagePath,
  feedPage,
  "utf8"
);

fs.writeFileSync(
  cssPath,
  css,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Feed Photo Select 1.0 aplicado."
);
console.log(
  "✅ Zoom eliminado."
);
console.log(
  "✅ Pinch/zoom eliminado."
);
console.log(
  "✅ Textos e instrucciones eliminados."
);
console.log(
  "✅ Restablecer y Omitir eliminados."
);
console.log(
  "✅ X arriba para salir."
);
console.log(
  "✅ + arriba para agregar otra foto/video."
);
console.log(
  "✅ Confirmar arriba."
);
console.log(
  "✅ Cuadrícula SIEMPRE visible."
);
console.log(
  "✅ La foto aún puede desplazarse para encuadrarla."
);
console.log(
  "✅ Botón Ajustar eliminado del preview."
);
console.log(
  "✅ Dark / Light preservados."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
