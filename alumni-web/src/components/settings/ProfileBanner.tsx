"use client";

interface ProfileBannerProps {
  bannerUrl: string;
  onSelectBanner: (file: File) => void;
}

export default function ProfileBanner({
  bannerUrl,
  onSelectBanner,
}: ProfileBannerProps) {
  return (
    <div className="relative">

      <div className="h-64 rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">

        {bannerUrl && (
          <img
            src={bannerUrl}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        )}

      </div>

      <label
        className="
          absolute
          bottom-5
          right-5
          bg-black/70
          hover:bg-black
          transition
          px-4
          py-2
          rounded-xl
          cursor-pointer
          text-sm
          font-medium
          backdrop-blur
        "
      >
        📷 Cambiar banner

        <input
          hidden
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              onSelectBanner(e.target.files[0]);
            }
          }}
        />
      </label>

    </div>
  );
}
