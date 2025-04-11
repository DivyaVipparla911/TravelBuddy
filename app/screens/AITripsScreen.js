import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Picker,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const BASE_URL = 'http://10.0.0.171:5001'; // Replace with your machine's local IP

const AIRecommendationsScreen = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    budget: '',
    travelStyle: '',
    climate: '',
    destinationType: '',
    groupType: '',
    duration: '',
    activities: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/api/recommendations`, {
        ...form,
        activities: form.activities.split(',').map((a) => a.trim()),
        budget: Number(form.budget),
        duration: Number(form.duration),
      });

      const userQuery = `I'm looking for a ${form.destinationType.toLowerCase()} destination with a budget of $${form.budget}, ${form.travelStyle.toLowerCase()} travel style, in a ${form.climate.toLowerCase()} climate for ${form.duration} days. Activities: ${form.activities}.`;

      navigation.navigate('RecommendationResults', {
        recommendations: response.data.recommendation,
        userQuery,
      });
    } catch (err) {
      console.error(err);
      alert('Failed to fetch recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const travelStyles = ['Select travel style', 'Luxury', 'Budget', 'Adventure', 'Relaxation', 'Cultural'];
  const climates = ['Select climate', 'Tropical', 'Mediterranean', 'Desert', 'Alpine', 'Temperate', 'Arctic'];
  const destinationTypes = ['Select destination', 'Beach', 'City', 'Mountain', 'Countryside', 'Island', 'Historical'];
  const groupTypes = ['Select group type', 'Solo', 'Couple', 'Family', 'Friends', 'Large Group'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Trips</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Text>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.formContainer}>
        <Text style={styles.label}>Budget (USD)</Text>
        <TextInput
          placeholder="Enter your budget"
          value={form.budget}
          onChangeText={(value) => handleChange('budget', value)}
          style={styles.input}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Travel Style</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={form.travelStyle}
            style={styles.picker}
            onValueChange={(value) => handleChange('travelStyle', value)}
          >
            {travelStyles.map((style) => (
              <Picker.Item key={style} label={style} value={style === 'Select travel style' ? '' : style} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Climate</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={form.climate}
            style={styles.picker}
            onValueChange={(value) => handleChange('climate', value)}
          >
            {climates.map((climate) => (
              <Picker.Item key={climate} label={climate} value={climate === 'Select climate' ? '' : climate} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Destination Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={form.destinationType}
            style={styles.picker}
            onValueChange={(value) => handleChange('destinationType', value)}
          >
            {destinationTypes.map((type) => (
              <Picker.Item key={type} label={type} value={type === 'Select destination' ? '' : type} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Group Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={form.groupType}
            style={styles.picker}
            onValueChange={(value) => handleChange('groupType', value)}
          >
            {groupTypes.map((type) => (
              <Picker.Item key={type} label={type} value={type === 'Select group type' ? '' : type} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Duration (days)</Text>
        <TextInput
          placeholder="Enter number of days"
          value={form.duration}
          onChangeText={(value) => handleChange('duration', value)}
          style={styles.input}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Activities</Text>
        <TextInput
          placeholder="Enter preferred activities (comma separated)"
          value={form.activities}
          onChangeText={(value) => handleChange('activities', value)}
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>GET RECOMMENDATIONS</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  settingsButton: { padding: 8 },
  formContainer: { padding: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#333' },
  input: {
    borderWidth: 1, borderColor: '#e1e1e1', borderRadius: 5,
    padding: 12, marginBottom: 16, backgroundColor: '#f9f9f9',
  },
  pickerContainer: {
    borderWidth: 1, borderColor: '#e1e1e1', borderRadius: 5,
    marginBottom: 16, backgroundColor: '#f9f9f9',
  },
  picker: { height: 50 },
  textArea: { height: 100, textAlignVertical: 'top' },
  button: {
    backgroundColor: '#000', padding: 16, borderRadius: 5,
    alignItems: 'center', marginTop: 10, marginBottom: 24,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default AIRecommendationsScreen;
