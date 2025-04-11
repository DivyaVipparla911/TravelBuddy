import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./app/config/firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import AuthNavigator from "./app/navigation/AuthNavigator";
import BottomTabNavigator from "./app/navigation/BottomTabNavigator";
import CreateProfileScreen from "./app/screens/Profile/CreateProfileScreen";
import VerifyIdentityScreen from "./app/screens/Profile/VerifyIdentityScreen";
import UploadLicenseScreen from "./app/screens/Profile/UploadLicenseScreen";
import VerifyingSubmissionScreen from "./app/screens/Profile/VerifyingSubmissionScreen";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { UserContextProvider } from "./app/contexts/UserContext";

const db = getFirestore();
const Stack = createStackNavigator();
const ProfileStack = createStackNavigator();

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

const MainNavigator = () => {
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

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : !profileCreated ? (
        <Stack.Screen name="ProfileCreation" component={ProfileCreationNavigator} />
      ) : (
        <Stack.Screen name="BottomTab" component={BottomTabNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <UserContextProvider>
      <NavigationContainer>
        <MainNavigator />
      </NavigationContainer>
    </UserContextProvider>
  );
}