const hairStylesUpload = require("../../middlewares/imageUpload")
const {pool}= require('../../config/db.config')
exports.uploadImage = async (req,res)=>{
  const client = await pool.connect();
    try{
        hairStylesUpload(req, res, function (err) {
   
            if (err) {
                res.status(400).json({
                    message: "Failed to upload image",
                    status:false,
                    error:err.message,
                  });
            } 
            else {
              res.status(200).json({
                message: "Image uploaded in particular folder",
                image_url : req.file.path,
                status:true
              });
            }
          });
    }
    catch(err){
        res.json(err)
    }

finally {
  client.release();
}
}

