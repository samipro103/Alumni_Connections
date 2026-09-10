const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER = "ALUMNI_MEDIA_RENDERING_1_0_INSTAGRAM_LEVEL";

const FILES = {
  feedPost: path.join(
    ROOT,
    "src",
    "components",
    "feed",
    "FeedPost.tsx"
  ),
  feedPage: path.join(
    ROOT,
    "src",
    "app",
    "feed",
    "page.tsx"
  ),
  savedTab: path.join(
    ROOT,
    "src",
    "components",
    "profile",
    "ProfileSavedTab.tsx"
  ),
  ownProfile: path.join(
    ROOT,
    "src",
    "app",
    "profile",
    "page.tsx"
  ),
  publicProfile: path.join(
    ROOT,
    "src",
    "app",
    "u",
    "[username]",
    "page.tsx"
  ),
  pipeline: path.join(
    ROOT,
    "src",
    "lib",
    "postImagePipeline.ts"
  ),
  helper: path.join(
    ROOT,
    "src",
    "lib",
    "postMediaPresentation.ts"
  ),
  css: path.join(
    ROOT,
    "src",
    "app",
    "media-rendering-1-0.css"
  ),
};

for (const [name, file] of Object.entries(FILES)) {
  if (
    ["helper", "css"].includes(name)
  ) {
    continue;
  }

  if (!fs.existsSync(file)) {
    console.error("❌ No encontré:", file);
    console.error("Ejecutá este parche desde alumni-web.");
    process.exit(1);
  }
}

function read(file) {
  return fs
    .readFileSync(file, "utf8")
    .replace(/\r\n/g, "\n");
}

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

function ensureImport(source, anchor, line, label) {
  if (source.includes(line)) {
    return source;
  }

  if (!source.includes(anchor)) {
    fail(
      `No encontré el punto de importación para ${label}.`
    );
  }

  return source.replace(
    anchor,
    `${anchor}\n${line}`
  );
}

function backup(file) {
  const target =
    file + ".before-media-rendering-1.0.bak";

  if (!fs.existsSync(target)) {
    fs.copyFileSync(file, target);
  }
}

let feedPost = read(FILES.feedPost);
let feedPage = read(FILES.feedPage);
let savedTab = read(FILES.savedTab);
let ownProfile = read(FILES.ownProfile);
let publicProfile = read(FILES.publicProfile);
let pipeline = read(FILES.pipeline);

console.log("✅ Feed detectado");
console.log("✅ Perfil propio detectado");
console.log("✅ Perfil público detectado");
console.log("✅ Guardados detectado");
console.log("✅ Pipeline de imágenes detectado");

/* ================================================================
   1) HELPER ÚNICO DE PRESENTACIÓN
   ================================================================ */

const helper = `export type PostMediaFrame =
  | "portrait"
  | "square"
  | "landscape"
  | "wide";

export type PostMediaDimensions = {
  width?: number | null;
  height?: number | null;
};

const FRAME_RATIO: Record<
  PostMediaFrame,
  number
> = {
  portrait: 4 / 5,
  square: 1,
  landscape: 4 / 3,
  wide: 16 / 9,
};

export function classifyPostMediaFrame(
  width?: number | null,
  height?: number | null
): PostMediaFrame {
  const safeWidth = Number(width || 0);
  const safeHeight = Number(height || 0);

  if (
    safeWidth <= 0 ||
    safeHeight <= 0
  ) {
    return "square";
  }

  const ratio =
    safeWidth / safeHeight;

  /*
   * ALUMNI visual rhythm:
   * - vertical extremo / retrato -> 4:5
   * - casi cuadrado -> 1:1
   * - horizontal normal -> 4:3
   * - panorámico -> 16:9
   */
  if (ratio < 0.9) {
    return "portrait";
  }

  if (ratio < 1.12) {
    return "square";
  }

  if (ratio < 1.55) {
    return "landscape";
  }

  return "wide";
}

export function resolvePostMediaFrame(
  items: Array<
    PostMediaDimensions & {
      media_type?: string | null;
    }
  >
): PostMediaFrame {
  const firstUsable =
    items.find(
      (item) =>
        Number(item.width || 0) > 0 &&
        Number(item.height || 0) > 0
    ) || items[0];

  return classifyPostMediaFrame(
    firstUsable?.width,
    firstUsable?.height
  );
}

export function shouldPostMediaCover(
  item: PostMediaDimensions,
  frame: PostMediaFrame
) {
  const width =
    Number(item.width || 0);
  const height =
    Number(item.height || 0);

  if (
    width <= 0 ||
    height <= 0
  ) {
    return false;
  }

  const sourceRatio =
    width / height;

  const targetRatio =
    FRAME_RATIO[frame];

  const relativeDifference =
    Math.abs(
      sourceRatio - targetRatio
    ) / targetRatio;

  /*
   * Solo permitimos cover si el recorte es mínimo.
   * Así no cortamos caras, textos, logos o artes.
   */
  return relativeDifference <= 0.045;
}

/* ${MARKER} */
`;

