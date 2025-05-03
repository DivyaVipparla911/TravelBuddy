import React, { useEffect, useState } from "react";
import { 
  View, 
  FlatList, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  TextInput,
  SafeAreaView,
  StatusBar
} from "react-native";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { db } from "../config/firebase";
import { useUserContext } from "../contexts/UserContext";
import { Ionicons } from '@expo/vector-icons';
import ChatListItem from "../components/ChatList";

const ChatListScreen = () => {
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [error, setError] = useState(null);
  const { user, loading: userLoading } = useUserContext();
  const navigation = useNavigation();

  useEffect(() => {
    if (!user?.uid) {
      setLoadingChats(false);
      return;
    }
    
    console.log("Current user ID:", user.uid);
    
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid)
    );
    
    const unsubscribe = onSnapshot(q,
      async (snapshot) => {
        try {
          console.log("Chats snapshot received, docs count:", snapshot.docs.length);
          
          // First get all basic chat data
          const basicChatData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          
          console.log("Basic chat data:", JSON.stringify(basicChatData, null, 2));
          
          // Then fetch usernames for each chat
          const chatsWithUserNames = await Promise.all(
            basicChatData.map(async (chat) => {
              // Find the other user's ID
              const otherUserId = chat.participants?.find(id => id !== user.uid);
              
              console.log("Found other user ID:", otherUserId);
              
              if (!otherUserId) {
                console.log("No other user ID found in chat");
                return {
                  ...chat,
                  otherUserName: "Unknown User"
                };
              }
              
              // Fetch the other user's data from Firestore - specifically looking for fullName
              try {
                // Try fetching from "Profiles" collection first
                console.log("Fetching user profile from Profiles collection for ID:", otherUserId);
                const userDocRef = doc(db, "Profiles", otherUserId);
                const userDocSnap = await getDoc(userDocRef);
                
                if (userDocSnap.exists()) {
                  const userData = userDocSnap.data();
                  console.log("User data found:", JSON.stringify(userData, null, 2));
                  // Use the fullName field based on your Firebase structure
                  const fullName = userData.fullName || "Unknown User";
                  console.log("Using fullName:", fullName);
                  
                  return {
                    ...chat,
                    otherUserName: fullName,
                    otherUserPhoto: userData.profileImage || userData.idImage || null
                  };
                } else {
                  console.log("User doc doesn't exist in Profiles, trying users collection");
                  
                  // Try the "users" collection as a fallback
                  const usersDocRef = doc(db, "users", otherUserId);
                  const usersDocSnap = await getDoc(usersDocRef);
                  
                  if (usersDocSnap.exists()) {
                    const userData = usersDocSnap.data();
                    console.log("User data found in users collection:", JSON.stringify(userData, null, 2));
                    const fullName = userData.fullName || userData.displayName || userData.name || "Unknown User";
                    console.log("Using fullName from users collection:", fullName);
                    
                    return {
                      ...chat,
                      otherUserName: fullName,
                      otherUserPhoto: userData.profileImage || userData.photoURL || null
                    };
                  } else {
                    console.log("User not found in either collection");
                    return {
                      ...chat,
                      otherUserName: "Unknown User"
                    };
                  }
                }
              } catch (error) {
                console.error("Error fetching user data:", error);
                return {
                  ...chat,
                  otherUserName: "Unknown User"
                };
              }
            })
          );
          
          console.log("Chats with user names:", JSON.stringify(chatsWithUserNames, null, 2));
          
          // Process the data to ensure it's safe to render
          const processedChats = chatsWithUserNames.map(chat => ({
            id: chat.id,
            participants: Array.isArray(chat.participants) ? chat.participants : [],
            lastMessage: typeof chat.lastMessage === 'string' ? chat.lastMessage : 'No messages yet',
            otherUserName: chat.otherUserName,
            otherUserPhoto: chat.otherUserPhoto,
            timestamp: chat.timestamp
          }));
          
          setChats(processedChats);
          setError(null);
        } catch (e) {
          console.error("Error processing chats:", e);
          setError("Failed to load chats");
        } finally {
          setLoadingChats(false);
        }
      },
      (error) => {
        console.error("Error fetching chats:", error);
        setError("Failed to fetch chats");
        setLoadingChats(false);
      }
    );
    
    return () => unsubscribe();
  }, [user?.uid]);

  const handleOpenChat = (chat) => {
    if (!user?.uid || !chat?.id) return;
    const otherUserId = chat.participants?.find(id => id !== user.uid) || '';
    navigation.navigate("ChatDetail", {
      chatId: chat.id,
      otherUserId,
      otherUserName: chat.otherUserName || 'User',
    });
  };

  if (userLoading || loadingChats) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text>Please sign in to view chats</Text>
      </View>
    );
  }

  // Safety check to ensure we have a valid array
  const validChats = Array.isArray(chats) ? chats : [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages"
          placeholderTextColor="#999"
        />
      </View>
      
      {/* Chat List using your ChatListItem component */}
      <FlatList
        data={validChats}
        keyExtractor={(item) => String(item?.id || Math.random())}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleOpenChat(item)}>
            <ChatListItem chat={item} currentUserId={user?.uid} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 25,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
});

export default ChatListScreen;