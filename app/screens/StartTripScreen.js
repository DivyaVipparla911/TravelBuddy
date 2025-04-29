import 'react-native-get-random-values';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator
} from 'react-native';
import { auth, db } from '../config/firebase';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { collection, addDoc } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

const MAPS_KEY = "YOUR_GOOGLE_MAPS_API_KEY";

const StartTripScreen = ({ navigation }) => {
  // State declarations
  const [tripType, setTripType] = useState('');
  const [startingPoint, setStartingPoint] = useState({ 
    address: '', 
    lat: null, 
    lng: null,
    photoUrl: null,
    placeId: null
  });
  const [destination, setDestination] = useState({ 
    address: '', 
    lat: null, 
    lng: null,
    photoUrl: null,
    placeId: null
  });
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [tripDescription, setTripDescription] = useState('');
  const [meetingPoint, setMeetingPoint] = useState({ 
    address: '', 
    lat: null, 
    lng: null,
    photoUrl: null,
    placeId: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Refs for Google Places
  const startingPointRef = useRef(null);
  const destinationRef = useRef(null);
  const meetingPointRef = useRef(null);

  // Debug mount
  useEffect(() => {
    console.log('Component mounted - API Key:', MAPS_KEY ? 'Loaded' : 'Missing');
  }, []);

  // Fetch place photo from Google Places
  const fetchPlacePhoto = async (placeId) => {
    try {
      console.log('Fetching photo for place:', placeId);
      const detailsResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&key=${MAPS_KEY}&fields=name,photo`
      );
      const detailsData = await detailsResponse.json();
      
      if (detailsData.result?.photos?.length > 0) {
        const photoReference = detailsData.result.photos[0].photo_reference;
        return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoReference}&key=${MAPS_KEY}`;
      }
      return null;
    } catch (error) {
      console.error('Photo fetch error:', error);
      return null;
    }
  };

  // Handle place selection
  const handlePlaceSelect = (ref, setState) => async (data, details = null) => {
    if (!details) {
      console.warn('No details for place:', data.description);
      return;
    }
    
    const address = data.description;
    const lat = details.geometry?.location?.lat || null;
    const lng = details.geometry?.location?.lng || null;
    const placeId = details.place_id;
    
    setIsLoading(true);
    try {
      const photoUrl = await fetchPlacePhoto(placeId);
      console.log('Place selected:', { address, photoUrl: !!photoUrl });
      setState({ address, lat, lng, photoUrl, placeId });
      ref.current?.setAddressText(address);
      ref.current?.blur();
    } catch (error) {
      console.error('Place selection error:', error);
      setState({ address, lat, lng, photoUrl: null, placeId });
    } finally {
      setIsLoading(false);
    }
  };

  // Date picker handlers
  const onStartDateChange = (event, selectedDate) => {
    setShowStartPicker(false);
    if (event.type === 'dismissed') return;
    
    if (selectedDate) {
      setStartDate(selectedDate);
      // Auto-adjust end date if earlier than new start date
      if (endDate < selectedDate) {
        setEndDate(selectedDate);
      }
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    setShowEndPicker(false);
    if (event.type === 'dismissed') return;
    
    if (selectedDate) {
      if (selectedDate >= startDate) {
        setEndDate(selectedDate);
      } else {
        Alert.alert("Invalid Date", "End date must be after start date");
      }
    }
  };

  // Format date for display
  const formatDisplayDate = (date) => format(date, 'MMM dd, yyyy');

  // Validate trip dates
  const validateDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      Alert.alert('Invalid Date', 'Start date cannot be in the past');
      return false;
    }
    if (endDate < startDate) {
      Alert.alert('Invalid Date', 'End date must be after start date');
      return false;
    }
    return true;
  };

  // Handle trip submission
  const handleStartTrip = async () => {
    console.log('Attempting to start trip...');
    if (isLoading) return;

    // Validation checks
    if (!tripType || !startingPoint.address || !destination.address || 
        !tripDescription || !meetingPoint.address) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!validateDates()) return;

    setIsLoading(true);
    
    try {
      const tripData = {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        tripType,
        startingPoint: {
          address: startingPoint.address,
          coordinates: new firebase.firestore.GeoPoint(startingPoint.lat, startingPoint.lng),
          photoUrl: startingPoint.photoUrl,
          placeId: startingPoint.placeId
        },
        destination: {
          address: destination.address,
          coordinates: new firebase.firestore.GeoPoint(destination.lat, destination.lng),
          photoUrl: destination.photoUrl,
          placeId: destination.placeId
        },
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        tripDescription,
        meetingPoint: {
          address: meetingPoint.address,
          coordinates: new firebase.firestore.GeoPoint(meetingPoint.lat, meetingPoint.lng),
          photoUrl: meetingPoint.photoUrl,
          placeId: meetingPoint.placeId
        },
        createdAt: new Date().toISOString(),
        status: 'active',
        participants: [auth.currentUser.uid]
      };

      console.log('Creating trip with data:', tripData);
      await addDoc(collection(db, 'Trips'), tripData);
      Alert.alert('Success', 'Trip started successfully!');
      navigation.navigate('Home');
    } catch (error) {
      console.error('Trip creation failed:', error);
      Alert.alert('Error', error.message || 'Failed to start trip');
    } finally {
      setIsLoading(false);
    }
  };

  // Render location picker component
  const renderLocationPicker = (label, ref, setState, photoUrl, caption) => {
    return (
      <>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.autocompleteWrapper}>
          <GooglePlacesAutocomplete
            placeholder={`Enter ${label.toLowerCase()}`}
            onPress={handlePlaceSelect(ref, setState)}
            query={{
              key: MAPS_KEY,
              language: 'en',
              components: 'country:us',
              types: ['geocode', 'establishment']
            }}
            styles={{
              textInput: styles.input,
              listView: styles.dropdown,
              description: styles.placeDescription
            }}
            ref={ref}
            fetchDetails
            enablePoweredByContainer={false}
            debounce={300}
            keepResultsAfterBlur={false}
            listViewDisplayed="auto"
            renderRow={(item) => <Text style={styles.placeItem}>{item.description}</Text>}
          />
        </View>
        {photoUrl && (
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: photoUrl }}
              style={styles.locationPhoto}
              resizeMode="cover"
            />
            <Text style={styles.photoCaption}>{caption}</Text>
          </View>
        )}
      </>
    );
  };

  // Render date picker button
  const DatePickerButton = ({ label, date, onPress }) => {
    return (
      <View style={styles.dateInputWrapper}>
        <Text style={styles.dateLabel}>{label}</Text>
        <TouchableOpacity onPress={onPress} style={styles.dateInput}>
          <Text style={styles.dateText}>{formatDisplayDate(date)}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Start New Trip</Text>

        {isLoading && (
          <View style={styles.overlayLoader}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}

        {/* Trip Type Input */}
        <Text style={styles.label}>Trip Type</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Road Trip, Vacation"
          value={tripType}
          onChangeText={setTripType}
        />

        {/* Location Pickers */}
        {renderLocationPicker(
          'Current Location', 
          startingPointRef, 
          setStartingPoint, 
          startingPoint.photoUrl,
          'Starting Point'
        )}

        {renderLocationPicker(
          'Destination', 
          destinationRef, 
          setDestination, 
          destination.photoUrl,
          'Destination'
        )}

        {/* Date Pickers */}
        <Text style={styles.label}>Trip Dates</Text>
        <View style={styles.dateRow}>
          <DatePickerButton 
            label="Start Date"
            date={startDate}
            onPress={() => setShowStartPicker(true)}
          />
          <DatePickerButton 
            label="End Date"
            date={endDate}
            onPress={() => setShowEndPicker(true)}
          />
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={onStartDateChange}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            minimumDate={startDate}
            onChange={onEndDateChange}
          />
        )}

        {/* Trip Description */}
        <Text style={styles.label}>Trip Description</Text>
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          placeholder="Describe your trip plans, activities, etc."
          value={tripDescription}
          onChangeText={setTripDescription}
          multiline
          numberOfLines={4}
        />

        {/* Meeting Point */}
        {renderLocationPicker(
          'Meeting Point', 
          meetingPointRef, 
          setMeetingPoint, 
          meetingPoint.photoUrl,
          'Meeting Point'
        )}

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.disabledButton]} 
          onPress={handleStartTrip}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Start Trip</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  innerContainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#0E0F11',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 15,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  autocompleteWrapper: {
    height: 70,
    zIndex: 1,
    marginBottom: 10,
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    maxHeight: 200,
    elevation: 3,
    zIndex: 1000,
  },
  placeDescription: {
    fontWeight: 'bold'
  },
  placeItem: {
    padding: 10,
    fontSize: 14,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateInputWrapper: {
    width: '48%',
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  dateInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
  },
  photoContainer: {
    marginBottom: 15,
  },
  locationPhoto: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginTop: 10,
  },
  photoCaption: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#0E0F11',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 25,
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  overlayLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 100,
  },
});

export default StartTripScreen;