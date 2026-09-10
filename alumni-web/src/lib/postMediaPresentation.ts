export type PostMediaFrame =
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

/* ALUMNI_MEDIA_RENDERING_1_0_INSTAGRAM_LEVEL */
