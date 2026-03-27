const express = require('express');
const router = express.Router();
const { getDoctorProfile, updateAvailability } = require('../controllers/doctorController');

// TODO: Import Binoth's authentication middleware here later
// const { verifyToken } = require('../middleware/authMiddleware');

// Route to get a doctor's profile
router.get('/:id', getDoctorProfile);

// Route to update availability (Later, you will add verifyToken here to protect this route)
router.put('/:id/availability', updateAvailability);

module.exports = router;