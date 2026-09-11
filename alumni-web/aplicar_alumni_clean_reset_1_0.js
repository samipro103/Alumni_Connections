const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_CLEAN_RESET_1_0";

const FEEDBACK =
  "src/app/feedback/page.tsx";
const FEEDBACK_CSS =
  "src/app/feedback/feedback-simple-4-0.css";
const GLOBALS =
  "src/app/globals.css";

function abs(rel) {
  return path.join(
    ROOT,
    rel
  );
}

function fail(message) {
  console.error(
    "❌ " + message
  );
  process.exit(1);
}

function read(rel) {
  if (
    !fs.existsSync(
      abs(rel)
    )
  ) {
    fail(
      `No encontré ${rel}`
    );
  }

  return fs
    .readFileSync(
      abs(rel),
      "utf8"
    )
    .replace(
      /\r\n/g,
      "\n"
    );
}

function backup(
  rel,
  content
) {
  const target =
    abs(rel) +
    ".before-clean-reset-1.0.bak";

  if (
    !fs.existsSync(
      target
    )
  ) {
    fs.writeFileSync(
      target,
      content,
      "utf8"
    );
  }
}

if (
  !fs.existsSync(
    abs("package.json")
  )
) {
  fail(
    "Ejecutá este parche dentro de alumni-web."
  );
}

const oldFeedback =
  read(FEEDBACK);

let globals =
  read(GLOBALS);

if (
  oldFeedback.includes(
    MARKER
  ) &&
  globals.includes(
    MARKER
  )
) {
  console.log(
    "✅ Clean Reset 1.0 ya estaba aplicado."
  );
  process.exit(0);
}

backup(
  FEEDBACK,
  oldFeedback
);
backup(
  GLOBALS,
  globals
);

