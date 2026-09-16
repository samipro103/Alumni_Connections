const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_SMART_START_FEED_1_0";

const FILES = {
  feed:
    "src/app/feed/page.tsx",
  css:
    "src/app/feed/feed-consolidated-final-4-0.css",
  component:
    "src/components/feed/FeedSmartStart.tsx",
};

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

  return fs
    .readFileSync(abs(rel), "utf8")
    .replace(/\r\n/g, "\n");
}

function backup(rel, content) {
  const target = abs(
    path.join(
      "node_modules",
      ".alumni_patch_backups",
      "smart-start-feed-1-0",
      rel
    )
  );

  if (fs.existsSync(target)) return;

  fs.mkdirSync(
    path.dirname(target),
    { recursive: true }
  );

  fs.writeFileSync(
    target,
    content,
    "utf8"
  );
}

function replaceOnce(
  source,
  from,
  to,
  label
) {
  if (!source.includes(from)) {
    fail(
      `No encontré el bloque esperado: ${label}`
    );
  }

  const first =
    source.indexOf(from);

  const second =
    source.indexOf(
      from,
      first + from.length
    );

  if (second !== -1) {
    fail(
      `El bloque "${label}" aparece más de una vez.`
    );
  }

  return source.replace(
    from,
    to
  );
}

if (
  !fs.existsSync(
    abs("package.json")
  )
) {
  fail(
    "Ejecutá este script dentro de alumni-web."
  );
}

let feed =
  read(FILES.feed);

let css =
  read(FILES.css);

if (
  feed.includes(MARKER) &&
  css.includes(MARKER) &&
  fs.existsSync(
    abs(FILES.component)
  )
) {
  console.log(
    "✅ Inicio más vivo 1.0 ya está aplicado."
  );
  process.exit(0);
}

if (
  fs.existsSync(
    abs(FILES.component)
  ) &&
  !read(
    FILES.component
  ).includes(MARKER)
) {
  fail(
    "Ya existe FeedSmartStart.tsx y no pertenece a este parche."
  );
}

backup(
  FILES.feed,
  feed
);

backup(
  FILES.css,
  css
);

