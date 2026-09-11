const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_FEEDBACK_2_1_EDITORIAL_MODERNO";

const PAGE =
  "src/app/feedback/page.tsx";

const CSS =
  "src/app/feedback/feedback-form-editorial-2-1.css";

function abs(rel) {
  return path.join(ROOT, rel);
}

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

if (!fs.existsSync(abs(PAGE))) {
  fail(
    "No encontré src/app/feedback/page.tsx. " +
    "Ejecutá este parche desde alumni-web."
  );
}

let source = fs
  .readFileSync(abs(PAGE), "utf8")
  .replace(/\r\n/g, "\n");

if (
  source.includes(MARKER) &&
  fs.existsSync(abs(CSS))
) {
  console.log(
    "✅ ALUMNI Feedback 2.1 ya estaba aplicado."
  );
  process.exit(0);
}

if (
  !source.includes(
    "ALUMNI_FEEDBACK_2_0_HELP_HUB_CLEAN"
  )
) {
  fail(
    "Feedback 2.0 todavía no está aplicado. " +
    "Aplicá primero ALUMNI_FEEDBACK_2_0_HELP_HUB_CLEAN y luego este parche."
  );
}

if (
  !source.includes(
    'import "./feedback-help-2-0.css";'
  )
) {
  fail(
    "No encontré el CSS base de Feedback 2.0."
  );
}

if (
  !source.includes(
    'import "./feedback-form-editorial-2-1.css";'
  )
) {
  source = source.replace(
    'import "./feedback-help-2-0.css";',
    'import "./feedback-help-2-0.css";\nimport "./feedback-form-editorial-2-1.css";'
  );
}

const start =
  source.indexOf(
    "function FeedbackForm({"
  );

const end =
  source.indexOf(
    "\n/* ALUMNI_FEEDBACK_2_0_HELP_HUB_CLEAN */",
    start
  );

if (
  start < 0 ||
  end < 0
) {
  fail(
    "No encontré el componente FeedbackForm de Feedback 2.0."
  );
}