const nextFeedback =
  "\"use client\";\n\nimport {\n  useEffect,\n  useMemo,\n  useRef,\n  useState,\n} from \"react\";\nimport {\n  useRouter,\n} from \"next/navigation\";\nimport {\n  ArrowLeft,\n  Check,\n  ImagePlus,\n  Send,\n  X,\n} from \"lucide-react\";\nimport {\n  motion,\n  useReducedMotion,\n} from \"framer-motion\";\nimport AppShell from \"@/components/layout/AppShell\";\nimport {\n  useAuth,\n} from \"@/components/auth/AuthProvider\";\nimport {\n  supabase,\n} from \"@/lib/supabase\";\nimport {\n  APP_VERSION,\n} from \"@/lib/appVersion\";\nimport \"./feedback-simple-4-0.css\";\n\nconst MAX_FILES = 4;\nconst MAX_FILE_SIZE =\n  8 * 1024 * 1024;\n\nfunction detectPlatform() {\n  if (\n    typeof navigator ===\n    \"undefined\"\n  ) {\n    return \"Web\";\n  }\n\n  const ua =\n    navigator.userAgent\n      .toLowerCase();\n\n  if (\n    ua.includes(\n      \"android\"\n    )\n  ) {\n    return \"Android\";\n  }\n\n  if (\n    /iphone|ipad|ipod/.test(\n      ua\n    )\n  ) {\n    return \"iOS\";\n  }\n\n  return \"Web\";\n}\n\nexport default function FeedbackPage() {\n  const router =\n    useRouter();\n\n  const {\n    user,\n    loading,\n  } = useAuth();\n\n  const reduceMotion =\n    useReducedMotion();\n\n  const inputRef =\n    useRef<HTMLInputElement>(\n      null\n    );\n\n  const [\n    message,\n    setMessage,\n  ] = useState(\"\");\n\n  const [\n    files,\n    setFiles,\n  ] = useState<File[]>([]);\n\n  const [\n    sending,\n    setSending,\n  ] = useState(false);\n\n  const [\n    sent,\n    setSent,\n  ] = useState(false);\n\n  const [\n    sourcePath,\n    setSourcePath,\n  ] = useState(\"/\");\n\n  useEffect(() => {\n    if (\n      !loading &&\n      !user\n    ) {\n      router.replace(\n        \"/login\"\n      );\n    }\n  }, [\n    loading,\n    user,\n    router,\n  ]);\n\n  useEffect(() => {\n    if (\n      typeof window ===\n      \"undefined\"\n    ) {\n      return;\n    }\n\n    setSourcePath(\n      sessionStorage.getItem(\n        \"alumni_feedback_from\"\n      ) ||\n        document.referrer ||\n        \"/\"\n    );\n  }, []);\n\n  const previews =\n    useMemo(\n      () =>\n        files.map(\n          (file) => ({\n            file,\n            url:\n              URL.createObjectURL(\n                file\n              ),\n          })\n        ),\n      [files]\n    );\n\n  useEffect(() => {\n    return () => {\n      previews.forEach(\n        ({ url }) =>\n          URL.revokeObjectURL(\n            url\n          )\n      );\n    };\n  }, [previews]);\n\n  function addFiles(\n    selected:\n      FileList | null\n  ) {\n    if (!selected) {\n      return;\n    }\n\n    const next =\n      [...files];\n\n    for (\n      const file\n      of Array.from(\n        selected\n      )\n    ) {\n      if (\n        !file.type.startsWith(\n          \"image/\"\n        )\n      ) {\n        continue;\n      }\n\n      if (\n        file.size >\n        MAX_FILE_SIZE\n      ) {\n        alert(\n          `\"${file.name}\" supera 8 MB.`\n        );\n        continue;\n      }\n\n      if (\n        next.length >=\n        MAX_FILES\n      ) {\n        break;\n      }\n\n      next.push(file);\n    }\n\n    setFiles(\n      next.slice(\n        0,\n        MAX_FILES\n      )\n    );\n\n    if (\n      inputRef.current\n    ) {\n      inputRef.current.value =\n        \"\";\n    }\n  }\n\n  function removeFile(\n    index: number\n  ) {\n    setFiles(\n      (current) =>\n        current.filter(\n          (\n            _,\n            currentIndex\n          ) =>\n            currentIndex !==\n            index\n        )\n    );\n  }\n\n  async function sendFeedback() {\n    const clean =\n      message.trim();\n\n    if (\n      !user ||\n      sending ||\n      !clean\n    ) {\n      return;\n    }\n\n    setSending(true);\n\n    const reportId =\n      crypto.randomUUID();\n\n    const uploadedPaths:\n      string[] = [];\n\n    try {\n      for (\n        let index = 0;\n        index <\n        files.length;\n        index += 1\n      ) {\n        const file =\n          files[index];\n\n        const extension =\n          file.name\n            .split(\".\")\n            .pop()\n            ?.toLowerCase() ||\n          (\n            file.type.includes(\n              \"png\"\n            )\n              ? \"png\"\n              : \"jpg\"\n          );\n\n        const path =\n          `${user.id}/${reportId}/${Date.now()}-${index}.${extension}`;\n\n        const {\n          error:\n            uploadError,\n        } =\n          await supabase.storage\n            .from(\n              \"feedback\"\n            )\n            .upload(\n              path,\n              file,\n              {\n                cacheControl:\n                  \"3600\",\n                upsert:\n                  false,\n                contentType:\n                  file.type,\n              }\n            );\n\n        if (\n          uploadError\n        ) {\n          throw uploadError;\n        }\n\n        uploadedPaths.push(\n          path\n        );\n      }\n\n      const generatedTitle =\n        clean\n          .replace(\n            /\\s+/g,\n            \" \"\n          )\n          .slice(\n            0,\n            90\n          ) ||\n        \"Feedback\";\n\n      const {\n        error,\n      } =\n        await supabase\n          .from(\n            \"feedback_reports\"\n          )\n          .insert({\n            id: reportId,\n            user_id:\n              user.id,\n            type: \"other\",\n            priority:\n              \"medium\",\n            title:\n              generatedTitle,\n            description:\n              clean,\n            expected_behavior:\n              null,\n            steps_to_reproduce:\n              null,\n            source_path:\n              sourcePath,\n            platform:\n              detectPlatform(),\n            app_version:\n              APP_VERSION,\n            attachments:\n              uploadedPaths,\n          });\n\n      if (error) {\n        throw error;\n      }\n\n      sessionStorage\n        .removeItem(\n          \"alumni_feedback_from\"\n        );\n\n      setMessage(\"\");\n      setFiles([]);\n      setSent(true);\n    } catch (\n      error: any\n    ) {\n      if (\n        uploadedPaths.length\n      ) {\n        await supabase.storage\n          .from(\"feedback\")\n          .remove(\n            uploadedPaths\n          );\n      }\n\n      console.error(\n        error\n      );\n\n      alert(\n        error?.message ||\n          \"No se pudo enviar el feedback.\"\n      );\n    } finally {\n      setSending(false);\n    }\n  }\n\n  if (\n    loading ||\n    !user\n  ) {\n    return (\n      <AppShell>\n        <main className=\"alumni-feedback-simple\">\n          <div className=\"alumni-feedback-simple-loading\">\n            Cargando...\n          </div>\n        </main>\n      </AppShell>\n    );\n  }\n\n  if (sent) {\n    return (\n      <AppShell>\n        <main\n          className=\"alumni-feedback-simple\"\n          data-alumni-motion-ignore=\"true\"\n        >\n          <motion.section\n            className=\"alumni-feedback-simple-success\"\n            initial={\n              reduceMotion\n                ? false\n                : {\n                    opacity: 0,\n                    y: 12,\n                    scale: 0.98,\n                  }\n            }\n            animate={{\n              opacity: 1,\n              y: 0,\n              scale: 1,\n            }}\n          >\n            <span>\n              <Check\n                size={22}\n              />\n            </span>\n\n            <h1>Enviado</h1>\n\n            <p>\n              Gracias por ayudarnos a mejorar ALUMNI.\n            </p>\n\n            <button\n              type=\"button\"\n              onClick={() =>\n                setSent(false)\n              }\n            >\n              Enviar otro\n            </button>\n          </motion.section>\n        </main>\n      </AppShell>\n    );\n  }\n\n  return (\n    <AppShell>\n      <main\n        className=\"alumni-feedback-simple\"\n        data-alumni-motion-ignore=\"true\"\n      >\n        <header className=\"alumni-feedback-simple-header\">\n          <button\n            type=\"button\"\n            onClick={() =>\n              router.back()\n            }\n            aria-label=\"Volver\"\n          >\n            <ArrowLeft\n              size={19}\n            />\n          </button>\n\n          <h1>\n            Feedback\n          </h1>\n\n          <span />\n        </header>\n\n        <motion.section\n          className=\"alumni-feedback-simple-body\"\n          initial={\n            reduceMotion\n              ? false\n              : {\n                  opacity: 0,\n                  y: 12,\n                }\n          }\n          animate={{\n            opacity: 1,\n            y: 0,\n          }}\n          transition={{\n            duration: 0.42,\n            ease: [\n              0.2,\n              0.8,\n              0.2,\n              1,\n            ],\n          }}\n        >\n          <p>\n            Cuéntanos qué podemos mejorar.\n          </p>\n\n          <textarea\n            value={message}\n            onChange={(\n              event\n            ) =>\n              setMessage(\n                event.target\n                  .value\n              )\n            }\n            maxLength={3000}\n            placeholder=\"Escribe aquí...\"\n            autoFocus\n          />\n\n          {previews.length >\n            0 && (\n            <div className=\"alumni-feedback-simple-previews\">\n              {previews.map(\n                (\n                  preview,\n                  index\n                ) => (\n                  <div\n                    key={\n                      preview.url\n                    }\n                    className=\"alumni-feedback-simple-preview\"\n                  >\n                    <img\n                      src={\n                        preview.url\n                      }\n                      alt=\"\"\n                    />\n\n                    <button\n                      type=\"button\"\n                      onClick={() =>\n                        removeFile(\n                          index\n                        )\n                      }\n                      aria-label=\"Quitar foto\"\n                    >\n                      <X\n                        size={14}\n                      />\n                    </button>\n                  </div>\n                )\n              )}\n            </div>\n          )}\n\n          <div className=\"alumni-feedback-simple-actions\">\n            <button\n              type=\"button\"\n              className=\"alumni-feedback-simple-photo\"\n              onClick={() =>\n                inputRef.current\n                  ?.click()\n              }\n              disabled={\n                files.length >=\n                MAX_FILES\n              }\n            >\n              <ImagePlus\n                size={18}\n              />\n              Fotos\n              {files.length >\n                0 && (\n                <span>\n                  {files.length}/\n                  {MAX_FILES}\n                </span>\n              )}\n            </button>\n\n            <button\n              type=\"button\"\n              className=\"alumni-feedback-simple-send\"\n              disabled={\n                !message.trim() ||\n                sending\n              }\n              onClick={() =>\n                void sendFeedback()\n              }\n            >\n              <Send\n                size={17}\n              />\n              {sending\n                ? \"Enviando...\"\n                : \"Enviar\"}\n            </button>\n          </div>\n\n          <input\n            ref={inputRef}\n            type=\"file\"\n            accept=\"image/*\"\n            multiple\n            hidden\n            onChange={(\n              event\n            ) =>\n              addFiles(\n                event.target\n                  .files\n              )\n            }\n          />\n        </motion.section>\n      </main>\n    </AppShell>\n  );\n}\n\n/* ALUMNI_FEEDBACK_SIMPLE_4_0 */\n/* ALUMNI_CLEAN_RESET_1_0 */\n";

