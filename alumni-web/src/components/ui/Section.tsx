import { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function Section({
  title,
  subtitle,
  children,
}: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">
          {title}
        </h2>

        {subtitle && (
          <p className="text-zinc-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </div>
  );
}
