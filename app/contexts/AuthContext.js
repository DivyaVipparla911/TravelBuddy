// app/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, firestore } from '../config/firebase';

// Create the auth context
const AuthContext = createContext(null);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider component that makes auth object available to any child component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileCreated, setProfileCreated] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userDocRef = doc(firestore, "users", user.uid);
        const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists() && docSnap.data().profileCreated) {
            setProfileCreated(true);
          } else {
            setProfileCreated(false);
          }
          setLoading(false);
        });
        return () => {
          unsubscribeDoc(); // cleanup listener
        };
      } else {
        setUser(null);
        setProfileCreated(false);
        setLoading(false);
      }
    });
    
    return () => unsubscribeAuth();
  }, []);

  // Authentication functions
  const signOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Value object that will be available to consumers of this context
  const value = {
    user,
    loading,
    profileCreated,
    signOut,
    // Add these properties to match what your ChatScreen expects
    currentUser: user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};