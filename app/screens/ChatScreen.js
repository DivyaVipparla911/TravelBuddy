// src/screens/ChatScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useUserContext } from "../contexts/UserContext"; // Import useUserContext instead
import MessageBubble from "../components/MessageBubble";

const ChatScreen = ({ route }) => {
  const { chatId, otherUserId, otherUserName } = route.params || {};
  const { user } = useUserContext(); // Use the working context
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef();

  // Make sure chatId exists before creating the reference
  useEffect(() => {
    if (!chatId || !user?.uid) {
      setLoading(false);
      return;
    }

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching messages:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId, user?.uid]);

  const sendMessage = async () => {
    if (!input.trim() || !chatId || !user?.uid) return;
    
    const messagesRef = collection(db, "chats", chatId, "messages");
    
    try {
      await addDoc(messagesRef, {
        text: input.trim(),
        senderId: user.uid,
        timestamp: serverTimestamp(),
      });
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007aff" />
      </View>
    );
  }

  // Check if user or chatId is not available
  if (!user || !chatId) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Unable to load chat. Please try again.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            text={item.text}
            isCurrentUser={item.senderId === user.uid}
          />
        )}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
          style={styles.input}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f9f9f9",
  },
  input: {
    flex: 1,
    borderRadius: 20,
    padding: 10,
    backgroundColor: "#eee",
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#007aff",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: "center",
    alignItems: "center",
  },
});