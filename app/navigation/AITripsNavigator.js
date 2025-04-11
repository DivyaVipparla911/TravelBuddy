import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AITripsScreen from '../screens/AITripsScreen';
import RecommendationResultsScreen from '../screens/RecommendationResultsScreen';

const AIStack = createStackNavigator();

const AITripsNavigator = () => {
  return (
    <AIStack.Navigator screenOptions={{ headerShown: false }}>
      <AIStack.Screen name="AITripsMain" component={AITripsScreen} />
      <AIStack.Screen name="RecommendationResults" component={RecommendationResultsScreen} />
    </AIStack.Navigator>
  );
};

export default AITripsNavigator;