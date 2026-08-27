"use client";

import styles from "./ProfileMiniStats.module.css";

export default function ProfileMiniStats({
  posts,
  followers,
  following,
}: {
  posts: number;
  followers: number;
  following: number;
}) {
  return (
    <div className={styles.root}>
      <Mini value={posts} label="Publicaciones" />
      <Mini value={followers} label="Seguidores" />
      <Mini value={following} label="Siguiendo" />
    </div>
  );
}

function Mini({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className={styles.item}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
