"use client";

import { ReactNode } from "react";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import TopBar from "./TopBar";

interface Props {
  children: ReactNode;
}

export default function AppShell({ children }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-950">
      <TopBar />

      <div className="max-w-[1600px] mx-auto px-6 pt-24">
        <div className="grid grid-cols-12 gap-8">
          <aside className="hidden lg:block col-span-3">
            <LeftSidebar />
          </aside>

          <main className="col-span-12 lg:col-span-6">{children}</main>

          <aside className="hidden xl:block col-span-3">
            <RightSidebar />
          </aside>
        </div>
      </div>
    </div>
  );
}
