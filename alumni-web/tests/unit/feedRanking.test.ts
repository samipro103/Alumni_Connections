import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rankForYouPosts } from "../../src/lib/feedRanking";

const HOUR = 60 * 60 * 1000;

function makePost(
  id: string,
  userId: string,
  ageHours: number,
  extra: Record<string, unknown> = {}
) {
  return {
    id,
    user_id: userId,
    created_at: new Date(Date.now() - ageHours * HOUR).toISOString(),
    content: "Publicación de prueba para validar el ranking de Alumni.",
    likesCount: 0,
    comments: [],
    profiles: {},
    ...extra,
  };
}

describe("rankForYouPosts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-02T18:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("prioriza contenido más reciente cuando las demás señales son iguales", () => {
    const older = makePost("older", "user-b", 36);
    const newer = makePost("newer", "user-a", 2);

    const result = rankForYouPosts([older, newer], {}, []);

    expect(result[0].id).toBe("newer");
    expect(result[0]._forYouScore).toBeGreaterThan(result[1]._forYouScore ?? 0);
  });

  it("da prioridad a una conexión seguida frente a un desconocido comparable", () => {
    const stranger = makePost("stranger", "user-stranger", 2);
    const connection = makePost("connection", "user-followed", 10);

    const result = rankForYouPosts(
      [stranger, connection],
      {},
      ["user-followed"]
    );

    expect(result[0].id).toBe("connection");
    expect(result[0]._forYouReason).toBe("De una conexión");
  });

  it("normaliza acentos y mayúsculas al comparar institución", () => {
    const matching = makePost("matching", "user-a", 6, {
      profiles: {
        education_institution_name: "universidad tecnologica",
      },
    });

    const result = rankForYouPosts(
      [matching],
      {
        education_institution_name: "Universidad Tecnológica",
      },
      []
    );

    expect(result[0]._forYouReason).toBe("Tu institución");
  });

  it("diversifica autores cuando una misma persona domina candidatos similares", () => {
    const authorA1 = makePost("a-1", "author-a", 1, { likesCount: 100 });
    const authorA2 = makePost("a-2", "author-a", 1, { likesCount: 100 });
    const authorB = makePost("b-1", "author-b", 1, { likesCount: 20 });

    const result = rankForYouPosts(
      [authorA1, authorA2, authorB],
      {},
      []
    );

    expect(result[0].user_id).toBe("author-a");
    expect(result[1].user_id).toBe("author-b");
  });
});
