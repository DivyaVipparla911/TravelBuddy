const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController'); // Ensure correct import

// Define routes
router.get('/:userId', profileController.getProfile);
router.post('/', profileController.createProfile);
router.put('/:userId', profileController.updateProfile);

module.exports = router; // Ensure correct export