/* ================================================================
   2) FEEDPOST — FRAME ESTABLE + MISMO FRAME EN CARRUSEL
   ================================================================ */

feedPost = ensureImport(
  feedPost,
  'import type { PostMediaItem } from "@/lib/feedMedia";',
  `import {
  classifyPostMediaFrame,
  resolvePostMediaFrame,
  shouldPostMediaCover,
  type PostMediaFrame,
} from "@/lib/postMediaPresentation";`,
  "postMediaPresentation en FeedPost"
);

/* FeedImage recibe el frame común del post/carrusel. */
if (
  !feedPost.includes(
    "  frame,\n  postIndex,"
  )
) {
  const needle = `function FeedImage({
  item,
  postIndex,`;

  if (!feedPost.includes(needle)) {
    fail(
      "FeedPost: no encontré la firma actual de FeedImage."
    );
  }

  feedPost = feedPost.replace(
    needle,
    `function FeedImage({
  item,
  frame,
  postIndex,`
  );
}

if (
  !feedPost.includes(
    "  frame: PostMediaFrame;"
  )
) {
  const needle = `}: {
  item: PostMediaItem;
  postIndex: number;`;

  if (!feedPost.includes(needle)) {
    fail(
      "FeedPost: no encontré los tipos de FeedImage."
    );
  }

  feedPost = feedPost.replace(
    needle,
    `}: {
  item: PostMediaItem;
  frame: PostMediaFrame;
  postIndex: number;`
  );
}

/* Ya no depende únicamente de 4:5. */
if (
  feedPost.includes(
    "  const contain = !isFourFive(item);"
  )
) {
  feedPost = feedPost.replace(
    "  const contain = !isFourFive(item);",
    `  const contain =
    !shouldPostMediaCover(
      item,
      frame
    );`
  );
}

/* Descubre ratio de posts legacy sin width/height. */
if (
  feedPost.includes(
    '          onLoad={() => setLoaded(true)}'
  )
) {
  feedPost = feedPost.replace(
    '          onLoad={() => setLoaded(true)}',
    `          onLoad={(event) => {
            setLoaded(true);

            if (
              mediaIndex !== 0 ||
              (
                Number(item.width || 0) > 0 &&
                Number(item.height || 0) > 0
              )
            ) {
              return;
            }

            const image =
              event.currentTarget;

            const discoveredFrame =
              classifyPostMediaFrame(
                image.naturalWidth,
                image.naturalHeight
              );

            const shell =
              image.closest(
                ".alumni-pro-media-shell"
              );

            shell?.setAttribute(
              "data-media-frame",
              discoveredFrame
            );

            const button =
              image.closest(
                ".alumni-pro-image-button"
              );

            button?.setAttribute(
              "data-fit",
              shouldPostMediaCover(
                {
                  width:
                    image.naturalWidth,
                  height:
                    image.naturalHeight,
                },
                discoveredFrame
              )
                ? "cover"
                : "contain"
            );
          }}`
  );
}

/* Frame calculado una vez por post usando el primer medio utilizable. */
if (
  !feedPost.includes(
    "  const mediaFrame =\n    resolvePostMediaFrame(media);"
  )
) {
  const needle =
    `  const media: PostMediaItem[] = post.mediaItems || [];`;

  if (!feedPost.includes(needle)) {
    fail(
      "FeedPost: no encontré mediaItems."
    );
  }

  feedPost = feedPost.replace(
    needle,
    `${needle}

  /*
   * El primer medio fija el marco de TODO el carrusel.
   * Así las diapositivas no cambian de alto.
   */
  const mediaFrame =
    resolvePostMediaFrame(media);`
  );
}

/* El shell declara su frame. */
if (
  !feedPost.includes(
    'data-media-frame={mediaFrame}'
  )
) {
  const needle =
    `<div className="alumni-pro-media-shell">`;

  if (!feedPost.includes(needle)) {
    fail(
      "FeedPost: no encontré alumni-pro-media-shell."
    );
  }

  feedPost = feedPost.replace(
    needle,
    `<div
          className="alumni-pro-media-shell"
          data-media-frame={mediaFrame}
        >`
  );
}