const feedbackCss =
  ".alumni-feedback-simple {\n  width: 100%;\n  max-width: 560px;\n  min-height: 100%;\n  margin: 0 auto;\n  padding:\n    0 0\n    calc(\n      96px +\n      env(safe-area-inset-bottom)\n    );\n  color:\n    var(--app-text);\n}\n\n.alumni-feedback-simple-header {\n  display: grid;\n  grid-template-columns:\n    40px\n    minmax(0, 1fr)\n    40px;\n  min-height: 50px;\n  align-items: center;\n}\n\n.alumni-feedback-simple-header\nbutton {\n  display: inline-flex;\n  width: 38px;\n  height: 38px;\n  align-items: center;\n  justify-content: center;\n  padding: 0;\n  border: 0;\n  border-radius: 12px;\n  background: transparent;\n  color:\n    var(--app-text);\n}\n\n.alumni-feedback-simple-header\nbutton:active {\n  background:\n    var(--app-soft);\n  transform:\n    scale(.93);\n}\n\n.alumni-feedback-simple-header\nh1 {\n  margin: 0;\n  font-size: 15px;\n  font-weight: 900;\n  text-align: center;\n  letter-spacing: -.025em;\n}\n\n.alumni-feedback-simple-body {\n  padding-top: 18px;\n}\n\n.alumni-feedback-simple-body\n> p {\n  margin:\n    0 0 14px;\n  color:\n    var(--app-muted);\n  font-size: 12px;\n  line-height: 1.5;\n}\n\n.alumni-feedback-simple-body\ntextarea {\n  display: block;\n  width: 100%;\n  min-height: 210px;\n  max-height: 52dvh;\n  resize: vertical;\n  padding: 16px;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius: 17px;\n  outline: 0;\n  background:\n    var(--app-surface);\n  color:\n    var(--app-text);\n  font: inherit;\n  font-size: 15px;\n  line-height: 1.55;\n  caret-color:\n    var(--app-accent);\n  transition:\n    border-color\n      160ms ease,\n    box-shadow\n      160ms ease;\n}\n\n.alumni-feedback-simple-body\ntextarea::placeholder {\n  color:\n    var(--app-muted-3);\n}\n\n.alumni-feedback-simple-body\ntextarea:focus {\n  border-color:\n    color-mix(\n      in srgb,\n      var(--app-accent) 42%,\n      var(--app-border)\n    );\n  box-shadow:\n    0 0 0 3px\n    color-mix(\n      in srgb,\n      var(--app-accent) 7%,\n      transparent\n    );\n}\n\n.alumni-feedback-simple-previews {\n  display: grid;\n  grid-template-columns:\n    repeat(\n      4,\n      minmax(0, 1fr)\n    );\n  gap: 8px;\n  margin-top: 10px;\n}\n\n.alumni-feedback-simple-preview {\n  position: relative;\n  aspect-ratio: 1 / 1;\n  overflow: hidden;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius: 12px;\n  background:\n    var(--app-surface-2);\n}\n\n.alumni-feedback-simple-preview\nimg {\n  display: block;\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n\n.alumni-feedback-simple-preview\nbutton {\n  position: absolute;\n  top: 5px;\n  right: 5px;\n  display: inline-flex;\n  width: 25px;\n  height: 25px;\n  align-items: center;\n  justify-content: center;\n  padding: 0;\n  border:\n    1px solid\n    rgba(\n      255,\n      255,\n      255,\n      .14\n    );\n  border-radius: 999px;\n  background:\n    rgba(\n      0,\n      0,\n      0,\n      .62\n    );\n  color: #fff;\n}\n\n.alumni-feedback-simple-actions {\n  display: flex;\n  align-items: center;\n  justify-content:\n    space-between;\n  gap: 10px;\n  margin-top: 12px;\n}\n\n.alumni-feedback-simple-photo,\n.alumni-feedback-simple-send {\n  display: inline-flex;\n  min-height: 42px;\n  align-items: center;\n  justify-content: center;\n  gap: 7px;\n  padding:\n    0 14px;\n  border-radius: 12px;\n  font-size: 11px;\n  font-weight: 850;\n}\n\n.alumni-feedback-simple-photo {\n  border:\n    1px solid\n    var(--app-border);\n  background:\n    transparent;\n  color:\n    var(--app-text-soft);\n}\n\n.alumni-feedback-simple-photo\nspan {\n  color:\n    var(--app-muted);\n  font-size: 9px;\n}\n\n.alumni-feedback-simple-send {\n  min-width: 106px;\n  border: 0;\n  background:\n    var(--app-accent-fill);\n  color:\n    var(--app-on-accent);\n}\n\n.alumni-feedback-simple-send:disabled,\n.alumni-feedback-simple-photo:disabled {\n  opacity: .42;\n}\n\n.alumni-feedback-simple-success {\n  max-width: 420px;\n  margin:\n    min(\n      20dvh,\n      150px\n    )\n    auto 0;\n  text-align: center;\n}\n\n.alumni-feedback-simple-success\n> span {\n  display: inline-flex;\n  width: 50px;\n  height: 50px;\n  align-items: center;\n  justify-content: center;\n  border-radius: 50%;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-success) 12%,\n      transparent\n    );\n  color:\n    var(--app-success);\n}\n\n.alumni-feedback-simple-success\nh1 {\n  margin:\n    15px 0 0;\n  font-size: 26px;\n  font-weight: 950;\n  letter-spacing: -.04em;\n}\n\n.alumni-feedback-simple-success\np {\n  margin:\n    7px 0 0;\n  color:\n    var(--app-muted);\n  font-size: 11px;\n}\n\n.alumni-feedback-simple-success\nbutton {\n  min-height: 42px;\n  margin-top: 20px;\n  padding:\n    0 16px;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius: 12px;\n  background:\n    var(--app-surface);\n  color:\n    var(--app-text);\n  font-size: 11px;\n  font-weight: 850;\n}\n\n.alumni-feedback-simple-loading {\n  padding:\n    50px 0;\n  color:\n    var(--app-muted);\n  font-size: 11px;\n  text-align: center;\n}\n\n@media (max-width: 390px) {\n  .alumni-feedback-simple-body\n  textarea {\n    min-height:\n      190px;\n  }\n\n  .alumni-feedback-simple-previews {\n    grid-template-columns:\n      repeat(\n        3,\n        minmax(0, 1fr)\n      );\n  }\n}\n\n/* ALUMNI_FEEDBACK_SIMPLE_4_0 */\n";