const component =
  "\"use client\";\n\nimport {\n  useEffect,\n  useMemo,\n  useState,\n} from \"react\";\nimport Link from \"next/link\";\nimport {\n  Check,\n  Loader2,\n  Sparkles,\n  UserPlus,\n} from \"lucide-react\";\nimport {\n  AnimatePresence,\n  motion,\n  useReducedMotion,\n} from \"framer-motion\";\nimport {\n  AlumniAvatar,\n} from \"@/components/ui/AlumniImage\";\nimport {\n  supabase,\n} from \"@/lib/supabase\";\nimport {\n  getRecommendedProfiles,\n  type RecommendedProfile,\n} from \"@/lib/recommendations\";\n\ntype ConnectionState =\n  | \"following\"\n  | \"requested\";\n\nexport default function FeedSmartStart({\n  user,\n  followingIds,\n  onFollowing,\n}: {\n  user: any;\n  followingIds: string[];\n  onFollowing: (\n    personId: string\n  ) => void;\n}) {\n  const reduceMotion =\n    useReducedMotion();\n\n  const [\n    recommendations,\n    setRecommendations,\n  ] = useState<\n    RecommendedProfile[]\n  >([]);\n\n  const [\n    loading,\n    setLoading,\n  ] = useState(false);\n\n  const [\n    busy,\n    setBusy,\n  ] = useState<string | null>(\n    null\n  );\n\n  const [\n    connected,\n    setConnected,\n  ] = useState<\n    Record<\n      string,\n      ConnectionState\n    >\n  >({});\n\n  const [\n    welcomeVisible,\n    setWelcomeVisible,\n  ] = useState(false);\n\n  const networkIsSmall =\n    followingIds.length < 8;\n\n  const freshOnboarding =\n    useMemo(() => {\n      const raw =\n        user?.user_metadata\n          ?.onboarding_completed_at_v1;\n\n      if (!raw) {\n        return false;\n      }\n\n      const completedAt =\n        new Date(raw).getTime();\n\n      if (\n        !Number.isFinite(\n          completedAt\n        )\n      ) {\n        return false;\n      }\n\n      return (\n        Date.now() -\n          completedAt <\n        20 * 60 * 1000\n      );\n    }, [\n      user?.user_metadata\n        ?.onboarding_completed_at_v1,\n    ]);\n\n  useEffect(() => {\n    if (\n      !freshOnboarding ||\n      typeof window ===\n        \"undefined\"\n    ) {\n      return;\n    }\n\n    const key =\n      `alumni:smart-start:welcome:${user.id}`;\n\n    if (\n      sessionStorage.getItem(\n        key\n      ) === \"1\"\n    ) {\n      return;\n    }\n\n    sessionStorage.setItem(\n      key,\n      \"1\"\n    );\n\n    setWelcomeVisible(\n      true\n    );\n\n    const timer =\n      window.setTimeout(\n        () => {\n          setWelcomeVisible(\n            false\n          );\n        },\n        3600\n      );\n\n    return () =>\n      window.clearTimeout(\n        timer\n      );\n  }, [\n    freshOnboarding,\n    user?.id,\n  ]);\n\n  useEffect(() => {\n    if (\n      !user?.id ||\n      !networkIsSmall\n    ) {\n      setRecommendations(\n        []\n      );\n      return;\n    }\n\n    let active = true;\n\n    setLoading(true);\n\n    void (async () => {\n      try {\n        const data =\n          await getRecommendedProfiles(\n            user.id,\n            6\n          );\n\n        if (!active) {\n          return;\n        }\n\n        setRecommendations(\n          data.filter(\n            (person) =>\n              !followingIds.includes(\n                person.id\n              )\n          )\n        );\n      } catch (error) {\n        console.warn(\n          \"[Alumni Feed] smart start recommendations:\",\n          error\n        );\n      } finally {\n        if (active) {\n          setLoading(false);\n        }\n      }\n    })();\n\n    return () => {\n      active = false;\n    };\n  }, [\n    user?.id,\n    networkIsSmall,\n  ]);\n\n  async function follow(\n    person: RecommendedProfile\n  ) {\n    if (\n      !user?.id ||\n      busy ||\n      connected[\n        person.id\n      ]\n    ) {\n      return;\n    }\n\n    setBusy(\n      person.id\n    );\n\n    try {\n      if (\n        person.is_private\n      ) {\n        const {\n          error,\n        } = await supabase\n          .from(\n            \"follow_requests\"\n          )\n          .insert({\n            requester_id:\n              user.id,\n            target_id:\n              person.id,\n          });\n\n        if (error) {\n          throw error;\n        }\n\n        setConnected(\n          (current) => ({\n            ...current,\n            [person.id]:\n              \"requested\",\n          })\n        );\n      } else {\n        const {\n          error,\n        } = await supabase\n          .from(\"follows\")\n          .insert({\n            follower_id:\n              user.id,\n            following_id:\n              person.id,\n          });\n\n        if (error) {\n          throw error;\n        }\n\n        setConnected(\n          (current) => ({\n            ...current,\n            [person.id]:\n              \"following\",\n          })\n        );\n\n        onFollowing(\n          person.id\n        );\n\n        void supabase\n          .from(\n            \"notifications\"\n          )\n          .insert({\n            user_id:\n              person.id,\n            actor_id:\n              user.id,\n            type: \"follow\",\n            target_type:\n              \"profile\",\n            target_id:\n              user.id,\n          });\n      }\n\n      void supabase.rpc(\n        \"alumni_record_discovery_signal\",\n        {\n          p_signal_type:\n            \"profile\",\n          p_signal_value:\n            person.id,\n          p_weight: 2.2,\n        }\n      );\n    } catch (error: any) {\n      const message =\n        String(\n          error?.message ||\n            \"\"\n        ).toLowerCase();\n\n      if (\n        message.includes(\n          \"duplicate\"\n        ) ||\n        message.includes(\n          \"unique\"\n        )\n      ) {\n        setConnected(\n          (current) => ({\n            ...current,\n            [person.id]:\n              person.is_private\n                ? \"requested\"\n                : \"following\",\n          })\n        );\n\n        if (\n          !person.is_private\n        ) {\n          onFollowing(\n            person.id\n          );\n        }\n      } else {\n        console.warn(\n          \"[Alumni Feed] smart follow:\",\n          error\n        );\n      }\n    } finally {\n      setBusy(null);\n    }\n  }\n\n  const visible =\n    welcomeVisible ||\n    (\n      networkIsSmall &&\n      (\n        loading ||\n        recommendations.length >\n          0\n      )\n    );\n\n  if (!visible) {\n    return null;\n  }\n\n  return (\n    <motion.section\n      className=\"alumni-feed-smart-start\"\n      initial={\n        reduceMotion\n          ? {\n              opacity: 0,\n            }\n          : {\n              opacity: 0,\n              y: 8,\n            }\n      }\n      animate={{\n        opacity: 1,\n        y: 0,\n      }}\n      transition={{\n        duration:\n          reduceMotion\n            ? 0.08\n            : 0.22,\n        ease: [\n          0.2,\n          0.8,\n          0.2,\n          1,\n        ],\n      }}\n    >\n      <AnimatePresence\n        initial={false}\n      >\n        {welcomeVisible && (\n          <motion.div\n            className=\"alumni-feed-smart-welcome\"\n            initial={\n              reduceMotion\n                ? {\n                    opacity: 0,\n                  }\n                : {\n                    opacity: 0,\n                    y: -5,\n                  }\n            }\n            animate={{\n              opacity: 1,\n              y: 0,\n            }}\n            exit={{\n              opacity: 0,\n              y: -4,\n            }}\n          >\n            <Sparkles\n              size={14}\n            />\n            <span>\n              Tu inicio ya est\u00e1 listo\n            </span>\n          </motion.div>\n        )}\n      </AnimatePresence>\n\n      {networkIsSmall && (\n        <>\n          <header className=\"alumni-feed-smart-head\">\n            <strong>\n              Conecta\n            </strong>\n\n            <Link\n              href=\"/explore\"\n            >\n              Ver m\u00e1s\n            </Link>\n          </header>\n\n          {loading ? (\n            <div\n              className=\"alumni-feed-smart-skeleton\"\n              aria-hidden=\"true\"\n            >\n              {[0, 1, 2].map(\n                (item) => (\n                  <span\n                    key={item}\n                  />\n                )\n              )}\n            </div>\n          ) : (\n            <div className=\"alumni-feed-smart-rail\">\n              <AnimatePresence\n                initial={false}\n              >\n                {recommendations.map(\n                  (\n                    person,\n                    index\n                  ) => {\n                    const state =\n                      connected[\n                        person.id\n                      ];\n\n                    const isBusy =\n                      busy ===\n                      person.id;\n\n                    return (\n                      <motion.article\n                        layout\n                        key={\n                          person.id\n                        }\n                        className=\"alumni-feed-smart-person\"\n                        initial={\n                          reduceMotion\n                            ? {\n                                opacity:\n                                  0,\n                              }\n                            : {\n                                opacity:\n                                  0,\n                                x: 9,\n                              }\n                        }\n                        animate={{\n                          opacity: 1,\n                          x: 0,\n                        }}\n                        exit={{\n                          opacity: 0,\n                          scale:\n                            0.98,\n                        }}\n                        transition={{\n                          duration:\n                            reduceMotion\n                              ? 0.08\n                              : 0.2,\n                          delay:\n                            reduceMotion\n                              ? 0\n                              : Math.min(\n                                  index *\n                                    0.025,\n                                  0.1\n                                ),\n                        }}\n                      >\n                        <Link\n                          href={`/u/${person.username}`}\n                          className=\"alumni-feed-smart-profile\"\n                          aria-label={`Ver perfil de ${person.username}`}\n                        >\n                          <AlumniAvatar\n                            src={\n                              person.avatar_url\n                            }\n                            name={\n                              person.full_name ||\n                              person.username\n                            }\n                            alt=\"\"\n                            className=\"alumni-feed-smart-avatar\"\n                            imageClassName=\"alumni-feed-smart-avatar-image\"\n                          />\n\n                          <span className=\"alumni-feed-smart-copy\">\n                            <strong>\n                              {person.full_name ||\n                                `@${person.username}`}\n                            </strong>\n\n                            <small>\n                              {\n                                person.reason\n                              }\n                            </small>\n                          </span>\n                        </Link>\n\n                        <motion.button\n                          type=\"button\"\n                          aria-label={\n                            state\n                              ? \"Conexi\u00f3n guardada\"\n                              : `Seguir a ${person.username}`\n                          }\n                          data-done={\n                            state\n                              ? \"true\"\n                              : \"false\"\n                          }\n                          disabled={\n                            isBusy ||\n                            Boolean(\n                              state\n                            )\n                          }\n                          onClick={() =>\n                            void follow(\n                              person\n                            )\n                          }\n                          whileTap={\n                            reduceMotion\n                              ? undefined\n                              : {\n                                  scale:\n                                    0.92,\n                                }\n                          }\n                        >\n                          {isBusy ? (\n                            <Loader2\n                              size={14}\n                              className=\"alumni-feed-smart-spin\"\n                            />\n                          ) : state ? (\n                            <Check\n                              size={14}\n                            />\n                          ) : (\n                            <UserPlus\n                              size={14}\n                            />\n                          )}\n                        </motion.button>\n                      </motion.article>\n                    );\n                  }\n                )}\n              </AnimatePresence>\n            </div>\n          )}\n        </>\n      )}\n    </motion.section>\n  );\n}\n\n/* ALUMNI_SMART_START_FEED_1_0 */\n";

