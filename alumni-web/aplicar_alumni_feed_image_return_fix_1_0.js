const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER = "ALUMNI_FEED_IMAGE_RETURN_FIX_1_0";

const ALUMNI_IMAGE = "src/components/ui/AlumniImage.tsx";
const FEED_POST = "src/components/feed/FeedPost.tsx";

function abs(rel) {
  return path.join(ROOT, rel);
}

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

function read(rel) {
  if (!fs.existsSync(abs(rel))) {
    fail(`No encontré ${rel}`);
  }
  return fs.readFileSync(abs(rel), "utf8").replace(/\r\n/g, "\n");
}

function backup(rel, content) {
  const target = abs(rel) + ".before-feed-image-return-fix-1.0.bak";
  if (!fs.existsSync(target)) {
    fs.writeFileSync(target, content, "utf8");
  }
}

if (!fs.existsSync(abs("package.json"))) {
  fail("Ejecutá este parche dentro de alumni-web.");
}

let alumniImage = read(ALUMNI_IMAGE);
let feedPost = read(FEED_POST);

if (
  alumniImage.includes(MARKER) &&
  feedPost.includes(MARKER)
) {
  console.log("✅ Feed Image Return Fix 1.0 ya estaba aplicado.");
  process.exit(0);
}

backup(ALUMNI_IMAGE, alumniImage);
backup(FEED_POST, feedPost);

/* ======================================================
   AlumniImage: cached image may already be complete before
   React receives onLoad after client-side navigation.
   ====================================================== */

if (!alumniImage.includes("useRef,")) {
  alumniImage = alumniImage.replace(
    `  useEffect,\n  useState,`,
    `  useEffect,\n  useRef,\n  useState,`
  );
}

const stateNeedle = `  const [state, setState] =\n    useState<\n      \"loading\" | \"loaded\" | \"error\"\n    >(initialState);`;

if (!alumniImage.includes("const imageRef =")) {
  if (!alumniImage.includes(stateNeedle)) {
    fail("No encontré el estado de AlumniImage esperado.");
  }

  alumniImage = alumniImage.replace(
    stateNeedle,
    `${stateNeedle}\n\n  const imageRef =\n    useRef<HTMLImageElement>(\n      null\n    );`
  );
}

const oldEffect = `  useEffect(() => {\n    if (!source) {\n      setState(\"error\");\n      return;\n    }\n\n    setState(\n      loadedSources.has(source)\n        ? \"loaded\"\n        : \"loading\"\n    );\n  }, [source]);`;

const newEffect = `  useEffect(() => {\n    if (!source) {\n      setState(\"error\");\n      return;\n    }\n\n    const image =\n      imageRef.current;\n\n    const syncState = () => {\n      const current =\n        imageRef.current;\n\n      if (!current) {\n        return;\n      }\n\n      if (!current.complete) {\n        setState(\"loading\");\n        return;\n      }\n\n      if (current.naturalWidth > 0) {\n        loadedSources.add(source);\n        setState(\"loaded\");\n      } else {\n        setState(\"error\");\n      }\n    };\n\n    if (image?.complete) {\n      syncState();\n    } else {\n      setState(\"loading\");\n    }\n\n    const frame =\n      window.requestAnimationFrame(\n        syncState\n      );\n\n    const timer =\n      window.setTimeout(\n        syncState,\n        80\n      );\n\n    const handleVisible = () => {\n      if (\n        document.visibilityState ===\n        \"visible\"\n      ) {\n        syncState();\n      }\n    };\n\n    window.addEventListener(\n      \"pageshow\",\n      syncState\n    );\n\n    document.addEventListener(\n      \"visibilitychange\",\n      handleVisible\n    );\n\n    return () => {\n      window.cancelAnimationFrame(\n        frame\n      );\n      window.clearTimeout(\n        timer\n      );\n      window.removeEventListener(\n        \"pageshow\",\n        syncState\n      );\n      document.removeEventListener(\n        \"visibilitychange\",\n        handleVisible\n      );\n    };\n  }, [source]);`;

if (alumniImage.includes(oldEffect)) {
  alumniImage = alumniImage.replace(oldEffect, newEffect);
} else if (!alumniImage.includes("window.addEventListener(\n      \"pageshow\"")) {
  fail("El effect de AlumniImage cambió y necesita revisión.");
}

const imgNeedle = `        <img\n          {...rest}\n          src={source}`;

if (!alumniImage.includes("ref={imageRef}")) {
  if (!alumniImage.includes(imgNeedle)) {
    fail("No encontré el img principal de AlumniImage.");
  }

  alumniImage = alumniImage.replace(
    imgNeedle,
    `        <img\n          ref={imageRef}\n          {...rest}\n          src={source}`
  );
}

alumniImage += `\n/* ${MARKER}:ALUMNI_IMAGE */\n`;

/* ======================================================
   FeedImage: same cached-load race on Feed return.
   ====================================================== */

