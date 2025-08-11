const express = require('express');
const router = express.Router();
const { addForex, getAllForex, getForexById, updateForex, deleteForex } = require('../controllers/forexController');
const { protectAdmin } = require('../middlewares/authMiddleware');

// Create a new Forex entry
router.post('/',protectAdmin, addForex);
// Get all Forex entries
router.get('/', getAllForex);
// Get a single Forex entry by ID
router.get('/:id', getForexById);
// Update a Forex entry by ID
router.put('/:id', updateForex);
// Delete a Forex entry by ID
router.delete('/:id', deleteForex);

module.exports = router;