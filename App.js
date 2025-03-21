import React, { useState, useEffect, lazy, Suspense } from "react";
import { View, ActivityIndicator } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./app/config/firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import AuthNavigator from "./app/navigation/AuthNavigator";
import BottomTabNavigator from "./app/navigation/BottomTabNavigator";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import CreateProfileScreen from "./app/screens/Profile/EditProfileScreen";

const db = getFirestore();
const Stack = createStackNavigator();

// Lazy-loaded ID verification screens
const VerifyIdentityScreen = lazy(() => import("./app/screens/Profile/VerifyIdentityScreen"));
const UploadLicenseScreen = lazy(() => import("./app/screens/Profile/UploadLicenseScreen"));
const VerifyingSubmissionScreen = lazy(() => import("./app/screens/Profile/VerifyingSubmissionScreen"));

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

  // Show authentication flow if user is not logged in
  if (!user) {
    return <AuthNavigator />;
  }

  // Show profile creation & ID verification flow if profile is not created
  if (!profileCreated) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
          <Stack.Screen
            name="VerifyIdentity"
            component={(props) => (
              <Suspense fallback={<LoadingScreen />}>
                <VerifyIdentityScreen {...props} />
              </Suspense>
            )}
          />
          <Stack.Screen
            name="UploadLicense"
            component={(props) => (
              <Suspense fallback={<LoadingScreen />}>
                <UploadLicenseScreen {...props} />
              </Suspense>
            )}
          />
          <Stack.Screen
            name="VerifyingSubmission"
            component={(props) => (
              <Suspense fallback={<LoadingScreen />}>
                <VerifyingSubmissionScreen {...props} />
              </Suspense>
            )}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Show main app flow if the user has a profile
  return <BottomTabNavigator />;
}

// Fallback loading screen
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <ActivityIndicator size="large" color="black" />
  </View>
);
