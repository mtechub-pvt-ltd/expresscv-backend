
const express = require('express');

const router = express.Router();
const controller = require("../../controllers/Main/interestController")

router.post("/addInterest" , controller.addInterest);
router.put("/updateInterest" , controller.updateinterest);
router.delete("/deleteInterest" , controller.deleteinterest);
router.get("/getAllInterests" , controller.getAllinterests);
router.get("/getInterestById" , controller.getinterestById);
router.get("/userInterests" , controller.getInterestsByuser_id);


module.exports = router;
