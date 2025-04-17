import 'react-native-get-random-values';
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
  Platform
} from 'react-native';
import { auth, db } from '../config/firebase';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { collection, addDoc } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';


const MAPS_KEY = "";

const StartTripScreen = ({ navigation }) => {
  const [tripType, setTripType] = useState('');
  const [startingPoint, setStartingPoint] = useState({ address: '', lat: null, lng: null });
  const [destination, setDestination] = useState({ address: '', lat: null, lng: null });
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [tripDescription, setTripDescription] = useState('');
  const [meetingPoint, setMeetingPoint] = useState({ address: '', lat: null, lng: null });
  const [tripPicture, setTripPicture] = useState(null);


  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const startingPointRef = useRef(null);
  const destinationRef = useRef(null);
  const meetingPointRef = useRef(null);

  const handlePlaceSelect = (ref, setState) => (data, details = null) => {
    const address = data.description;
    const lat = details?.geometry?.location?.lat || null;
    const lng = details?.geometry?.location?.lng || null;
    setState({ address, lat, lng });
    ref.current?.setAddressText(address);
    ref.current?.blur();
  };

  const pickTripImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.5,
    });
  
    if (!result.canceled) {
      setTripPicture(result.assets[0].base64); // Store base64 string
      // Or use `result.assets[0].uri` if you prefer URI instead
    }
  };

  const onStartDateChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShowStartPicker(false);
      return;
    }
    setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      if (endDate < selectedDate) setEndDate(selectedDate);
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShowEndPicker(false);
      return;
    }
    setShowEndPicker(false);
    if (selectedDate && selectedDate >= startDate) {
      setEndDate(selectedDate);
    } else if (selectedDate && selectedDate < startDate) {
      Alert.alert("Invalid Date", "End date must be after start date");
    }
  };

  const formatDisplayDate = (date) => format(date, 'MM/dd/yyyy');

  const validateDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
      Alert.alert('Invalid Date', 'Start date cannot be in the past');
      return false;
    }
    if (endDate < startDate) {
      Alert.alert('Invalid Date', 'End date must be after or equal to start date');
      return false;
    }
    return true;
  };

  const handleStartTrip = async () => {
    if (
      !tripType ||
      !startingPoint.address ||
      !destination.address ||
      !tripDescription ||
      !meetingPoint.address ||
      !tripPicture
    ) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!validateDates()) return;

    const user = auth.currentUser;
    try {
      await addDoc(collection(db, 'Trips'), {
        userId: user.uid,
        tripType,
        startingPoint,
        destination,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        tripDescription,
        meetingPoint,
        tripPicture,
      });
      Alert.alert('Success', 'Trip started successfully!');
      navigation.navigate('Home');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to start trip. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Text style={styles.title}>Start New Trip</Text>

          <Text style={styles.label}>Trip Type</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter trip type (e.g., Road Trip)"
            value={tripType}
            onChangeText={setTripType}
          />

          <Text style={styles.label}>Current Location</Text>
          <View style={styles.autocompleteContainer}>
            <GooglePlacesAutocomplete
              placeholder="Enter starting point"
              onPress={handlePlaceSelect(startingPointRef, setStartingPoint)}
              query={{ key: MAPS_KEY, language: 'en', components: 'country:us' }}
              styles={{ textInput: styles.input, listView: styles.listView }}
              ref={startingPointRef}
              fetchDetails
              enablePoweredByContainer={false}
              debounce={300}
            />
          </View>

          <Text style={styles.label}>Destination</Text>
          <View style={styles.autocompleteContainer}>
            <GooglePlacesAutocomplete
              placeholder="Where are you going?"
              onPress={handlePlaceSelect(destinationRef, setDestination)}
              query={{ key: MAPS_KEY, language: 'en', components: 'country:us' }}
              styles={{ textInput: styles.input, listView: styles.listView }}
              ref={destinationRef}
              fetchDetails
              enablePoweredByContainer={false}
            />
          </View>

          <Text style={styles.label}>Trip Dates</Text>
          <View style={styles.dateContainer}>
            <TouchableOpacity onPress={() => setShowStartPicker(true)} style={[styles.input, styles.dateInput]}>
              <Text>{formatDisplayDate(startDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowEndPicker(true)} style={[styles.input, styles.dateInput]}>
              <Text>{formatDisplayDate(endDate)}</Text>
            </TouchableOpacity>
          </View>

          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={onStartDateChange}
              style={{ alignSelf: 'flex-start' }}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={startDate}
              onChange={onEndDateChange}
              style={{ alignSelf: 'flex-start' }}
            />
          )}

          <Text style={styles.label}>Trip Description</Text>
          <TextInput
            style={[styles.input, { height: 100 }]}
            placeholder="Describe your trip plans"
            value={tripDescription}
            onChangeText={setTripDescription}
            multiline
          />

          <TouchableOpacity style={styles.imageButton} onPress={pickTripImage}>
            <Text style={styles.buttonText}>
              {tripPicture ? 'Change Trip Picture' : 'Add Trip Picture'}
            </Text>
          </TouchableOpacity>

          {tripPicture && (
            <Image
              source={{ uri: `data:image/jpeg;base64,${tripPicture}` }}
              style={{ width: '100%', height: 200, borderRadius: 10, marginTop: 10 }}
            />
          )}

          <Text style={styles.label}>Meeting Point</Text>
          <View style={styles.autocompleteContainer}>
            <GooglePlacesAutocomplete
              placeholder="Specify meeting location"
              onPress={handlePlaceSelect(meetingPointRef, setMeetingPoint)}
              query={{ key: MAPS_KEY, language: 'en', components: 'country:us' }}
              styles={{ textInput: styles.input, listView: styles.listView }}
              ref={meetingPointRef}
              fetchDetails
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
    justifyContent: 'center',
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
  imageButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#0E0F11',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 20,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateInput: {
    width: '48%',
    paddingLeft: 10,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#0E0F11',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StartTripScreen;