const cleanupCss =
  "\n/* =========================================================\n   ALUMNI Clean Reset 1.0\n   Removes Visual Pass boxes and restores flat layouts.\n   ========================================================= */\n\n/* ---------------------------------------------------------\n   FEED — restore flat presentation\n   --------------------------------------------------------- */\n\n.alumni-feed-page\n.alumni-pro-composer {\n  overflow:\n    visible !important;\n  border:\n    0 !important;\n  border-radius:\n    0 !important;\n  background:\n    transparent !important;\n  box-shadow:\n    none !important;\n}\n\n.alumni-feed-page\n.alumni-pro-feed-tabs {\n  margin-top:\n    10px !important;\n  margin-bottom:\n    12px !important;\n  padding:\n    0 !important;\n  border:\n    0 !important;\n  border-radius:\n    0 !important;\n  background:\n    transparent !important;\n}\n\n.alumni-feed-page\n.alumni-pro-feed-tabs\nbutton {\n  border-radius:\n    0 !important;\n}\n\n.alumni-feed-page\n.alumni-pro-feed-tabs\nbutton[data-active=\"true\"] {\n  background:\n    transparent !important;\n}\n\n/* ---------------------------------------------------------\n   MESSAGES — original clean inbox\n   --------------------------------------------------------- */\n\n.alumni-messages-page\n.alumni-inbox-header {\n  margin:\n    0 !important;\n  padding:\n    2px 0\n    10px !important;\n  border:\n    0 !important;\n  border-radius:\n    0 !important;\n  background:\n    transparent !important;\n  box-shadow:\n    none !important;\n}\n\n.alumni-messages-page\n.alumni-inbox-list,\n.alumni-messages-page\n.alumni-message-list {\n  overflow:\n    visible !important;\n  border:\n    0 !important;\n  border-radius:\n    0 !important;\n  background:\n    transparent !important;\n  box-shadow:\n    none !important;\n}\n\n/* ---------------------------------------------------------\n   SEARCH — remove hero/card surface\n   --------------------------------------------------------- */\n\n.alumni-explore-pro\n.alumni-explore-hero {\n  overflow:\n    visible !important;\n  padding:\n    4px 0\n    14px !important;\n  border:\n    0 !important;\n  border-radius:\n    0 !important;\n  background:\n    var(--app-bg) !important;\n  box-shadow:\n    none !important;\n}\n\n.alumni-explore-pro\n.alumni-explore-hero::after,\n.alumni-explore-pro\n.alumni-explore-hero::before {\n  display:\n    none !important;\n}\n\n.alumni-explore-pro\n.alumni-explore-hero h1 {\n  margin:\n    0 0\n    12px !important;\n  font-size:\n    27px !important;\n}\n\n/* ---------------------------------------------------------\n   PROFILE — remove extra Visual Pass framing\n   --------------------------------------------------------- */\n\n.alumni-profile-launch-stats {\n  border-top:\n    0 !important;\n}\n\n.alumni-profile-launch-tabs {\n  border-right:\n    0 !important;\n  border-left:\n    0 !important;\n  box-shadow:\n    none !important;\n}\n\n/* ---------------------------------------------------------\n   EVENTS — restore alignment\n   --------------------------------------------------------- */\n\n.alumni-events-2 {\n  width:\n    100%;\n}\n\n.alumni-events-2\n.events2-hero {\n  overflow:\n    visible !important;\n  margin:\n    0 !important;\n  padding:\n    8px 0\n    20px !important;\n  border:\n    0 !important;\n  border-bottom:\n    1px solid\n    var(--app-border) !important;\n  border-radius:\n    0 !important;\n  background:\n    transparent !important;\n  box-shadow:\n    none !important;\n}\n\n.alumni-events-2\n.events2-hero::after,\n.alumni-events-2\n.events2-hero::before {\n  display:\n    none !important;\n}\n\n.alumni-events-2\n.events2-hero h1 {\n  margin:\n    0 !important;\n}\n\n.alumni-events-2\n.events2-navigation {\n  margin:\n    0 !important;\n  padding:\n    0 !important;\n  border:\n    0 !important;\n  border-bottom:\n    1px solid\n    var(--app-border) !important;\n  border-radius:\n    0 !important;\n  background:\n    transparent !important;\n  box-shadow:\n    none !important;\n}\n\n.alumni-events-2\n.events2-list {\n  overflow:\n    visible !important;\n  margin:\n    0 !important;\n  border:\n    0 !important;\n  border-bottom:\n    1px solid\n    var(--app-border) !important;\n  border-radius:\n    0 !important;\n  background:\n    transparent !important;\n  box-shadow:\n    none !important;\n}\n\n.alumni-events-2\n.events2-row {\n  padding-right:\n    0 !important;\n  padding-left:\n    0 !important;\n}\n\n.alumni-events-2\n.events2-primary-action {\n  border-radius:\n    0 !important;\n  box-shadow:\n    none !important;\n}\n\n/* ---------------------------------------------------------\n   COMMUNITY — restore alignment\n   --------------------------------------------------------- */\n\n.alumni-community-2 {\n  width:\n    100%;\n}\n\n.alumni-community-2\n.community2-hero {\n  overflow:\n    visible !important;\n  margin:\n    0 !important;\n  padding:\n    8px 0\n    20px !important;\n  border:\n    0 !important;\n  border-bottom:\n    1px solid\n    var(--app-border) !important;\n  border-radius:\n    0 !important;\n  background:\n    transparent !important;\n  box-shadow:\n    none !important;\n}\n\n.alumni-community-2\n.community2-hero::after,\n.alumni-community-2\n.community2-hero::before {\n  display:\n    none !important;\n}\n\n.alumni-community-2\n.community2-hero h1 {\n  margin:\n    0 !important;\n}\n\n.alumni-community-2\n.community2-navigation {\n  margin:\n    0 !important;\n  padding:\n    0 !important;\n  border:\n    0 !important;\n  border-bottom:\n    1px solid\n    var(--app-border) !important;\n  border-radius:\n    0 !important;\n  background:\n    transparent !important;\n  box-shadow:\n    none !important;\n}\n\n.alumni-community-2\n.community2-list {\n  overflow:\n    visible !important;\n  margin:\n    0 !important;\n  border:\n    0 !important;\n  border-bottom:\n    1px solid\n    var(--app-border) !important;\n  border-radius:\n    0 !important;\n  background:\n    transparent !important;\n  box-shadow:\n    none !important;\n}\n\n.alumni-community-2\n.community2-row {\n  padding-right:\n    0 !important;\n  padding-left:\n    0 !important;\n}\n\n.alumni-community-2\n.community2-primary-action {\n  border-radius:\n    0 !important;\n  box-shadow:\n    none !important;\n}\n\n/* ---------------------------------------------------------\n   Motion remains, geometry does not drift.\n   --------------------------------------------------------- */\n\n.alumni-feed-page,\n.alumni-messages-page,\n.alumni-explore-pro,\n.alumni-profile-launch,\n.alumni-events-2,\n.alumni-community-2 {\n  transform-origin:\n    center top;\n}\n\n/* ALUMNI_CLEAN_RESET_1_0 */\n";

