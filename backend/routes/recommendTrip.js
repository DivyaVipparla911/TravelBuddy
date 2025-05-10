const express = require('express');
const router = express.Router();
const { Anthropic } = require('@anthropic-ai/sdk');
require('dotenv').config();

// Initialize Claude client with timeout
const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
  timeout: 30000 // 30 seconds
});

// Cache for storing frequent queries (simple in-memory cache)
const recommendationCache = new Map();

// Predefined error messages
const ERROR_MESSAGES = {
  INVALID_INPUT: 'Please provide all required travel preferences',
  API_FAILURE: 'Failed to generate recommendations',
  EMPTY_RESPONSE: 'No recommendations found for your criteria'
};

router.post('/api/recommendations', async (req, res) => {
  try {
    // Validate input
    const { budget, travelStyle, climate, destinationType, groupType, duration, activities } = req.body;
    
    if (!budget || !travelStyle || !activities) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_INPUT });
    }

    // Create cache key
    const cacheKey = JSON.stringify(req.body);
    
    // Check cache first
    if (recommendationCache.has(cacheKey)) {
      return res.status(200).json({ 
        recommendation: recommendationCache.get(cacheKey),
        cached: true 
      });
    }

    // Build dynamic prompt
    const prompt = buildPrompt({
      budget,
      travelStyle,
      climate,
      destinationType,
      groupType,
      duration,
      activities
    });

    // Get Claude response with retry logic
    const claudeResponse = await withRetry(() => 
      client.messages.create({
        model: "claude-3-haiku-20240307", // Fastest model
        max_tokens: 4000, // Reduced from 6000 for better performance
        temperature: 0.7, // For more creative responses
        system: "You are an expert travel assistant...",
        messages: [{ role: "user", content: prompt }]
      }),
      3 // Retry attempts
    );

    // Process response
    const result = processClaudeResponse(claudeResponse);
    
    if (!result) {
      return res.status(200).json({ recommendation: ERROR_MESSAGES.EMPTY_RESPONSE });
    }

    // Cache successful response
    recommendationCache.set(cacheKey, result);

    res.status(200).json({ recommendation: result });

  } catch (error) {
    console.error('Recommendation Error:', error);
    res.status(500).json({ 
      error: ERROR_MESSAGES.API_FAILURE,
      details: error.message 
    });
  }
});

// Helper Functions

function buildPrompt(params) {
  return `
  Recommend 5 travel destinations with these preferences:
  - Budget: $${params.budget}
  - Style: ${params.travelStyle}
  - Climate: ${params.climate || 'any'}
  - Type: ${params.destinationType || 'any'}
  - Group: ${params.groupType || 'solo'}
  - Duration: ${params.duration || 7} days
  - Activities: ${params.activities.join(', ')}

  For each destination provide:
  1. [Name, Country]
  [1-paragraph description]
  Estimated cost: $[range]
  Top 3 activities:
  - [Activity 1]
  - [Activity 2]
  - [Activity 3]
  Sample ${params.duration || 7}-day itinerary
  `;
}

function processClaudeResponse(response) {
  try {
    return response?.content?.[0]?.text?.trim() || '';
  } catch {
    return '';
  }
}

async function withRetry(operation, maxRetries) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  
  throw lastError;
}

module.exports = router;