/* Pasar el frame a cada imagen. */
if (
  !feedPost.includes(
    "                    frame={mediaFrame}"
  )
) {
  const needle = `                  <FeedImage
                    item={item}
                    postIndex={postIndex}`;

  if (!feedPost.includes(needle)) {
    fail(
      "FeedPost: no encontré el uso actual de FeedImage."
    );
  }

  feedPost = feedPost.replace(
    needle,
    `                  <FeedImage
                    item={item}
                    frame={mediaFrame}
                    postIndex={postIndex}`
  );
}

/* Primer video también puede descubrir el ratio real. */
if (
  !feedPost.includes(
    "data-alumni-video-ratio"
  )
) {
  const needle = `        onLoadedData={() => setReady(true)}
        onCanPlay={() => setReady(true)}`;

  if (feedPost.includes(needle)) {
    feedPost = feedPost.replace(
      needle,
      `        data-alumni-video-ratio="auto"
        onLoadedMetadata={(event) => {
          const video =
            event.currentTarget;

          const slide =
            video.closest(
              ".alumni-pro-media-slide"
            );

          const isFirstSlide =
            slide?.parentElement
              ?.firstElementChild ===
            slide;

          if (!isFirstSlide) {
            return;
          }

          const discoveredFrame =
            classifyPostMediaFrame(
              video.videoWidth,
              video.videoHeight
            );

          const shell =
            video.closest(
              ".alumni-pro-media-shell"
            );

          shell?.setAttribute(
            "data-media-frame",
            discoveredFrame
          );
        }}
        onLoadedData={() => setReady(true)}
        onCanPlay={() => setReady(true)}`
    );
  }
}

/* ================================================================
   3) FEED PAGE — CSS NUEVO SIEMPRE AL FINAL
   ================================================================ */

feedPage = feedPage.replace(
  'import "../media-rendering-1-0.css";\n',
  ""
);

const feedCssAnchor =
  'import "./stories-visual-1-1.css";';

if (!feedPage.includes(feedCssAnchor)) {
  fail(
    "Feed page: no encontré el último import visual conocido."
  );
}

feedPage = feedPage.replace(
  feedCssAnchor,
  `${feedCssAnchor}
import "../media-rendering-1-0.css";`
);

/* ================================================================
   4) GUARDADOS — MISMA REGLA VISUAL
   ================================================================ */

savedTab = ensureImport(
  savedTab,
  'import { hydratePostMedia } from "@/lib/privateMedia";',
  `import {
  classifyPostMediaFrame,
  resolvePostMediaFrame,
  shouldPostMediaCover,
} from "@/lib/postMediaPresentation";`,
  "postMediaPresentation en Guardados"
);

if (
  !savedTab.includes(
    "          const mediaFrame =\n            resolvePostMediaFrame(media);"
  )
) {
  const needle = `          const first = media[0] || null;`;

  if (!savedTab.includes(needle)) {
    fail(
      "Guardados: no encontré first media."
    );
  }

  savedTab = savedTab.replace(
    needle,
    `${needle}

          const mediaFrame =
            resolvePostMediaFrame(media);

          const mediaCover =
            first
              ? shouldPostMediaCover(
                  first,
                  mediaFrame
                )
              : false;`
  );
}

if (
  !savedTab.includes(
    'data-media-frame={mediaFrame}'
  )
) {
  const needle = `                  className="relative mt-3 block overflow-hidden bg-[#05070b]"`;

  if (!savedTab.includes(needle)) {
    fail(
      "Guardados: no encontré el contenedor de media."
    );
  }

  savedTab = savedTab.replace(
    needle,
    `                  data-alumni-media-frame="saved"
                  data-media-frame={mediaFrame}
                  data-fit={
                    mediaCover
                      ? "cover"
                      : "contain"
                  }
                  className="alumni-saved-media-frame relative mt-3 block overflow-hidden bg-[#05070b]"`
  );
}

/* Video guardado llena el mismo frame sin deformarse. */
savedTab = savedTab.replace(
  'className="max-h-[500px] w-full object-contain"',
  'className="alumni-adaptive-media-main"'
);

/* Imagen guardada: fondo + main + descubrimiento legacy. */
const savedImageNeedle = `                    <img
                      src={first.media_url || ""}
                      alt=""
                      loading="lazy"
                      className="max-h-[500px] w-full object-contain"
                    />`;

