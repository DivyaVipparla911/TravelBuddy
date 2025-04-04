import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons'; // Import icons

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

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button}>
            <Ionicons name="ios-list" size={20} color="#000" /> {/* Icon for Trip Type */}
            <Text style={styles.buttonText}>Trip Type</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <MaterialIcons name="attach-money" size={20} color="#000" /> {/* Icon for Budget */}
            <Text style={styles.buttonText}>Budget</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <MaterialIcons name="date-range" size={20} color="#000" /> {/* Icon for Dates */}
            <Text style={styles.buttonText}>Dates</Text>
          </TouchableOpacity>
        </View>

        {/* Trip List */}
        <ScrollView style={styles.tripList}>
          {mockTripData.map((trip) => (
            <TouchableOpacity key={trip.id} style={styles.tripCard}>
              <Image source={ trip.image } style={styles.tripImage} resizeMode='contain'/>
              <View style={styles.tripContent}>
                <Text style={styles.tripTitle}>{trip.title}</Text>
                <Text style={styles.tripDescription}>{trip.description}</Text>
                <Text style={styles.tripType}>{trip.type}</Text>
                <TouchableOpacity style={styles.joinButton}>
                  <Text style={styles.joinButtonText}>Join Trip</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8', // Match the header background color
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20, // Added padding to push buttons down
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
    flexDirection: 'row', // Align icon and text horizontally
    justifyContent: 'center', // Center content
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    marginLeft: 5, // Add space between icon and text
  },
  tripList: {
    flex: 1,
    padding: 20,
  },
  tripCard: {
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f8f8f8',
  },
  tripImage: {
    width: '100%',
    height: 150,
  },
  tripContent: {
    padding: 10,
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
  },
  joinButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#000',
    flexDirection: 'row', // Align icon and text horizontally
    justifyContent: 'center', // Center content
  },
  joinButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5, // Add space between icon and text
  },
});

export default HomeScreen;