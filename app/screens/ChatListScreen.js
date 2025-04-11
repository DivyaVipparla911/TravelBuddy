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
import { collection, query, where, onSnapshot } from "firebase/firestore";
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
    
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid)
    );
    
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        try {
          const chatData = snapshot.docs.map(doc => {
            const data = doc.data();
            
            // Convert any potential objects to strings to avoid direct rendering
            const processedData = {
              id: doc.id,
              participants: Array.isArray(data.participants) ? data.participants : [],
              lastMessage: typeof data.lastMessage === 'string' ? data.lastMessage : 'No messages yet',
              otherUserName: typeof data.otherUserName === 'string' ? data.otherUserName : 'Unknown User',
              // Skip timestamp for now as ChatListItem doesn't use it
            };
            
            return processedData;
          });
          
          setChats(chatData);
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