const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_FEEDBACK_2_0_HELP_HUB_CLEAN";

const PAGE =
  "src/app/feedback/page.tsx";

const CSS =
  "src/app/feedback/feedback-help-2-0.css";

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

const current = fs
  .readFileSync(abs(PAGE), "utf8")
  .replace(/\r\n/g, "\n");

if (
  current.includes(MARKER) &&
  fs.existsSync(abs(CSS))
) {
  console.log(
    "✅ ALUMNI Feedback 2.0 ya estaba aplicado."
  );
  process.exit(0);
}

if (
  !current.includes(
    'from("feedback_reports")'
  ) ||
  !current.includes(
    '.from("feedback")'
  )
) {
  fail(
    "La página de Feedback no contiene el backend esperado. " +
    "No escribí cambios."
  );
}

const page = `"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ImagePlus,
  Lightbulb,
  Loader2,
  Mail,
  Send,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import {
  useAuth,
} from "@/components/auth/AuthProvider";
import {
  supabase,
} from "@/lib/supabase";
import {
  APP_VERSION,
} from "@/lib/appVersion";
import "../interior-ui-1-0.css";
import "./feedback-help-2-0.css";

type FeedbackType =
  | "bug"
  | "ui"
  | "suggestion"
  | "missing_feature"
  | "other";

type Priority =
  | "low"
  | "medium"
  | "high"
  | "blocker";

type FeedbackView =
  | "home"
  | "form"
  | "help"
  | "status"
  | "legal";

type FormMode =
  | "problem"
  | "idea"
  | "support";

const MAX_FILES = 4;
const MAX_FILE_SIZE =
  8 * 1024 * 1024;

function detectPlatform() {
  if (
    typeof navigator ===
    "undefined"
  ) {
    return "Web";
  }

  const ua =
    navigator.userAgent
      .toLowerCase();

  if (
    ua.includes("android")
  ) {
    return "Android";
  }

  if (
    /iphone|ipad|ipod/.test(
      ua
    )
  ) {
    return "iOS";
  }

  return "Web";
}

const FAQS = [
  {
    title:
      "¿Cómo reporto un problema?",
    body:
      "Entra en “Reportar un problema”, cuéntanos qué ocurrió y, si ayuda, adjunta una captura. Alumni agrega automáticamente la versión y plataforma.",
  },
  {
    title:
      "¿Qué datos técnicos se envían?",
    body:
      "El reporte incluye la versión de Alumni, la plataforma y la sección desde donde llegaste. No se adjuntan contraseñas ni contenido privado fuera de lo que tú escribas o adjuntes.",
  },
  {
    title:
      "¿Puedo adjuntar capturas?",
    body:
      "Sí. Puedes adjuntar hasta 4 imágenes de máximo 8 MB cada una para ayudarnos a entender mejor el problema.",
  },
  {
    title:
      "¿Cómo propongo una función nueva?",
    body:
      "Usa “Sugerir una mejora”. Las ideas se guardan en el mismo sistema de feedback para que puedan revisarse junto con su contexto.",
  },
] as const;

export default function FeedbackPage() {
  const router =
    useRouter();

  const {
    user,
    loading,
  } =
    useAuth();

  const [
    view,
    setView,
  ] =
    useState<FeedbackView>(
      "home"
    );

  const [
    formMode,
    setFormMode,
  ] =
    useState<FormMode>(
      "problem"
    );

  const [
    openFaq,
    setOpenFaq,
  ] =
    useState<number | null>(
      0
    );

  const [
    type,
    setType,
  ] =
    useState<FeedbackType>(
      "bug"
    );

  const [
    priority,
    setPriority,
  ] =
    useState<Priority>(
      "medium"
    );

  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    description,
    setDescription,
  ] =
    useState("");

  const [
    expected,
    setExpected,
  ] =
    useState("");

  const [
    steps,
    setSteps,
  ] =
    useState("");

  const [
    sourcePath,
    setSourcePath,
  ] =
    useState("/");

  const [
    files,
    setFiles,
  ] =
    useState<File[]>([]);

  const [
    sending,
    setSending,
  ] =
    useState(false);

  const [
    successId,
    setSuccessId,
  ] =
    useState("");

  useEffect(() => {
    if (
      !loading &&
      !user
    ) {
      router.replace(
        "/login"
      );
    }
  }, [
    loading,
    user,
    router,
  ]);

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    setSourcePath(
      sessionStorage.getItem(
        "alumni_feedback_from"
      ) ||
        document.referrer ||
        "/"
    );
  }, []);

  const previews =
    useMemo(
      () =>
        files.map(
          (file) => ({
            file,
            url:
              URL.createObjectURL(
                file
              ),
          })
        ),
      [files]
    );

  useEffect(() => {
    return () =>
      previews.forEach(
        (item) =>
          URL.revokeObjectURL(
            item.url
          )
      );
  }, [previews]);

  function addFiles(
    selected:
      FileList | null
  ) {
    if (!selected) {
      return;
    }

    const next = [
      ...files,
    ];

    for (
      const file
      of Array.from(
        selected
      )
    ) {
      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        continue;
      }

      if (
        file.size >
        MAX_FILE_SIZE
      ) {
        alert(
          \`"\${file.name}" supera 8 MB.\`
        );
        continue;
      }

      if (
        next.length >=
        MAX_FILES
      ) {
        break;
      }

      next.push(
        file
      );
    }

    setFiles(
      next.slice(
        0,
        MAX_FILES
      )
    );
  }

  function removeFile(
    index: number
  ) {
    setFiles(
      (current) =>
        current.filter(
          (
            _,
            currentIndex
          ) =>
            currentIndex !==
            index
        )
    );
  }

  function resetForm() {
    setPriority(
      "medium"
    );
    setTitle("");
    setDescription("");
    setExpected("");
    setSteps("");
    setFiles([]);
    setSuccessId("");
  }

  function openForm(
    mode: FormMode
  ) {
    resetForm();
    setFormMode(mode);

    if (
      mode ===
      "problem"
    ) {
      setType("bug");
    } else if (
      mode ===
      "idea"
    ) {
      setType(
        "suggestion"
      );
    } else {
      setType("other");
    }

    setView("form");
  }

  function backToHub() {
    if (
      successId ||
      view !== "home"
    ) {
      setSuccessId("");
      setView("home");
      return;
    }

    router.back();
  }

  async function submitFeedback() {
    if (
      !user ||
      sending ||
      !title.trim() ||
      !description.trim()
    ) {
      return;
    }

    setSending(true);

    const reportId =
      crypto.randomUUID();

    const uploadedPaths:
      string[] = [];

    try {
      for (
        let index = 0;
        index <
        files.length;
        index += 1
      ) {
        const file =
          files[index];

        const extension =
          file.name
            .split(".")
            .pop()
            ?.toLowerCase() ||
          (
            file.type.includes(
              "png"
            )
              ? "png"
              : "jpg"
          );

        const path =
          \`\${user.id}/\${reportId}/\${Date.now()}-\${index}.\${extension}\`;

        const {
          error:
            uploadError,
        } =
          await supabase.storage
            .from(
              "feedback"
            )
            .upload(
              path,
              file,
              {
                cacheControl:
                  "3600",
                upsert:
                  false,
                contentType:
                  file.type,
              }
            );

        if (
          uploadError
        ) {
          throw uploadError;
        }

        uploadedPaths.push(
          path
        );
      }

      const {
        error,
      } =
        await supabase
          .from(
            "feedback_reports"
          )
          .insert({
            id: reportId,
            user_id:
              user.id,
            type,
            priority,
            title:
              title.trim(),
            description:
              description.trim(),
            expected_behavior:
              expected.trim() ||
              null,
            steps_to_reproduce:
              steps.trim() ||
              null,
            source_path:
              sourcePath,
            platform:
              detectPlatform(),
            app_version:
              APP_VERSION,
            attachments:
              uploadedPaths,
          });

      if (error) {
        throw error;
      }

      setSuccessId(
        reportId
      );

      sessionStorage
        .removeItem(
          "alumni_feedback_from"
        );
    } catch (
      error: any
    ) {
      if (
        uploadedPaths.length >
        0
      ) {
        await supabase
          .storage
          .from("feedback")
          .remove(
            uploadedPaths
          );
      }

      console.error(
        error
      );

      alert(
        error?.message ||
          "No se pudo enviar el reporte."
      );
    } finally {
      setSending(false);
    }
  }

  if (
    loading ||
    !user
  ) {
    return (
      <AppShell>
        <main className="alumni-help-v2">
          <div className="alumni-help-loading">
            Preparando ayuda...
          </div>
        </main>
      </AppShell>
    );
  }

  if (successId) {
    return (
      <AppShell>
        <main className="alumni-help-v2">
          <section className="alumni-help-success">
            <span className="alumni-help-success-icon">
              <CheckCircle2
                size={27}
              />
            </span>

            <h1>
              Feedback enviado
            </h1>

            <p>
              Gracias. Tu mensaje ya quedó registrado para revisión.
            </p>

            <small>
              ID{" "}
              {successId
                .slice(
                  0,
                  8
                )
                .toUpperCase()}
            </small>

            <button
              type="button"
              onClick={
                backToHub
              }
            >
              Volver a Ayuda
            </button>
          </section>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main
        className="alumni-help-v2"
        data-feedback-view={
          view
        }
      >
        <header className="alumni-help-header">
          <button
            type="button"
            onClick={
              backToHub
            }
            aria-label="Volver"
          >
            <ArrowLeft
              size={20}
            />
          </button>

          <h1>
            {view ===
            "home"
              ? "Ayuda y feedback"
              : view ===
                "form"
              ? formMode ===
                "problem"
                ? "Reportar un problema"
                : formMode ===
                  "idea"
                ? "Sugerir una mejora"
                : "Contactar soporte"
              : view ===
                "help"
              ? "Centro de ayuda"
              : view ===
                "status"
              ? "Estado de la app"
              : "Información legal"}
          </h1>

          <span />
        </header>

        {view ===
          "home" && (
          <HelpHome
            onHelp={() =>
              setView(
                "help"
              )
            }
            onProblem={() =>
              openForm(
                "problem"
              )
            }
            onIdea={() =>
              openForm(
                "idea"
              )
            }
            onStatus={() =>
              setView(
                "status"
              )
            }
            onSupport={() =>
              openForm(
                "support"
              )
            }
            onLegal={() =>
              setView(
                "legal"
              )
            }
          />
        )}

        {view ===
          "help" && (
          <section className="alumni-help-detail">
            <div className="alumni-help-detail-intro">
              <BookOpen
                size={22}
              />
              <div>
                <strong>
                  Centro de ayuda
                </strong>
                <p>
                  Respuestas rápidas sobre feedback y soporte.
                </p>
              </div>
            </div>

            <div className="alumni-help-faqs">
              {FAQS.map(
                (
                  item,
                  index
                ) => {
                  const open =
                    openFaq ===
                    index;

                  return (
                    <button
                      key={
                        item.title
                      }
                      type="button"
                      className="alumni-help-faq"
                      data-open={
                        open
                          ? "true"
                          : "false"
                      }
                      onClick={() =>
                        setOpenFaq(
                          open
                            ? null
                            : index
                        )
                      }
                    >
                      <span>
                        <strong>
                          {
                            item.title
                          }
                        </strong>

                        {open && (
                          <p>
                            {
                              item.body
                            }
                          </p>
                        )}
                      </span>

                      <ChevronDown
                        size={
                          17
                        }
                      />
                    </button>
                  );
                }
              )}
            </div>
          </section>
        )}

        {view ===
          "status" && (
          <section className="alumni-help-detail">
            <div className="alumni-help-detail-intro">
              <Activity
                size={22}
              />
              <div>
                <strong>
                  Estado técnico
                </strong>
                <p>
                  Información de esta instalación de Alumni.
                </p>
              </div>
            </div>

            <div className="alumni-help-status-list">
              <div>
                <span>
                  Versión
                </span>
                <strong>
                  {
                    APP_VERSION
                  }
                </strong>
              </div>

              <div>
                <span>
                  Plataforma
                </span>
                <strong>
                  {
                    detectPlatform()
                  }
                </strong>
              </div>

              <div>
                <span>
                  Origen
                </span>
                <strong>
                  {sourcePath}
                </strong>
              </div>
            </div>

            <p className="alumni-help-status-note">
              Alumni todavía no tiene un monitor público de incidencias en tiempo real conectado a esta pantalla. Si algo no funciona, puedes reportarlo directamente.
            </p>

            <button
              type="button"
              className="alumni-help-primary-action"
              onClick={() =>
                openForm(
                  "problem"
                )
              }
            >
              Reportar un problema
            </button>
          </section>
        )}

        {view ===
          "legal" && (
          <section className="alumni-help-detail">
            <div className="alumni-help-detail-intro">
              <ShieldCheck
                size={22}
              />
              <div>
                <strong>
                  Información legal
                </strong>
                <p>
                  Privacidad, términos y normas de la comunidad.
                </p>
              </div>
            </div>

            <div className="alumni-help-legal-list">
              <Link href="/legal/privacy">
                <span>
                  Privacidad
                </span>
                <ChevronRight
                  size={17}
                />
              </Link>

              <Link href="/legal/terms">
                <span>
                  Términos
                </span>
                <ChevronRight
                  size={17}
                />
              </Link>

              <Link href="/legal/community">
                <span>
                  Normas de comunidad
                </span>
                <ChevronRight
                  size={17}
                />
              </Link>
            </div>
          </section>
        )}

        {view ===
          "form" && (
          <FeedbackForm
            formMode={
              formMode
            }
            type={type}
            setType={
              setType
            }
            priority={
              priority
            }
            setPriority={
              setPriority
            }
            title={title}
            setTitle={
              setTitle
            }
            description={
              description
            }
            setDescription={
              setDescription
            }
            expected={
              expected
            }
            setExpected={
              setExpected
            }
            steps={steps}
            setSteps={
              setSteps
            }
            files={files}
            previews={
              previews
            }
            addFiles={
              addFiles
            }
            removeFile={
              removeFile
            }
            sending={
              sending
            }
            canSend={Boolean(
              title.trim() &&
                description.trim()
            )}
            onSubmit={() =>
              void submitFeedback()
            }
          />
        )}
      </main>
    </AppShell>
  );
}

function HelpHome({
  onHelp,
  onProblem,
  onIdea,
  onStatus,
  onSupport,
  onLegal,
}: {
  onHelp: () => void;
  onProblem: () => void;
  onIdea: () => void;
  onStatus: () => void;
  onSupport: () => void;
  onLegal: () => void;
}) {
  const rows = [
    {
      label:
        "Centro de ayuda",
      description:
        "Preguntas y respuestas rápidas",
      icon:
        BookOpen,
      tone:
        "blue",
      onClick:
        onHelp,
    },
    {
      label:
        "Reportar un problema",
      description:
        "Errores, fallos o algo que no se ve bien",
      icon:
        TriangleAlert,
      tone:
        "red",
      onClick:
        onProblem,
    },
    {
      label:
        "Sugerir una mejora",
      description:
        "Ideas para nuevas funciones",
      icon:
        Lightbulb,
      tone:
        "green",
      onClick:
        onIdea,
    },
    {
      label:
        "Estado de la app",
      description:
        "Versión y diagnóstico de tu sesión",
      icon:
        Activity,
      tone:
        "violet",
      onClick:
        onStatus,
    },
    {
      label:
        "Contactar soporte",
      description:
        "Cuéntanos en qué podemos ayudarte",
      icon:
        Mail,
      tone:
        "blue",
      onClick:
        onSupport,
    },
  ] as const;

  return (
    <>
      <section className="alumni-help-home-intro">
        <p>
          Cuéntanos cómo mejorar Alumni o encuentra ayuda con un problema.
        </p>
      </section>

      <section className="alumni-help-home-list">
        {rows.map(
          ({
            label,
            description,
            icon: Icon,
            tone,
            onClick,
          }) => (
            <button
              key={label}
              type="button"
              className="alumni-help-home-row"
              onClick={
                onClick
              }
            >
              <span
                className="alumni-help-home-icon"
                data-tone={
                  tone
                }
              >
                <Icon
                  size={21}
                  strokeWidth={
                    1.8
                  }
                />
              </span>

              <span className="alumni-help-home-copy">
                <strong>
                  {label}
                </strong>
                <small>
                  {
                    description
                  }
                </small>
              </span>

              <ChevronRight
                size={18}
                className="alumni-help-chevron"
              />
            </button>
          )
        )}
      </section>

      <section className="alumni-help-legal-block">
        <span>
          Información legal
        </span>

        <button
          type="button"
          onClick={
            onLegal
          }
          className="alumni-help-home-row"
        >
          <span
            className="alumni-help-home-icon"
            data-tone="neutral"
          >
            <ShieldCheck
              size={21}
              strokeWidth={
                1.8
              }
            />
          </span>

          <span className="alumni-help-home-copy">
            <strong>
              Términos y privacidad
            </strong>
            <small>
              Consulta las políticas de Alumni
            </small>
          </span>

          <ChevronRight
            size={18}
            className="alumni-help-chevron"
          />
        </button>
      </section>
    </>
  );
}

function FeedbackForm({
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

  return (
    <section className="alumni-feedback-form-v2">
      <div className="alumni-feedback-type-tabs">
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

      <label className="alumni-feedback-field">
        <span>
          Asunto
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
              ? "Resume tu idea..."
              : formMode ===
                "support"
              ? "¿En qué podemos ayudarte?"
              : "Resume brevemente el problema..."
          }
        />
      </label>

      <label className="alumni-feedback-field">
        <span>
          Cuéntanos más
        </span>
        <textarea
          value={
            description
          }
          rows={6}
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
              ? "Cuéntanos qué mejorarías y por qué sería útil..."
              : "Describe lo que ocurrió con el detalle que consideres necesario..."
          }
        />
      </label>

      {isProblem && (
        <details className="alumni-feedback-advanced">
          <summary>
            Más detalles
          </summary>

          <label className="alumni-feedback-field">
            <span>
              ¿Qué esperabas?
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
              placeholder="Lo que debería haber ocurrido."
            />
          </label>

          <label className="alumni-feedback-field">
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
        </details>
      )}

      <div className="alumni-feedback-severity">
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
              "Bloquea",
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

      <label className="alumni-feedback-attach">
        <span className="alumni-feedback-attach-icon">
          <ImagePlus
            size={20}
          />
        </span>

        <span>
          <strong>
            Adjuntar captura
          </strong>
          <small>
            JPG, PNG o imagen · máximo 8 MB
          </small>
        </span>

        <ChevronRight
          size={17}
        />

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
        <div className="alumni-feedback-previews">
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

      <p className="alumni-feedback-attachment-limit">
        {files.length}/
        {MAX_FILES} capturas
      </p>

      <button
        type="button"
        className="alumni-feedback-send-v2"
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
          : "Enviar feedback"}
      </button>

      <p className="alumni-feedback-safe-note">
        <CircleHelp
          size={13}
        />
        Tu feedback se envía de forma segura al equipo de Alumni.
      </p>
    </section>
  );
}

/* ${MARKER} */
`;

