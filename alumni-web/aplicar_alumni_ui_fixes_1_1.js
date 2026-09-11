const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_UI_FIXES_1_1";

const FILES = {
  feed:
    "src/app/feed/page.tsx",
  feedCss:
    "src/app/feed/feed-visual-3-1.css",
  searchCss:
    "src/app/explore/explore-pro.css",
  eventsCss:
    "src/app/events/events-2.css",
  communityCss:
    "src/app/community/community-2.css",
  navCss:
    "src/components/layout/mobile-nav-refine-1-0.css",
  topbar:
    "src/components/layout/TopBar.tsx",
  topbarCss:
    "src/components/layout/topbar-glass-1-1.css",
  comments:
    "src/components/feed/FeedCommentsSheet.tsx",
  commentsCss:
    "src/app/feed/feed-comments-messaging-font.css",
};

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
    ".before-ui-fixes-1.1.bak";

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

function appendOnce(
  source,
  marker,
  css
) {
  if (
    source.includes(
      marker
    )
  ) {
    return source;
  }

  return (
    source.trimEnd() +
    "\n\n" +
    css.trim() +
    "\n"
  );
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

let feed =
  read(FILES.feed);

let feedCss =
  read(FILES.feedCss);

let searchCss =
  read(FILES.searchCss);

let eventsCss =
  read(FILES.eventsCss);

let communityCss =
  read(FILES.communityCss);

const oldNavCss =
  read(FILES.navCss);

let topbar =
  read(FILES.topbar);

const oldComments =
  read(FILES.comments);

let commentsCss =
  read(
    FILES.commentsCss
  );

if (
  feed.includes(
    `${MARKER}:FEED`
  ) &&
  oldComments.includes(
    `${MARKER}_COMMENTS`
  )
) {
  console.log(
    "✅ UI Fixes 1.1 ya estaba aplicado."
  );
  process.exit(0);
}

for (
  const [
    rel,
    content,
  ] of [
    [
      FILES.feed,
      feed,
    ],
    [
      FILES.feedCss,
      feedCss,
    ],
    [
      FILES.searchCss,
      searchCss,
    ],
    [
      FILES.eventsCss,
      eventsCss,
    ],
    [
      FILES.communityCss,
      communityCss,
    ],
    [
      FILES.navCss,
      oldNavCss,
    ],
    [
      FILES.topbar,
      topbar,
    ],
    [
      FILES.comments,
      oldComments,
    ],
    [
      FILES.commentsCss,
      commentsCss,
    ],
  ]
) {
  backup(
    rel,
    content
  );
}

/* ======================================================
   FEED PERFORMANCE + ALIGNMENT
   ====================================================== */

if (
  feed.includes(
    "const FEED_PAGE_SIZE = 30;"
  )
) {
  feed =
    feed.replace(
      "const FEED_PAGE_SIZE = 30;",
      "const FEED_PAGE_SIZE = 18;"
    );
} else if (
  !feed.includes(
    "const FEED_PAGE_SIZE = 18;"
  )
) {
  fail(
    "No encontré FEED_PAGE_SIZE esperado."
  );
}

feed +=
  `\n/* ${MARKER}:FEED */\n`;

feedCss =
  appendOnce(
    feedCss,
    "ALUMNI_UI_FIXES_1_1_FEED",
    "\n/* =========================================================\n   ALUMNI UI Fixes 1.1 — Feed alignment\n   ========================================================= */\n\n@media (max-width: 767px) {\n  .alumni-feed-page\n  .alumni-pro-feed-tabs {\n    padding-right:\n      14px !important;\n    padding-left:\n      14px !important;\n  }\n\n  .alumni-feed-page\n  .alumni-pro-composer {\n    padding-right:\n      14px !important;\n    padding-left:\n      14px !important;\n  }\n\n  .alumni-feed-page\n  .alumni-feed-post-viewport {\n    padding-right:\n      14px !important;\n    padding-left:\n      14px !important;\n  }\n}\n\n.alumni-feed-page\n.alumni-pro-feed-tabs {\n  gap: 22px;\n}\n\n.alumni-feed-page\n.alumni-pro-feed-tabs\nbutton {\n  min-width: 0;\n}\n\n/* ALUMNI_UI_FIXES_1_1_FEED */\n"
  );

searchCss =
  appendOnce(
    searchCss,
    "ALUMNI_UI_FIXES_1_1_SEARCH",
    "\n/* =========================================================\n   ALUMNI UI Fixes 1.1 — Search flat field\n   ========================================================= */\n\n.alumni-search-people-focus\n.alumni-explore-search {\n  min-height: 44px !important;\n  padding:\n    0 2px !important;\n  border:\n    0 !important;\n  border-bottom:\n    1px solid\n    var(--app-border) !important;\n  border-radius:\n    0 !important;\n  background:\n    transparent !important;\n  box-shadow:\n    none !important;\n}\n\nhtml[data-theme=\"light\"]\n.alumni-search-people-focus\n.alumni-explore-search,\nhtml[data-theme=\"dark\"]\n.alumni-search-people-focus\n.alumni-explore-search {\n  background:\n    transparent !important;\n}\n\n.alumni-search-people-focus\n.alumni-search-filter-button {\n  border:\n    0 !important;\n  background:\n    transparent !important;\n  box-shadow:\n    none !important;\n}\n\n.alumni-search-people-focus\n.alumni-explore-search:focus-within {\n  border-bottom-color:\n    var(--app-accent) !important;\n}\n\n/* ALUMNI_UI_FIXES_1_1_SEARCH */\n"
  );

eventsCss =
  appendOnce(
    eventsCss,
    "ALUMNI_UI_FIXES_1_1_EVENTS",
    "\n/* =========================================================\n   ALUMNI UI Fixes 1.1 — Events containment\n   ========================================================= */\n\n.alumni-events-2 {\n  min-width: 0;\n  overflow-x: clip;\n}\n\n.alumni-events-2\n.events2-hero,\n.alumni-events-2\n.events2-navigation,\n.alumni-events-2\n.events2-list,\n.alumni-events-2\n.events2-row {\n  width: 100%;\n  max-width: 100%;\n  min-width: 0;\n}\n\n.alumni-events-2\n.events2-hero\n> div {\n  min-width: 0;\n  max-width: 100%;\n}\n\n.alumni-events-2\n.events2-hero h1 {\n  max-width: 100%;\n  overflow-wrap: anywhere;\n}\n\n.alumni-events-2\n.events2-primary-action {\n  max-width: 100%;\n}\n\n.alumni-events-2\n.events2-tabs {\n  max-width: 100%;\n  overflow-x: auto;\n  overflow-y: hidden;\n  scrollbar-width: none;\n}\n\n.alumni-events-2\n.events2-tabs::-webkit-scrollbar {\n  display: none;\n}\n\n.alumni-events-2\n.events2-row-main {\n  min-width: 0;\n  overflow: hidden;\n}\n\n.alumni-events-2\n.events2-row-kicker,\n.alumni-events-2\n.events2-row-title,\n.alumni-events-2\n.events2-row-meta {\n  max-width: 100%;\n}\n\n.alumni-events-2\n.events2-row-kicker,\n.alumni-events-2\n.events2-row-title,\n.alumni-events-2\n.events2-row-meta {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.alumni-events-2\n.events2-row-side {\n  min-width: 0;\n}\n\n@media (max-width: 430px) {\n  .alumni-events-2\n  .events2-hero h1 {\n    font-size:\n      clamp(\n        30px,\n        10vw,\n        38px\n      );\n  }\n\n  .alumni-events-2\n  .events2-row {\n    grid-template-columns:\n      44px\n      minmax(0, 1fr)\n      16px;\n    gap: 10px;\n  }\n\n  .alumni-events-2\n  .events2-row-side {\n    gap: 0;\n  }\n\n  .alumni-events-2\n  .events2-row-meta {\n    max-width: 100%;\n  }\n}\n\n/* ALUMNI_UI_FIXES_1_1_EVENTS */\n"
  );

communityCss =
  appendOnce(
    communityCss,
    "ALUMNI_UI_FIXES_1_1_COMMUNITY",
    "\n/* =========================================================\n   ALUMNI UI Fixes 1.1 — Community containment\n   ========================================================= */\n\n.alumni-community-2 {\n  min-width: 0;\n  overflow-x: clip;\n}\n\n.alumni-community-2\n.community2-hero,\n.alumni-community-2\n.community2-navigation,\n.alumni-community-2\n.community2-list,\n.alumni-community-2\n.community2-row {\n  width: 100%;\n  max-width: 100%;\n  min-width: 0;\n}\n\n.alumni-community-2\n.community2-hero\n> div {\n  min-width: 0;\n  max-width: 100%;\n}\n\n.alumni-community-2\n.community2-hero h1 {\n  max-width: 100%;\n  overflow-wrap: anywhere;\n}\n\n.alumni-community-2\n.community2-primary-action {\n  max-width: 100%;\n}\n\n.alumni-community-2\n.community2-tabs {\n  max-width: 100%;\n  overflow-x: auto;\n  overflow-y: hidden;\n  scrollbar-width: none;\n}\n\n.alumni-community-2\n.community2-tabs::-webkit-scrollbar {\n  display: none;\n}\n\n.alumni-community-2\n.community2-row-main {\n  min-width: 0;\n  overflow: hidden;\n}\n\n.alumni-community-2\n.community2-row-kicker {\n  min-width: 0;\n  max-width: 100%;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.alumni-community-2\n.community2-row-main\n> strong,\n.alumni-community-2\n.community2-row-main\n> small {\n  max-width: 100%;\n}\n\n@media (max-width: 430px) {\n  .alumni-community-2\n  .community2-hero h1 {\n    font-size:\n      clamp(\n        29px,\n        9.5vw,\n        37px\n      );\n  }\n\n  .alumni-community-2\n  .community2-row {\n    grid-template-columns:\n      42px\n      minmax(0, 1fr)\n      16px;\n    gap: 10px;\n  }\n}\n\n/* ALUMNI_UI_FIXES_1_1_COMMUNITY */\n"
  );

/* ======================================================
   NAVBAR
   ====================================================== */

const navCss =
  ".alumni-mobile-nav-clean {\n  position: fixed;\n  overflow: hidden;\n\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-text) 7%,\n      var(--app-border)\n    ) !important;\n\n  border-radius:\n    24px !important;\n\n  background:\n    color-mix(\n      in srgb,\n      var(--app-surface) 87%,\n      transparent\n    ) !important;\n\n  -webkit-backdrop-filter:\n    blur(14px)\n    saturate(1.06);\n  backdrop-filter:\n    blur(14px)\n    saturate(1.06);\n\n  box-shadow:\n    0 10px 30px\n      color-mix(\n        in srgb,\n        var(--app-shadow) 70%,\n        transparent\n      ),\n    inset 0 1px 0\n      color-mix(\n        in srgb,\n        var(--app-text) 5%,\n        transparent\n      ),\n    inset 0 0 0 1px\n      color-mix(\n        in srgb,\n        var(--app-text) 1.5%,\n        transparent\n      );\n\n  transform: none !important;\n\n  animation:\n    alumniNavSoftFade\n    260ms\n    cubic-bezier(.2,.8,.2,1)\n    both !important;\n}\n\n.alumni-mobile-nav-clean::before {\n  content: \"\";\n  position: absolute;\n  inset: 0;\n  pointer-events: none;\n  border-radius: inherit;\n  background:\n    linear-gradient(\n      180deg,\n      color-mix(\n        in srgb,\n        var(--app-text) 3.5%,\n        transparent\n      ),\n      transparent 46%\n    );\n}\n\n.alumni-mobile-nav-clean\n> div {\n  position: relative;\n  z-index: 1;\n}\n\n.alumni-mobile-nav-clean\n.alumni-mobile-nav-item {\n  min-width: 0;\n  border-radius:\n    18px !important;\n}\n\n.alumni-mobile-nav-clean\n.alumni-mobile-nav-icon {\n  color:\n    var(--app-muted);\n\n  border-radius:\n    14px !important;\n\n  transition:\n    transform\n      145ms\n      cubic-bezier(.2,.8,.2,1),\n    background-color\n      170ms\n      ease,\n    color\n      170ms\n      ease,\n    box-shadow\n      170ms\n      ease;\n}\n\n.alumni-mobile-nav-clean\n.alumni-mobile-nav-item[\n  data-active=\"true\"\n]\n.alumni-mobile-nav-icon {\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 11%,\n      transparent\n    );\n\n  color:\n    var(--app-accent);\n\n  box-shadow:\n    inset 0 0 0 1px\n      color-mix(\n        in srgb,\n        var(--app-accent) 9%,\n        transparent\n      );\n}\n\n.alumni-mobile-nav-clean\n.alumni-mobile-nav-item:active\n.alumni-mobile-nav-icon {\n  transform:\n    scale(.92);\n}\n\n@keyframes alumniNavSoftFade {\n  from {\n    opacity: 0;\n  }\n\n  to {\n    opacity: 1;\n  }\n}\n\n@media (\n  prefers-reduced-motion:\n  reduce\n) {\n  .alumni-mobile-nav-clean {\n    animation:\n      none !important;\n  }\n}\n\n/* ALUMNI_NAVBAR_REFINE_1_1 */\n";

/* ======================================================
   TOPBAR GLASS
   ====================================================== */

if (
  !topbar.includes(
    `./topbar-glass-1-1.css`
  )
) {
  const needle =
    `import { AlumniAvatar } from "@/components/ui/AlumniImage";`;

  if (
    !topbar.includes(
      needle
    )
  ) {
    fail(
      "No encontré el import esperado en TopBar."
    );
  }

  topbar =
    topbar.replace(
      needle,
      `${needle}
import "./topbar-glass-1-1.css";`
    );
}

topbar +=
  `\n/* ${MARKER}:TOPBAR */\n`;

const topbarCss =
  "/*\n * ALUMNI TopBar Glass 1.1\n * Transparent enough to let content breathe underneath,\n * while keeping text/icons readable.\n */\n\n[data-alumni-topbar=\"true\"] {\n  border-bottom-color:\n    color-mix(\n      in srgb,\n      var(--app-border) 68%,\n      transparent\n    ) !important;\n\n  background:\n    color-mix(\n      in srgb,\n      var(--app-bg) 82%,\n      transparent\n    ) !important;\n\n  -webkit-backdrop-filter:\n    blur(16px)\n    saturate(1.08) !important;\n\n  backdrop-filter:\n    blur(16px)\n    saturate(1.08) !important;\n\n  box-shadow:\n    0 1px 0\n    color-mix(\n      in srgb,\n      var(--app-text) 2%,\n      transparent\n    );\n}\n\nhtml[data-theme=\"light\"]\n[data-alumni-topbar=\"true\"] {\n  background:\n    color-mix(\n      in srgb,\n      var(--app-bg) 86%,\n      transparent\n    ) !important;\n}\n\n/* ALUMNI_TOPBAR_GLASS_1_1 */\n";

/* ======================================================
   COMMENTS
   ====================================================== */

const comments =
  "\"use client\";\n\nimport {\n  Send,\n  X,\n} from \"lucide-react\";\nimport {\n  useEffect,\n  useMemo,\n  useRef,\n  useState,\n} from \"react\";\nimport {\n  createPortal,\n} from \"react-dom\";\nimport {\n  motion,\n  useReducedMotion,\n} from \"framer-motion\";\nimport CommentLikeButton from \"@/components/social/CommentLikeButton\";\n\ntype ReplyTarget = {\n  id: number;\n  username: string;\n} | null;\n\ntype ThreadedComment = {\n  comment: any;\n  depth: number;\n};\n\nfunction threadedComments(\n  comments: any[]\n): ThreadedComment[] {\n  const byId =\n    new Map<number, any>();\n\n  const children =\n    new Map<number, any[]>();\n\n  const roots: any[] = [];\n\n  for (\n    const comment\n    of comments\n  ) {\n    const id =\n      Number(\n        comment?.id\n      );\n\n    if (\n      Number.isFinite(id)\n    ) {\n      byId.set(\n        id,\n        comment\n      );\n    }\n  }\n\n  for (\n    const comment\n    of comments\n  ) {\n    const parentId =\n      Number(\n        comment\n          ?.parent_comment_id\n      );\n\n    if (\n      Number.isFinite(\n        parentId\n      ) &&\n      parentId > 0 &&\n      byId.has(\n        parentId\n      )\n    ) {\n      const list =\n        children.get(\n          parentId\n        ) || [];\n\n      list.push(\n        comment\n      );\n\n      children.set(\n        parentId,\n        list\n      );\n    } else {\n      roots.push(\n        comment\n      );\n    }\n  }\n\n  const output:\n    ThreadedComment[] = [];\n\n  /*\n   * Important:\n   * optimistic comments use negative IDs.\n   * They still must count as visited, otherwise an optimistic\n   * reply is rendered once inside its parent and again as a root.\n   */\n  const visited =\n    new Set<number>();\n\n  function walk(\n    comment: any,\n    depth: number\n  ) {\n    const id =\n      Number(\n        comment?.id\n      );\n\n    if (\n      Number.isFinite(id)\n    ) {\n      if (\n        visited.has(id)\n      ) {\n        return;\n      }\n\n      visited.add(id);\n    }\n\n    output.push({\n      comment,\n      depth,\n    });\n\n    for (\n      const reply\n      of children.get(id) ||\n      []\n    ) {\n      walk(\n        reply,\n        depth + 1\n      );\n    }\n  }\n\n  for (\n    const root\n    of roots\n  ) {\n    walk(\n      root,\n      0\n    );\n  }\n\n  for (\n    const comment\n    of comments\n  ) {\n    const id =\n      Number(\n        comment?.id\n      );\n\n    if (\n      !Number.isFinite(id) ||\n      !visited.has(id)\n    ) {\n      output.push({\n        comment,\n        depth: 0,\n      });\n    }\n  }\n\n  return output;\n}\n\nexport default function FeedCommentsSheet({\n  post,\n  currentUserId,\n  onSend,\n  onClose,\n  focusedCommentId,\n  loading = false,\n}: {\n  post: any | null;\n  currentUserId?:\n    | string\n    | null;\n  onSend: (\n    value: string,\n    parentCommentId?:\n      | number\n      | null\n  ) => Promise<boolean>;\n  onClose: () => void;\n  focusedCommentId?:\n    | number\n    | null;\n  loading?: boolean;\n}) {\n  const [\n    ready,\n    setReady,\n  ] = useState(false);\n\n  const [\n    input,\n    setInput,\n  ] = useState(\"\");\n\n  const [\n    sending,\n    setSending,\n  ] = useState(false);\n\n  const [\n    replyTo,\n    setReplyTo,\n  ] =\n    useState<ReplyTarget>(\n      null\n    );\n\n  const inputRef =\n    useRef<HTMLInputElement>(\n      null\n    );\n\n  const reduceMotion =\n    useReducedMotion();\n\n  useEffect(\n    () =>\n      setReady(true),\n    []\n  );\n\n  useEffect(() => {\n    setInput(\"\");\n    setSending(false);\n    setReplyTo(null);\n  }, [post?.id]);\n\n  async function submitComment() {\n    const value =\n      input.trim();\n\n    if (\n      !value ||\n      !currentUserId ||\n      sending\n    ) {\n      return;\n    }\n\n    const parentCommentId =\n      replyTo?.id ??\n      null;\n\n    setInput(\"\");\n    setSending(true);\n\n    try {\n      const ok =\n        await onSend(\n          value,\n          parentCommentId\n        );\n\n      if (ok) {\n        setReplyTo(null);\n      } else {\n        setInput(\n          (current) =>\n            current.trim()\n              ? current\n              : value\n        );\n      }\n    } finally {\n      setSending(false);\n    }\n  }\n\n  useEffect(() => {\n    if (!post) {\n      return;\n    }\n\n    const old =\n      document.body.style\n        .overflow;\n\n    document.body.style\n      .overflow = \"hidden\";\n\n    return () => {\n      document.body.style\n        .overflow = old;\n    };\n  }, [post]);\n\n  useEffect(() => {\n    if (\n      !post ||\n      !focusedCommentId\n    ) {\n      return;\n    }\n\n    const timer =\n      window.setTimeout(\n        () => {\n          document\n            .getElementById(\n              `feed-comment-${focusedCommentId}`\n            )\n            ?.scrollIntoView({\n              behavior:\n                \"smooth\",\n              block:\n                \"center\",\n            });\n        },\n        180\n      );\n\n    return () =>\n      window.clearTimeout(\n        timer\n      );\n  }, [\n    post?.id,\n    focusedCommentId,\n  ]);\n\n  const comments =\n    post?.comments || [];\n\n  const threaded =\n    useMemo(\n      () =>\n        threadedComments(\n          comments\n        ),\n      [comments]\n    );\n\n  function beginReply(\n    comment: any\n  ) {\n    const id =\n      Number(\n        comment?.id\n      );\n\n    if (\n      !currentUserId ||\n      !Number.isFinite(id) ||\n      id <= 0\n    ) {\n      return;\n    }\n\n    setReplyTo({\n      id,\n      username:\n        comment.profile\n          ?.username ||\n        \"usuario\",\n    });\n\n    window.setTimeout(\n      () =>\n        inputRef.current\n          ?.focus(),\n      20\n    );\n  }\n\n  if (\n    !ready ||\n    !post\n  ) {\n    return null;\n  }\n\n  return createPortal(\n    <motion.div\n      className=\"alumni-comments-backdrop\"\n      data-alumni-motion-ignore=\"true\"\n      initial={\n        reduceMotion\n          ? false\n          : {\n              opacity: 0,\n            }\n      }\n      animate={{\n        opacity: 1,\n      }}\n      transition={{\n        duration: 0.2,\n      }}\n      onMouseDown={(\n        event\n      ) => {\n        if (\n          event.currentTarget ===\n          event.target\n        ) {\n          onClose();\n        }\n      }}\n    >\n      <motion.section\n        className=\"alumni-comments-sheet alumni-comments-messaging-font\"\n        role=\"dialog\"\n        aria-modal=\"true\"\n        aria-label=\"Comentarios\"\n        initial={\n          reduceMotion\n            ? false\n            : {\n                opacity: 0,\n                y: 24,\n                scale: 0.992,\n              }\n        }\n        animate={{\n          opacity: 1,\n          y: 0,\n          scale: 1,\n        }}\n        transition={{\n          duration: 0.32,\n          ease: [\n            0.2,\n            0.8,\n            0.2,\n            1,\n          ],\n        }}\n      >\n        <header className=\"alumni-comments-header\">\n          <div>\n            <span>\n              Publicación\n            </span>\n            <h3>\n              Comentarios\n            </h3>\n          </div>\n\n          <button\n            type=\"button\"\n            onClick={\n              onClose\n            }\n            aria-label=\"Cerrar comentarios\"\n          >\n            <X size={20} />\n          </button>\n        </header>\n\n        <div className=\"alumni-comments-list\">\n          {loading ? (\n            <div className=\"alumni-feed-modal-empty\">\n              Cargando comentarios...\n            </div>\n          ) : threaded.length ? (\n            threaded.map(\n              (\n                {\n                  comment,\n                  depth,\n                },\n                index\n              ) => {\n                const visualDepth =\n                  Math.min(\n                    depth,\n                    3\n                  );\n\n                return (\n                  <motion.div\n                    id={`feed-comment-${comment.id}`}\n                    key={\n                      comment.id\n                    }\n                    layout=\"position\"\n                    className={`alumni-feed-comment alumni-thread-comment ${\n                      visualDepth >\n                      0\n                        ? \"is-reply\"\n                        : \"\"\n                    } ${\n                      focusedCommentId ===\n                      comment.id\n                        ? \"is-focused\"\n                        : \"\"\n                    }`}\n                    data-thread-depth={\n                      visualDepth\n                    }\n                    style={{\n                      marginLeft:\n                        visualDepth >\n                        0\n                          ? `${visualDepth * 18}px`\n                          : undefined,\n                    }}\n                    initial={\n                      reduceMotion\n                        ? false\n                        : {\n                            opacity: 0,\n                            y: 7,\n                            scale: 0.995,\n                          }\n                    }\n                    animate={{\n                      opacity: 1,\n                      y: 0,\n                      scale: 1,\n                    }}\n                    transition={{\n                      duration:\n                        0.24,\n                      delay:\n                        reduceMotion\n                          ? 0\n                          : Math.min(\n                              index *\n                                0.018,\n                              0.1\n                            ),\n                    }}\n                  >\n                    <a\n                      href={`/u/${\n                        comment\n                          .profile\n                          ?.username ||\n                        \"\"\n                      }`}\n                      className=\"alumni-feed-comment-avatar\"\n                    >\n                      {comment\n                        .profile\n                        ?.avatar_url ? (\n                        <img\n                          src={\n                            comment\n                              .profile\n                              .avatar_url\n                          }\n                          alt=\"\"\n                        />\n                      ) : (\n                        comment\n                          .profile\n                          ?.username\n                          ?.charAt(\n                            0\n                          )\n                          ?.toUpperCase() ||\n                        \"A\"\n                      )}\n                    </a>\n\n                    <div className=\"alumni-feed-comment-body\">\n                      <p>\n                        <a\n                          href={`/u/${\n                            comment\n                              .profile\n                              ?.username ||\n                            \"\"\n                          }`}\n                        >\n                          @\n                          {comment\n                            .profile\n                            ?.username ||\n                            \"usuario\"}\n                        </a>\n\n                        <span>\n                          {\n                            comment.content\n                          }\n                        </span>\n                      </p>\n\n                      <div className=\"alumni-comment-thread-actions\">\n                        {Number(\n                          comment.id\n                        ) >\n                          0 && (\n                          <CommentLikeButton\n                            commentId={\n                              comment.id\n                            }\n                            commentOwnerId={\n                              comment.user_id\n                            }\n                            currentUserId={\n                              currentUserId\n                            }\n                          />\n                        )}\n\n                        {currentUserId &&\n                          Number(\n                            comment.id\n                          ) >\n                            0 && (\n                            <button\n                              type=\"button\"\n                              className=\"alumni-comment-reply-button\"\n                              onClick={() =>\n                                beginReply(\n                                  comment\n                                )\n                              }\n                            >\n                              Responder\n                            </button>\n                          )}\n                      </div>\n                    </div>\n                  </motion.div>\n                );\n              }\n            )\n          ) : (\n            <div className=\"alumni-feed-modal-empty\">\n              Sé la primera persona en comentar.\n            </div>\n          )}\n        </div>\n\n        <div className=\"alumni-comments-composer-wrap\">\n          {replyTo && (\n            <motion.div\n              className=\"alumni-comment-reply-target\"\n              initial={\n                reduceMotion\n                  ? false\n                  : {\n                      opacity: 0,\n                      y: 6,\n                    }\n              }\n              animate={{\n                opacity: 1,\n                y: 0,\n              }}\n              transition={{\n                duration: 0.2,\n              }}\n            >\n              <span>\n                Respondiendo a{\" \"}\n                <strong>\n                  @\n                  {\n                    replyTo.username\n                  }\n                </strong>\n              </span>\n\n              <button\n                type=\"button\"\n                onClick={() =>\n                  setReplyTo(\n                    null\n                  )\n                }\n                aria-label=\"Cancelar respuesta\"\n              >\n                <X\n                  size={14}\n                />\n              </button>\n            </motion.div>\n          )}\n\n          <div className=\"alumni-comments-composer\">\n            <input\n              ref={inputRef}\n              type=\"text\"\n              value={input}\n              disabled={\n                !currentUserId\n              }\n              placeholder={\n                currentUserId\n                  ? replyTo\n                    ? `Responder a @${replyTo.username}...`\n                    : \"Escribe un comentario...\"\n                  : \"Inicia sesión para comentar\"\n              }\n              onChange={(\n                event\n              ) =>\n                setInput(\n                  event.target\n                    .value\n                )\n              }\n              onKeyDown={(\n                event\n              ) => {\n                if (\n                  event.key ===\n                  \"Enter\"\n                ) {\n                  event.preventDefault();\n                  void submitComment();\n                }\n              }}\n            />\n\n            <motion.button\n              type=\"button\"\n              onClick={() =>\n                void submitComment()\n              }\n              disabled={\n                !currentUserId ||\n                !input.trim() ||\n                sending\n              }\n              aria-busy={\n                sending\n              }\n              aria-label={\n                replyTo\n                  ? \"Enviar respuesta\"\n                  : \"Enviar comentario\"\n              }\n              whileTap={\n                reduceMotion\n                  ? undefined\n                  : {\n                      scale:\n                        0.9,\n                    }\n              }\n            >\n              <Send\n                size={17}\n              />\n            </motion.button>\n          </div>\n        </div>\n      </motion.section>\n    </motion.div>,\n    document.body\n  );\n}\n\n/* ALUMNI_1_4_0_COMMENTS_SHEET */\n/* ALUMNI_PERFORMANCE_HARDENING_FEED_V2_LAZY_COMMENTS */\n/* ALUMNI_PERFORMANCE_HARDENING_COMMENT_DRAFT_LOCAL_V8 */\n/* ALUMNI_1_7_0_STORIES_HIDDEN_COMMENTS_GEIST */\n/* ALUMNI_COMMENT_THREADS_1_0 */\n/* ALUMNI_UI_FIXES_1_1_COMMENTS */\n";

commentsCss =
  appendOnce(
    commentsCss,
    "ALUMNI_UI_FIXES_1_1_COMMENTS",
    "\n/* =========================================================\n   ALUMNI UI Fixes 1.1 — Comment motion polish\n   ========================================================= */\n\n.alumni-comments-messaging-font\n.alumni-thread-comment {\n  will-change:\n    transform,\n    opacity;\n}\n\n.alumni-comments-messaging-font\n.alumni-comment-reply-button {\n  transition:\n    color 150ms ease,\n    transform\n      130ms\n      cubic-bezier(.2,.8,.2,1);\n}\n\n.alumni-comments-messaging-font\n.alumni-comment-reply-button:active {\n  transform:\n    scale(.94);\n}\n\n.alumni-comments-messaging-font\n.alumni-comment-reply-target {\n  transform-origin:\n    center bottom;\n}\n\n/* ALUMNI_UI_FIXES_1_1_COMMENTS */\n"
  );

/* ======================================================
   TYPESCRIPT PARSE VALIDATION
   ====================================================== */

try {
  const ts =
    require(
      "typescript"
    );

  for (
    const [
      rel,
      content,
    ] of [
      [
        FILES.feed,
        feed,
      ],
      [
        FILES.topbar,
        topbar,
      ],
      [
        FILES.comments,
        comments,
      ],
    ]
  ) {
    const parsed =
      ts.createSourceFile(
        rel,
        content,
        ts.ScriptTarget
          .Latest,
        true,
        ts.ScriptKind
          .TSX
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
        `${rel}: ${ts.flattenDiagnosticMessageText(
          first.messageText,
          "\n"
        )}`
      );
    }
  }

  console.log(
    "✅ Parser TypeScript: archivos válidos"
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

/* ======================================================
   WRITE
   ====================================================== */

fs.writeFileSync(
  abs(FILES.feed),
  feed,
  "utf8"
);

fs.writeFileSync(
  abs(FILES.feedCss),
  feedCss,
  "utf8"
);

fs.writeFileSync(
  abs(FILES.searchCss),
  searchCss,
  "utf8"
);

fs.writeFileSync(
  abs(FILES.eventsCss),
  eventsCss,
  "utf8"
);

fs.writeFileSync(
  abs(FILES.communityCss),
  communityCss,
  "utf8"
);

fs.writeFileSync(
  abs(FILES.navCss),
  navCss,
  "utf8"
);

fs.writeFileSync(
  abs(FILES.topbar),
  topbar,
  "utf8"
);

fs.writeFileSync(
  abs(FILES.topbarCss),
  topbarCss,
  "utf8"
);

fs.writeFileSync(
  abs(FILES.comments),
  comments,
  "utf8"
);

fs.writeFileSync(
  abs(FILES.commentsCss),
  commentsCss,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI UI Fixes 1.1 aplicado."
);
console.log(
  "✅ Feed alineado."
);
console.log(
  "✅ Primera carga Feed: 18 posts."
);
console.log(
  "✅ Buscar sin caja."
);
console.log(
  "✅ Eventos contenido."
);
console.log(
  "✅ Comunidad contenida."
);
console.log(
  "✅ Navbar más redondeada y refinada."
);
console.log(
  "✅ Topbar transparente + blur."
);
console.log(
  "✅ Respuestas ya no se duplican."
);
console.log(
  "✅ Comentarios con Motion."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
