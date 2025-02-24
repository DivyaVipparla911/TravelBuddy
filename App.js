import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./config/firebase";
import AuthNavigator from "./app/navigation/AuthNavigator";
import BottomTabNavigator from "./app/navigation/BottomTabNavigator";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("User State Changed: ", user);
      if (user) {
        console.log("User is logged in. Email:", user.email);
        console.log("User UID:", user.uid);
        // Uncomment the following line to force sign out for testing
        await auth.signOut();
        console.log("User signed out.");
      } else {
        console.log("No user is logged in.");
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

  return user ? <BottomTabNavigator /> : <AuthNavigator />;
}