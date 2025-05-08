import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RecommendationResultsScreen = ({ navigation, route }) => {
  const { recommendations, userQuery } = route.params || {};
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TravelAI</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      {/* User Query Box */}
      <View style={styles.queryContainer}>
        <Text style={styles.queryLabel}>Your Search</Text>
        <Text style={styles.queryText}>{userQuery || "Looking for destinations..."}</Text>
      </View>
      
      {/* Recommendations */}
      <ScrollView style={styles.recommendationsContainer} showsVerticalScrollIndicator={false}>
        {recommendations ? (
          <Text style={styles.recommendationsText}>{recommendations}</Text>
        ) : (
          <View style={styles.noResultsContainer}>
            <Ionicons name="sad-outline" size={48} color="#888" />
            <Text style={styles.noResultsText}>No recommendations found</Text>
            <Text style={styles.noResultsSubText}>Try adjusting your search criteria</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {
    width: 24, // Same as back button for balance
  },
  queryContainer: {
    backgroundColor: 'white',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  queryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  queryText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
  },
  recommendationsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  recommendationsText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 20,
  },
  noResultsContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  noResultsSubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default RecommendationResultsScreen;