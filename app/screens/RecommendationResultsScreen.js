import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define the parsing function directly in this file
const parseRecommendations = (rawText) => {
  // Initialize array to store parsed destinations
  const destinations = [];
  
  // Check if we received a valid response
  if (!rawText || typeof rawText !== 'string') {
    return destinations;
  }
  
  try {
    // Split the text by destination (assuming each starts with name followed by description)
    const destinationSections = rawText.split(/\d+\.\s+/).filter(Boolean);
    
    destinationSections.forEach(section => {
      // Extract destination name (first line or before first paragraph break)
      const nameMatch = section.match(/^([^:\n]+)/);
      const name = nameMatch ? nameMatch[1].trim() : 'Unknown Destination';
      
      // Extract description (content before "Cost" or "Activities")
      let description = '';
      const descriptionMatch = section.match(/^[^:\n]+(?::\s*|\n\s*)([\s\S]+?)(?=\n\s*(?:Estimated|Cost|Top|Activities))/i);
      if (descriptionMatch) {
        description = descriptionMatch[1].trim();
      }
      
      // Extract cost information
      let startingPrice = 0;
      const costMatch = section.match(/(?:Estimated total cost|Cost):\s*\$?([\d,]+)/i);
      if (costMatch) {
        startingPrice = parseInt(costMatch[1].replace(/,/g, ''));
      }
      
      // Extract activities
      const activities = [];
      const activitiesMatch = section.match(/(?:Top \d+ activities|Activities):\s*([\s\S]+?)(?=\n\s*(?:\d+\.|$))/i);
      if (activitiesMatch) {
        const activitiesText = activitiesMatch[1];
        const activityItems = activitiesText.split(/\n\s*-\s*|\n\s*•\s*/).filter(Boolean);
        activities.push(...activityItems.map(activity => activity.trim()));
      }
      
      // Generate tags based on content
      const tags = [];
      // Add budget tag
      if (startingPrice < 800) tags.push('Budget');
      else if (startingPrice < 1500) tags.push('Mid-range');
      else tags.push('Luxury');
      
      // Add activity-based tags
      if (section.toLowerCase().includes('beach')) tags.push('Beach');
      if (section.toLowerCase().includes('nightlife') || section.toLowerCase().includes('party')) tags.push('Nightlife');
      if (section.toLowerCase().includes('culture') || section.toLowerCase().includes('historical')) tags.push('Culture');
      if (section.toLowerCase().includes('food') || section.toLowerCase().includes('cuisine')) tags.push('Food');
      if (section.toLowerCase().includes('adventure') || section.toLowerCase().includes('hiking')) tags.push('Adventure');
      
      // Ensure we have at least 2 tags but no more than 3 (reducing from 3-4)
      if (tags.length < 2) {
        const defaultTags = ['Popular', 'Featured', 'Recommended'];
        for (const tag of defaultTags) {
          if (tags.length < 2 && !tags.includes(tag)) {
            tags.push(tag);
          }
        }
      }
      
      // Limit to max 3 tags
      const finalTags = tags.slice(0, 3);
      
      // Add the parsed destination to our array
      destinations.push({
        name,
        description: description.length > 150 ? description.substring(0, 147) + '...' : description,
        tags: finalTags,
        startingPrice: startingPrice || 599, // Fallback price if none found
        activities: activities.slice(0, 3) // Limit to top 3 activities
      });
    });
    
    return destinations;
  } catch (error) {
    console.error('Error parsing recommendations:', error);
    return [];
  }
};

const RecommendationResultsScreen = ({ route, navigation }) => {
  // Get recommendations from route params
  const { recommendations, userQuery } = route.params || {};
  
  // Parse recommendations data from Claude API response
  const parsedRecommendations = recommendations ? 
    parseRecommendations(recommendations) : 
    [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TravelAI</Text>
        <View style={styles.iconPlaceholder} />
      </View>
      
      {/* User Query Box */}
      <View style={styles.queryContainer}>
        <Text style={styles.queryLabel}>Your Search</Text>
        <Text style={styles.queryText}>{userQuery || "Looking for destinations..."}</Text>
      </View>
      
      {/* Recommendations */}
      <ScrollView style={styles.recommendationsContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.resultsTitle}>Recommendations</Text>
        
        {parsedRecommendations.length > 0 ? (
          parsedRecommendations.map((destination, index) => (
            <View key={index} style={styles.destinationCard}>
              <Text style={styles.destinationName}>{destination.name}</Text>
              
              {/* Tags */}
              <View style={styles.tagsContainer}>
                {destination.tags.map((tag, tagIndex) => (
                  <View key={tagIndex} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
              
              <Text style={styles.destinationDescription}>{destination.description}</Text>
              
              {/* Cost */}
              <View style={styles.costContainer}>
                <Text style={styles.costValue}>${destination.startingPrice}</Text>
                <Text style={styles.costLabel}>estimated total</Text>
              </View>
              
              {/* Activities */}
              {destination.activities && destination.activities.length > 0 && (
                <View style={styles.activitiesContainer}>
                  <Text style={styles.activitiesTitle}>Top Activities:</Text>
                  {destination.activities.map((activity, actIndex) => (
                    <Text key={actIndex} style={styles.activityItem}>• {activity}</Text>
                  ))}
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No recommendations found. Please try again.</Text>
          </View>
        )}
        
        {/* Bottom padding for scrolling */}
        <View style={{ height: 30 }} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  iconPlaceholder: {
    width: 24,
  },
  queryContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
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
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  recommendationsContainer: {
    flex: 1,
  },
  destinationCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  destinationName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#222',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#444',
    fontWeight: '500',
  },
  destinationDescription: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 14,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  costValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginRight: 4,
  },
  costLabel: {
    fontSize: 12,
    color: '#666',
  },
  activitiesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  activitiesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#444',
  },
  activityItem: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
    lineHeight: 18,
  },
  noResultsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  }
});

export default RecommendationResultsScreen;