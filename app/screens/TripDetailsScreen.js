import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const TripDetailsScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Trip Details</Text>

        <View style={styles.creatorContainer}>
          <Text style={styles.creatorName}>Alex Chen</Text>
          <Text style={styles.creatorRole}>Trip Creator</Text>
        </View>

        <Text style={styles.sectionTitle}>Trip Type</Text>
        <Text style={styles.tripType}>Beach Vacation</Text>
        <Text style={styles.tripActivity}>Adventure Activities</Text>

        <Text style={styles.sectionTitle}>Exploring Cities</Text>
        <View style={styles.detailContainer}>
          <Text style={styles.detailLabel}>Starting Point</Text>
          <Text style={styles.detailValue}>Jakarta, Indonesia</Text>
        </View>
        <View style={styles.detailContainer}>
          <Text style={styles.detailLabel}>Destination</Text>
          <Text style={styles.detailValue}>Bali, Indonesia</Text>
        </View>
        <View style={styles.detailContainer}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>May 10 - May 17, 2025</Text>
        </View>
        <View style={styles.detailContainer}>
          <Text style={styles.detailLabel}>Meeting Point</Text>
          <Text style={styles.detailValue}>Ngurah Rai International Airport, Bali</Text>
        </View>
        <View style={styles.detailContainer}>
          <Text style={styles.detailLabel}>Budget</Text>
          <Text style={styles.detailValue}>$1,200 USD per person</Text>
        </View>

        <Text style={styles.sectionTitle}>Trip Description</Text>
        <Text style={styles.tripDescription}>
          Planning a week-long trip to Bali exploring beaches, temples, and local culture. Itinerary includes visits to Ubud, Uluwatu Temple, Nusa Penida, and relaxing at beach clubs.
        </Text>

        <TouchableOpacity style={styles.interestButton} onPress={() => Alert.alert('Interested', 'You have shown interest in this trip!')}>
          <Text style={styles.interestButtonText}>I'm Interested</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  creatorContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  creatorName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  creatorRole: {
    fontSize: 14,
    color: '#6C757D',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  tripType: {
    fontSize: 16,
    color: '#0E0F11',
    marginBottom: 5,
  },
  tripActivity: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 20,
  },
  detailContainer: {
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  detailValue: {
    fontSize: 16,
    color: '#0E0F11',
    fontWeight: 'bold',
  },
  tripDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
    marginBottom: 20,
  },
  interestButton: {
    backgroundColor: '#0E0F11',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  interestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TripDetailsScreen;