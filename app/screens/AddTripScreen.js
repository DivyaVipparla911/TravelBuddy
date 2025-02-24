import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AddTripScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Add Trip Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
  },
});

export default AddTripScreen;