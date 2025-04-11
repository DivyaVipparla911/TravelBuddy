// src/navigation/ChatNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ChatListScreen from "../screens/ChatListScreen";
import ChatScreen from "../screens/ChatScreen";

const Stack = createNativeStackNavigator();

const ChatNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: "Chats" }} />
      <Stack.Screen name="ChatDetail" component={ChatScreen} options={{ title: "Chat" }} />
    </Stack.Navigator>
  );
};

export default ChatNavigator;
