import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import LoginScreen from "../screens/Auth/LoginScreen";
import SignupScreen from "../screens/Auth/SignupScreen";
import CreateProfileScreen from "../screens/Profile/CreateProfileScreen";

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
      </Stack.Navigator>
   
  );
};

export default AuthNavigator;