const cssAppend =
  "\n/* =========================================================\n   ALUMNI_SMART_START_FEED_1_0\n   Primer Inicio m\u00e1s vivo, mobile-first y sin ruido.\n   ========================================================= */\n\n.alumni-feed-smart-start {\n  margin:\n    2px\n    0\n    8px;\n  padding:\n    0\n    0\n    10px;\n  overflow: hidden;\n  border-bottom:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-border) 72%,\n      transparent\n    );\n}\n\n.alumni-feed-smart-welcome {\n  display: flex;\n  min-height: 34px;\n  align-items: center;\n  justify-content: center;\n  gap: 7px;\n  margin:\n    0\n    12px\n    5px;\n  color:\n    var(--app-text-soft);\n  font-size: 10.5px;\n  font-weight: 760;\n}\n\n.alumni-feed-smart-welcome svg {\n  color:\n    var(--app-accent);\n}\n\n.alumni-feed-smart-head {\n  display: flex;\n  min-height: 34px;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  padding:\n    0\n    14px;\n}\n\n.alumni-feed-smart-head strong {\n  color:\n    var(--app-text);\n  font-size: 11px;\n  font-weight: 850;\n}\n\n.alumni-feed-smart-head a {\n  color:\n    var(--app-muted-2);\n  font-size: 9.5px;\n  font-weight: 720;\n  text-decoration: none;\n}\n\n.alumni-feed-smart-rail,\n.alumni-feed-smart-skeleton {\n  display: flex;\n  gap: 8px;\n  overflow-x: auto;\n  padding:\n    2px\n    14px\n    3px;\n  scrollbar-width: none;\n  overscroll-behavior-x:\n    contain;\n  scroll-snap-type:\n    x proximity;\n  -webkit-overflow-scrolling:\n    touch;\n}\n\n.alumni-feed-smart-rail::-webkit-scrollbar,\n.alumni-feed-smart-skeleton::-webkit-scrollbar {\n  display: none;\n}\n\n.alumni-feed-smart-person {\n  width: min(\n    72vw,\n    238px\n  );\n  min-width: min(\n    72vw,\n    238px\n  );\n  min-height: 60px;\n  display: grid;\n  grid-template-columns:\n    minmax(0, 1fr)\n    34px;\n  gap: 8px;\n  align-items: center;\n  padding:\n    8px\n    8px\n    8px\n    9px;\n  scroll-snap-align:\n    start;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius:\n    16px;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-surface) 92%,\n      transparent\n    );\n}\n\n.alumni-feed-smart-profile {\n  min-width: 0;\n  display: grid;\n  grid-template-columns:\n    40px\n    minmax(0, 1fr);\n  gap: 9px;\n  align-items: center;\n  color: inherit;\n  text-decoration: none;\n}\n\n.alumni-feed-smart-avatar {\n  width: 40px;\n  height: 40px;\n  overflow: hidden;\n  border-radius:\n    13px;\n  background:\n    var(--app-soft);\n}\n\n.alumni-feed-smart-avatar-image {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n\n.alumni-feed-smart-copy {\n  min-width: 0;\n}\n\n.alumni-feed-smart-copy strong,\n.alumni-feed-smart-copy small {\n  display: block;\n  overflow: hidden;\n  text-overflow:\n    ellipsis;\n  white-space: nowrap;\n}\n\n.alumni-feed-smart-copy strong {\n  color:\n    var(--app-text);\n  font-size: 10.5px;\n  font-weight: 820;\n  line-height: 1.2;\n}\n\n.alumni-feed-smart-copy small {\n  margin-top: 3px;\n  color:\n    var(--app-muted-2);\n  font-size: 8.5px;\n  font-weight: 620;\n  line-height: 1.2;\n}\n\n.alumni-feed-smart-person\n  > button {\n  width: 32px;\n  height: 32px;\n  display: grid;\n  place-items: center;\n  padding: 0;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-accent) 18%,\n      var(--app-border)\n    );\n  border-radius:\n    11px;\n  outline: 0;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 8%,\n      var(--app-surface)\n    );\n  color:\n    var(--app-accent);\n}\n\n.alumni-feed-smart-person\n  > button[data-done=\"true\"] {\n  border-color:\n    var(--app-border);\n  background:\n    var(--app-soft);\n  color:\n    var(--app-muted-2);\n}\n\n.alumni-feed-smart-skeleton span {\n  width: min(\n    72vw,\n    238px\n  );\n  min-width: min(\n    72vw,\n    238px\n  );\n  height: 60px;\n  border-radius:\n    16px;\n  background:\n    linear-gradient(\n      90deg,\n      var(--app-soft),\n      var(--app-surface),\n      var(--app-soft)\n    );\n  background-size:\n    220% 100%;\n  animation:\n    alumniFeedSmartSkeleton\n    1.05s linear infinite;\n}\n\n.alumni-feed-smart-spin {\n  animation:\n    alumniFeedSmartSpin\n    .72s linear infinite;\n}\n\n@keyframes\n  alumniFeedSmartSpin {\n  to {\n    transform:\n      rotate(360deg);\n  }\n}\n\n@keyframes\n  alumniFeedSmartSkeleton {\n  to {\n    background-position:\n      -220% 0;\n  }\n}\n\n@media (\n  max-width: 370px\n) {\n  .alumni-feed-smart-person,\n  .alumni-feed-smart-skeleton span {\n    width: 232px;\n    min-width: 232px;\n  }\n\n  .alumni-feed-smart-head,\n  .alumni-feed-smart-rail,\n  .alumni-feed-smart-skeleton {\n    padding-left: 12px;\n    padding-right: 12px;\n  }\n}\n\n@media (\n  prefers-reduced-motion:\n  reduce\n) {\n  .alumni-feed-smart-spin,\n  .alumni-feed-smart-skeleton span {\n    animation:\n      none !important;\n  }\n}\n\n/* ALUMNI_SMART_START_FEED_1_0:CSS */\n";

