"use client";

import { ReactNode } from "react";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import TopBar from "./TopBar";
import MobileNav from "./MobileNav";
import AppUtilities from "./AppUtilities";

interface Props {
  children: ReactNode;
  /**
   * Para pantallas que ya tienen su propio header/footer móvil,
   * como una conversación. En escritorio conserva el shell normal.
   */
  immersiveMobile?: boolean;
}

export default function AppShell({
  children,
  immersiveMobile = false,
}: Props) {
  return (
    <>
      {/*
        Este bloque es el que baja durante Pull-to-Refresh.
        Los elementos fixed globales NO deben vivir aquí dentro,
        porque un ancestro transformado cambia su containing block.
      */}
      <div
        id="alumni-global-shell"
        className="relative z-[41] min-h-[100dvh] overflow-x-clip bg-[var(--app-bg)] text-[var(--app-text)]"
      >
        <div
          className={
            immersiveMobile
              ? "hidden lg:block"
              : ""
          }
        >
          <TopBar />
        </div>

        <div
          className={
            immersiveMobile
              ? "mx-auto w-full max-w-[1500px] px-0 pb-0 pt-0 lg:px-8 lg:pb-10 lg:pt-[84px]"
              : "mx-auto w-full max-w-[1500px] px-4 pb-24 pt-[84px] sm:px-6 lg:px-8 lg:pb-10"
          }
        >
          <div
            className={
              immersiveMobile
                ? "grid grid-cols-1 gap-0 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-7 xl:grid-cols-[220px_minmax(0,1fr)_310px]"
                : "grid grid-cols-1 gap-7 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_310px]"
            }
          >
            <aside className="hidden lg:block">
              <LeftSidebar />
            </aside>

            <main className="min-w-0">
              {children}
            </main>

            <aside className="hidden xl:block">
              <RightSidebar />
            </aside>
          </div>
        </div>
      </div>

      {/*
        FIXED UI fuera del contenedor transformable.
        Así jamás desaparece por el gesto de refresh.
      */}
      {immersiveMobile ? (
        <div className="hidden lg:block">
          <AppUtilities />
        </div>
      ) : (
        <>
          <AppUtilities />
          <MobileNav />
        </>
      )}
    </>
  );
}
