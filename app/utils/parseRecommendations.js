/**
 * Parses the raw text from Claude API into structured recommendation data
 * @param {string} rawText - The raw text response from Claude API
 * @returns {Array} - Array of structured destination objects
 */
export const parseRecommendations = (rawText) => {
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
        
        // Ensure we have at least 3 tags but no more than 4
        if (tags.length < 3) {
          const defaultTags = ['Popular', 'Featured', 'Recommended'];
          for (const tag of defaultTags) {
            if (tags.length < 3 && !tags.includes(tag)) {
              tags.push(tag);
            }
          }
        }
        
        // Limit to max 4 tags
        const finalTags = tags.slice(0, 4);
        
        // Add the parsed destination to our array
        destinations.push({
          name,
          description: description.substring(0, 120) + (description.length > 120 ? '...' : ''),
          tags: finalTags,
          startingPrice: startingPrice || 599, // Fallback price if none found
          activities
        });
      });
      
      return destinations;
    } catch (error) {
      console.error('Error parsing recommendations:', error);
      return [];
    }
  };