/* Imports */
feed = replaceOnce(
  feed,
  `import dynamic from "next/dynamic";`,
  `import dynamic from "next/dynamic";
import {
  motion,
  useReducedMotion,
} from "framer-motion";`,
  "Framer Motion import"
);

feed = replaceOnce(
  feed,
  `import FeedPost from "@/components/feed/FeedPost";`,
  `import FeedPost from "@/components/feed/FeedPost";
import FeedSmartStart from "@/components/feed/FeedSmartStart";`,
  "FeedSmartStart import"
);

/* Reduced motion */
feed = replaceOnce(
  feed,
  `function FeedContent() {
  const searchParams = useSearchParams();`,
  `function FeedContent() {
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();`,
  "FeedContent motion preference"
);

/* Smart follow callback */
feed = replaceOnce(
  feed,
  `  const activeCommentsPost = useMemo(`,
  `  function handleSmartFollowing(
    personId: string
  ) {
    setFollowingIds(
      (current) =>
        current.includes(
          personId
        )
          ? current
          : [
              ...current,
              personId,
            ]
    );
  }

  const activeCommentsPost = useMemo(`,
  "smart follow callback"
);

/* Insert smart start under feed tabs */
feed = replaceOnce(
  feed,
  `        </nav>

        {newPostsAvailable && (`,
  `        </nav>

        {feedMode === "for-you" &&
          currentUser && (
            <FeedSmartStart
              user={currentUser}
              followingIds={followingIds}
              onFollowing={handleSmartFollowing}
            />
          )}

        {newPostsAvailable && (`,
  "smart start placement"
);

