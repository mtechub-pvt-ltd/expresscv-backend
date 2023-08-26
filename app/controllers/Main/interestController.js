const {pool} = require("../../config/db.config");


exports.addInterest = async (req, res) => {
    const client = await pool.connect();
    try {
        const text = req.body.text;
        const user_id = req.body.user_id;

        if (!text || !user_id) {
            return (
                res.json({
                    message: "Please provide text and user_id for creating interest",
                    status: false
                })
            )
        }

        const query = 'INSERT INTO interests (text , user_id) VALUES ($1 , $2) RETURNING*'
        const result = await pool.query(query , 
            [
                text ? text : null ,
                user_id ? user_id : null,
            ]);

            
        if (result.rows[0]) {
            res.status(201).json({
                message: "interest saved in database",
                status: true,
                result: result.rows[0]
            })
        }
        else {
            res.status(400).json({
                message: "Could not save",
                status: false
            })
        }
    }
    catch (err) {
        res.json({
            message: "Error",
            status: false,
            error: err.messagefalse
        })
    }
    finally {
        client.release();
      }

}

exports.updateinterest = async (req, res) => {
    const client = await pool.connect();
    try {
        const interest_id = req.body.interest_id;
        const text = req.body.text;


        if (!interest_id) {
            return (
                res.json({
                    message: "Please provide interest_id ",
                    status: false
                })
            )
        }

       
        let query = 'UPDATE interests SET ';
        let index = 2;
        let values =[interest_id];



        if(text){
            query+= `text = $${index} , `;
            values.push(text)
            index ++
        }
        

        query += 'WHERE interest_id = $1 RETURNING*'
        query = query.replace(/,\s+WHERE/g, " WHERE");

       const result = await pool.query(query , values);

        if (result.rows[0]) {
            res.json({
                message: "Updated",
                status: true,
                result: result.rows[0]
            })
        }
        else {
            res.json({
                message: "Could not update . Record With this Id may not found or req.body may be empty",
                status: false,
            })
        }

    }
    catch (err) {
        res.json({
            message: "Error",
            status: false,
            error: err.message
        })
    }
    finally {
        client.release();
      }
}

exports.deleteinterest = async (req, res) => {
    const client = await pool.connect();
    try {
        const interest_id = req.query.interest_id;
        if (!interest_id) {
            return (
                res.json({
                    message: "Please Provide interest_id",
                    status: false
                })
            )
        }
        const query = 'DELETE FROM interests WHERE interest_id = $1 RETURNING *';
        const result = await pool.query(query , [interest_id]);

        if(result.rowCount>0){
            res.status(200).json({
                message: "Deletion successfull",
                status: true,
                deletedRecord: result.rows[0]
            })
        }
        else{
            res.status(404).json({
                message: "Could not delete . Record With this Id may not found or req.body may be empty",
                status: false,
            })
        }

    }
    catch (err) {
        res.json({
            message: "Error",
            status: false,
            error: err.message
        })
    }
    finally {
        client.release();
      }
}

exports.getAllinterests = async (req, res) => {
    const client = await pool.connect();
    try {

        let limit = req.query.limit;
        let page = req.query.page

        
        if (!page || !limit) {
            const query = 'SELECT * FROM interests'
            result = await pool.query(query);
           
        }

        if(page && limit){
            limit = parseInt(limit);
            let offset= (parseInt(page)-1)* limit

        const query = 'SELECT * FROM interests LIMIT $1 OFFSET $2'
        result = await pool.query(query , [limit , offset]);

      
        }

        if (result.rows) {
            res.json({
                message: "Fetched",
                status: true,
                result: result.rows
            })
        }
        else {
            res.json({
                message: "could not fetch",
                status: false
            })
        }
    }
    catch (err) {
        res.json({
            message: "Error",
            status: false,
            error: err.message
        })
    }
    finally {
        client.release();
      }

}

exports.getinterestById = async (req, res) => {
    const client = await pool.connect();
    try {
        const interest_id = req.query.interest_id;

        if (!interest_id) {
            return (
                res.status(400).json({
                    message: "Please Provide interest_id",
                    status: false
                })
            )
        }
        const query = 'SELECT * FROM interests WHERE interest_id = $1'
        const result = await pool.query(query , [interest_id]);

        if (result.rowCount>0) {
            res.json({
                message: "Fetched",
                status: true,
                result: result.rows[0]
            })
        }
        else {
            res.json({
                message: "could not fetch",
                status: false
            })
        }
    }
    catch (err) {
        res.json({
            message: "Error",
            status: false,
            error: err.message
        })
    }
    finally {
        client.release();
      }

}

exports.getInterestsByuser_id = async(req,res)=>{
    const client = await pool.connect();
    try {
        const user_id = req.query.user_id;

        if (!user_id) {
            return (
                res.status(400).json({
                    message: "Please Provide user_id",
                    status: false
                })
            )
        }
        const query = 'SELECT * FROM interests WHERE user_id = $1'
        const result = await pool.query(query , [user_id]);

        if (result.rowCount>0) {
            res.json({
                message: "Fetched",
                status: true,
                result: result.rows
            })
        }
        else {
            res.json({
                message: "could not fetch",
                status: false
            })
        }
    }
    catch (err) {
        res.json({
            message: "Error",
            status: false,
            error: err.message
        })
    }
    finally {
        client.release();
      }

}