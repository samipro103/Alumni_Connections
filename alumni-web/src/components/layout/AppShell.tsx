"use client";

import { ReactNode } from "react";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import TopBar from "./TopBar";
import MobileNav from "./MobileNav";
import AppUtilities from "./AppUtilities";

interface Props {
  children: ReactNode;
}

export default function AppShell({ children }: Props) {
  return (
    <div className="min-h-screen text-white">
      <TopBar />

      <div className="mx-auto w-full max-w-[1500px] px-4 pb-24 pt-[84px] sm:px-6 lg:px-8 lg:pb-10">
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_310px]">
          <aside className="hidden lg:block">
            <LeftSidebar />
          </aside>

          <main className="min-w-0">{children}</main>

          <aside className="hidden xl:block">
            <RightSidebar />
          </aside>
        </div>
      </div>

      <AppUtilities />
      <MobileNav />
    </div>
  );
}
