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
  ActivityIndicator,
  ScrollView,
  FlatList
} from 'react-native';
import { auth, db } from '../config/firebase';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { collection, addDoc, GeoPoint } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

const MAPS_KEY = "AIzaSyDw26V3Tw0g6tXKWX5ruHx8nAl6eJrn7vI";

const StartTripScreen = ({ navigation }) => {
  const [tripType, setTripType] = useState('');
  const [startingPoint, setStartingPoint] = useState({
    address: '',
    lat: null,
    lng: null,
    placeId: null
  });
  const [destination, setDestination] = useState({
    address: '',
    lat: null,
    lng: null,
    photos: [],
    placeId: null
  });
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [tripDescription, setTripDescription] = useState('');
  const [meetingPoint, setMeetingPoint] = useState({
    address: '',
    lat: null,
    lng: null,
    placeId: null
  });
  const [budget, setBudget] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isWebMapsLoaded, setIsWebMapsLoaded] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [photoError, setPhotoError] = useState(null);

  const startingPointRef = useRef(null);
  const destinationRef = useRef(null);
  const meetingPointRef = useRef(null);

  const webAutocompleteRefs = {
    startingPoint: useRef(null),
    destination: useRef(null),
    meetingPoint: useRef(null)
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (window.google && window.google.maps) {
        setIsWebMapsLoaded(true);
        return;
      }

      const scriptId = 'google-maps-script';
      if (document.getElementById(scriptId)) {
        setIsWebMapsLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Google Maps script loaded successfully');
        setIsWebMapsLoaded(true);
      };
      
      script.onerror = () => {
        console.error('Failed to load Google Maps script');
        Alert.alert('Error', 'Failed to load maps functionality');
      };

      document.head.appendChild(script);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && isWebMapsLoaded) {
      try {
        const startInput = document.getElementById('starting-point-input');
        if (startInput && !webAutocompleteRefs.startingPoint.current) {
          webAutocompleteRefs.startingPoint.current = new window.google.maps.places.Autocomplete(
            startInput,
            {
              types: ['geocode', 'establishment'],
              componentRestrictions: { country: 'us' },
              fields: ['formatted_address', 'geometry', 'place_id']
            }
          );
          
          webAutocompleteRefs.startingPoint.current.addListener('place_changed', () => {
            const place = webAutocompleteRefs.startingPoint.current.getPlace();
            if (!place.geometry) return;
            
            handleStartingPointSelect(null, {
              description: place.formatted_address,
              geometry: { location: place.geometry.location },
              place_id: place.place_id
            });
          });
        }

        const destInput = document.getElementById('destination-input');
        if (destInput && !webAutocompleteRefs.destination.current) {
          webAutocompleteRefs.destination.current = new window.google.maps.places.Autocomplete(
            destInput,
            {
              types: ['geocode', 'establishment'],
              componentRestrictions: { country: 'us' },
              fields: ['formatted_address', 'geometry', 'place_id', 'photos', 'name']
            }
          );
          
          webAutocompleteRefs.destination.current.addListener('place_changed', () => {
            const place = webAutocompleteRefs.destination.current.getPlace();
            if (!place.geometry) return;
            
            handleDestinationSelect(null, {
              description: place.formatted_address || place.name,
              geometry: { location: place.geometry.location },
              place_id: place.place_id,
              photos: place.photos || []
            });
          });
        }

        const meetingInput = document.getElementById('meeting-point-input');
        if (meetingInput && !webAutocompleteRefs.meetingPoint.current) {
          webAutocompleteRefs.meetingPoint.current = new window.google.maps.places.Autocomplete(
            meetingInput,
            {
              types: ['geocode', 'establishment'],
              componentRestrictions: { country: 'us' },
              fields: ['formatted_address', 'geometry', 'place_id']
            }
          );
          
          webAutocompleteRefs.meetingPoint.current.addListener('place_changed', () => {
            const place = webAutocompleteRefs.meetingPoint.current.getPlace();
            if (!place.geometry) return;
            
            handleMeetingPointSelect(null, {
              description: place.formatted_address,
              geometry: { location: place.geometry.location },
              place_id: place.place_id
            });
          });
        }
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      }
    }
  }, [isWebMapsLoaded]);

  const formatDisplayDate = (date) => {
    return format(date, 'MMM dd, yyyy');
  };

  const fetchPlacePhotos = async (placeId) => {
    if (!placeId) {
      console.log('No placeId provided for photo fetch');
      return [];
    }
    
    try {
      console.log(`Fetching photos for place: ${placeId}`);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&key=${MAPS_KEY}&fields=name,photos`
      );
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`API returned status: ${data.status}`);
      }
      
      if (data.result?.photos?.length > 0) {
        const photoUrls = data.result.photos
          .slice(0, 5)
          .map(photo => {
            return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${MAPS_KEY}`;
          });
        
        console.log(`Successfully fetched ${photoUrls.length} photos`);
        return photoUrls;
      }
      
      console.log('No photos found for this location');
      return [];
    } catch (error) {
      console.error('Error fetching place photos:', error);
      setPhotoError('Could not load destination photos');
      return [];
    }
  };

  const extractPhotoUrlsFromGooglePhotos = (photos) => {
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return [];
    }
    
    try {
      return photos.slice(0, 5).map(photo => {
        try {
          return photo.getUrl({ maxWidth: 800, maxHeight: 600 });
        } catch (e) {
          console.error('Error getting photo URL:', e);
          return null;
        }
      }).filter(url => url !== null);
    } catch (error) {
      console.error('Error extracting photo URLs:', error);
      setPhotoError('Could not process destination photos');
      return [];
    }
  };

  const handleStartingPointSelect = async (data, details = null) => {
    let address, lat, lng, placeId;
    
    if (Platform.OS === 'web') {
      if (!details) return;
      
      address = details.description;
      lat = details.geometry.location.lat();
      lng = details.geometry.location.lng();
      placeId = details.place_id;
    } else {
      if (!details) {
        console.warn('No details for place:', data?.description);
        return;
      }
      
      address = data.description;
      lat = details.geometry?.location?.lat || null;
      lng = details.geometry?.location?.lng || null;
      placeId = details.place_id;
    }
    
    setStartingPoint({ address, lat, lng, placeId });
    
    if (Platform.OS !== 'web' && startingPointRef.current) {
      startingPointRef.current.setAddressText(address);
      startingPointRef.current.blur();
    }
  };

  const handleDestinationSelect = async (data, details = null) => {
    let address, lat, lng, placeId, photoUrls = [];
    setPhotoError(null);
    
    if (Platform.OS === 'web') {
      if (!details) return;
      
      address = details.description;
      lat = details.geometry.location.lat();
      lng = details.geometry.location.lng();
      placeId = details.place_id;
      
      if (details.photos && Array.isArray(details.photos)) {
        photoUrls = extractPhotoUrlsFromGooglePhotos(details.photos);
      }
    } else {
      if (!details) {
        console.warn('No details for place:', data?.description);
        return;
      }
      
      address = data.description;
      lat = details.geometry?.location?.lat || null;
      lng = details.geometry?.location?.lng || null;
      placeId = details.place_id;
    }
    
    setIsLoading(true);
    
    try {
      if (photoUrls.length === 0 && placeId) {
        photoUrls = await fetchPlacePhotos(placeId);
      }
      
      setDestination({ 
        address, 
        lat, 
        lng, 
        photos: photoUrls,
        placeId 
      });
      
      setSelectedPhotoIndex(0);
      
      if (Platform.OS !== 'web' && destinationRef.current) {
        destinationRef.current.setAddressText(address);
        destinationRef.current.blur();
      }
    } catch (error) {
      console.error('Error handling destination selection:', error);
      setDestination({ 
        address, 
        lat, 
        lng, 
        photos: [],
        placeId 
      });
      setPhotoError('Failed to load destination information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMeetingPointSelect = async (data, details = null) => {
    let address, lat, lng, placeId;
    
    if (Platform.OS === 'web') {
      if (!details) return;
      
      address = details.description;
      lat = details.geometry.location.lat();
      lng = details.geometry.location.lng();
      placeId = details.place_id;
    } else {
      if (!details) {
        console.warn('No details for place:', data?.description);
        return;
      }
      
      address = data.description;
      lat = details.geometry?.location?.lat || null;
      lng = details.geometry?.location?.lng || null;
      placeId = details.place_id;
    }
    
    setMeetingPoint({ address, lat, lng, placeId });
    
    if (Platform.OS !== 'web' && meetingPointRef.current) {
      meetingPointRef.current.setAddressText(address);
      meetingPointRef.current.blur();
    }
  };

  const handleBudgetChange = (text) => {
    // Remove all non-digit characters except decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      // If more than one decimal point, keep only the first
      setBudget(parts[0] + '.' + parts.slice(1).join(''));
    } else {
      setBudget(cleaned);
    }
  };

  const onStartDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || startDate;
    setShowStartPicker(false);
    setStartDate(currentDate);
    
    if (endDate < currentDate) {
      setEndDate(currentDate);
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || endDate;
    setShowEndPicker(false);
    
    if (currentDate >= startDate) {
      setEndDate(currentDate);
    } else {
      Alert.alert("Invalid Date", "End date must be after start date");
    }
  };

  const validateForm = () => {
    if (!tripType.trim()) {
      Alert.alert('Error', 'Please enter a trip type');
      return false;
    }
    
    if (!startingPoint.address.trim()) {
      Alert.alert('Error', 'Please select a starting point');
      return false;
    }
    
    if (!destination.address.trim()) {
      Alert.alert('Error', 'Please select a destination');
      return false;
    }
    
    if (!tripDescription.trim()) {
      Alert.alert('Error', 'Please enter a trip description');
      return false;
    }
    
    if (!meetingPoint.address.trim()) {
      Alert.alert('Error', 'Please select a meeting point');
      return false;
    }
    
    if (!startingPoint.lat || !startingPoint.lng) {
      Alert.alert('Error', 'Invalid starting point coordinates');
      return false;
    }
    
    if (!destination.lat || !destination.lng) {
      Alert.alert('Error', 'Invalid destination coordinates');
      return false;
    }
    
    if (!meetingPoint.lat || !meetingPoint.lng) {
      Alert.alert('Error', 'Invalid meeting point coordinates');
      return false;
    }
    
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
    
    if (!budget.trim()) {
      Alert.alert('Error', 'Please enter a budget amount');
      return false;
    }
    
    const budgetNumber = parseFloat(budget);
    if (isNaN(budgetNumber)) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return false;
    }
    
    if (budgetNumber <= 0) {
      Alert.alert('Error', 'Budget must be greater than 0');
      return false;
    }
    
    return true;
  };

  const handleStartTrip = async () => {
    if (isLoading) return;
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const tripData = {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        userName: auth.currentUser.displayName|| auth.currentUser.email.split('@')[0],
        tripType: tripType.trim(),
        startingPoint: {
          address: startingPoint.address,
          coordinates: new GeoPoint(startingPoint.lat, startingPoint.lng),
          placeId: startingPoint.placeId
        },
        destination: {
          address: destination.address,
          coordinates: new GeoPoint(destination.lat, destination.lng),
          photos: destination.photos,
          placeId: destination.placeId
        },
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        tripDescription: tripDescription.trim(),
        meetingPoint: {
          address: meetingPoint.address,
          coordinates: new GeoPoint(meetingPoint.lat, meetingPoint.lng),
          placeId: meetingPoint.placeId
        },
        budget: parseFloat(budget),
        createdAt: new Date().toISOString(),
        status: 'active',
        participants: [auth.currentUser.email],
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'Trips'), tripData);
      console.log('Trip created with ID:', docRef.id);
      
      Alert.alert('Success', 'Trip started successfully!');
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error creating trip:', error);
      Alert.alert('Error', 'Failed to start trip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderLocationInput = (label, key, value, onChangeText) => {
    return (
      <>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          id={`${key}-input`}
          style={styles.input}
          placeholder={`Enter ${label.toLowerCase()}`}
          value={value}
          onChangeText={onChangeText}
        />
      </>
    );
  };

  const renderMobileAutocomplete = (label, ref, onPress) => {
    return (
      <>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.autocompleteWrapper}>
          <GooglePlacesAutocomplete
            placeholder={`Enter ${label.toLowerCase()}`}
            onPress={onPress}
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
      </>
    );
  };

  const DatePickerButton = ({ label, date, onPress }) => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.dateInputWrapper}>
          <Text style={styles.dateLabel}>{label}</Text>
          <input
            type="date"
            value={date.toISOString().split('T')[0]}
            onChange={(e) => {
              const newDate = new Date(e.target.value);
              if (label === 'Start Date') {
                setStartDate(newDate);
                if (endDate < newDate) {
                  setEndDate(newDate);
                }
              } else {
                if (newDate >= startDate) {
                  setEndDate(newDate);
                } else {
                  Alert.alert("Invalid Date", "End date must be after start date");
                }
              }
            }}
            min={label === 'Start Date' 
              ? new Date().toISOString().split('T')[0] 
              : startDate.toISOString().split('T')[0]}
            style={styles.webDateInput}
          />
        </View>
      );
    }

    return (
      <View style={styles.dateInputWrapper}>
        <Text style={styles.dateLabel}>{label}</Text>
        <TouchableOpacity onPress={onPress} style={styles.dateInput}>
          <Text style={styles.dateText}>{formatDisplayDate(date)}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDestinationPhotos = () => {
    if (photoError) {
      return (
        <View style={styles.photoContainer}>
          <View style={styles.placeholderPhoto}>
            <Text style={styles.errorText}>{photoError}</Text>
          </View>
          <Text style={styles.photoCaption}>Destination Preview</Text>
        </View>
      );
    }

    if (!destination.photos || destination.photos.length === 0) {
      return (
        <View style={styles.photoContainer}>
          <View style={styles.placeholderPhoto}>
            <Text style={styles.placeholderText}>No photos available</Text>
          </View>
          <Text style={styles.photoCaption}>Destination Preview</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.photoContainer}>
        <Image
          source={{ uri: destination.photos[selectedPhotoIndex] }}
          style={styles.locationPhoto}
          resizeMode="cover"
          onError={() => setPhotoError('Failed to load photo')}
        />
        
        {destination.photos.length > 1 && (
          <>
            <View style={styles.photoCounter}>
              <Text style={styles.photoCounterText}>
                {selectedPhotoIndex + 1} / {destination.photos.length}
              </Text>
            </View>
            
            <FlatList
              data={destination.photos}
              keyExtractor={(item, index) => `photo-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailsContainer}
              renderItem={({ item, index }) => (
                <TouchableOpacity 
                  onPress={() => setSelectedPhotoIndex(index)}
                  style={[
                    styles.thumbnailWrapper,
                    selectedPhotoIndex === index && styles.selectedThumbnail
                  ]}
                >
                  <Image
                    source={{ uri: item }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                    onError={() => console.log(`Thumbnail ${index} failed to load`)}
                  />
                </TouchableOpacity>
              )}
            />
          </>
        )}
        
        <Text style={styles.photoCaption}>Destination Preview</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.innerContainer}>
          <Text style={styles.title}>Start New Trip</Text>

          {isLoading && (
            <View style={styles.overlayLoader}>
              <ActivityIndicator size="large" color="#0000ff" />
            </View>
          )}

          <Text style={styles.label}>Trip Type</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Road Trip, Vacation"
            value={tripType}
            onChangeText={setTripType}
          />

          {Platform.OS === 'web' ? (
            renderLocationInput(
              'Starting Point',
              'starting-point',
              startingPoint.address,
              (text) => setStartingPoint(prev => ({ ...prev, address: text })))
          ) : (
            renderMobileAutocomplete(
              'Starting Point',
              startingPointRef,
              handleStartingPointSelect
            )
          )}

          {Platform.OS === 'web' ? (
            <>
              {renderLocationInput(
                'Destination',
                'destination',
                destination.address,
                (text) => setDestination(prev => ({ ...prev, address: text }))
              )}
              {renderDestinationPhotos()}
            </>
          ) : (
            <>
              {renderMobileAutocomplete(
                'Destination',
                destinationRef,
                handleDestinationSelect
              )}
              {renderDestinationPhotos()}
            </>
          )}

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

          {Platform.OS !== 'web' && showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={onStartDateChange}
            />
          )}

          {Platform.OS !== 'web' && showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              minimumDate={startDate}
              onChange={onEndDateChange}
            />
          )}

          <Text style={styles.label}>Trip Description</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Describe your trip plans, activities, etc."
            value={tripDescription}
            onChangeText={setTripDescription}
            multiline
            numberOfLines={4}
          />

          {Platform.OS === 'web' ? (
            renderLocationInput(
              'Meeting Point',
              'meeting-point',
              meetingPoint.address,
              (text) => setMeetingPoint(prev => ({ ...prev, address: text })))
          ) : (
            renderMobileAutocomplete(
              'Meeting Point',
              meetingPointRef,
              handleMeetingPointSelect
            )
          )}

          <Text style={styles.label}>Budget ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter estimated budget for the trip"
            value={budget}
            onChangeText={handleBudgetChange}
            keyboardType="numeric"
          />

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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  innerContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#2c3e50',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 20,
    color: '#34495e',
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
    color: '#2c3e50',
  },
  descriptionInput: {
    height: 120,
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
    borderRadius: 8,
    maxHeight: 200,
    elevation: 3,
    zIndex: 1000,
  },
  placeDescription: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  placeItem: {
    padding: 12,
    fontSize: 14,
    color: '#34495e',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateInputWrapper: {
    width: '48%',
  },
  dateLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 6,
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
    color: '#2c3e50',
  },
  webDateInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#2c3e50',
  },
  photoContainer: {
    marginVertical: 15,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  locationPhoto: {
    width: '100%',
    height: 200,
  },
  placeholderPhoto: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eaeaea',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  placeholderText: {
    color: '#7f8c8d',
    fontSize: 16,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  photoCounter: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  photoCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  thumbnailsContainer: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  thumbnailWrapper: {
    marginHorizontal: 5,
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedThumbnail: {
    borderColor: '#3498db',
  },
  thumbnail: {
    width: 60,
    height: 40,
  },
  photoCaption: {
    marginTop: 8,
    marginBottom: 5,
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  overlayLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    zIndex: 100,
  },
});

export default StartTripScreen;