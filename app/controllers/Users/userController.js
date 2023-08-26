const { pool } = require('../../config/db.config')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const nodemailer = require("nodemailer");;
const emailOTPBody = require("../../utils/emailOTPBody")

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    },

});
exports.createUser = async (req, res) => {
    // connect to database
    const db = await pool.connect();
    try {
        // destructure from request body

        const { user_name, email, password } = req.body;
        // setting up query to insert new user in db
        if (!user_name || !email || !password) {
            return res.status(401).json({
                status: false,
                message: "User registeration failed because user_name, email and password are required"
            });
        }

        // checking if the user with this email already exsists
        const query1 = 'SELECT * FROM users WHERE email = $1'
        const checkUser = await db.query(query1, [
            email,
        ]);
        if (checkUser.rows.length > 0) {
            return res.status(401).json({
                status: false,
                message: "User registeration failed because email already exsists"
            });
        }
        const query = 'INSERT INTO users (user_name, email, password) VALUES ($1, $2, $3) RETURNING *';

        // generating salt to hash the password
        const salt = await bcrypt.genSalt(10);

        // password hashing
        const hashPassword = await bcrypt.hash(password, salt);

        // saving data in db
        const addUser = await db.query(query, [
            user_name,
            email,
            hashPassword
        ]);
        // if data is saved response sent with status true
        if (addUser.rows) {
            const token = jwt.sign({ id: addUser.rows[0].user_id }, process.env.TOKEN);
            res.status(200).json({
                status: true,
                findUsers: addUser.rows[0],
                jwt_token: token
            })
        }
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Internal server error"
        });
    }
}
exports.signInUser = async (req, res) => {
    // Connecting to db
    const db = await pool.connect();
    try {
        // destructure from request body
        const { email, password } = req.body;

        // check if the data is recieved
        if (!email || !password) {
            return res.status(401).json({
                status: false,
                message: "User registeration failed because email and password are required"
            });
        }

        // setting up query to find if data with this email exsists
        const query = 'SELECT * FROM users WHERE email = $1'

        // feteching data from db using query above
        const checkUser = await db.query(query, [
            email,
        ]);

        // checking if the user does not exsists then sending response with status false
        if (!checkUser.rows[0]) {
            return res.status(401).json({
                status: false,
                message: "User does not exsists"
            });
        }

        // compare password using bycrpt
        const comparePassword = await bcrypt.compare(password, checkUser.rows[0].password)

        // checking if the password did not match then sending response with status false
        if (!comparePassword) {
            return res.status(401).json({
                status: false,
                message: "Email or password incorrect"
            });
        }

        // generating jwt token for authentication
        const token = jwt.sign({ id: checkUser.rows[0].user_id }, process.env.TOKEN);

        // sending response with status true
        res.status(200).json({
            status: true,
            message: "User Logged in",
            user: checkUser.rows[0],
            jwt_token: token
        });

    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Internal server error"
        });
    }
}
exports.getUserData = async (req, res) => {
    const { current_user_id } = req.query;
    try {
        if (!current_user_id) {
            return res.status(401).json({
                status: false,
                message: "User_id is required"
            });
        }
        const query = 'SELECT * FROM users WHERE user_id = $1';
        const userData = await pool.query(query, [current_user_id]);
        
        if (!userData.rows[0]) {
            return res.status(401).json({
                status: false,
                message: "User Does not exsists"
            });
        }
        await Promise.all(userData.rows.map(async (userDat, index) => {
            // CHECKING IF RESUME HAS work_experience ARRAY THEN FETECHING DATA FOR EACH work_experience ID
            if(userDat.experience){
                if (userDat.experience.length > 0) {
                    const work_experienceQuery = 'SELECT * FROM workExperience WHERE work_experience_id IN (SELECT UNNEST($1::int[]))'
                    const work_experienceData = await pool.query(work_experienceQuery, [userDat.experience]);
                    
                    if (work_experienceData.rows[0]) {
                        userData.rows[index].experience = work_experienceData.rows;
                    }
                }
            }
            // CHECKING IF RESUME HAS educations ARRAY THEN FETECHING DATA FOR EACH educations ID
            if(userDat.education){
                if (userDat.education.length > 0) {
                    const educationsQuery = 'SELECT * FROM educations WHERE education_id IN (SELECT UNNEST($1::int[]))'
                    const educationsData = await pool.query(educationsQuery, [userDat.education]);
                    if (educationsData.rows[0]) {
                        userData.rows[index].education = educationsData.rows;
                    }
                }
            }
        }))
        res.json({
            status: true,
            message: "Data Fetched sucessfully",
            results: userData.rows[0]
        })
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: err.message
        });
    }
}
exports.forgetPassword = async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) {
            return res.status(401).json({
                status: false,
                message: "Email is required"
            });
        }
        const userCheckQuery = 'SELECT * FROM users WHERE email = $1'
        const findUSer = await pool.query(userCheckQuery, [email]);
        if (findUSer.rowCount < 1) {
            return res.status(401).json({
                status: false,
                message: "Invalid Email Address"
            });
        }
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
        const query = 'SELECT * FROM otpStored WHERE email = $1';
        const checkEmail = pool.query(query, [email]);
        if (checkEmail.rowCount > 0) {
            let query = 'UPDATE otpStored SET otp = $1  WHERE email = $2 RETURNING*'
            let values = [
                otp ? otp : null,
                email ? email : null
            ]
            const result = await pool.query(query, values);
            if (result.rowCount > 0) {
                let sendEmailResponse = await transporter.sendMail({
                    from: process.env.EMAIL_USERNAME,
                    to: email,
                    subject: 'Forget Password',
                    html: emailOTPBody(otp, "Express-Cv", "#0492C2")

                });
                if (!sendEmailResponse) {
                    return res.json({
                        status: false,
                        message: "otp not sent",
                    })
                }
                return res.json({
                    status: true,
                    message: "otp updated",
                    results: result.rows[0]
                })
            }
        }
        const query1 = 'INSERT INTO otpStored (email , otp) VALUES ($1 , $2) RETURNING*'
        const result = await pool.query(query1, [email, otp])
        if (result.rowCount < 1) {
            return res.json({
                status: false,
                message: "otp was not added",
            })
        }
        let sendEmailResponse = await transporter.sendMail({
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: 'Forget Password',
            html: emailOTPBody(otp, "Express-Cv", "#0492C2")

        });
        if (!sendEmailResponse) {
            return res.json({
                status: false,
                message: "otp not sent",
            })
        }
        res.json({
            status: true,
            message: "otp added",
            results: result.rows[0]
        })

    } catch (err) {
        return res.json({
            status: false,
            message: err.message
        });
    }
}
exports.otpVerification = async (req, res) => {
    const { otp, otp_id } = req.query;
    try {
        if (!otp || !otp_id) {
            return res.json({
                status: false,
                message: "OTP and otp_id is required"
            })
        }
        const query = 'SELECT * FROM otpStored WHERE otp_id = $1'
        const findOtp = await pool.query(query, [otp_id]);
        if (findOtp.rowCount < 1) {
            return res.json({
                status: false,
                message: "Invalid OTP Id"
            })
        }
        if (findOtp.rows[0].otp !== otp) {
            return res.json({
                status: false,
                message: "Invalid OTP"
            })
        }
        return res.json({
            status: true,
            message: "Code Verified Sucessfully"
        })
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: err.message
        });
    }
}
exports.resetPassword = async (req, res) => {
    const { otp_id, password } = req.body;
    try {
        if (!otp_id || !password) {
            return res.json({
                status: false,
                message: "Otp id, password and email are required"
            })
        }
        const query = 'SELECT * FROM otpStored WHERE otp_id = $1'
        const getOtpUser = await pool.query(query, [otp_id]);
        if (getOtpUser.rowCount < 1) {
            return res.json({
                status: false,
                message: "The request can not be completed because otp could not be verified"
            })
        }
        const query1 = 'UPDATE users SET password = $1  WHERE email = $2 RETURNING *'
        const updatePassword = await pool.query(query1, [password, getOtpUser.rows[0].email])
        if (updatePassword.rowCount < 1) {
            return res.json({
                status: false,
                message: "Unable to update the password because email was not found"
            })
        }
        const deleteEntry = 'DELETE FROM otpStored WHERE otp_id = $1';
        const deletedOtp = await pool.query(deleteEntry, [otp_id]);
        if (deletedOtp.rowCount < 1) {
            return res.json({
                status: false,
                message: "The otp entry was not deleted because otp_id was not found"
            })
        }
        res.json({
            status: true,
            message: "Password Updated sucessfully",
            results: updatePassword.rows[0]
        })
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: err.message
        });
    }
}
exports.changePassword = async (req, res) => {
    const { current_password, new_password, user_id } = req.body;
    try {
        if (!current_password || !new_password || !user_id) {
            return res.json({
                status: false,
                message: "current_password, user_id and new_password are required"
            })
        }
        const query = 'SELECT * FROM users WHERE user_id = $1'
        const getOtpUser = await pool.query(query, [user_id]);
        if (getOtpUser.rowCount < 1) {
            return res.json({
                status: false,
                message: "User with this id was not found"
            })
        }
        const comparePassword = await bcrypt.compare(current_password, getOtpUser.rows[0].password)

        // checking if the password did not match then sending response with status false
        if (!comparePassword) {
            return res.status(401).json({
                status: false,
                message: "Current password is incorrect"
            });
        }
        const salt = await bcrypt.genSalt(10);

        // password hashing
        const hashPassword = await bcrypt.hash(new_password, salt);
        const query1 = 'UPDATE users SET password = $1  WHERE user_id = $2 RETURNING *'
        const updatePassword = await pool.query(query1, [hashPassword, user_id])
        if (updatePassword.rowCount < 1) {
            return res.json({
                status: false,
                message: "Unable to update the password because user_id was not found"
            })
        }
        res.json({
            status: true,
            message: "Password Updated sucessfully",
            results: updatePassword.rows[0]
        })
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: err.message
        });
    }
}
exports.updateUserInfo = async (req, res) => {
    const { user_name, phone, user_id } = req.query;
    try {
        let query;
        let values = [];
        if (!user_id) {
            return res.json({
                status: false,
                message: 'User_id is required'
            })
        }
        if (!user_name || !phone) {
            return res.json({
                status: false,
                message: 'User_name or Phone is required to update data'
            })
        }
        
        if (user_name === '') {
            return res.json({
                status: false,
                message: 'User_name can not be empty'
            })
        }
        if(user_name && phone){
            query = 'UPDATE users SET user_name =$2, phone = $3 WHERE user_id = $1 RETURNING *';
            values=[user_id, user_name, phone]
        }
        if(user_name && !phone){
            query = 'UPDATE users SET user_name = $2 WHERE user_id = $1 RETURNING *';
            values=[user_id, user_name]
        }
        if(!user_name && phone){
            query = 'UPDATE users SET phone = $2 WHERE user_id = $1 RETURNING *';
            values=[user_id, phone]
        }
        const updatedData = await pool.query(query, values);
        if(updatedData.rowCount < 1){
            return res.json({
                status: false,
                message: 'User with this User_id does not exsists'
            })
        }
        res.json({
            status: true,
            message: 'user updated Sucessfully',
            results: updatedData.rows[0]
        })
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: err.message
        });
    }
}
exports.uploadImage = async (req,res)=>{
    const path = req.file.path;
    const user_id = req.query.user_id;
    if(!path || !user_id){
        return res.json({
            status:false,
            message:"path or user_id not found"
        })
    }
    const query = 'UPDATE users SET profile_img = $1 WHERE user_id = $2 RETURNING *'
    const updateUserImage = await pool.query(query, [path,user_id]);
    if(updateUserImage.rowCount < 1){
        return res.json({
            status:false,
            message:"user_id was not found"
        })
    }
    res.json({
        status: true,
        message:'Image Uploaded Sucessfully',
        results: path
    })
}