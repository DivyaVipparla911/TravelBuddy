import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';

const TripCard = ({ trip }) => {
  const navigation = useNavigation();
  
  const handleJoinTrip = () => {
    navigation.navigate('TripDetails', { tripId: trip.id });
  };
  
  return (
    <TouchableOpacity style={styles.tripCard} onPress={handleJoinTrip}>
      <Image 
        source={trip.imageUrl ? { uri: trip.imageUrl } : { uri: 'https://via.placeholder.com/300x150?text=No+Image' }} 
        style={styles.tripImage} 
        resizeMode="cover" 
      />
      <View style={styles.tripContent}>
        <Text style={styles.tripTitle}>{trip.title}</Text>
        <Text style={styles.tripDescription}>{trip.description}</Text>
        <Text style={styles.tripType}>{trip.type}</Text>
        <View style={styles.postedByContainer}>
          <Text style={styles.postedBy}>Posted by: {trip.userName || 'Anonymous'}</Text>
        </View>
        <TouchableOpacity style={styles.joinButton} onPress={handleJoinTrip}>
          <Text style={styles.joinButtonText}>Join Trip</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    tripType: null,
    budget: null,
    dates: null
  });
  
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    fetchTrips();
  }, [filter]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      const tripsRef = collection(db, 'Trips'); // Fetch from 'Trips' collection
      
      // Create a base query to exclude trips created by the current user
      let q = query(tripsRef, where('userId', '!=', currentUser.uid));
      
      // Add additional filters if they exist
      if (filter.tripType) {
        q = query(q, where('type', '==', filter.tripType));
      }
      
      if (filter.budget) {
        q = query(q, where('budget', '==', filter.budget));
      }
      
      // Fetch data from Firestore
      const querySnapshot = await getDocs(q);
      let tripsList = [];

      querySnapshot.forEach((doc) => {
        const trip = { id: doc.id, ...doc.data() };
        
        // Optional client-side filtering
        if (
          (!filter.tripType || trip.type === filter.tripType) &&
          (!filter.budget || trip.budget === filter.budget)
        ) {
          tripsList.push(trip);
        }
      });

      setTrips(tripsList);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTripTypeFilter = () => {
    // Example toggle between 'Adventure' and null as trip type filter
    setFilter(prev => ({
      ...prev, 
      tripType: prev.tripType ? null : 'Adventure'
    }));
  };

  const handleBudgetFilter = () => {
    // Example toggle between '$$' and null as budget filter
    setFilter(prev => ({
      ...prev, 
      budget: prev.budget ? null : '$$'
    }));
  };

  const handleDateFilter = () => {
    // Example toggle for dates filter
    setFilter(prev => ({
      ...prev, 
      dates: prev.dates ? null : 'upcoming'
    }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with Filters */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, filter.tripType && styles.activeButton]} 
            onPress={handleTripTypeFilter}
          >
            <Ionicons name="list" size={20} color={filter.tripType ? "#fff" : "#000"} />
            <Text style={[styles.buttonText, filter.tripType && styles.activeButtonText]}>Trip Type</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, filter.budget && styles.activeButton]} 
            onPress={handleBudgetFilter}
          >
            <MaterialIcons name="attach-money" size={20} color={filter.budget ? "#fff" : "#000"} />
            <Text style={[styles.buttonText, filter.budget && styles.activeButtonText]}>Budget</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, filter.dates && styles.activeButton]} 
            onPress={handleDateFilter}
          >
            <MaterialIcons name="date-range" size={20} color={filter.dates ? "#fff" : "#000"} />
            <Text style={[styles.buttonText, filter.dates && styles.activeButtonText]}>Dates</Text>
          </TouchableOpacity>
        </View>

        {/* Trip List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Loading trips...</Text>
          </View>
        ) : trips.length > 0 ? (
          <ScrollView 
            style={styles.tripList}
            contentContainerStyle={styles.tripListContent}
          >
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No trips found</Text>
            <Text style={styles.emptySubText}>Try changing your filters or check back later!</Text>
          </View>
        )}
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  button: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 20,
    width: '30%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  activeButtonText: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  tripList: {
    flex: 1,
  },
  tripListContent: {
    padding: 20,
  },
  tripCard: {
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f8f8f8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tripImage: {
    width: '100%',
    height: 150,
  },
  tripContent: {
    padding: 15,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tripDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  tripType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  postedByContainer: {
    marginBottom: 10,
  },
  postedBy: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  joinButton: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#000',
  },
  joinButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default HomeScreen;
