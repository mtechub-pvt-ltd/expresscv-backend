const express = require('express');

const router = express.Router();
const controller = require("../../controllers/Main/faqsController")

router.post("/addFaq" , controller.addFaq);
router.get("/getAllFaqs" , controller.getAllFaqs);
router.get("/viewFaq" , controller.viewFaq);
router.put("/updateFaq" , controller.updateFaq);
router.delete("/DeleteFaq" , controller.DeleteFaq);


module.exports = router;
