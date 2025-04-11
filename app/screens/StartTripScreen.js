import 'react-native-get-random-values'; // Required for crypto support
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const StartTripScreen = ({ navigation }) => {
  const [tripType, setTripType] = useState('');
  const [startingPoint, setStartingPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [flexibleDates, setFlexibleDates] = useState(false);
  const [tripDescription, setTripDescription] = useState('');
  const [meetingPoint, setMeetingPoint] = useState('');

  const startingPointRef = useRef(null);
  const destinationRef = useRef(null);
  const meetingPointRef = useRef(null);

  const handlePlaceSelect = (ref, setState) => (data, details = null) => {
    setState(data.description);
    ref.current?.setAddressText(data.description);
    ref.current?.blur();
  };

  const handleStartTrip = async () => {
    if (
      !tripType ||
      !startingPoint ||
      !destination ||
      !startDate ||
      !endDate ||
      !tripDescription ||
      !meetingPoint
    ) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      Alert.alert('Success', 'Trip started successfully!');
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error saving trip:', error);
      Alert.alert('Error', 'Failed to start trip. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Text style={styles.title}>Start New Trip</Text>

          <Text style={styles.label}>Trip Type</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter trip type (e.g., Road Trip, Beach Vacation)"
            value={tripType}
            onChangeText={setTripType}
          />

          <Text style={styles.label}>Current Location</Text>
          <View style={styles.autocompleteContainer}>
            <GooglePlacesAutocomplete
              placeholder="Enter starting point"
              onPress={handlePlaceSelect(startingPointRef, setStartingPoint)}
              query={{
                key: 'AIzaSyDw26V3Tw0g6tXKWX5ruHx8nAl6eJrn7vI',
                language: 'en',
                components: 'country:us',
              }}
              styles={{
                textInput: styles.input,
                listView: styles.listView,
              }}
              ref={startingPointRef}
              enablePoweredByContainer={false}
              fetchDetails={true}
              debounce={300}
            />
          </View>

          <Text style={styles.label}>Destination</Text>
          <View style={styles.autocompleteContainer}>
            <GooglePlacesAutocomplete
              placeholder="Where are you going?"
              onPress={handlePlaceSelect(destinationRef, setDestination)}
              query={{
                key: 'AIzaSyDw26V3Tw0g6tXKWX5ruHx8nAl6eJrn7vI',
                language: 'en',
                components: 'country:us',
              }}
              styles={{
                textInput: styles.input,
                listView: styles.listView,
              }}
              ref={destinationRef}
              enablePoweredByContainer={false}
              fetchDetails={true}
            />
          </View>

          <Text style={styles.label}>Trip Dates</Text>
          <View style={styles.dateContainer}>
            <TextInput
              style={[styles.input, styles.dateInput]}
              placeholder="Start Date (mm/dd/yyyy)"
              value={startDate}
              onChangeText={setStartDate}
            />
            <TextInput
              style={[styles.input, styles.dateInput]}
              placeholder="End Date (mm/dd/yyyy)"
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>

          <View style={styles.flexibleDatesContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setFlexibleDates(!flexibleDates)}
            >
              <Text style={styles.checkboxText}>{flexibleDates ? '✓' : ''}</Text>
            </TouchableOpacity>
            <Text style={styles.flexibleDatesText}>Flexible Dates</Text>
          </View>

          <Text style={styles.label}>Trip Description</Text>
          <TextInput
            style={[styles.input, { height: 100 }]}
            placeholder="Describe your trip plans"
            value={tripDescription}
            onChangeText={setTripDescription}
            multiline
          />

          <Text style={styles.label}>Meeting Point</Text>
          <View style={styles.autocompleteContainer}>
            <GooglePlacesAutocomplete
              placeholder="Specify meeting location"
              onPress={handlePlaceSelect(meetingPointRef, setMeetingPoint)}
              query={{
                key: 'AIzaSyDw26V3Tw0g6tXKWX5ruHx8nAl6eJrn7vI',
                language: 'en',
                components: 'country:us',
              }}
              styles={{
                textInput: styles.input,
                listView: styles.listView,
              }}
              ref={meetingPointRef}
              enablePoweredByContainer={false}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleStartTrip}>
            <Text style={styles.buttonText}>Start Trip</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  autocompleteContainer: {
    height: 100,
    zIndex: 1,
    marginBottom: 20,
  },
  listView: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 5,
    maxHeight: 200,
    elevation: 3,
    zIndex: 1000,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInput: {
    width: '48%',
  },
  flexibleDatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxText: {
    fontSize: 14,
  },
  flexibleDatesText: {
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#0E0F11',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StartTripScreen;
