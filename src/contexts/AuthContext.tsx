import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore/lite';
import { auth, db } from '../firebase';

export interface UserProfile {
  email: string;
  displayName: string;
  photoURL: string;
  dni: string;
  dniType?: string;
  role: 'fan' | 'promoter' | 'admin';
  createdAt: unknown;
  selectedTag?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  isPromoter: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

const googleProvider = new GoogleAuthProvider();

const actionCodeSettings = {
  url: window.location.origin,
  handleCodeInApp: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Handle magic link on page load
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('lezgoEmailForSignIn');
      if (!email) {
        email = window.prompt('Please enter your email for confirmation');
      }
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem('lezgoEmailForSignIn');
            window.history.replaceState(null, '', window.location.pathname);
          })
          .catch((err) => console.error('Magic link error:', err));
      }
    }
  }, []);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data) {
              setProfile(data as UserProfile);
            }
          } else {
            const newProfile: UserProfile = {
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              dni: '',
              role: 'fan',
              createdAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setProfile(newProfile);
          }
        } catch (err) {
          console.error('Error loading profile:', err);
          setProfile({
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            dni: '',
            role: 'fan',
            createdAt: null,
          });
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const sendMagicLink = async (email: string) => {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('lezgoEmailForSignIn', email);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;

    // Whitelist: only allow safe fields to be updated from the client
    const ALLOWED_FIELDS: (keyof UserProfile)[] = ['displayName', 'dni', 'photoURL', 'selectedTag'];
    const sanitized: Partial<UserProfile> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in data) {
        (sanitized as Record<string, unknown>)[key] = data[key];
      }
    }

    if (Object.keys(sanitized).length === 0) return;

    await setDoc(doc(db, 'users', user.uid), sanitized, { merge: true });
    setProfile((prev) => (prev ? { ...prev, ...sanitized } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        loginWithGoogle,
        sendMagicLink,
        logout,
        updateProfile,
        isPromoter: profile?.role === 'promoter' || profile?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
