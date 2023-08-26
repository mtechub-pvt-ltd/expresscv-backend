const express = require("express");
const userController = require("../../controllers/Users/userController");
const userRouter = express.Router();
const auth = require("../../middlewares/auth")
const multer = require('multer');
const upload = multer({ dest: 'uploads/userProfileImage' });

userRouter.post("/create-user", userController.createUser);
userRouter.post("/sign-in-user", userController.signInUser);
userRouter.get("/get-user-data", userController.getUserData);
userRouter.post("/forget-password", userController.forgetPassword);
userRouter.get("/otp-verification", userController.otpVerification);
userRouter.put("/update-user-info", userController.updateUserInfo);
userRouter.put("/update-password", userController.changePassword);
userRouter.post("/reset-password", userController.resetPassword);
userRouter.post("/uploadUserimage", upload.single('image'), userController.uploadImage);
module.exports =  userRouter;