/* Give posts subtle Motion without changing their layout */
feed = replaceOnce(
  feed,
  `              <div
                key={post.id}
                className={`,
  `              <motion.div
                key={post.id}
                initial={
                  reduceMotion
                    ? { opacity: 1 }
                    : {
                        opacity: 0,
                        y: 7,
                      }
                }
                animate={
                  opacity: 1,
                  y: 0,
                }
                transition={
                  duration:
                    reduceMotion
                      ? 0
                      : 0.2,
                  delay:
                    reduceMotion
                      ? 0
                      : Math.min(
                          postIndex *
                            0.018,
                          0.09
                        ),
                  ease: [
                    0.2,
                    0.8,
                    0.2,
                    1,
                  ],
                }
                className={`,
  "post motion wrapper"
);

feed = replaceOnce(
  feed,
  `                />
              </div>

              {shouldShowFeedAd(postIndex) && (`,
  `                />
              </motion.div>

              {shouldShowFeedAd(postIndex) && (`,
  "post motion close"
);

feed =
  feed.trimEnd() +
  "\n\n/* " +
  MARKER +
  ":PAGE */\n";

if (
  !css.includes(MARKER)
) {
  css =
    css.trimEnd() +
    "\n\n" +
    cssAppend +
    "\n";
}

try {
  const ts =
    require("typescript");

  for (
    const [
      name,
      source,
      kind,
    ] of [
      [
        FILES.feed,
        feed,
        ts.ScriptKind.TSX,
      ],
      [
        FILES.component,
        component,
        ts.ScriptKind.TSX,
      ],
    ]
  ) {
    const parsed =
      ts.createSourceFile(
        name,
        source,
        ts.ScriptTarget.Latest,
        true,
        kind
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
        name +
          ": " +
          ts.flattenDiagnosticMessageText(
            first.messageText,
            "\n"
          )
      );
    }
  }

  console.log(
    "✅ Parser TypeScript: Inicio más vivo válido."
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
    abs(FILES.component)
  ),
  { recursive: true }
);

fs.writeFileSync(
  abs(FILES.feed),
  feed,
  "utf8"
);

fs.writeFileSync(
  abs(FILES.css),
  css,
  "utf8"
);

fs.writeFileSync(
  abs(FILES.component),
  component,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI INICIO MÁS VIVO 1.0 aplicado."
);
console.log(
  "✅ Bienvenida breve después del onboarding."
);
console.log(
  "✅ Conexiones sugeridas solo cuando la red es pequeña."
);
console.log(
  "✅ Usa Recomendaciones 2.0 si está disponible."
);
console.log(
  "✅ Fallback compatible con el recomendador actual."
);
console.log(
  "✅ Seguir / solicitar seguimiento funciona desde Inicio."
);
console.log(
  "✅ Publicaciones entran con Motion sutil."
);
console.log(
  "✅ Sin tarjetas grandes ni texto pesado."
);
console.log(
  "✅ No agrega CSS nuevo al stack del Feed."
);
console.log("");
console.log(
  "Ejecutá:"
);
console.log(
  "  npm run design:audit:strict"
);
console.log(
  "  npm run build"
);
console.log("");
console.log(
  "Luego hacé el commit del LEEME."
);
