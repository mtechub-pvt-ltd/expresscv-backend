const express = require('express');

const router = express.Router();
const controller = require("../../controllers/Main/blogController")
const multer = require('multer');
const upload = multer({ dest: 'uploads/blogImages' });

router.post("/addBlog" , upload.single('image'), controller.addBlog);
router.put("/updateBlog" , controller.updateBlog);
router.delete("/deleteBlog" , controller.deleteBlog);
router.get("/getAllBlogs" , controller.getAllBlogs);
router.get("/getBlogById" , controller.getBlogById);
router.post("/addSubHeading" , controller.addSubHeadings);

module.exports = router;