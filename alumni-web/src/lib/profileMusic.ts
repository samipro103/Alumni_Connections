export type ProfileMusic = {
  user_id: string;
  provider: string;
  provider_track_id: string | null;
  track_title: string;
  artist_name: string | null;
  album_name: string | null;
  artwork_url: string | null;
  track_url: string;
  embed_url: string;
  clip_start_seconds?: number | null;
  clip_duration_seconds?: number | null;
  track_duration_seconds?: number | null;
  updated_at?: string;
};

export type SpotifyTrackImport = {
  provider: "spotify";
  provider_track_id: string | null;
  track_title: string;
  artist_name: string | null;
  album_name: string | null;
  artwork_url: string | null;
  track_url: string;
  embed_url: string;
  duration_ms?: number | null;
};
