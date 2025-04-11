const express = require('express');
const router = express.Router();
const { Anthropic } = require('@anthropic-ai/sdk'); // ✅ Correct import
require('dotenv').config();

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY, // ✅ Make sure this is set in your .env file
});

router.post('/api/recommendations', async (req, res) => {
  try {
    const { budget, travelStyle, climate, destinationType, groupType, duration, activities } = req.body;

    const prompt = `
Recommend 10 travel destinations with the following preferences:
- Budget: $${budget}
- Travel Style: ${travelStyle}
- Climate: ${climate}
- Destination Type: ${destinationType}
- Group Type: ${groupType}
- Duration: ${duration} days
- Activities: ${activities.join(', ')}

For each destination, provide the following in this exact format:
1. [Destination Name, Country]
[One paragraph description about what makes this destination special and suitable for the preferences]
Estimated total cost: $[Cost in USD]
Top 3 activities:
- [Activity 1]
- [Activity 2]
- [Activity 3]

... and so on for all 10 destinations
`;

    const claudeResponse = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      system: "You are a travel assistant providing detailed destination recommendations. Format your response exactly as requested with no additional explanations or comments.",
      messages: [
        { role: "user", content: prompt }
      ]
    });

    const result = claudeResponse?.content?.[0]?.text || claudeResponse?.content || "";

    console.log("Claude Response:", result); // Debug: see full Claude response

    if (!result || result.trim() === "") {
      return res.status(200).json({ recommendation: 'No recommendations found.' });
    }

    res.status(200).json({ recommendation: result });

  } catch (error) {
    console.error('Claude API Error:', error?.response?.data || error.message);
    res.status(500).json({ message: 'Failed to fetch recommendations.' });
  }
});

module.exports = router;
