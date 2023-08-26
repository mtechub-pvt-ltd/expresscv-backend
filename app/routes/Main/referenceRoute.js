

const express = require('express');

const router = express.Router();
const controller = require("../../controllers/Main/referenceController")

router.post("/addReference" , controller.addreference);
router.put("/updateReference" , controller.updatereference);
router.delete("/deleteReference" , controller.deletereference);
router.get("/getAllReferences" , controller.getAllreferences);
router.get("/getReferenceById" , controller.getreferenceById);
router.get("/userReferences" , controller.getreferencesByuser_id);


module.exports = router;
