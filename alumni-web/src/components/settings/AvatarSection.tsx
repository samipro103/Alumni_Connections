"use client";

interface AvatarSectionProps {
  avatarUrl: string;
  onSelectAvatar: (file: File) => void;
}

export default function AvatarSection({
  avatarUrl,
  onSelectAvatar,
}: AvatarSectionProps) {
  return (
    <div className="-mt-16 ml-8 relative w-fit">

      <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-[#09090B] shadow-2xl bg-zinc-800">

        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            👤
          </div>
        )}

      </div>

      <label
        className="
          absolute
          bottom-0
          right-0
          bg-blue-600
          hover:bg-blue-700
          transition
          rounded-full
          w-12
          h-12
          flex
          items-center
          justify-center
          cursor-pointer
          shadow-xl
        "
      >
        📷

        <input
          hidden
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              onSelectAvatar(e.target.files[0]);
            }
          }}
        />

      </label>

    </div>
  );
}
