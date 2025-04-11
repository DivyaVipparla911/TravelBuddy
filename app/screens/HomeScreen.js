import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

// Mock data simulating a database response
const mockTripData = [
  {
    id: 1,
    image: require('../../assets/pictures/bali.jpeg'),
    title: 'Bali Adventure',
    description: 'Explore the beautiful beaches and cultural sites',
    type: '[Adventure] $$',
  },
  {
    id: 2,
    image: require('../../assets/pictures/tokyo.jpeg'),
    title: 'Tokyo City Tour',
    description: 'Experience the vibrant city life',
    type: '[City Tour] $$$',
  },
  {
    id: 3,
    image: require('../../assets/pictures/hiking.jpeg'),
    title: 'Mountain Hiking',
    description: 'Trek through scenic mountain trails',
    type: '[Adventure] $$',
  },
  {
    id: 4,
    image: require('../../assets/pictures/tokyo.jpeg'),
    title: 'Historical Landmarks',
    description: 'Visit ancient ruins and historical sites',
    type: '[Cultural] $$',
  },
  {
    id: 5,
    image: require('../../assets/pictures/tokyo.jpeg'),
    title: 'Beach Getaway',
    description: 'Relax on pristine beaches',
    type: '[Relaxation] $$$',
  },
];

const TripCard = ({ trip }) => (
  <TouchableOpacity style={styles.tripCard}>
    <Image source={trip.image} style={styles.tripImage} resizeMode="cover" />
    <View style={styles.tripContent}>
      <Text style={styles.tripTitle}>{trip.title}</Text>
      <Text style={styles.tripDescription}>{trip.description}</Text>
      <Text style={styles.tripType}>{trip.type}</Text>
      <TouchableOpacity style={styles.joinButton}>
        <Text style={styles.joinButtonText}>Join Trip</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button}>
            <Ionicons name="list" size={20} color="#000" />
            <Text style={styles.buttonText}>Trip Type</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <MaterialIcons name="attach-money" size={20} color="#000" />
            <Text style={styles.buttonText}>Budget</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <MaterialIcons name="date-range" size={20} color="#000" />
            <Text style={styles.buttonText}>Dates</Text>
          </TouchableOpacity>
        </View>

        {/* Trip List */}
        <ScrollView 
          style={styles.tripList}
          contentContainerStyle={styles.tripListContent}
        >
          {mockTripData.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </ScrollView>
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
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    marginLeft: 5,
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
    marginBottom: 10,
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