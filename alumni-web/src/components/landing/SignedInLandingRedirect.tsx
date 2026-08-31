"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export default function SignedInLandingRedirect() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/feed");
    }
  }, [loading, router, user]);

  return null;
}

/* ALUMNI_3_6_1_PUBLIC_LANDING_ADSENSE_READINESS */
