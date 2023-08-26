const {pool} = require('../../config/db.config');


exports.addFaq = async(req,res)=>{
    const client = await pool.connect();
    try{
        const question = req.body.question ;
        const answer = req.body.answer ;

        const query= 'INSERT INTO faqs (question, answer) Values ($1, $2) RETURNING *'
        const result = await pool.query(query , [question,answer]);

        if(result.rows[0]){
            res.json({
                message: "Created Faq",
                status : true,
                result : result.rows[0]
            })
         }
         else{
            res.json({
                message: "Could not insert record",
                status : false
            })
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


exports.getAllFaqs = async(req,res)=>{
    const client = await pool.connect();

    try{
        const query = 'SELECT * FROM faqs';

        const result = await pool.query(query);

        if(result.rows){
            res.json({
                message: "All Fetched faqs",
                status : true,
                result : result.rows
            })
         }
         else{
            res.json({
                message: "Could not fetch record",
                status : false
            })
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

exports.viewFaq = async(req,res)=>{
    const client = await pool.connect();

    try{
        const faq_id = req.query.faq_id;
        const query = 'SELECT * FROM faqs WHERE faq_id= $1';

        const result = await pool.query(query , [faq_id]);

        if(result.rows[0]){
            res.json({
                message: "faq fetched",
                status : true,
                result : result.rows[0]
            })
         }
         else{
            res.json({
                message: "Could not fetch record",
                status : false
            })
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


exports.updateFaq= async(req,res)=>{
    const client = await pool.connect();

    
    try{
        const faq_id = req.body.faq_id;
        const question = req.body.question;
        const answer = req.body.answer;


        let query = 'UPDATE faqs SET ';
        let index = 2;
        let values =[faq_id];

        
        if(question){
            query+= `question = $${index} , `;
            values.push(question)
            index ++
        }
        if(answer){
            query+= `answer = $${index} , `;
            values.push(answer)
            index ++
       


        query += 'WHERE faq_id = $1 RETURNING*'
        query = query.replace(/,\s+WHERE/g, " WHERE");

       const result = await pool.query(query , values);


        if(result.rows[0]){
            res.json({
                message: "faq updated",
                status : true,
                result : result.rows[0]
            })
         }
         else{
            res.json({
                message: "Could not update record",
                status : false
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


exports.DeleteFaq= async(req,res)=>{
    const client = await pool.connect();

    
    try{
        const faq_id = req.query.faq_id;


        const query=   `DELETE FROM faqs WHERE faq_id = $1 RETURNING*`
       const result = await pool.query(query , [faq_id]);


        if(result.rows[0]){
            res.json({
                message: "faq deleted",
                status : true,
                deletedRecord : result.rows[0]
            })
         }
         else{
            res.json({
                message: "Could not update record",
                status : false
            })
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