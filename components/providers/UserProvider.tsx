"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { isMobileDevice } from "@/lib/auth/isMobileDevice";

type BackendUser = {
  role?: string;
  bid?: string;
};

export type AppUser = FirebaseUser & BackendUser;

type UserContextValue = {
  user: AppUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  googleAuth: () => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();

          const tokenRes = await fetch(ENDPOINTS.AUTH_TOKEN, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });
          if (!tokenRes.ok) {
            console.warn(
              "[UserContext] /auth/token failed — session cookie not set"
            );
          }

          const response = await fetch(ENDPOINTS.AUTH_ME, {
            headers: { Authorization: `Bearer ${idToken}` },
          });

          if (response.ok) {
            const backendUserData = (await response.json()) as BackendUser;
            setUser(Object.assign(firebaseUser, backendUserData));
          } else {
            setUser(firebaseUser);
          }
        } catch {
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const googleAuth = async () => {
    try {
      if (isMobileDevice()) {
        window.location.assign("/auth/callback?start=google");
        return false;
      }

      // onAuthStateChanged syncs session via /api/auth/token and loads /api/auth/me
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (error) {
      console.error("Google auth error:", error);
      throw error;
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error("Password reset request error:", error);
      throw error;
    }
  };

  const contextValue: UserContextValue = {
    user,
    isLoading,
    login,
    logout,
    googleAuth,
    requestPasswordReset,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
