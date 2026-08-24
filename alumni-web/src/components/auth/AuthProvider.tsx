"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  Session,
  User,
} from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import NativePushNotifications from "@/components/mobile/NativePushNotifications";
import WebPushBootstrap from "@/components/pwa/WebPushBootstrap";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] =
    useState<User | null>(null);
  const [session, setSession] =
    useState<Session | null>(null);
  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      <NativePushNotifications
        userId={user?.id ?? null}
      />
      <WebPushBootstrap
        userId={user?.id ?? null}
      />
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
