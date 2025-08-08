const express = require('express');
const router = express.Router();
const {protectAdmin, protectAgent} = require('../middlewares/authMiddleware');
const {
    getTotalConverted,
    getTotalBusy,
    getTotalCallMeLater,
    getTotalDemo,
    getTotalDnp,
    getTotalDormants,
    getTotalEmails,
    getTotalFutureLeads,
    getTotalNotInterested,
    getTotalOutofStation,
    getTotalWrongNumber

}= require("../controllers/clientsController");


router.get("/converted", protectAdmin, getTotalConverted);
router.get("/buty", protectAdmin, getTotalBusy);
router.get("/callmelater", protectAdmin, getTotalCallMeLater);
router.get("/demo", protectAdmin, getTotalDemo );
router.get("/dnp", protectAdmin, getTotalDnp);
router.get("/dormants", protectAdmin, getTotalDormants);
router.get("emails", protectAdmin, getTotalEmails);
router.get("futureclients", protectAdmin, getTotalFutureLeads);
router.get("/notinterested", protedaend)