if (
  savedTab.includes(savedImageNeedle)
) {
  savedTab = savedTab.replace(
    savedImageNeedle,
    `                    <>
                      <img
                        src={first.media_url || ""}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        className="alumni-adaptive-media-backdrop"
                      />

                      <img
                        src={first.media_url || ""}
                        alt=""
                        loading="lazy"
                        className="alumni-adaptive-media-main"
                        onLoad={(event) => {
                          if (
                            Number(first.width || 0) > 0 &&
                            Number(first.height || 0) > 0
                          ) {
                            return;
                          }

                          const image =
                            event.currentTarget;

                          const discovered =
                            classifyPostMediaFrame(
                              image.naturalWidth,
                              image.naturalHeight
                            );

                          const frame =
                            image.closest(
                              "[data-alumni-media-frame]"
                            );

                          frame?.setAttribute(
                            "data-media-frame",
                            discovered
                          );

                          frame?.setAttribute(
                            "data-fit",
                            shouldPostMediaCover(
                              {
                                width:
                                  image.naturalWidth,
                                height:
                                  image.naturalHeight,
                              },
                              discovered
                            )
                              ? "cover"
                              : "contain"
                          );
                        }}
                      />
                    </>`
  );
} else if (
  !savedTab.includes(
    "alumni-adaptive-media-backdrop"
  )
) {
  fail(
    "Guardados: no encontré la imagen actual para convertirla al renderer."
  );
}

/* ================================================================
   5) PERFIL PROPIO — SOPORTA 1.1.1 Y 1.2.0B LAUNCH
   ================================================================ */

ownProfile = ensureImport(
  ownProfile,
  'import { hydratePostMedia } from "@/lib/privateMedia";',
  `import {
  classifyPostMediaFrame,
  shouldPostMediaCover,
} from "@/lib/postMediaPresentation";`,
  "postMediaPresentation en /profile"
);

ownProfile = ensureImport(
  ownProfile,
  'import { shareAlumniContent } from "@/lib/nativeExperience";',
  'import { toPublicImageCdnUrl } from "@/lib/imageCdn";',
  "image CDN en /profile"
);

ownProfile = ownProfile.replace(
  'import "../media-rendering-1-0.css";\n',
  ""
);

const ownCssAnchor =
  'import "@/components/profile/ProfilePostOwnerMenu.css";';

if (!ownProfile.includes(ownCssAnchor)) {
  fail(
    "/profile: no encontré ProfilePostOwnerMenu.css."
  );
}

ownProfile = ownProfile.replace(
  ownCssAnchor,
  `${ownCssAnchor}
import "../media-rendering-1-0.css";`
);

function upgradeOwnProfileMedia(
  input,
  className
) {
  let output = input;

  const openNeedle =
    `<div className="${className}">`;

  if (
    output.includes(openNeedle) &&
    !output.includes(
      `<div
                          className="${className}"
                          data-alumni-media-frame="profile"`
    )
  ) {
    output = output.replace(
      openNeedle,
      `<div
                          className="${className}"
                          data-alumni-media-frame="profile"
                          data-media-frame="square"
                          data-fit="contain"
                        >`
    );
  }

  const imageNeedle = `                            <img
                              src={post.image_url}
                              alt="Publicación"
                            />`;

  if (
    output.includes(imageNeedle)
  ) {
    output = output.replace(
      imageNeedle,
      `                            <img
                              src={toPublicImageCdnUrl(
                                post.image_url
                              )}
                              alt=""
                              aria-hidden="true"
                              className="alumni-adaptive-media-backdrop"
                            />

                            <img
                              src={toPublicImageCdnUrl(
                                post.image_url
                              )}
                              alt="Publicación"
                              className="alumni-adaptive-media-main"
                              onLoad={(event) => {
                                const image =
                                  event.currentTarget;

                                const discovered =
                                  classifyPostMediaFrame(
                                    image.naturalWidth,
                                    image.naturalHeight
                                  );

                                const frame =
                                  image.closest(
                                    "[data-alumni-media-frame]"
                                  );

                                frame?.setAttribute(
                                  "data-media-frame",
                                  discovered
                                );

                                frame?.setAttribute(
                                  "data-fit",
                                  shouldPostMediaCover(
                                    {
                                      width:
                                        image.naturalWidth,
                                      height:
                                        image.naturalHeight,
                                    },
                                    discovered
                                  )
                                    ? "cover"
                                    : "contain"
                                );
                              }}
                            />`
    );
  }

  return output;
}

const ownBefore = ownProfile;

ownProfile =
  upgradeOwnProfileMedia(
    ownProfile,
    "alumni-profile-pro-media"
  );