const nextForm = `function FeedbackForm({
  formMode,
  type,
  setType,
  priority,
  setPriority,
  title,
  setTitle,
  description,
  setDescription,
  expected,
  setExpected,
  steps,
  setSteps,
  files,
  previews,
  addFiles,
  removeFile,
  sending,
  canSend,
  onSubmit,
}: {
  formMode: FormMode;
  type: FeedbackType;
  setType:
    (
      type:
        FeedbackType
    ) => void;
  priority: Priority;
  setPriority:
    (
      priority:
        Priority
    ) => void;
  title: string;
  setTitle:
    (
      value: string
    ) => void;
  description: string;
  setDescription:
    (
      value: string
    ) => void;
  expected: string;
  setExpected:
    (
      value: string
    ) => void;
  steps: string;
  setSteps:
    (
      value: string
    ) => void;
  files: File[];
  previews: {
    file: File;
    url: string;
  }[];
  addFiles:
    (
      files:
        FileList | null
    ) => void;
  removeFile:
    (
      index:
        number
    ) => void;
  sending: boolean;
  canSend: boolean;
  onSubmit:
    () => void;
}) {
  const isProblem =
    formMode ===
    "problem";

  const editorial =
    formMode === "idea"
      ? {
          icon:
            Lightbulb,
          eyebrow:
            "TU IDEA CUENTA",
          title:
            "Ideas que generan impacto",
          copy:
            "Tu experiencia como alumni es valiosa. Cuéntanos cómo podríamos mejorar la app para todos.",
        }
      : formMode ===
        "support"
      ? {
          icon:
            Mail,
          eyebrow:
            "ESTAMOS PARA AYUDARTE",
          title:
            "Cuéntanos qué necesitas",
          copy:
            "Describe tu consulta con tranquilidad. Entre más contexto tengamos, mejor podremos entenderla.",
        }
      : {
          icon:
            TriangleAlert,
          eyebrow:
            "AYÚDANOS A MEJORAR",
          title:
            "Cuéntanos qué ocurrió",
          copy:
            "Explícanos qué pasó y dónde lo notaste. Si puedes, agrega una captura para ayudarnos a revisarlo.",
        };

  const EditorialIcon =
    editorial.icon;

  return (
    <section
      className="alumni-feedback-editorial"
      data-mode={
        formMode
      }
    >
      <div className="alumni-feedback-editorial-hero">
        <span className="alumni-feedback-editorial-hero-icon">
          <EditorialIcon
            size={23}
            strokeWidth={
              1.8
            }
          />
        </span>

        <div>
          <small>
            {
              editorial.eyebrow
            }
          </small>

          <h2>
            {
              editorial.title
            }
          </h2>

          <p>
            {editorial.copy}
          </p>
        </div>
      </div>

      <div className="alumni-feedback-editorial-note">
        <CircleHelp
          size={15}
          strokeWidth={
            1.9
          }
        />
        <span>
          Sé específico y cuéntanos el contexto. Entre más claro sea el mensaje, mejor podremos evaluarlo.
        </span>
      </div>

      <div
        className="alumni-feedback-editorial-type"
        role="group"
        aria-label="Tipo de feedback"
      >
        {[
          [
            "bug",
            "Problema",
          ],
          [
            "suggestion",
            "Idea",
          ],
          [
            "other",
            "Otro",
          ],
        ].map(
          ([
            value,
            label,
          ]) => (
            <button
              key={
                value
              }
              type="button"
              data-active={
                type ===
                value
                  ? "true"
                  : "false"
              }
              onClick={() =>
                setType(
                  value as
                    FeedbackType
                )
              }
            >
              {label}
            </button>
          )
        )}
      </div>

      <label className="alumni-feedback-editorial-field">
        <span>
          {formMode ===
          "idea"
            ? "Título de la sugerencia"
            : formMode ===
              "support"
            ? "Asunto"
            : "Título"}
        </span>

        <input
          value={title}
          maxLength={120}
          onChange={(
            event
          ) =>
            setTitle(
              event.target
                .value
            )
          }
          placeholder={
            formMode ===
            "idea"
              ? "Ej. Mejora en el buscador de eventos"
              : formMode ===
                "support"
              ? "Resume brevemente tu consulta"
              : "Resumen breve del problema"
          }
        />

        <small className="alumni-feedback-editorial-counter">
          {title.length}/120
        </small>
      </label>

      <label className="alumni-feedback-editorial-field alumni-feedback-editorial-field-large">
        <span>
          {formMode ===
          "idea"
            ? "Descripción de la sugerencia"
            : formMode ===
              "support"
            ? "Cuéntanos más"
            : "Descripción"}
        </span>

        <textarea
          value={
            description
          }
          maxLength={
            1000
          }
          rows={8}
          onChange={(
            event
          ) =>
            setDescription(
              event.target
                .value
            )
          }
          placeholder={
            formMode ===
            "idea"
              ? "Comparte tu idea, cómo funcionaría y por qué sería útil..."
              : formMode ===
                "support"
              ? "Describe tu consulta con el contexto que consideres importante..."
              : "Describe qué ocurrió, dónde lo viste y cómo podemos reproducirlo..."
          }
        />

        <small className="alumni-feedback-editorial-counter">
          {
            description.length
          }
          /1000
        </small>
      </label>

      <label className="alumni-feedback-editorial-attach">
        <span className="alumni-feedback-editorial-attach-icon">
          <ImagePlus
            size={21}
            strokeWidth={
              1.8
            }
          />
        </span>

        <span className="alumni-feedback-editorial-attach-copy">
          <strong>
            Adjuntar captura
          </strong>
          <small>
            Opcional · hasta {MAX_FILES} imágenes de máximo 8 MB
          </small>
        </span>

        <span className="alumni-feedback-editorial-attach-action">
          Agregar
        </span>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(
            event
          ) =>
            addFiles(
              event.target
                .files
            )
          }
        />
      </label>

      {files.length >
        0 && (
        <div className="alumni-feedback-editorial-previews">
          {previews.map(
            (
              item,
              index
            ) => (
              <div
                key={
                  \`\${item.file.name}-\${index}\`
                }
              >
                <img
                  src={
                    item.url
                  }
                  alt=""
                />

                <button
                  type="button"
                  onClick={() =>
                    removeFile(
                      index
                    )
                  }
                  aria-label="Quitar captura"
                >
                  <X
                    size={14}
                  />
                </button>
              </div>
            )
          )}
        </div>
      )}

      <div className="alumni-feedback-editorial-priority">
        <span>
          Prioridad
        </span>

        <div>
          {[
            [
              "low",
              "Baja",
            ],
            [
              "medium",
              "Media",
            ],
            [
              "high",
              "Alta",
            ],
            [
              "blocker",
              "Urgente",
            ],
          ].map(
            ([
              value,
              label,
            ]) => (
              <button
                key={
                  value
                }
                type="button"
                data-active={
                  priority ===
                    value
                    ? "true"
                    : "false"
                }
                onClick={() =>
                  setPriority(
                    value as
                      Priority
                  )
                }
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>

      {isProblem && (
        <details className="alumni-feedback-editorial-more">
          <summary>
            Añadir detalles técnicos
          </summary>

          <div>
            <label className="alumni-feedback-editorial-field">
              <span>
                ¿Qué esperabas que ocurriera?
              </span>

              <textarea
                value={
                  expected
                }
                rows={3}
                onChange={(
                  event
                ) =>
                  setExpected(
                    event.target
                      .value
                  )
                }
                placeholder="Describe el resultado esperado."
              />
            </label>

            <label className="alumni-feedback-editorial-field">
              <span>
                Pasos para repetirlo
              </span>

              <textarea
                value={
                  steps
                }
                rows={3}
                onChange={(
                  event
                ) =>
                  setSteps(
                    event.target
                      .value
                  )
                }
                placeholder={
                  "1. Abrí...\\n2. Toqué...\\n3. Apareció..."
                }
              />
            </label>
          </div>
        </details>
      )}

      <button
        type="button"
        className="alumni-feedback-editorial-send"
        disabled={
          sending ||
          !canSend
        }
        onClick={
          onSubmit
        }
      >
        {sending ? (
          <Loader2
            size={16}
            className="animate-spin"
          />
        ) : (
          <Send
            size={16}
          />
        )}

        {sending
          ? "Enviando..."
          : formMode ===
            "idea"
          ? "Enviar sugerencia"
          : formMode ===
            "support"
          ? "Enviar mensaje"
          : "Enviar reporte"}
      </button>

      <p className="alumni-feedback-editorial-safe">
        Tu mensaje se envía de forma segura al equipo de Alumni.
      </p>
    </section>
  );
}
`;

