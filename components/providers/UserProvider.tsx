"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  reload,
  sendEmailVerification,
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
  business_id?: number;
  business_name?: string | null;
  config_version?: number;
  first_name?: string | null;
  last_name?: string | null;
  is_admin?: boolean;
  approved?: boolean;
  original_business_id?: number | string | null;
};

export type AppUser = FirebaseUser & BackendUser;

function mergeAppUser(
  firebaseUser: FirebaseUser,
  backendUserData: BackendUser
): AppUser {
  const config_version = Number(backendUserData.config_version) || 0;

  return Object.assign({}, firebaseUser, backendUserData, {
    config_version,
  }) as AppUser;
}

async function syncBackendSession(firebaseUser: FirebaseUser): Promise<AppUser> {
  const idToken = await firebaseUser.getIdToken();

  const tokenRes = await fetch(ENDPOINTS.AUTH_TOKEN, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!tokenRes.ok) {
    console.warn("[UserContext] /auth/token failed — session cookie not set");
  }

  const response = await fetch(ENDPOINTS.AUTH_ME, {
    headers: { Authorization: `Bearer ${idToken}` },
  });

  if (response.ok) {
    const backendUserData = (await response.json()) as BackendUser;
    return mergeAppUser(firebaseUser, backendUserData);
  }

  console.warn("[UserContext] /auth/me failed — using Firebase user only");
  return firebaseUser as AppUser;
}

type UserContextValue = {
  user: AppUser | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<AppUser>;
  logout: () => Promise<boolean>;
  googleAuth: () => Promise<AppUser | false>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  resendVerificationEmail: () => Promise<void>;
  confirmEmailVerified: () => Promise<AppUser | null>;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const appUser = await syncBackendSession(firebaseUser);
          setUser(appUser);
        } catch {
          setUser(firebaseUser as AppUser);
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
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const appUser = await syncBackendSession(credential.user);
      setUser(appUser);
      return appUser;
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

      const credential = await signInWithPopup(auth, googleProvider);
      const appUser = await syncBackendSession(credential.user);
      setUser(appUser);
      return appUser;
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

  const resendVerificationEmail = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      throw new Error("You must be signed in to resend the verification email.");
    }

    await sendEmailVerification(firebaseUser);
  };

  const confirmEmailVerified = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      return null;
    }

    await reload(firebaseUser);
    await firebaseUser.getIdToken(true);

    if (!firebaseUser.emailVerified) {
      return null;
    }

    const appUser = await syncBackendSession(firebaseUser);
    setUser(appUser);
    return appUser;
  };

  const refreshUser = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      setUser(null);
      return;
    }

    try {
      const appUser = await syncBackendSession(firebaseUser);
      setUser(appUser);
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  }, []);

  const contextValue: UserContextValue = {
    user,
    isLoading,
    refreshUser,
    login,
    logout,
    googleAuth,
    requestPasswordReset,
    resendVerificationEmail,
    confirmEmailVerified,
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
