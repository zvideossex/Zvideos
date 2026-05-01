import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: any | null;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, profile: null });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userDocRef = doc(db, 'users', u.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            const newProfile = {
              uid: u.uid,
              email: u.email,
              username: u.displayName || 'Guest',
              avatarUrl: u.photoURL,
              isCreator: u.email === 'mdrifathossen059@gmail.com',
              isVerified: true,
              ageConfirmed: true,
              bio: '',
              earnings: 0,
              totalEarned: 0,
              subscribers: 0,
              createdAt: serverTimestamp(),
            };
            await setDoc(userDocRef, newProfile);
            setProfile({ ...newProfile, createdAt: new Date().toISOString() });
          } else {
            const data = userDoc.data();
            // Ensure status is kept up to date for the admin
            if (u.email === 'mdrifathossen059@gmail.com' && !data.isCreator) {
              await updateDoc(userDocRef, { isCreator: true });
              data.isCreator = true;
            }
            setProfile(data);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${u.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, profile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
