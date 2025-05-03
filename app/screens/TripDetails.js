import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const TripDetailsScreen = ({ route }) => {
  const { tripId } = route.params;
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        // In a real app, fetch the trip from Firebase
        const tripDoc = doc(db, 'trips', tripId);
        const tripSnapshot = await getDoc(tripDoc);
        
        if (tripSnapshot.exists()) {
          setTrip({ id: tripSnapshot.id, ...tripSnapshot.data() });
        } else {
          // For demo purposes, use mock data if Firebase fetch fails
          // In production, you would show an error message
          const mockTrip = {
            id: tripId,
            title: "Mountain Hiking Trip",
            location: "Mount Rainier, Washington",
            startDate: "March 15, 2025",
            endDate: "March 17, 2025",
            price: 120,
            description: "Join us for an exciting 3-day hiking adventure at Mount Rainier. Experience breathtaking views, professional guidance, and meet fellow hiking enthusiasts. All equipment and meals included.",
            hostName: "John Smith",
            hostAvatar: null, // You can add a default avatar path
            spotsLeft: 4,
            duration: "3 days, 2 nights",
            difficultyLevel: "Intermediate Level",
            included: ["Equipment", "Meals", "Guide", "Transport"]
          };
          setTrip(mockTrip);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching trip details: ', error);
        setLoading(false);
        // Use mock data as fallback in case of error
        const mockTrip = {
          id: tripId,
          title: "Mountain Hiking Trip",
          location: "Mount Rainier, Washington",
          startDate: "March 15, 2025",
          endDate: "March 17, 2025",
          price: 120,
          description: "Join us for an exciting 3-day hiking adventure at Mount Rainier. Experience breathtaking views, professional guidance, and meet fellow hiking enthusiasts. All equipment and meals included.",
          hostName: "John Smith",
          hostAvatar: null,
          spotsLeft: 4,
          duration: "3 days, 2 nights",
          difficultyLevel: "Intermediate Level",
          included: ["Equipment", "Meals", "Guide", "Transport"]
        };
        setTrip(mockTrip);
      }
    };

    fetchTripDetails();
  }, [tripId]);

  const handleConnect = () => {
    // Navigate to chat screen with the trip host
    navigation.navigate('Chat', { 
      recipientId: trip.hostId || '123', // Default ID for demo
      recipientName: trip.hostName,
      tripId: trip.id,
      tripName: trip.title
    });
  };

  const handleJoinTrip = () => {
    // Navigate to booking/confirmation screen
    navigation.navigate('JoinTrip', { tripId: trip.id });
  };

  if (loading || !trip) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with back button and bookmark */}
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
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Trip Cover Image */}
          <View style={styles.imageContainer}>
            {trip.coverImage ? (
              <Image source={{ uri: trip.coverImage }} style={styles.coverImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>Trip Cover Image</Text>
              </View>
            )}
          </View>
          
          {/* Trip Title and Price */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{trip.title}</Text>
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>${trip.price}/person</Text>
            </View>
          </View>
          
          {/* Location */}
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#444" />
            <Text style={styles.infoText}>{trip.location}</Text>
          </View>
          
          {/* Date */}
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#444" />
            <Text style={styles.infoText}>{trip.startDate} - {trip.endDate}</Text>
          </View>
          
          {/* Host Info */}
          <View style={styles.hostContainer}>
            <View style={styles.hostAvatar}>
              {trip.hostAvatar ? (
                <Image source={{ uri: trip.hostAvatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarPlaceholder}>{trip.hostName.charAt(0)}</Text>
              )}
            </View>
            <View>
              <Text style={styles.hostName}>{trip.hostName}</Text>
              <Text style={styles.hostLabel}>Trip Host</Text>
            </View>
          </View>
          
          {/* About This Trip */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>About This Trip</Text>
            <Text style={styles.description}>{trip.description}</Text>
          </View>
          
          {/* Trip Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={20} color="#444" />
              <Text style={styles.detailText}>{trip.spotsLeft} spots left</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color="#444" />
              <Text style={styles.detailText}>{trip.duration}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="trending-up-outline" size={20} color="#444" />
              <Text style={styles.detailText}>{trip.difficultyLevel}</Text>
            </View>
          </View>
          
          {/* What's Included */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>What's Included</Text>
            <View style={styles.includedContainer}>
              {trip.included && trip.included.map((item, index) => (
                <View key={index} style={styles.includedItem}>
                  <Ionicons name="checkmark-outline" size={18} color="#444" />
                  <Text style={styles.includedText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Bottom Spacing for Button Container */}
          <View style={{ height: 100 }} />
        </ScrollView>
        
        {/* Fixed Bottom Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={handleConnect}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#000" />
            <Text style={styles.connectButtonText}>Connect</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.joinButton}
            onPress={handleJoinTrip}
          >
            <Text style={styles.joinButtonText}>Join Trip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    backgroundColor: '#f8f8f8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  bookmarkButton: {
    padding: 8,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ddd',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
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
  },
  priceTag: {
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  priceText: {
    fontWeight: 'bold',
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
  },
  hostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 20,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  hostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  hostName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  hostLabel: {
    color: '#666',
    fontSize: 14,
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  detailsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#444',
  },
  includedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  includedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 12,
  },
  includedText: {
    marginLeft: 8,
    fontSize: 14,
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
    borderTopColor: '#ddd',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 10,
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#000',
  },
  joinButton: {
    backgroundColor: '#000',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default TripDetailsScreen;