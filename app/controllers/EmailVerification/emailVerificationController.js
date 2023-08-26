const { pool } = require("../../config/db.config");
const nodemailer = require("nodemailer");;
const emailOTPBody = require("../../utils/emailOTPBody")


const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    },

});



exports.sendEmail = async (req, res) => {
    const client = await pool.connect();

    
    try {
        const email = req.body.email;

        const found_email_query = 'SELECT * FROM users WHERE email = $1'
        const foundResult = await pool.query(found_email_query, [email])


        if (foundResult.rowCount > 0) {
            sendOTPVerificationEmail(foundResult.rows[0].email, res)
        }
        else {
            const found_email_query = 'SELECT * FROM admins WHERE email = $1'
            const foundResult = await pool.query(found_email_query, [email])

            if (foundResult) {
                sendOTPVerificationEmail(foundResult.rows[0].email, res)
            }
            else {
                    res.json({
                        message: "This email is not Registered with this app , please add valid email",
                        status: false
                    })
            
            }
        }
        
    }
    catch (err) {
        res.json({
            message: "Error Occurred",
            status: false,
            error: err.message
        })
    }

finally {
    client.release();
  }
}

exports.verifyOTP = async (req,res)=>{
    const client = await pool.connect();
    try{
        const email = req.body.email;
        const otp = req.body.otp;

        const found_email_query = 'SELECT * FROM otpStored WHERE email = $1 AND otp = $2'
        const result = await pool.query(found_email_query, [email , otp])

        if(result.rowCount>0){
            res.json({
                message: "OTP verified",
                status: true,
                result: result.rows[0]
            })
        }
        else{
            res.json({
                message : "Verification Rejected",
                status:false
            })
        }
    }
    catch(err){
        res.status(500).json({
          message: `Internal server error occurred`,
          success:false,
        });
      }

finally {
    client.release();
  }
}


const sendOTPVerificationEmail = async (email, res) => {
    try {
        let result;
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`

        
        const found_email_query = 'SELECT * FROM otpStored WHERE email = $1'
        const foundStoredOtp = await pool.query(found_email_query, [email])


        if (foundStoredOtp.rowCount ==0) {
            const query = 'INSERT INTO otpStored (email , otp) VALUES ($1 , $2) RETURNING*'
            result = await pool.query(query, [email, otp])
            result = result.rows[0]
        }

        if (foundStoredOtp.rowCount > 0) {
            let query = 'UPDATE otpStored SET otp = $1  WHERE email = $2 RETURNING*'
            let values = [
                otp ? otp : null,
                email ? email : null
            ]
            result = await pool.query(query , values);
            result = result.rows[0]
        }

        
        let sendEmailResponse = await transporter.sendMail({
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: 'Verify Account',
            html: emailOTPBody(otp, "Express-Cv", "#0492C2")

        });


        if (sendEmailResponse.accepted.length > 0) {
            res.status(200).json({
                message: `Sent a verification email to ${email}`,
                success: true,
                data: result
            });
        }
        else {
            res.status(404).json({
                message: `Could not send email`,
                success: false,
            });
        }



    }
    catch (err) {
        res.status(500).json({
            message: `Internal server error occurred`,
            success: false,
        });
    }
}

