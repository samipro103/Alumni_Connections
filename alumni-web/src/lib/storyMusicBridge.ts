"use client";

type StoryMusicEntry = {
  storyId: string;
  controller: any;
  trackUrl: string;
  startSeconds: number;
  clipDurationSeconds: number;
  ready: boolean;
  pendingStart: boolean;
  playing: boolean;
  positionMs: number;
};

type StoryMusicListener = (
  storyId: string,
  playing: boolean
) => void;

const registry = new Map<string, StoryMusicEntry>();
const listeners = new Set<StoryMusicListener>();
let activeStoryId: string | null = null;

function emit(storyId: string, playing: boolean) {
  listeners.forEach((listener) => {
    try {
      listener(storyId, playing);
    } catch {
      // Un listener nunca debe romper el bridge.
    }
  });
}

export function registerStoryMusicController(
  storyId: string,
  controller: any,
  trackUrl: string,
  startSeconds: number,
  clipDurationSeconds = 15
) {
  registry.set(storyId, {
    storyId,
    controller,
    trackUrl,
    startSeconds: Math.max(0, Math.floor(startSeconds)),
    clipDurationSeconds: Math.max(
      1,
      Math.floor(clipDurationSeconds)
    ),
    ready: false,
    pendingStart: false,
    playing: false,
    positionMs: 0,
  });
}

export function markStoryMusicReady(storyId: string) {
  const entry = registry.get(storyId);
  if (!entry) return;

  entry.ready = true;

  // Fallback: si el usuario tocó la historia antes de que terminara de
  // precargarse, hacemos un intento al quedar lista. El caso ideal sigue
  // siendo que esté lista ANTES del toque.
  if (entry.pendingStart) {
    void startStoryMusicNow(storyId);
  }
}

export function updateStoryMusicState(
  storyId: string,
  state: {
    isPaused?: boolean;
    position?: number;
  }
) {
  const entry = registry.get(storyId);
  if (!entry) return;

  if (typeof state.position === "number") {
    entry.positionMs = state.position;
  }

  const playing =
    state.isPaused === undefined
      ? entry.playing
      : !state.isPaused;

  if (entry.playing !== playing) {
    entry.playing = playing;
    emit(storyId, playing);
  }

  const endMs =
    (entry.startSeconds + entry.clipDurationSeconds) * 1000;

  if (
    playing &&
    entry.positionMs >= endMs - 120
  ) {
    try {
      entry.controller.pause?.();
    } catch {
      // No bloquear la historia por un error del proveedor.
    }

    entry.playing = false;
    emit(storyId, false);
  }
}

export function unregisterStoryMusicController(
  storyId: string
) {
  const entry = registry.get(storyId);

  if (entry) {
    try {
      entry.controller.pause?.();
      entry.controller.destroy?.();
    } catch {
      // Cleanup tolerante.
    }
  }

  registry.delete(storyId);

  if (activeStoryId === storyId) {
    activeStoryId = null;
  }
}

export function stopStoryMusicNow(
  storyId?: string | null
) {
  const targetId = storyId || activeStoryId;

  if (!targetId) return;

  const entry = registry.get(targetId);

  if (entry) {
    entry.pendingStart = false;

    try {
      entry.controller.pause?.();
    } catch {
      // Ignorar proveedor.
    }

    if (entry.playing) {
      entry.playing = false;
      emit(targetId, false);
    }
  }

  if (activeStoryId === targetId) {
    activeStoryId = null;
  }
}

export function stopAllStoryMusic() {
  for (const [storyId, entry] of registry) {
    entry.pendingStart = false;

    try {
      entry.controller.pause?.();
    } catch {
      // Ignorar proveedor.
    }

    if (entry.playing) {
      entry.playing = false;
      emit(storyId, false);
    }
  }

  activeStoryId = null;
}

export function startStoryMusicNow(
  storyId: string
) {
  const entry = registry.get(storyId);

  if (!entry) {
    return false;
  }

  // Detenemos la historia anterior ANTES de arrancar la nueva.
  if (
    activeStoryId &&
    activeStoryId !== storyId
  ) {
    stopStoryMusicNow(activeStoryId);
  }

  activeStoryId = storyId;
  entry.pendingStart = true;

  if (!entry.ready) {
    return false;
  }

  entry.pendingStart = false;

  const startMs = entry.startSeconds * 1000;
  const endMs =
    (entry.startSeconds + entry.clipDurationSeconds) * 1000;

  // Si la historia se está abriendo nuevamente y el controlador quedó
  // fuera del clip, reubicamos una sola vez.
  if (
    entry.positionMs < startMs - 900 ||
    entry.positionMs >= endMs - 150
  ) {
    try {
      entry.controller.seek?.(entry.startSeconds);
    } catch {
      // El startAt precargado sigue siendo el respaldo.
    }
  }

  // ESTE play ocurre dentro del mismo click/tap que abre la historia cuando
  // el controlador ya está precargado. Eso es mucho más compatible con las
  // reglas de autoplay que intentar play() segundos después.
  try {
    entry.controller.play?.();
    return true;
  } catch {
    return false;
  }
}

export function isStoryMusicReady(
  storyId: string
) {
  return Boolean(registry.get(storyId)?.ready);
}

export function subscribeStoryMusic(
  listener: StoryMusicListener
) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