source =
  source.slice(
    0,
    start
  ) +
  nextForm +
  source.slice(
    end
  );

source +=
  `\n/* ${MARKER} */\n`;

const css = `/*
 * ${MARKER}
 *
 * Feedback 2.1 — Opción 4 Editorial moderno,
 * adaptada al lenguaje visual de ALUMNI.
 */

.alumni-feedback-editorial {
  width: 100%;
  padding:
    18px 0 0;
  color:
    var(--app-text);
}

.alumni-feedback-editorial-hero {
  display: grid;
  grid-template-columns:
    48px minmax(0, 1fr);
  align-items:
    start;
  gap: 13px;
  padding:
    4px 4px 20px;
}

.alumni-feedback-editorial-hero-icon {
  display: inline-flex;
  width: 46px;
  height: 46px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background:
    var(--app-soft);
  color:
    var(--app-accent);
}

.alumni-feedback-editorial[
  data-mode="idea"
]
.alumni-feedback-editorial-hero-icon {
  background:
    color-mix(
      in srgb,
      var(--app-success) 11%,
      transparent
    );
  color:
    var(--app-success);
}

.alumni-feedback-editorial[
  data-mode="problem"
]
.alumni-feedback-editorial-hero-icon {
  background:
    color-mix(
      in srgb,
      var(--app-danger) 10%,
      transparent
    );
  color:
    var(--app-danger);
}

.alumni-feedback-editorial-hero
  small {
  display: block;
  margin-bottom: 6px;
  color:
    var(--app-muted-3);
  font-size: 8.5px;
  font-weight: 900;
  letter-spacing:
    .14em;
}

.alumni-feedback-editorial-hero
  h2 {
  margin: 0;
  color:
    var(--app-text);
  font-size:
    clamp(
      24px,
      7vw,
      31px
    );
  font-weight: 950;
  line-height: 1.02;
  letter-spacing:
    -.045em;
}

.alumni-feedback-editorial-hero
  p {
  max-width: 450px;
  margin-top: 9px;
  color:
    var(--app-muted);
  font-size: 11.5px;
  line-height: 1.5;
}

.alumni-feedback-editorial-note {
  display: flex;
  align-items:
    flex-start;
  gap: 9px;
  margin:
    0 4px 20px;
  padding:
    11px 12px;
  border:
    1px solid
    color-mix(
      in srgb,
      var(--app-accent) 16%,
      var(--app-border)
    );
  border-radius:
    12px;
  background:
    color-mix(
      in srgb,
      var(--app-accent-soft) 56%,
      transparent
    );
  color:
    var(--app-accent);
}

.alumni-feedback-editorial-note
  span {
  color:
    var(--app-text-soft);
  font-size: 10px;
  font-weight: 580;
  line-height: 1.45;
}

.alumni-feedback-editorial-note
  svg {
  flex: 0 0 auto;
  margin-top: 1px;
}

.alumni-feedback-editorial-type {
  display: flex;
  gap: 7px;
  margin:
    0 4px 22px;
  overflow-x: auto;
  scrollbar-width:
    none;
}

.alumni-feedback-editorial-type::-webkit-scrollbar {
  display: none;
}

.alumni-feedback-editorial-type
  button {
  min-height: 34px;
  flex: 0 0 auto;
  padding:
    0 13px;
  border:
    1px solid
    var(--app-border);
  border-radius:
    999px;
  background:
    transparent;
  color:
    var(--app-muted-2);
  font-size:
    9.5px;
  font-weight: 800;
}

.alumni-feedback-editorial-type
  button[
    data-active="true"
  ] {
  border-color:
    var(--app-accent);
  background:
    var(--app-accent-soft);
  color:
    var(--app-accent);
}

.alumni-feedback-editorial-field {
  position: relative;
  display: block;
  margin:
    18px 4px 0;
}

.alumni-feedback-editorial-field
  > span {
  display: block;
  margin-bottom: 8px;
  color:
    var(--app-text-soft);
  font-size: 11px;
  font-weight: 820;
}

.alumni-feedback-editorial-field
  input,
.alumni-feedback-editorial-field
  textarea {
  width: 100%;
  border:
    1px solid
    var(--app-border);
  border-radius:
    13px;
  outline: 0;
  background:
    var(--app-surface);
  color:
    var(--app-text);
  font-size: 14px;
  box-shadow: none;
  transition:
    border-color .14s ease,
    box-shadow .14s ease,
    background-color .14s ease;
}

.alumni-feedback-editorial-field
  input {
  height: 48px;
  padding:
    0 13px;
}

.alumni-feedback-editorial-field
  textarea {
  resize: none;
  padding:
    12px 13px 28px;
  line-height: 1.52;
}

.alumni-feedback-editorial-field-large
  textarea {
  min-height: 190px;
}

.alumni-feedback-editorial-field
  input::placeholder,
.alumni-feedback-editorial-field
  textarea::placeholder {
  color:
    var(--app-muted-3);
}

.alumni-feedback-editorial-field
  input:focus,
.alumni-feedback-editorial-field
  textarea:focus {
  border-color:
    var(--app-accent);
  background:
    var(--app-surface);
  box-shadow:
    0 0 0 3px
    var(--app-accent-soft);
}

.alumni-feedback-editorial-counter {
  position: absolute;
  right: 10px;
  bottom: 7px;
  color:
    var(--app-muted-3);
  font-size: 8.5px;
  font-weight: 700;
  pointer-events: none;
}

.alumni-feedback-editorial-attach {
  position: relative;
  display: grid;
  grid-template-columns:
    42px minmax(0, 1fr) auto;
  min-height: 72px;
  align-items: center;
  gap: 11px;
  margin:
    22px 4px 0;
  padding:
    11px 12px;
  border:
    1px dashed
    color-mix(
      in srgb,
      var(--app-muted-3) 64%,
      var(--app-border)
    );
  border-radius:
    14px;
  background:
    transparent;
  cursor: pointer;
}

.alumni-feedback-editorial-attach
  input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.alumni-feedback-editorial-attach-icon {
  display: inline-flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius:
    999px;
  background:
    var(--app-soft);
  color:
    var(--app-text-soft);
}

.alumni-feedback-editorial-attach-copy {
  min-width: 0;
}

.alumni-feedback-editorial-attach-copy
  strong,
.alumni-feedback-editorial-attach-copy
  small {
  display: block;
}

.alumni-feedback-editorial-attach-copy
  strong {
  color:
    var(--app-text);
  font-size:
    11.5px;
  font-weight:
    840;
}

.alumni-feedback-editorial-attach-copy
  small {
  margin-top: 3px;
  color:
    var(--app-muted-2);
  font-size: 9px;
  line-height: 1.35;
}

.alumni-feedback-editorial-attach-action {
  color:
    var(--app-accent);
  font-size: 9.5px;
  font-weight: 850;
}

.alumni-feedback-editorial-previews {
  display: grid;
  grid-template-columns:
    repeat(
      4,
      minmax(0, 1fr)
    );
  gap: 7px;
  margin:
    9px 4px 0;
}

.alumni-feedback-editorial-previews
  > div {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border:
    1px solid
    var(--app-border);
  border-radius:
    11px;
  background:
    var(--app-soft);
}

.alumni-feedback-editorial-previews
  img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.alumni-feedback-editorial-previews
  button {
  position: absolute;
  top: 5px;
  right: 5px;
  display: inline-flex;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius:
    999px;
  background:
    rgba(5,7,11,.72);
  color: white;
}

.alumni-feedback-editorial-priority {
  margin:
    20px 4px 0;
}

.alumni-feedback-editorial-priority
  > span {
  display: block;
  margin-bottom: 8px;
  color:
    var(--app-text-soft);
  font-size:
    11px;
  font-weight: 820;
}

.alumni-feedback-editorial-priority
  > div {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}

.alumni-feedback-editorial-priority
  > div::-webkit-scrollbar {
  display: none;
}

.alumni-feedback-editorial-priority
  button {
  min-height: 34px;
  flex: 0 0 auto;
  padding:
    0 12px;
  border:
    1px solid
    var(--app-border);
  border-radius:
    999px;
  background:
    var(--app-soft);
  color:
    var(--app-muted-2);
  font-size:
    9.5px;
  font-weight: 800;
}

.alumni-feedback-editorial-priority
  button[
    data-active="true"
  ] {
  border-color:
    color-mix(
      in srgb,
      var(--app-accent) 48%,
      var(--app-border)
    );
  background:
    var(--app-accent-soft);
  color:
    var(--app-accent);
}

.alumni-feedback-editorial-more {
  margin:
    20px 4px 0;
  border-top:
    1px solid
    var(--app-border);
  border-bottom:
    1px solid
    var(--app-border);
}

.alumni-feedback-editorial-more
  summary {
  min-height: 52px;
  padding:
    17px 1px;
  color:
    var(--app-muted);
  font-size:
    10.5px;
  font-weight:
    800;
  cursor: pointer;
}

.alumni-feedback-editorial-more[
  open
] {
  padding-bottom: 18px;
}

.alumni-feedback-editorial-more
  .alumni-feedback-editorial-field {
  margin-right: 0;
  margin-left: 0;
}

.alumni-feedback-editorial-send {
  display: flex;
  width:
    calc(100% - 8px);
  min-height: 50px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin:
    26px 4px 0;
  border: 0;
  border-radius:
    13px;
  background:
    var(--app-accent-fill);
  color:
    var(--app-on-accent);
  font-size:
    11.5px;
  font-weight:
    900;
  box-shadow:
    none;
}

.alumni-feedback-editorial-send:disabled {
  opacity: .4;
}

.alumni-feedback-editorial-safe {
  margin:
    11px 4px 0;
  color:
    var(--app-muted-3);
  font-size: 9px;
  text-align: center;
  line-height: 1.4;
}

/*
 * Mobile is canonical.
 * Leaves enough bottom space for the floating navbar.
 */
@media (max-width: 699px) {
  .alumni-feedback-editorial {
    padding-bottom:
      calc(
        24px +
        env(
          safe-area-inset-bottom
        )
      );
  }

  .alumni-feedback-editorial-hero {
    grid-template-columns:
      42px minmax(0, 1fr);
    gap: 11px;
    padding-top: 8px;
  }

  .alumni-feedback-editorial-hero-icon {
    width: 40px;
    height: 40px;
  }

  .alumni-feedback-editorial-note,
  .alumni-feedback-editorial-type,
  .alumni-feedback-editorial-field,
  .alumni-feedback-editorial-attach,
  .alumni-feedback-editorial-previews,
  .alumni-feedback-editorial-priority,
  .alumni-feedback-editorial-more,
  .alumni-feedback-editorial-send,
  .alumni-feedback-editorial-safe {
    margin-right: 2px;
    margin-left: 2px;
  }

  .alumni-feedback-editorial-send {
    width:
      calc(100% - 4px);
  }
}

@media (max-width: 374px) {
  .alumni-feedback-editorial-hero
    h2 {
    font-size: 24px;
  }

  .alumni-feedback-editorial-previews {
    grid-template-columns:
      repeat(
        3,
        minmax(0, 1fr)
      );
  }

  .alumni-feedback-editorial-attach {
    grid-template-columns:
      38px minmax(0, 1fr);
  }

  .alumni-feedback-editorial-attach-action {
    display: none;
  }
}

/*
 * Desktop stays secondary and uses the same composition.
 */
@media (min-width: 700px) {
  .alumni-feedback-editorial {
    max-width: 560px;
    margin: 0 auto;
    padding-bottom: 40px;
  }
}

/* ${MARKER} */
`;

try {
  const ts =
    require("typescript");

  const parsed =
    ts.createSourceFile(
      PAGE,
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
      "Feedback 2.1 quedó con sintaxis inválida" +
        (
          pos
            ? ` línea ${pos.line + 1}, columna ${pos.character + 1}`
            : ""
        ) +
        `: ${message}`
    );
  }

  console.log(
    "✅ Parser TypeScript: Feedback 2.1 válido"
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

const backup =
  abs(PAGE) +
  ".before-feedback-2.1.bak";

if (!fs.existsSync(backup)) {
  fs.copyFileSync(
    abs(PAGE),
    backup
  );
}

fs.writeFileSync(
  abs(PAGE),
  source,
  "utf8"
);

fs.writeFileSync(
  abs(CSS),
  css,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Feedback 2.1 aplicado."
);
console.log(
  "✅ Formulario = Opción 4 Editorial moderno."
);
console.log(
  "✅ Adaptado al lenguaje visual de ALUMNI."
);
console.log(
  "✅ Hub limpio de Feedback 2.0 preservado."
);
console.log(
  "✅ Asunto + área amplia de escritura."
);
console.log(
  "✅ Adjuntos discretos."
);
console.log(
  "✅ Prioridad secundaria."
);
console.log(
  "✅ Detalles técnicos ocultos bajo Más detalles."
);
console.log(
  "✅ Dark / Light preservados."
);
console.log(
  "✅ Mobile-first 360–430px."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
