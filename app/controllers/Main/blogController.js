const { pool } = require("../../config/db.config");


exports.addBlog = async (req, res) => {
    const client = await pool.connect();
    try {
        const title = req.body.title;
        const description = req.body.description;
        const cover_image = req.file.path;
        if (!title ) {
            return (
                res.json({
                    message: "Please provide title atleast for creating blog",
                    status: false
                })
            )
        }


        const query = 'INSERT INTO blogs (title , description , cover_image, sub_headings) VALUES ($1 , $2 , $3 , $4) RETURNING*'
        const result = await pool.query(query,
            [
                title ? title : null,
                description ? description : null,
                cover_image ? cover_image : null,
                []
            ]);


        if (result.rows[0]) {
            res.status(201).json({
                message: "blog saved in database",
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

exports.updateBlog = async (req, res) => {
    const client = await pool.connect();
    try {
        const blog_id = req.body.blog_id;
        const title = req.body.title;
        const description = req.body.description;
        const cover_image = req.body.cover_image;
        const sub_headings = req.body.sub_headings;

        if (!blog_id) {
            return (
                res.json({
                    message: "Please provide blog_id ",
                    status: false
                })
            )
        }


        let query = 'UPDATE blogs SET ';
        let index = 2;
        let values = [blog_id];



        if (title) {
            query += `title = $${index} , `;
            values.push(title)
            index++
        }
        if (sub_headings) {
            query += `sub_headings = $${index} , `;
            values.push(sub_headings)
            index++
        }
        if (description) {
            query += `description = $${index} , `;
            values.push(description)
            index++
        }

        if (cover_image) {
            query += `cover_image = $${index} , `;
            values.push(cover_image)
            index++
        }


        query += 'WHERE blog_id = $1 RETURNING*'
        query = query.replace(/,\s+WHERE/g, " WHERE");

        const result = await pool.query(query, values);

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

exports.deleteBlog = async (req, res) => {
    const client = await pool.connect();
    try {
        const blog_id = req.query.blog_id;
        if (!blog_id) {
            return (
                res.json({
                    message: "Please Provide blog_id",
                    status: false
                })
            )
        }
        const query = 'DELETE FROM blogs WHERE blog_id = $1 RETURNING *';
        const result = await pool.query(query, [blog_id]);

        if (result.rowCount > 0) {
            res.status(200).json({
                message: "Deletion successfull",
                status: true,
                deletedRecord: result.rows[0]
            })
        }
        else {
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

exports.getAllBlogs = async (req, res) => {
    const client = await pool.connect();
    try {
        let limit = req.query.limit;
        let page = req.query.page

        let result;
        if (!page || !limit) {
            const query = 'SELECT * FROM blogs'
            result = await pool.query(query);

        }

        if (page && limit) {
            limit = parseInt(limit);
            let offset = (parseInt(page) - 1) * limit

            const query = 'SELECT * FROM blogs LIMIT $1 OFFSET $2'
            result = await pool.query(query, [limit, offset]);


        }

        if (result.rowCount < 0) {
            res.json({
                message: "could not fetch",
                status: false
            })
        }
        await Promise.all(
            result.rows.map(async (results, index) => {
                if (results.sub_headings !== null) {
                    if (results.sub_headings.length > 0) {
                        
                        const sub_headingsQuery = 'SELECT * FROM sub_headings WHERE sub_headings_id IN (SELECT UNNEST($1::int[]))'
                        const sub_headingsResults = await pool.query(sub_headingsQuery, [results.sub_headings])
                        if (sub_headingsResults.rowCount > 0) {
                            result.rows[index].sub_headings= sub_headingsResults.rows;
                        }
                    }
                }
            })
        )
        res.json({
            message: "Fetched",
            status: true,
            result: result.rows
        })

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

exports.getBlogById = async (req, res) => {
    const client = await pool.connect();
    try {
        const blog_id = req.query.blog_id;

        if (!blog_id) {
            return (
                res.status(400).json({
                    message: "Please Provide blog_id",
                    status: false
                })
            )
        }
        const query = 'SELECT * FROM blogs WHERE blog_id = $1'
        const result = await pool.query(query, [blog_id]);

        if (result.rowCount > 0) {
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
            status: false,
            message: err.message
        })
    }
    finally {
        client.release();
    }

}
exports.addSubHeadings = async (req, res) => {
    const { heading, details, blog_id } = req.body;
    try {
        if (!heading || !details || !blog_id) {
            return res.json({
                status: false,
                message: "Heading, Details and blog_id is required"
            })
        }
        const query = 'INSERT INTO sub_headings (heading,ddetails) VALUES ($1, $2) RETURNING *';
        const postSUbHeading = await pool.query(query, [heading, details]);
        if (postSUbHeading.rowCount < 1) {
            return res.json({
                status: false,
                message: "Sub Heading was not added sucessfully"
            })
        }
        const insertInBlogQuery = 'UPDATE blogs SET sub_headings = array_append(sub_headings, $1) WHERE blog_id = $2 RETURNING *;';
        const insertInBlog = await pool.query(insertInBlogQuery, [postSUbHeading.rows[0].sub_headings_id, blog_id]);
        if (insertInBlog.rowCount < 1) {
            return res.json({
                status: false,
                message: "Sub Heading was added but id was not inserted in blog sucessfully"
            })
        }
        res.json({
            status: true,
            message: "Sub Heading was added sucessfully"
        })
    } catch (error) {
        res.json({
            status: false,
            message: error.message
        })
    }
}