ownProfile =
  upgradeOwnProfileMedia(
    ownProfile,
    "alumni-profile-launch-media"
  );

if (
  ownBefore === ownProfile &&
  !ownProfile.includes(
    'data-alumni-media-frame="profile"'
  )
) {
  /*
   * Puede ocurrir si /profile todavía no tiene posts visuales
   * del diseño esperado. El CSS queda instalado y el parche
   * no rompe la página.
   */
  console.warn(
    "⚠️ /profile no expuso un bloque image_url reconocido; " +
    "se instaló la capa CSS igualmente."
  );
}

/* ================================================================
   6) PERFIL PÚBLICO /u/[username]
   ================================================================ */

publicProfile = ensureImport(
  publicProfile,
  'import { hydratePostMedia } from "@/lib/privateMedia";',
  `import {
  classifyPostMediaFrame,
  shouldPostMediaCover,
} from "@/lib/postMediaPresentation";`,
  "postMediaPresentation en perfil público"
);

publicProfile = ensureImport(
  publicProfile,
  'import { hydratePostMedia } from "@/lib/privateMedia";',
  'import { toPublicImageCdnUrl } from "@/lib/imageCdn";',
  "image CDN en perfil público"
);

publicProfile =
  publicProfile.replace(
    'import "../../media-rendering-1-0.css";\n',
    ""
  );

const publicCssAnchor =
  'import "./profile-option-3-exact.css";';

if (!publicProfile.includes(publicCssAnchor)) {
  fail(
    "Perfil público: no encontré profile-option-3-exact.css."
  );
}

publicProfile = publicProfile.replace(
  publicCssAnchor,
  `${publicCssAnchor}
import "../../media-rendering-1-0.css";`
);

if (
  !publicProfile.includes(
    'data-alumni-media-frame="public-profile"'
  )
) {
  const publicOpen =
    `<div className="alumni-profile-v3-media">`;

  if (!publicProfile.includes(publicOpen)) {
    fail(
      "Perfil público: no encontré alumni-profile-v3-media."
    );
  }

  publicProfile =
    publicProfile.replace(
      publicOpen,
      `<div
                              className="alumni-profile-v3-media"
                              data-alumni-media-frame="public-profile"
                              data-media-frame="square"
                              data-fit="contain"
                            >`
    );
}

const publicImageNeedle = `                              <img
                                src={post.image_url}
                                alt="Publicación"
                              />`;

if (
  publicProfile.includes(
    publicImageNeedle
  )
) {
  publicProfile =
    publicProfile.replace(
      publicImageNeedle,
      `                              <img
                                src={toPublicImageCdnUrl(
                                  post.image_url
                                )}
                                alt=""
                                aria-hidden="true"
                                className="alumni-adaptive-media-backdrop"
                              />

                              <img
                                src={toPublicImageCdnUrl(
                                  post.image_url
                                )}
                                alt="Publicación"
                                className="alumni-adaptive-media-main"
                                onLoad={(event) => {
                                  const image =
                                    event.currentTarget;

                                  const discovered =
                                    classifyPostMediaFrame(
                                      image.naturalWidth,
                                      image.naturalHeight
                                    );

                                  const frame =
                                    image.closest(
                                      "[data-alumni-media-frame]"
                                    );

                                  frame?.setAttribute(
                                    "data-media-frame",
                                    discovered
                                  );

                                  frame?.setAttribute(
                                    "data-fit",
                                    shouldPostMediaCover(
                                      {
                                        width:
                                          image.naturalWidth,
                                        height:
                                          image.naturalHeight,
                                      },
                                      discovered
                                    )
                                      ? "cover"
                                      : "contain"
                                  );
                                }}
                              />`
    );
} else if (
  !publicProfile.includes(
    "alumni-adaptive-media-backdrop"
  )
) {
  fail(
    "Perfil público: no encontré la imagen del post."
  );
}

/* ================================================================
   7) PIPELINE DE SUBIDA — MÁS APTO PARA MÓVIL
   ================================================================ */

/*
 * 2560px conserva margen de sobra para fullscreen/retina,
 * pero evita servir 3200px en el feed.
 */
pipeline = pipeline.replace(
  "const MAX_LONG_EDGE = 3200;",
  "const MAX_LONG_EDGE = 2560;"
);

/*
 * Evitar passthrough de fotos de 8–10MB.
 */
pipeline = pipeline.replace(
  `const PASSTHROUGH_BYTES =
  10 * 1024 * 1024;`,
  `const PASSTHROUGH_BYTES =
  3 * 1024 * 1024;`
);

