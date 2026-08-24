type Props = {
  size?: number;
  className?: string;
};

export default function SpotifyLogo({
  size = 22,
  className = "",
}: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="currentColor"
      />

      <path
        d="M6.9 9.1c3.75-1.13 8.1-.82 11.35.84"
        stroke="#07110a"
        strokeWidth="1.55"
        strokeLinecap="round"
      />

      <path
        d="M7.55 12.15c3.08-.88 6.84-.62 9.67.75"
        stroke="#07110a"
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      <path
        d="M8.2 14.95c2.4-.64 5.34-.44 7.57.59"
        stroke="#07110a"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}
