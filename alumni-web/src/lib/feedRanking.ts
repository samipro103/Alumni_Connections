type RankedPost = {
  _forYouScore?: number;
  _forYouReason?: string;
  [key: string]: any;
};

function clean(value: unknown) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function same(a: unknown, b: unknown) {
  const left = clean(a);
  const right = clean(b);

  return Boolean(
    left &&
      right &&
      left === right
  );
}

function institutionOf(profile: any) {
  return (
    profile?.education_institution_name ||
    profile?.university ||
    ""
  );
}

function programOf(profile: any) {
  return (
    profile?.education_program_name ||
    ""
  );
}

function freshnessScore(
  createdAt: string
) {
  const ageHours = Math.max(
    0,
    (Date.now() -
      new Date(
        createdAt
      ).getTime()) /
      3600000
  );

  if (ageHours <= 3) {
    return 46;
  }

  if (ageHours <= 12) {
    return 42;
  }

  if (ageHours <= 24) {
    return 36;
  }

  if (ageHours <= 72) {
    return Math.max(
      22,
      36 -
        (ageHours - 24) *
          0.29
    );
  }

  if (ageHours <= 168) {
    return Math.max(
      8,
      22 -
        (ageHours - 72) *
          0.145
    );
  }

  return Math.max(
    0,
    8 -
      (ageHours - 168) /
        72
  );
}

function engagementScore(
  post: any
) {
  const likes =
    post.likesCount ??
    post.likes?.length ??
    0;

  const comments =
    post.commentsCount ??
    post.comments?.length ??
    0;

  /*
    Rendimiento decreciente:
    una publicación viral ayuda,
    pero no puede dominar todo el feed.
  */
  const raw =
    Math.log2(likes + 1) *
      4.2 +
    Math.log2(comments + 1) *
      6.1;

  return Math.min(
    raw,
    27
  );
}

function richnessScore(
  post: any
) {
  let score = 0;

  if (post.image_url) {
    score += 3;
  }

  const content =
    String(
      post.content || ""
    ).trim();

  if (content.length >= 40) {
    score += 2;
  }

  if (content.length >= 120) {
    score += 2;
  }

  return score;
}

function scorePost(
  post: any,
  profile: any,
  following: Set<string>
): RankedPost {
  let score =
    freshnessScore(
      post.created_at
    );

  const reasons: Array<{
    score: number;
    text: string;
  }> = [];

  if (
    following.has(
      post.user_id
    )
  ) {
    score += 31;
    reasons.push({
      score: 31,
      text: "De una conexión",
    });
  }

  const myInstitution =
    institutionOf(profile);

  const postInstitution =
    institutionOf(
      post.profiles
    );

  if (
    same(
      myInstitution,
      postInstitution
    )
  ) {
    score += 25;
    reasons.push({
      score: 25,
      text: "Tu institución",
    });
  }

  if (
    same(
      programOf(profile),
      programOf(
        post.profiles
      )
    )
  ) {
    score += 22;
    reasons.push({
      score: 22,
      text: "Tu programa",
    });
  }

  if (
    same(
      profile?.career,
      post.profiles?.career
    )
  ) {
    score += 21;
    reasons.push({
      score: 21,
      text: "Tu carrera",
    });
  }

  if (
    same(
      profile?.city,
      post.profiles?.city
    )
  ) {
    score += 9;
    reasons.push({
      score: 9,
      text: "Cerca de ti",
    });
  } else if (
    same(
      profile?.residence_country_code ||
        profile?.country,
      post.profiles
        ?.residence_country_code ||
        post.profiles?.country
    )
  ) {
    score += 4;
  }

  if (
    profile?.id &&
    post.user_id ===
      profile.id
  ) {
    /*
      Tus propios posts pueden aparecer,
      pero no se fuerzan al principio.
    */
    score += 3;
  }

  const discoveryBoost = Math.min(
    Math.max(
      Number(
        post._discoveryBoost ||
          0
      ),
      0
    ),
    18
  );

  if (discoveryBoost > 0) {
    score += discoveryBoost;

    if (discoveryBoost >= 5) {
      reasons.push({
        score: discoveryBoost,
        text: "Según lo que exploras",
      });
    }
  }

  score +=
    engagementScore(post);

  score +=
    richnessScore(post);

  reasons.sort(
    (a, b) =>
      b.score - a.score
  );

  return {
    ...post,
    _forYouScore: score,
    _forYouReason:
      reasons[0]?.text ||
      "Actividad reciente",
  };
}

function diversifyAuthors(
  posts: RankedPost[]
) {
  const remaining =
    [...posts];

  const output:
    RankedPost[] = [];

  const recentAuthors:
    string[] = [];

  while (
    remaining.length > 0
  ) {
    let bestIndex = 0;
    let bestValue =
      -Infinity;

    /*
      Solo miramos una ventana de los mejores candidatos.
      Así conservamos relevancia sin dejar que una sola
      persona ocupe varias posiciones seguidas.
    */
    const windowSize =
      Math.min(
        8,
        remaining.length
      );

    for (
      let index = 0;
      index < windowSize;
      index += 1
    ) {
      const candidate =
        remaining[index];

      const author =
        String(
          candidate.user_id ||
            ""
        );

      const sameAsLast =
        recentAuthors[
          recentAuthors.length -
            1
        ] === author;

      const appearances =
        recentAuthors.filter(
          (id) => id === author
        ).length;

      const diversityPenalty =
        (sameAsLast
          ? 24
          : 0) +
        appearances * 8;

      const value =
        Number(
          candidate._forYouScore ||
            0
        ) -
        diversityPenalty -
        index * 0.35;

      if (
        value > bestValue
      ) {
        bestValue = value;
        bestIndex = index;
      }
    }

    const [selected] =
      remaining.splice(
        bestIndex,
        1
      );

    output.push(selected);

    recentAuthors.push(
      String(
        selected.user_id ||
          ""
      )
    );

    if (
      recentAuthors.length > 5
    ) {
      recentAuthors.shift();
    }
  }

  return output;
}

export function rankForYouPosts(
  posts: any[],
  profile: any,
  followingIds: string[]
) {
  const following =
    new Set(followingIds);

  const scored =
    posts
      .map((post) =>
        scorePost(
          post,
          profile,
          following
        )
      )
      .sort(
        (a, b) => {
          const byScore =
            Number(
              b._forYouScore ||
                0
            ) -
            Number(
              a._forYouScore ||
                0
            );

          if (byScore !== 0) {
            return byScore;
          }

          return (
            new Date(
              b.created_at
            ).getTime() -
            new Date(
              a.created_at
            ).getTime()
          );
        }
      );

  return diversifyAuthors(
    scored
  );
}

/* ALUMNI_1_6_0_EXPLORE_DISCOVERY:RANKING */

/* ALUMNI_PERFORMANCE_HARDENING_FEED_V2_RANKING_COUNTS */
