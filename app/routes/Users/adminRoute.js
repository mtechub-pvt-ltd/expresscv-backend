const express = require('express');

const router = express.Router();
const controller = require("../../controllers/Users/adminController")


router.post("/register_admin" , controller.registerAdmin);
router.post("/login" , controller.login);
router.get("/view_profile" , controller.viewAdminProfile);
router.put("/updateProfile" , controller.updateProfile);
router.get("/getAllAdmins" , controller.getAllAdmins);
router.put("/updatePassword", controller.passwordUpdate);


module.exports = router;