const loadedNeedle = `  const [loaded, setLoaded] =\n    useState(!shouldLoad || !src);`;

if (!feedPost.includes("const imageRef =\n    useRef<HTMLImageElement>")) {
  if (!feedPost.includes(loadedNeedle)) {
    fail("No encontré el estado loaded de FeedImage.");
  }

  feedPost = feedPost.replace(
    loadedNeedle,
    `${loadedNeedle}\n\n  const imageRef =\n    useRef<HTMLImageElement>(\n      null\n    );`
  );
}

const oldFeedEffect = `  useEffect(() => {\n    setLoaded(\n      !shouldLoad || !src\n    );\n  }, [shouldLoad, src]);`;

const newFeedEffect = `  useEffect(() => {\n    if (\n      !shouldLoad ||\n      !src\n    ) {\n      setLoaded(true);\n      return;\n    }\n\n    setLoaded(false);\n\n    const syncLoaded = () => {\n      const image =\n        imageRef.current;\n\n      if (\n        image?.complete &&\n        image.naturalWidth > 0\n      ) {\n        setLoaded(true);\n      }\n    };\n\n    syncLoaded();\n\n    const frame =\n      window.requestAnimationFrame(\n        syncLoaded\n      );\n\n    const timer =\n      window.setTimeout(\n        syncLoaded,\n        80\n      );\n\n    const handleVisible = () => {\n      if (\n        document.visibilityState ===\n        \"visible\"\n      ) {\n        syncLoaded();\n      }\n    };\n\n    window.addEventListener(\n      \"pageshow\",\n      syncLoaded\n    );\n\n    document.addEventListener(\n      \"visibilitychange\",\n      handleVisible\n    );\n\n    return () => {\n      window.cancelAnimationFrame(\n        frame\n      );\n      window.clearTimeout(\n        timer\n      );\n      window.removeEventListener(\n        \"pageshow\",\n        syncLoaded\n      );\n      document.removeEventListener(\n        \"visibilitychange\",\n        handleVisible\n      );\n    };\n  }, [shouldLoad, src]);`;

if (feedPost.includes(oldFeedEffect)) {
  feedPost = feedPost.replace(oldFeedEffect, newFeedEffect);
} else if (!feedPost.includes("const syncLoaded = () =>")) {
  fail("El effect de FeedImage cambió y necesita revisión.");
}

const feedImgNeedle = `        <img\n          className=\"alumni-feed-image-main\"\n          src={src}`;

if (!feedPost.includes("ref={imageRef}\n          className=\"alumni-feed-image-main\"")) {
  if (!feedPost.includes(feedImgNeedle)) {
    fail("No encontré el img principal de FeedImage.");
  }

  feedPost = feedPost.replace(
    feedImgNeedle,
    `        <img\n          ref={imageRef}\n          className=\"alumni-feed-image-main\"\n          src={src}`
  );
}

/* First visible feed media should not wait on browser lazy heuristics. */
feedPost = feedPost.replace(
  `            postIndex === 0 &&\n            mediaIndex === 0 &&\n            active`,
  `            postIndex < 3 &&\n            mediaIndex === 0 &&\n            active`
);

feedPost = feedPost.replace(
  `            postIndex === 0 &&\n            mediaIndex === 0 &&\n            active`,
  `            postIndex < 3 &&\n            mediaIndex === 0 &&\n            active`
);

feedPost += `\n/* ${MARKER}:FEED_POST */\n`;

/* ======================================================
   Validate TSX syntax
   ====================================================== */

try {
  const ts = require("typescript");

  for (const [rel, content] of [
    [ALUMNI_IMAGE, alumniImage],
    [FEED_POST, feedPost],
  ]) {
    const parsed = ts.createSourceFile(
      rel,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

    const diagnostics = parsed.parseDiagnostics || [];

    if (diagnostics.length) {
      const first = diagnostics[0];
      fail(
        `${rel}: ${ts.flattenDiagnosticMessageText(
          first.messageText,
          "\\n"
        )}`
      );
    }
  }

  console.log("✅ Parser TypeScript: archivos válidos");
} catch (error) {
  if (
    !(
      error &&
      typeof error === "object" &&
      error.code === "MODULE_NOT_FOUND"
    )
  ) {
    throw error;
  }
}

fs.writeFileSync(abs(ALUMNI_IMAGE), alumniImage, "utf8");
fs.writeFileSync(abs(FEED_POST), feedPost, "utf8");

console.log("");
console.log("✅ ALUMNI Feed Image Return Fix 1.0 aplicado.");
console.log("✅ Fotos cacheadas se detectan al volver al Feed.");
console.log("✅ Avatares cacheados se detectan al volver al Feed.");
console.log("✅ Primeras fotos visibles usan carga más agresiva.");
console.log("✅ No cambia consultas ni datos del Feed.");
console.log("");
console.log("Ahora ejecutá: npm run build");