if (
  !globals.includes(
    MARKER
  )
) {
  globals =
    globals.trimEnd() +
    "\n\n" +
    cleanupCss.trim() +
    "\n";
}

try {
  const ts =
    require(
      "typescript"
    );

  const parsed =
    ts.createSourceFile(
      FEEDBACK,
      nextFeedback,
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

    fail(
      `${FEEDBACK}: ${ts.flattenDiagnosticMessageText(
        first.messageText,
        "\n"
      )}`
    );
  }

  console.log(
    "✅ Parser TypeScript: Feedback válido"
  );
} catch (error) {
  if (
    !(
      error &&
      typeof error ===
        "object" &&
      error.code ===
        "MODULE_NOT_FOUND"
    )
  ) {
    throw error;
  }
}

fs.mkdirSync(
  path.dirname(
    abs(FEEDBACK_CSS)
  ),
  {
    recursive: true,
  }
);

fs.writeFileSync(
  abs(FEEDBACK),
  nextFeedback,
  "utf8"
);

fs.writeFileSync(
  abs(FEEDBACK_CSS),
  feedbackCss,
  "utf8"
);

fs.writeFileSync(
  abs(GLOBALS),
  globals,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Clean Reset 1.0 aplicado."
);
console.log(
  "✅ Feed vuelve a presentación plana."
);
console.log(
  "✅ Mensajes vuelve a presentación plana."
);
console.log(
  "✅ Buscar vuelve a presentación plana."
);
console.log(
  "✅ Perfil sin framing extra del Visual Pass."
);
console.log(
  "✅ Eventos alineado nuevamente."
);
console.log(
  "✅ Comunidad alineada nuevamente."
);
console.log(
  "✅ Feedback reducido a texto + fotos + enviar."
);
console.log(
  "✅ Motion se conserva."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
