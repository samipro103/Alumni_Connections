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
};