/*
 * WebP 90%: visualmente alto, mucho más razonable para móvil.
 */
pipeline = pipeline.replace(
  "const OUTPUT_QUALITY = 0.96;",
  "const OUTPUT_QUALITY = 0.90;"
);

pipeline = pipeline.replace(
  `      0.97
    );`,
  `      0.92
    );`
);

/* ================================================================
   8) CSS ÚNICO PARA TODAS LAS SUPERFICIES
   ================================================================ */

const css = `/*
 * ${MARKER}
 *
 * Render fotográfico consistente:
 * portrait   = 4:5
 * square     = 1:1
 * landscape  = 4:3
 * wide       = 16:9
 *
 * La imagen nunca se deforma.
 * Cover solo si el recorte sería mínimo.
 * Si no, contain + backdrop visual.
 */

/* =========================================================
   FRAME RATIOS
   ========================================================= */

.alumni-pro-media-shell[data-media-frame="portrait"]
  .alumni-pro-carousel,
.alumni-saved-media-frame[data-media-frame="portrait"],
.alumni-profile-pro-media[data-media-frame="portrait"],
.alumni-profile-launch-media[data-media-frame="portrait"],
.alumni-profile-v3-media[data-media-frame="portrait"] {
  aspect-ratio: 4 / 5 !important;
}

.alumni-pro-media-shell[data-media-frame="square"]
  .alumni-pro-carousel,
.alumni-saved-media-frame[data-media-frame="square"],
.alumni-profile-pro-media[data-media-frame="square"],
.alumni-profile-launch-media[data-media-frame="square"],
.alumni-profile-v3-media[data-media-frame="square"] {
  aspect-ratio: 1 / 1 !important;
}

.alumni-pro-media-shell[data-media-frame="landscape"]
  .alumni-pro-carousel,
.alumni-saved-media-frame[data-media-frame="landscape"],
.alumni-profile-pro-media[data-media-frame="landscape"],
.alumni-profile-launch-media[data-media-frame="landscape"],
.alumni-profile-v3-media[data-media-frame="landscape"] {
  aspect-ratio: 4 / 3 !important;
}

.alumni-pro-media-shell[data-media-frame="wide"]
  .alumni-pro-carousel,
.alumni-saved-media-frame[data-media-frame="wide"],
.alumni-profile-pro-media[data-media-frame="wide"],
.alumni-profile-launch-media[data-media-frame="wide"],
.alumni-profile-v3-media[data-media-frame="wide"] {
  aspect-ratio: 16 / 9 !important;
}

/* =========================================================
   FEED
   ========================================================= */

.alumni-feed-page
  .alumni-pro-media-shell {
  overflow: hidden !important;
  background: #05070b;
  contain: layout paint;
}

.alumni-feed-page
  .alumni-pro-carousel {
  width: 100%;
  min-height: 0 !important;
  overflow-x: auto;
  overflow-y: hidden;
  background: #05070b;
}

.alumni-feed-page
  .alumni-pro-media-slide,
.alumni-feed-page
  .alumni-pro-image-button,
.alumni-feed-page
  .alumni-feed-video-wrap {
  height: 100% !important;
  min-height: 0 !important;
}

.alumni-feed-page
  .alumni-pro-media-slide {
  overflow: hidden;
  background: #05070b;
}

.alumni-feed-page
  .alumni-pro-image-button {
  position: relative;
  overflow: hidden;
}

.alumni-feed-page
  .alumni-feed-image-main {
  position: relative;
  z-index: 2;
  display: block;
  width: 100% !important;
  height: 100% !important;
  max-height: none !important;
  object-fit: contain !important;
  background: transparent !important;
}

.alumni-feed-page
  .alumni-pro-image-button[data-fit="cover"]
  .alumni-feed-image-main {
  object-fit: cover !important;
}

/* Existing FeedImage backdrop becomes a premium soft fill. */
.alumni-feed-page
  .alumni-feed-image-backdrop {
  position: absolute;
  inset: -9%;
  z-index: 1;
  width: 118% !important;
  height: 118% !important;
  max-height: none !important;
  object-fit: cover !important;
  filter:
    blur(30px)
    brightness(.52)
    saturate(.82);
  transform: scale(1.06);
  opacity: .82;
  pointer-events: none;
}

.alumni-feed-page
  .alumni-feed-video {
  width: 100% !important;
  height: 100% !important;
  min-height: 0 !important;
  max-height: none !important;
  object-fit: contain !important;
  background: #05070b;
}

/* =========================================================
   SHARED ADAPTIVE IMAGE
   Profiles + Saved
   ========================================================= */

.alumni-saved-media-frame,
.alumni-profile-pro-media,
.alumni-profile-launch-media,
.alumni-profile-v3-media {
  position: relative !important;
  min-height: 0 !important;
  overflow: hidden !important;
  background: #05070b !important;
  contain: layout paint;
}

.alumni-saved-media-frame
  .alumni-adaptive-media-backdrop,
.alumni-profile-pro-media
  .alumni-adaptive-media-backdrop,
.alumni-profile-launch-media
  .alumni-adaptive-media-backdrop,
.alumni-profile-v3-media
  .alumni-adaptive-media-backdrop {
  position: absolute !important;
  inset: -9% !important;
  z-index: 1;
  display: block;
  width: 118% !important;
  height: 118% !important;
  max-height: none !important;
  object-fit: cover !important;
  filter:
    blur(30px)
    brightness(.52)
    saturate(.82);
  transform: scale(1.06);
  opacity: .82;
  pointer-events: none;
}

.alumni-saved-media-frame
  .alumni-adaptive-media-main,
.alumni-profile-pro-media
  .alumni-adaptive-media-main,
.alumni-profile-launch-media
  .alumni-adaptive-media-main,
.alumni-profile-v3-media
  .alumni-adaptive-media-main {
  position: relative !important;
  z-index: 2;
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  max-height: none !important;
  object-fit: contain !important;
  background: transparent !important;
}

.alumni-saved-media-frame[data-fit="cover"]
  .alumni-adaptive-media-main,
.alumni-profile-pro-media[data-fit="cover"]
  .alumni-adaptive-media-main,
.alumni-profile-launch-media[data-fit="cover"]
  .alumni-adaptive-media-main,
.alumni-profile-v3-media[data-fit="cover"]
  .alumni-adaptive-media-main {
  object-fit: cover !important;
}

.alumni-profile-pro-media > button,
.alumni-profile-launch-media > button {
  position: relative;
  z-index: 2;
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  padding: 0 !important;
}

/*
 * En perfil propio el backdrop es hermano del button,
 * por eso el main dentro del button conserva height:100%.
 */
.alumni-profile-pro-media > button
  .alumni-adaptive-media-main,
.alumni-profile-launch-media > button
  .alumni-adaptive-media-main {
  height: 100% !important;
}

/* =========================================================
   MOBILE RHYTHM — IMPORTANT
   ========================================================= */

/*
 * A 360–430px:
 * - portrait nunca supera 4:5
 * - square = un ancho de pantalla aprox
 * - horizontales son naturalmente más bajos
 *
 * Ya no existen verticales 9:16 gigantes.
 */
@media (max-width: 699px) {
  .alumni-pro-media-shell[data-media-frame="portrait"]
    .alumni-pro-carousel,
  .alumni-saved-media-frame[data-media-frame="portrait"],
  .alumni-profile-pro-media[data-media-frame="portrait"],
  .alumni-profile-launch-media[data-media-frame="portrait"],
  .alumni-profile-v3-media[data-media-frame="portrait"] {
    max-height: min(
      82vh,
      540px
    ) !important;
  }
}

/* Desktop es secundario: no dejamos crecer retratos a 900px. */
@media (min-width: 700px) {
  .alumni-pro-media-shell[data-media-frame="portrait"]
    .alumni-pro-carousel,
  .alumni-saved-media-frame[data-media-frame="portrait"],
  .alumni-profile-pro-media[data-media-frame="portrait"],
  .alumni-profile-launch-media[data-media-frame="portrait"],
  .alumni-profile-v3-media[data-media-frame="portrait"] {
    max-height: 680px !important;
  }
}

/* Reduce visual noise for motion-sensitive users. */
@media (prefers-reduced-motion: reduce) {
  .alumni-feed-image-backdrop,
  .alumni-adaptive-media-backdrop {
    filter:
      blur(24px)
      brightness(.52);
  }
}

/* ${MARKER} */
`;

