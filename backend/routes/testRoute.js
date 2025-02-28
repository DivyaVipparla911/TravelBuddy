const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile'); // Adjust path if needed

// Test Route - Create a Profile
router.post('/test-profile', async (req, res) => {
    try {
        const profile = new Profile(req.body);
        await profile.save();
        res.status(201).json({ message: "✅ Test profile created successfully!", profile });
    } catch (error) {
        res.status(500).json({ message: "❌ Error creating profile", error });
    }
});

module.exports = router;
