export type StoryMusicTrack = {
  provider: "spotify";
  provider_track_id: string;
  track_title: string;
  artist_name: string;
  album_name: string | null;
  artwork_url: string | null;
  track_url: string;
  embed_url: string;
  preview_url: string | null;
  duration_ms: number | null;
};
