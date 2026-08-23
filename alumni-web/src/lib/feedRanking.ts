export function rankForYouPosts(posts: any[], profile: any, followingIds: string[]) {
  const following = new Set(followingIds);

  return [...posts].map((post: any) => {
    let score = 0;
    const ageHours = Math.max(
      0,
      (Date.now() - new Date(post.created_at).getTime()) / 3600000
    );

    score += Math.max(0, 40 - ageHours / 4);
    if (following.has(post.user_id)) score += 35;

    if (profile?.university && post.profiles?.university === profile.university) {
      score += 18;
    }
    if (profile?.career && post.profiles?.career === profile.career) {
      score += 16;
    }

    const likes = post.likesCount ?? post.likes?.length ?? 0;
    const comments = post.comments?.length ?? 0;
    score += Math.min(likes * 1.5 + comments * 2.5, 28);

    return { ...post, _forYouScore: score };
  }).sort((a: any, b: any) => {
    if (b._forYouScore !== a._forYouScore) return b._forYouScore - a._forYouScore;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
