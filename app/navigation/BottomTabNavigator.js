import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HomeScreen from "../screens/HomeScreen";
import AITripsNavigator from "./AITripsNavigator";
import ChatNavigator from "./ChatNavigator";
import ProfileScreen from "../screens/Profile/ProfileScreen";
import VerifyIdentityScreen from "../screens/Profile/VerifyIdentityScreen";
import UploadLicenseScreen from "../screens/Profile/UploadLicenseScreen";
import VerifyingSubmissionScreen from "../screens/Profile/VerifyingSubmissionScreen";
import StartTripScreen from "../screens/StartTripScreen";

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "AITrips") {
            iconName = focused ? "search" : "search-outline";
          } else if (route.name === "Add") {
            iconName = focused ? "add-circle" : "add-circle-outline";
          } else if (route.name === "Chat") {
            iconName = focused ? "chatbubble" : "chatbubble-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "black",
        tabBarInactiveTintColor: "gray",
        tabBarShowLabel: false,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="AITrips" component={AITripsNavigator} />
      <Tab.Screen name="Add" component={StartTripScreen} />
      <Tab.Screen name="Chat" component={ChatNavigator} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;