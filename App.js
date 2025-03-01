import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./app/config/firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import AuthNavigator from "./app/navigation/AuthNavigator";
import BottomTabNavigator from "./app/navigation/BottomTabNavigator";
import CreateProfileScreen from "./app/screens/Profile/EditProfileScreen"

const db = getFirestore();
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileCreated, setProfileCreated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data().profileCreated) {
          setProfileCreated(true);
        } else {
          setProfileCreated(false);
        }
        await auth.signOut();
      }
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }
  if (!user) {
    return <AuthNavigator />;
  } else if (!profileCreated) {
    return <CreateProfileScreen />;
  } else {
    return <BottomTabNavigator />;
  }
}