const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middlewares/authMiddleware');
const {
    getTotalBusy, 
    getTotalConverted,
    getTotalDnp,
    getTotalDemo
} = require('../controllers/dashboardController');

router.get('/total-busy', protectAdmin, getTotalBusy);
router.get('/total-converted', protectAdmin, getTotalConverted);
router.get('/total-dnp', protectAdmin,getTotalDnp );
router.get('/total-demo', protectAdmin, getTotalDemo)


module.exports = router;