/* ================================================================
   9) VALIDACIONES DE SINTAXIS ANTES DE ESCRIBIR
   ================================================================ */

const candidates = [
  [
    "src/components/feed/FeedPost.tsx",
    feedPost,
  ],
  [
    "src/app/feed/page.tsx",
    feedPage,
  ],
  [
    "src/components/profile/ProfileSavedTab.tsx",
    savedTab,
  ],
  [
    "src/app/profile/page.tsx",
    ownProfile,
  ],
  [
    "src/app/u/[username]/page.tsx",
    publicProfile,
  ],
  [
    "src/lib/postImagePipeline.ts",
    pipeline,
  ],
  [
    "src/lib/postMediaPresentation.ts",
    helper,
  ],
];

try {
  const ts = require("typescript");

  for (const [name, code] of candidates) {
    const scriptKind =
      name.endsWith(".tsx")
        ? ts.ScriptKind.TSX
        : ts.ScriptKind.TS;

    const parsed =
      ts.createSourceFile(
        name,
        code,
        ts.ScriptTarget.Latest,
        true,
        scriptKind
      );

    const diagnostics =
      parsed.parseDiagnostics || [];

    if (diagnostics.length) {
      const first =
        diagnostics[0];

      const message =
        ts.flattenDiagnosticMessageText(
          first.messageText,
          "\n"
        );

      const pos =
        typeof first.start === "number"
          ? parsed.getLineAndCharacterOfPosition(
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
    "✅ Parser TypeScript: todos los TS/TSX válidos"
  );
} catch (error) {
  if (
    error &&
    typeof error === "object" &&
    error.code === "MODULE_NOT_FOUND"
  ) {
    console.warn(
      "⚠️ TypeScript no disponible para validación extra."
    );
  } else {
    throw error;
  }
}

/* Validaciones funcionales mínimas. */
const checks = [
  [
    feedPost,
    'data-media-frame={mediaFrame}',
    "Feed frame"
  ],
  [
    feedPost,
    'frame={mediaFrame}',
    "Feed carousel frame"
  ],
  [
    savedTab,
    'data-media-frame={mediaFrame}',
    "Saved frame"
  ],
  [
    publicProfile,
    'data-alumni-media-frame="public-profile"',
    "Public profile frame"
  ],
  [
    pipeline,
    "const MAX_LONG_EDGE = 2560;",
    "Upload max edge"
  ],
  [
    pipeline,
    "const OUTPUT_QUALITY = 0.90;",
    "Upload WebP quality"
  ],
];

for (
  const [code, token, label]
  of checks
) {
  if (!code.includes(token)) {
    fail(
      `Validación final: falta ${label}.`
    );
  }
}

/* ================================================================
   10) BACKUPS + WRITE
   ================================================================ */

for (const file of [
  FILES.feedPost,
  FILES.feedPage,
  FILES.savedTab,
  FILES.ownProfile,
  FILES.publicProfile,
  FILES.pipeline,
]) {
  backup(file);
}

fs.writeFileSync(
  FILES.helper,
  helper,
  "utf8"
);

fs.writeFileSync(
  FILES.css,
  css,
  "utf8"
);

feedPost +=
  `\n/* ${MARKER} */\n`;

feedPage +=
  `\n/* ${MARKER} */\n`;

savedTab +=
  `\n/* ${MARKER} */\n`;

ownProfile +=
  `\n/* ${MARKER} */\n`;

publicProfile +=
  `\n/* ${MARKER} */\n`;

pipeline +=
  `\n/* ${MARKER} */\n`;

fs.writeFileSync(
  FILES.feedPost,
  feedPost,
  "utf8"
);

fs.writeFileSync(
  FILES.feedPage,
  feedPage,
  "utf8"
);

fs.writeFileSync(
  FILES.savedTab,
  savedTab,
  "utf8"
);

fs.writeFileSync(
  FILES.ownProfile,
  ownProfile,
  "utf8"
);

fs.writeFileSync(
  FILES.publicProfile,
  publicProfile,
  "utf8"
);

fs.writeFileSync(
  FILES.pipeline,
  pipeline,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Media Rendering 1.0 aplicado."
);
console.log(
  "✅ Verticales extremos -> marco 4:5."
);
console.log(
  "✅ Cuadradas -> 1:1."
);
console.log(
  "✅ Horizontales -> 4:3."
);
console.log(
  "✅ Panorámicas -> 16:9."
);
console.log(
  "✅ Carrusel mantiene el mismo alto."
);
console.log(
  "✅ Sin deformación."
);
console.log(
  "✅ Sin cortes agresivos de caras/textos/logos."
);
console.log(
  "✅ Contain usa backdrop suave de la misma imagen."
);
console.log(
  "✅ Feed + Perfil + Perfil público + Guardados."
);
console.log(
  "✅ Legacy images descubren ratio al cargar."
);
console.log(
  "✅ Nuevas imágenes: max 2560px, WebP 90%, passthrough max 3MB."
);
console.log(
  "✅ Mobile-first 360–430px."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
