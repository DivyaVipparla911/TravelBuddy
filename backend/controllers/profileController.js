const Profile = require('../models/Profile');

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.params.userId });
        if (!profile) return res.status(404).json({ message: "Profile not found" });
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create user profile
exports.createProfile = async (req, res) => {
    try {
        const profile = new Profile(req.body);
        await profile.save();
        res.status(201).json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const profile = await Profile.findOneAndUpdate(
            { userId: req.params.userId },
            req.body,
            { new: true }
        );
        if (!profile) return res.status(404).json({ message: "Profile not found" });
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
