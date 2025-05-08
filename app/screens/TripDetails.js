import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

// API config - Consider moving this to an environment config file
const API_BASE_URL = 'http://localhost:5001';

const TripDetailsScreen = ({ route }) => {
  const { tripId } = route.params;
  const [trip, setTrip] = useState(null);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isJoining, setIsJoining] = useState(false); // State to track join request in progress
  const navigation = useNavigation();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Fetch trip details
        const tripRef = doc(db, 'Trips', tripId);
        const tripSnap = await getDoc(tripRef);
        
        if (!tripSnap.exists()) {
          throw new Error('Trip not found');
        }
        
        const tripData = tripSnap.data();
        
        // 2. Fetch creator details
        if (!tripData.userId) {
          throw new Error('Trip creator not specified');
        }
        
        const creatorRef = doc(db, 'users', tripData.userId);
        const creatorSnap = await getDoc(creatorRef);
        
        if (!creatorSnap.exists()) {
          throw new Error('Trip creator not found');
        }
        
        const creatorData = creatorSnap.data();
        
        // Set states
        setTrip({
          id: tripSnap.id,
          title: tripData.title || 'Untitled Trip',
          location: tripData.destination?.address || 'Location not specified',
          startDate: tripData.startDate?.toDate?.()?.toLocaleDateString() || 'Not specified',
          endDate: tripData.endDate?.toDate?.()?.toLocaleDateString() || 'Not specified',
          price: tripData.price ? `$${tripData.price}` : 'Price not set',
          description: tripData.description || 'No description provided',
          coverImage: tripData.photoUrl || null,
          meetingPoint: tripData.meetingPoint?.address || 'Meeting point not specified',
          tripType: tripData.tripType || 'General',
          participants: tripData.participants || [],
          userId: tripData.userId
        });
        
        setCreator({
          id: tripData.userId,
          name: creatorData.name || 'Unknown User',
          avatar: creatorData.avatarUrl || null,
          email: creatorData.email || null
        });
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err.message || 'Failed to load trip details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tripId]);

  const handleConnect = async () => {
    try {
      // Validate authentication and data
      if (!currentUser?.uid) {
        Alert.alert('Login Required', 'Please sign in to message the trip creator');
        return navigation.navigate('Auth');
      }
      
      if (!creator || !trip) {
        throw new Error('Trip information not available');
      }
      
      if (currentUser.uid === creator.id) {
        return Alert.alert('Notice', "You can't message yourself");
      }
      
      // Generate chat ID
      const participants = [currentUser.uid, creator.id].sort();
      const chatId = `chat_${participants.join('_')}`;
      
      // Create chat reference
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          participants: participants,
          createdAt: serverTimestamp()
        });
      }
      
      navigation.navigate('Chat', { chatId });
    } catch (error) {
      console.error('Chat creation failed:', error);
      Alert.alert(
        'Chat Creation Failed',
        error.message || 'Unable to create chat'
      );
    }
  };

  const handleJoinTrip = async () => {
    console.log('Join Trip button clicked'); // Debug log
    
    // Validate user login status
    if (!currentUser) {
      console.log('No current user found'); // Debug log
      Alert.alert('Login Required', 'Please sign in to join this trip', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Auth') }
      ]);
      return;
    }
    
    // Validate necessary data
    if (!creator?.email) {
      console.log('Creator email missing:', creator); // Debug log
      Alert.alert('Error', 'Cannot contact trip host - email not available');
      return;
    }
    
    try {
      setIsJoining(true); // Start loading state
      console.log('Setting isJoining to true'); // Debug log
      
      const userData = {
        userName: currentUser.displayName || 'User',
        userEmail: currentUser.email,
        tripTitle: trip.title,
        hostEmail: creator.email
      };
      
      // Log what we're sending to the API
      console.log('Sending request to API:', {
        url: `${API_BASE_URL}/send-join-request-email`,
        data: userData
      });
      
      // Check if API_BASE_URL is correctly set
      if (!API_BASE_URL) {
        console.error('API_BASE_URL is not defined!');
        throw new Error('API configuration error');
      }
      
      // Make API request to send email
      const response = await axios.post(`${API_BASE_URL}/send-join-request-email`, userData);
      console.log('API response:', response.status, response.data); // Debug log
      
      if (response.status === 200) {
        // Success message
        console.log('Request sent successfully'); // Debug log
        Alert.alert(
          'Request Sent!',
          'Your join request has been sent to the trip host. They will contact you soon.',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Failed to send request');
      }
    } catch (err) {
      console.error('Join request error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config // This will show the request URL and data
      });
      
      // Provide more detailed error message if available
      const errorMessage = err.response?.data?.message ||
        'Failed to send join request. Please try again later.';
      
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      console.log('Setting isJoining to false'); // Debug log
      setIsJoining(false); // End loading state
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading trip details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color="#FF5252" />
          <Text style={styles.errorText}>Couldn't load trip</Text>
          <Text style={styles.errorSubText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!trip || !creator) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FFA000" />
          <Text style={styles.errorText}>Trip information incomplete</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip Details</Text>
          <TouchableOpacity style={styles.bookmarkButton}>
            <Ionicons name="bookmark-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.imageContainer}>
            {trip.coverImage ? (
              <Image
                source={{ uri: trip.coverImage }}
                style={styles.coverImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="image-outline" size={48} color="#888" />
                <Text style={styles.placeholderText}>No trip image</Text>
              </View>
            )}
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>{trip.title}</Text>
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>{trip.price}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={20} color="#444" />
            <Text style={styles.infoText}>{trip.tripType}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#444" />
            <Text style={styles.infoText}>{trip.location}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="pin-outline" size={20} color="#444" />
            <Text style={styles.infoText}>Meet at: {trip.meetingPoint}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#444" />
            <Text style={styles.infoText}>{trip.startDate} - {trip.endDate}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={20} color="#444" />
            <Text style={styles.infoText}>
              {trip.participants.length} {trip.participants.length === 1 ? 'participant' : 'participants'}
            </Text>
          </View>

          <View style={styles.hostContainer}>
            <View style={styles.hostAvatar}>
              {creator.avatar ? (
                <Image
                  source={{ uri: creator.avatar }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>
                    {creator.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.hostInfo}>
              <Text style={styles.hostName}>{creator.name}</Text>
              <Text style={styles.hostLabel}>Trip Creator</Text>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>About This Trip</Text>
            <Text style={styles.description}>{trip.description}</Text>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.connectButton}
            onPress={handleConnect}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#000" />
            <Text style={styles.connectButtonText}>Message Creator</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
            onPress={handleJoinTrip}
            disabled={isJoining}
          >
            {isJoining ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.joinButtonText}>Join Trip</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF5252',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 150,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: '#e0e0e0',
    borderBottomWidth: 1,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  backButton: {
    padding: 8,
  },
  bookmarkButton: {
    padding: 8,
  },
  imageContainer: {
    width: '100%',
    height: 240,
    backgroundColor: '#f0f0f0',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ddd',
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
    marginTop: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
    color: '#000',
  },
  priceTag: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  priceText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 6,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#444',
    flex: 1,
  },
  hostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  hostAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  avatarPlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
  },
  hostLabel: {
    color: '#666',
    fontSize: 14,
    marginTop: 2,
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  buttonContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginRight: 10,
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#000',
  },
  joinButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  joinButtonDisabled: {
    backgroundColor: '#666',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TripDetailsScreen;