const css = `/*
 * ${MARKER}
 * Opción 1 — Ayuda y feedback.
 * Lista limpia + formulario bajo demanda.
 */

.alumni-help-v2 {
  width: 100%;
  max-width: 560px;
  min-height: 100%;
  margin: 0 auto;
  padding:
    0 0
    calc(
      104px +
      env(safe-area-inset-bottom)
    );
  color:
    var(--app-text);
}

.alumni-help-header {
  position: sticky;
  top: 0;
  z-index: 25;
  display: grid;
  grid-template-columns:
    42px minmax(0, 1fr) 42px;
  min-height: 54px;
  align-items: center;
  border-bottom:
    1px solid
    var(--app-border);
  background:
    color-mix(
      in srgb,
      var(--app-bg) 96%,
      transparent
    );
  backdrop-filter:
    blur(18px);
  -webkit-backdrop-filter:
    blur(18px);
}

.alumni-help-header
  > button {
  display: inline-flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background:
    transparent;
  color:
    var(--app-text);
}

.alumni-help-header
  > button:active {
  background:
    var(--app-soft);
}

.alumni-help-header h1 {
  margin: 0;
  overflow: hidden;
  color:
    var(--app-text);
  font-size: 15px;
  font-weight: 900;
  line-height: 1;
  text-align: center;
  text-overflow:
    ellipsis;
  white-space: nowrap;
  letter-spacing:
    -.025em;
}

/* Home */
.alumni-help-home-intro {
  padding:
    20px 4px 22px;
  border-bottom:
    1px solid
    var(--app-border);
}

.alumni-help-home-intro p {
  max-width: 420px;
  margin: 0;
  color:
    var(--app-text-soft);
  font-size: 14px;
  font-weight: 520;
  line-height: 1.48;
}

.alumni-help-home-list {
  display: block;
}

.alumni-help-home-row {
  display: grid;
  width: 100%;
  grid-template-columns:
    46px minmax(0, 1fr) auto;
  min-height: 82px;
  align-items: center;
  gap: 12px;
  padding: 11px 4px;
  border: 0;
  border-bottom:
    1px solid
    var(--app-border);
  background:
    transparent;
  color: inherit;
  text-align: left;
  text-decoration: none;
  -webkit-tap-highlight-color:
    transparent;
}

.alumni-help-home-row:active {
  background:
    var(--app-soft);
}

.alumni-help-home-icon {
  display: inline-flex;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
}

.alumni-help-home-icon[
  data-tone="blue"
] {
  background:
    color-mix(
      in srgb,
      var(--app-accent) 12%,
      transparent
    );
  color:
    var(--app-accent);
}

.alumni-help-home-icon[
  data-tone="red"
] {
  background:
    color-mix(
      in srgb,
      var(--app-danger) 11%,
      transparent
    );
  color:
    var(--app-danger);
}

.alumni-help-home-icon[
  data-tone="green"
] {
  background:
    color-mix(
      in srgb,
      var(--app-success) 12%,
      transparent
    );
  color:
    var(--app-success);
}

.alumni-help-home-icon[
  data-tone="violet"
] {
  background:
    color-mix(
      in srgb,
      var(--app-accent) 10%,
      transparent
    );
  color:
    var(--app-accent);
}

.alumni-help-home-icon[
  data-tone="neutral"
] {
  background:
    var(--app-soft);
  color:
    var(--app-text-soft);
}

.alumni-help-home-copy {
  min-width: 0;
}

.alumni-help-home-copy
  strong,
.alumni-help-home-copy
  small {
  display: block;
  overflow: hidden;
  text-overflow:
    ellipsis;
}

.alumni-help-home-copy
  strong {
  color:
    var(--app-text);
  font-size: 13px;
  font-weight: 850;
  line-height: 1.2;
}

.alumni-help-home-copy
  small {
  margin-top: 4px;
  color:
    var(--app-muted-2);
  font-size: 10.5px;
  font-weight: 500;
  line-height: 1.3;
}

.alumni-help-chevron {
  color:
    var(--app-muted-3);
}

.alumni-help-legal-block {
  margin-top: 22px;
}

.alumni-help-legal-block
  > span {
  display: block;
  padding: 0 4px 8px;
  color:
    var(--app-muted-3);
  font-size: 9px;
  font-weight: 900;
  letter-spacing:
    .13em;
  text-transform:
    uppercase;
}

.alumni-help-legal-block
  .alumni-help-home-row {
  border-top:
    1px solid
    var(--app-border);
}

/* Details */
.alumni-help-detail {
  padding:
    18px 0 0;
}

.alumni-help-detail-intro {
  display: flex;
  align-items:
    flex-start;
  gap: 12px;
  padding:
    0 4px 18px;
  border-bottom:
    1px solid
    var(--app-border);
  color:
    var(--app-accent);
}

.alumni-help-detail-intro
  > div {
  min-width: 0;
}

.alumni-help-detail-intro
  strong {
  display: block;
  color:
    var(--app-text);
  font-size: 14px;
  font-weight: 900;
}

.alumni-help-detail-intro p {
  margin-top: 4px;
  color:
    var(--app-muted-2);
  font-size: 10.5px;
  line-height: 1.4;
}

.alumni-help-faq {
  display: grid;
  width: 100%;
  grid-template-columns:
    minmax(0, 1fr)
    auto;
  align-items:
    start;
  gap: 14px;
  min-height: 62px;
  padding:
    16px 4px;
  border: 0;
  border-bottom:
    1px solid
    var(--app-border);
  background:
    transparent;
  color: inherit;
  text-align: left;
}

.alumni-help-faq strong {
  color:
    var(--app-text);
  font-size: 12px;
  font-weight: 800;
}

.alumni-help-faq p {
  margin-top: 8px;
  color:
    var(--app-muted);
  font-size: 11px;
  line-height: 1.55;
}

.alumni-help-faq svg {
  margin-top: 1px;
  color:
    var(--app-muted-3);
  transition:
    transform .16s ease;
}

.alumni-help-faq[
  data-open="true"
] svg {
  transform:
    rotate(180deg);
}

.alumni-help-status-list {
  display: block;
  border-bottom:
    1px solid
    var(--app-border);
}

.alumni-help-status-list
  > div {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    auto;
  min-height: 58px;
  align-items: center;
  gap: 12px;
  padding: 10px 4px;
  border-bottom:
    1px solid
    var(--app-border);
}

.alumni-help-status-list
  > div:last-child {
  border-bottom: 0;
}

.alumni-help-status-list
  span {
  color:
    var(--app-muted-2);
  font-size: 11px;
}

.alumni-help-status-list
  strong {
  max-width: 230px;
  overflow: hidden;
  color:
    var(--app-text);
  font-size: 11px;
  font-weight: 780;
  text-align: right;
  text-overflow:
    ellipsis;
  white-space: nowrap;
}

.alumni-help-status-note {
  margin:
    18px 4px 0;
  color:
    var(--app-muted);
  font-size: 11px;
  line-height: 1.55;
}

.alumni-help-primary-action {
  width:
    calc(100% - 8px);
  min-height: 46px;
  margin:
    18px 4px 0;
  border: 0;
  border-radius: 13px;
  background:
    var(--app-accent-fill);
  color:
    var(--app-on-accent);
  font-size: 11px;
  font-weight: 900;
}

.alumni-help-legal-list a {
  display: flex;
  min-height: 62px;
  align-items: center;
  gap: 12px;
  padding:
    10px 4px;
  border-bottom:
    1px solid
    var(--app-border);
  color:
    var(--app-text);
  text-decoration: none;
}

.alumni-help-legal-list
  a span {
  min-width: 0;
  flex: 1 1 auto;
  font-size: 12px;
  font-weight: 800;
}

.alumni-help-legal-list
  a svg {
  color:
    var(--app-muted-3);
}

/* Form */
.alumni-feedback-form-v2 {
  padding:
    18px 0 0;
}

.alumni-feedback-type-tabs {
  display: grid;
  grid-template-columns:
    repeat(
      3,
      minmax(0, 1fr)
    );
  gap: 7px;
  margin-bottom: 22px;
}

.alumni-feedback-type-tabs
  button {
  min-height: 42px;
  border:
    1px solid
    var(--app-border);
  border-radius: 12px;
  background:
    var(--app-soft);
  color:
    var(--app-muted);
  font-size: 10.5px;
  font-weight: 800;
}

.alumni-feedback-type-tabs
  button[
    data-active="true"
  ] {
  border-color:
    color-mix(
      in srgb,
      var(--app-accent) 50%,
      var(--app-border)
    );
  background:
    var(--app-accent-soft);
  color:
    var(--app-accent);
}

.alumni-feedback-field {
  display: block;
  margin-top: 17px;
}

.alumni-feedback-field
  > span,
.alumni-feedback-severity
  > span {
  display: block;
  margin-bottom: 8px;
  color:
    var(--app-text-soft);
  font-size: 11px;
  font-weight: 800;
}

.alumni-feedback-field
  input,
.alumni-feedback-field
  textarea {
  width: 100%;
  border:
    1px solid
    var(--app-border);
  border-radius: 13px;
  outline: 0;
  background:
    var(--app-surface-2);
  color:
    var(--app-text);
  font-size: 14px;
  box-shadow: none;
}

.alumni-feedback-field
  input {
  height: 48px;
  padding: 0 13px;
}

.alumni-feedback-field
  textarea {
  resize: none;
  padding: 12px 13px;
  line-height: 1.5;
}

.alumni-feedback-field
  input::placeholder,
.alumni-feedback-field
  textarea::placeholder {
  color:
    var(--app-muted-3);
}

.alumni-feedback-field
  input:focus,
.alumni-feedback-field
  textarea:focus {
  border-color:
    var(--app-accent);
  box-shadow:
    0 0 0 3px
    var(--app-accent-soft);
}

.alumni-feedback-advanced {
  margin-top: 18px;
  border-top:
    1px solid
    var(--app-border);
  border-bottom:
    1px solid
    var(--app-border);
}

.alumni-feedback-advanced
  summary {
  min-height: 52px;
  padding: 17px 2px;
  color:
    var(--app-muted);
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}

.alumni-feedback-advanced[
  open
] {
  padding-bottom: 16px;
}

.alumni-feedback-severity {
  margin-top: 18px;
}

.alumni-feedback-severity
  > div {
  display: grid;
  grid-template-columns:
    repeat(
      4,
      minmax(0, 1fr)
    );
  gap: 6px;
}

.alumni-feedback-severity
  button {
  min-height: 36px;
  border:
    1px solid
    var(--app-border);
  border-radius: 10px;
  background:
    transparent;
  color:
    var(--app-muted-2);
  font-size: 9.5px;
  font-weight: 800;
}

.alumni-feedback-severity
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

.alumni-feedback-attach {
  position: relative;
  display: grid;
  grid-template-columns:
    42px minmax(0, 1fr) auto;
  min-height: 70px;
  align-items: center;
  gap: 12px;
  margin-top: 22px;
  padding:
    10px 4px;
  border-top:
    1px solid
    var(--app-border);
  border-bottom:
    1px solid
    var(--app-border);
  cursor: pointer;
}

.alumni-feedback-attach
  input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.alumni-feedback-attach-icon {
  display: inline-flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background:
    var(--app-soft);
  color:
    var(--app-text-soft);
}

.alumni-feedback-attach
  > span:nth-child(2)
  strong,
.alumni-feedback-attach
  > span:nth-child(2)
  small {
  display: block;
}

.alumni-feedback-attach
  > span:nth-child(2)
  strong {
  color:
    var(--app-text);
  font-size: 11.5px;
  font-weight: 820;
}

.alumni-feedback-attach
  > span:nth-child(2)
  small {
  margin-top: 3px;
  color:
    var(--app-muted-2);
  font-size: 9.5px;
}

.alumni-feedback-attach
  > svg {
  color:
    var(--app-muted-3);
}

.alumni-feedback-previews {
  display: grid;
  grid-template-columns:
    repeat(
      4,
      minmax(0, 1fr)
    );
  gap: 7px;
  margin-top: 10px;
}

.alumni-feedback-previews
  > div {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border:
    1px solid
    var(--app-border);
  border-radius: 11px;
  background:
    var(--app-soft);
}

.alumni-feedback-previews
  img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.alumni-feedback-previews
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
  border-radius: 999px;
  background:
    rgba(5,7,11,.72);
  color: white;
}

.alumni-feedback-attachment-limit {
  margin-top: 7px;
  color:
    var(--app-muted-3);
  font-size: 9.5px;
  text-align: right;
}

.alumni-feedback-send-v2 {
  display: flex;
  width: 100%;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  border: 0;
  border-radius: 13px;
  background:
    var(--app-accent-fill);
  color:
    var(--app-on-accent);
  font-size: 11px;
  font-weight: 900;
}

.alumni-feedback-send-v2:disabled {
  opacity: .42;
}

.alumni-feedback-safe-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 12px;
  color:
    var(--app-muted-3);
  font-size: 9.5px;
}

/* Success / Loading */
.alumni-help-loading {
  padding: 64px 0;
  color:
    var(--app-muted-2);
  font-size: 12px;
  text-align: center;
}

.alumni-help-success {
  display: flex;
  min-height:
    min(
      70dvh,
      620px
    );
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px 18px;
  text-align: center;
}

.alumni-help-success-icon {
  display: inline-flex;
  width: 60px;
  height: 60px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background:
    color-mix(
      in srgb,
      var(--app-success) 12%,
      transparent
    );
  color:
    var(--app-success);
}

.alumni-help-success h1 {
  margin-top: 17px;
  color:
    var(--app-text);
  font-size: 23px;
  font-weight: 950;
  letter-spacing:
    -.04em;
}

.alumni-help-success p {
  max-width: 360px;
  margin-top: 8px;
  color:
    var(--app-muted);
  font-size: 12px;
  line-height: 1.55;
}

.alumni-help-success small {
  margin-top: 12px;
  color:
    var(--app-muted-3);
  font-size: 9px;
  font-weight: 800;
}

.alumni-help-success button {
  min-height: 44px;
  margin-top: 20px;
  padding: 0 18px;
  border: 0;
  border-radius: 12px;
  background:
    var(--app-accent-fill);
  color:
    var(--app-on-accent);
  font-size: 10.5px;
  font-weight: 900;
}

@media (max-width: 374px) {
  .alumni-help-home-row {
    min-height: 76px;
  }

  .alumni-help-home-icon {
    width: 40px;
    height: 40px;
  }

  .alumni-feedback-severity
    > div {
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );
  }
}

@media (min-width: 700px) {
  .alumni-help-v2 {
    max-width: 560px;
    padding-top: 14px;
  }

  .alumni-help-header {
    border:
      1px solid
      var(--app-border);
    border-radius:
      16px 16px 0 0;
  }

  .alumni-help-home-intro,
  .alumni-help-home-row,
  .alumni-help-detail,
  .alumni-feedback-form-v2 {
    padding-right: 14px;
    padding-left: 14px;
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
      page,
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
      "Feedback 2.0 quedó con sintaxis inválida" +
        (
          pos
            ? ` línea ${pos.line + 1}, columna ${pos.character + 1}`
            : ""
        ) +
        `: ${message}`
    );
  }

  console.log(
    "✅ Parser TypeScript: Feedback 2.0 válido"
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
  ".before-feedback-2.0.bak";

if (
  !fs.existsSync(
    backup
  )
) {
  fs.copyFileSync(
    abs(PAGE),
    backup
  );
}

fs.writeFileSync(
  abs(PAGE),
  page,
  "utf8"
);

fs.writeFileSync(
  abs(CSS),
  css,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Feedback 2.0 aplicado."
);
console.log(
  "✅ Opción 1: Ayuda y feedback como hub limpio."
);
console.log(
  "✅ Formulario solo aparece cuando se necesita."
);
console.log(
  "✅ Centro de ayuda integrado."
);
console.log(
  "✅ Estado técnico sin inventar incidencias."
);
console.log(
  "✅ Contactar soporte usa el backend real de feedback."
);
console.log(
  "✅ Términos / Privacidad / Normas accesibles."
);
console.log(
  "✅ Espacio inferior preparado para navbar flotante."
);
console.log(
  "✅ Dark / Light preservados."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
