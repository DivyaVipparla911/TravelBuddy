import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const ChatScreen = ({ route = {}, navigation }) => {
  // Extract parameters with defaults
  const params = route.params || {};
  const chatId = params.chatId || '';
  const otherUserId = params.otherUserId || '';
  const otherUserName = params.otherUserName || 'User';
  const tripId = params.tripId || '';
  const tripName = params.tripName || '';
  const tripImage = params.tripImage || null;

  // State
  const { currentUser } = useAuth() || {};
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [otherUserAvatar, setOtherUserAvatar] = useState(null);
  const flatListRef = useRef(null);

  // Set up header
  useEffect(() => {
    if (navigation) {
      navigation.setOptions({
        title: otherUserName,
        headerRight: () => (
          <View style={styles.headerRight}>
            {otherUserAvatar ? (
              <Image 
                source={{ uri: otherUserAvatar }} 
                style={styles.headerAvatar}
                onError={() => setOtherUserAvatar(null)}
              />
            ) : (
              <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder]}>
                <Text style={styles.headerAvatarText}>
                  {otherUserName?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>
        )
      });
    }
  }, [navigation, otherUserName, otherUserAvatar]);

  // Fetch other user's avatar
  useEffect(() => {
    const fetchOtherUser = async () => {
      if (!otherUserId) return;
  
      try {
        // First try Users collection
        const userRef = doc(db, 'Users', otherUserId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data() || {};
          setOtherUserAvatar(userData.avatarUrl || null);
          return;
        }
  
        // Fallback to Profiles collection
        const profileRef = doc(db, 'Profiles', otherUserId);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          const profileData = profileSnap.data() || {};
          setOtherUserAvatar(profileData.avatarUrl || null);
        }
      } catch (error) {
        console.log('User avatar fetch error:', error);
        // Silent fail - avatar is optional
      }
    };

    fetchOtherUser();
  }, [otherUserId]);

  // Initialize chat and set up messages listener
  useEffect(() => {
    if (!chatId || !currentUser?.uid) {
      setLoading(false);
      return;
    }

    const setupChat = async () => {
      try {
        setLoading(true);
        
        // Make sure chat document exists
        if (otherUserId) {
          const chatRef = doc(db, 'chats', chatId);
          const chatSnap = await getDoc(chatRef);
          
          if (!chatSnap.exists()) {
            await setDoc(chatRef, {
              participants: [currentUser.uid, otherUserId],
              tripId: tripId || null,
              tripName: tripName || null,
              createdAt: serverTimestamp(),
              lastMessage: '',
              lastUpdated: serverTimestamp()
            });
            console.log('Chat created:', chatId);
          }
        }
        
        // Set up messages listener
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        
        const unsubscribe = onSnapshot(q, 
          (snapshot) => {
            const newMessages = snapshot.docs.map(doc => {
              const data = doc.data();
              let timestamp = 0;
              
              // Handle timestamp conversion safely
              if (data.timestamp && typeof data.timestamp.toDate === 'function') {
                timestamp = data.timestamp.toDate().getTime();
              }
              
              return {
                id: doc.id,
                text: data.text || '',
                senderId: data.senderId || '',
                timestamp: timestamp,
                status: data.status || 'sent'
              };
            });
            
            setMessages(newMessages);
            setLoading(false);
            console.log(`Loaded ${newMessages.length} messages`);
          }, 
          (err) => {
            console.error('Messages listener error:', err);
            setError('Failed to load messages');
            setLoading(false);
          }
        );
        
        // Clean up function
        return () => unsubscribe();
      } catch (err) {
        console.error('Setup chat error:', err);
        setError('Failed to set up chat');
        setLoading(false);
      }
    };
    
    setupChat();
  }, [chatId, currentUser?.uid, otherUserId, tripId, tripName]);

  // Handle sending messages
  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;
    
    if (!chatId || !currentUser?.uid) {
      Alert.alert('Error', 'Cannot send message');
      return;
    }
    
    try {
      console.log('Sending message...');
      
      // References to Firestore documents
      const chatRef = doc(db, 'chats', chatId);
      const messagesRef = collection(chatRef, 'messages');
      
      // First add the message
      const messageDoc = await addDoc(messagesRef, {
        text: trimmedInput,
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
        status: 'sent'
      });
      
      console.log('Message added:', messageDoc.id);
      
      // Then update the chat metadata
      await updateDoc(chatRef, {
        lastMessage: trimmedInput,
        lastUpdated: serverTimestamp()
      });
      
      console.log('Chat updated');
      
      // Clear input
      setInput('');
    } catch (err) {
      console.error('Send message error:', err);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: false });
      }, 200);
    }
  }, [messages]);

  // Render individual message
  const renderMessage = ({ item }) => {
    if (!item) return null;
    
    const isCurrentUser = item.senderId === currentUser?.uid;
    const messageTime = item.timestamp ? 
      new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
      '';

    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        {!isCurrentUser && (
          <View>
            {otherUserAvatar ? (
              <Image 
                source={{ uri: otherUserAvatar }} 
                style={styles.messageAvatar}
                onError={() => setOtherUserAvatar(null)}
              />
            ) : (
              <View style={[styles.messageAvatar, styles.messageAvatarPlaceholder]}>
                <Text style={styles.messageAvatarText}>
                  {otherUserName?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
        ]}>
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserMessageText : null
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.messageTime,
            isCurrentUser ? styles.currentUserMessageTime : null
          ]}>
            {messageTime}
          </Text>
        </View>
      </View>
    );
  };

  // Loading screen
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </SafeAreaView>
    );
  }

  // Error screen
  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
            // Re-trigger the effect that sets up the chat
            // by changing a dependency (this is a hack)
            setOtherUserAvatar(prev => prev);
          }}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Main screen
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Trip info (if any) */}
        {tripName ? (
          <View style={styles.tripInfoContainer}>
            {tripImage ? (
              <Image 
                source={{ uri: tripImage }} 
                style={styles.tripImage}
                onError={() => console.log('Trip image failed to load')}
              />
            ) : (
              <View style={[styles.tripImage, styles.tripImagePlaceholder]}>
                <Ionicons name="map-outline" size={24} color="#888" />
              </View>
            )}
            <View style={styles.tripInfoText}>
              <Text style={styles.tripName} numberOfLines={1}>{tripName}</Text>
              {tripId ? <Text style={styles.tripId}>Trip ID: {tripId}</Text> : null}
            </View>
          </View>
        ) : null}

        {/* Messages list */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item?.id || String(Math.random())}
          contentContainerStyle={styles.messagesContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubText}>
                Start the conversation with {otherUserName}
              </Text>
            </View>
          }
        />

        {/* Input area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor="#888"
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !input.trim() ? styles.sendButtonDisabled : null
            ]}
            onPress={sendMessage}
            disabled={!input.trim()}
          >
            <Ionicons
              name="send"
              size={24}
              color={input.trim() ? "#2196F3" : "#ccc"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ff4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    padding: 10,
    backgroundColor: '#2196F3',
    borderRadius: 5,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
  },
  headerRight: {
    marginRight: 15,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerAvatarPlaceholder: {
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tripInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tripImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 10,
  },
  tripImagePlaceholder: {
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripInfoText: {
    flex: 1,
  },
  tripName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  tripId: {
    fontSize: 12,
    color: '#888',
  },
  messagesContainer: {
    padding: 10,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 14,
    color: '#aaa',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  currentUserMessage: {
    justifyContent: 'flex-end',
  },
  otherUserMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageAvatarPlaceholder: {
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 12,
  },
  currentUserBubble: {
    backgroundColor: '#2196F3',
    borderBottomRightRadius: 2,
  },
  otherUserBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
  },
  currentUserMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  currentUserMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    padding: 10,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatScreen;