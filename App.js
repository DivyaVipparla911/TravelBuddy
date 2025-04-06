import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./app/config/firebase";
import { getFirestore, doc, getDoc, onSnapshot } from "firebase/firestore";
import AuthNavigator from "./app/navigation/AuthNavigator";
import BottomTabNavigator from "./app/navigation/BottomTabNavigator";
import CreateProfileScreen from "./app/screens/Profile/CreateProfileScreen";
import VerifyIdentityScreen from "./app/screens/Profile/VerifyIdentityScreen";
import UploadLicenseScreen from "./app/screens/Profile/UploadLicenseScreen";
import VerifyingSubmissionScreen from "./app/screens/Profile/VerifyingSubmissionScreen";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

const db = getFirestore();
const Stack = createStackNavigator();
const ProfileStack = createStackNavigator();

// Create a separate navigator for the profile creation flow
const ProfileCreationNavigator = () => {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="CreateProfile"
        component={CreateProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="VerifyIdentity"
        component={VerifyIdentityScreen}
      />
      <ProfileStack.Screen
        name="UploadLicense"
        component={UploadLicenseScreen}
      />
      <ProfileStack.Screen
        name="VerifyingSubmission"
        component={VerifyingSubmissionScreen}
      />
    </ProfileStack.Navigator>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileCreated, setProfileCreated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Set up a real-time listener for the user document
        const userDocRef = doc(db, "users", user.uid);
        const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists() && docSnap.data().profileCreated) {
            setProfileCreated(true);
          } else {
            setProfileCreated(false);
          }
          
          // Only set loading to false after we've checked the profile status
          setLoading(false);
        });
        
        // Return a cleanup function that unsubscribes from both listeners
        return () => {
          unsubscribeDoc();
        };
      } else {
        // No user is signed in
        setUser(null);
        setProfileCreated(false);
        setLoading(false);
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : !profileCreated ? (
          <Stack.Screen name="ProfileCreation" component={ProfileCreationNavigator} />
        ) : (
          <Stack.Screen name="BottomTab" component={BottomTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}