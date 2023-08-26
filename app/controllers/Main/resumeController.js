const { query } = require("express");
const { pool } = require("../../config/db.config");
exports.addResumes = async (req, res) => {
    try {
        const { resume_template_id, user_id } = req.body;
        if (!user_id || !resume_template_id) {
            return res.status(401).json({
                status: false,
                message: "user_id and resume_template_id are required"
            });
        }
        const query = 'INSERT INTO resumes (resume_template_id, user_id) VALUES ($1, $2) RETURNING *'
        const savedResumes = await pool.query(query, [resume_template_id, user_id]);
        if (!savedResumes.rows[0]) {
            return res.status(401).json({
                status: false,
                message: "Resume not added due to issue while saving in db"
            });
        }
        return res.status(200).json({
            status: true,
            message: "resume added",
            results: savedResumes.rows[0]
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: err.message
        });
    }
}
exports.updateResumes = async (req, res) => {
    try {
        const { resume_id, skills, objective, personal_info, languages, work_experience, educations, interests } = req.body;
        if (!resume_id) {
            return res.status(401).json({
                status: false,
                message: "resume_id is required"
            });
        }
        if (skills || objective || personal_info || languages || work_experience || educations || interests) {

        }
        else {
            return res.status(401).json({
                status: false,
                message: "atleast 1 of them should be provided skills, objective, personal_info, languages, work_experience, educations"
            });
        }
        // SETTING UP QUERY TO UPDATE DATA IN DB IF FLUENCY IS NOT GIVEN
        let query = 'UPDATE resumes SET ';
        let index = 2
        let values = [resume_id]

        // CHECKING IF FLUENCY IS NOT AVAILABLE THEN UPDATING ONLY LANGUAGE
        if (skills) {
            // SETTING UP TITLE IN QUERY
            query += `skills = array_append(skills, $${index}) , `;
            values.push(skills)
            index++
        }

        if (objective) {
            // SETTING UP TITLE IN QUERY
            query += `objective = $${index} , `;
            values.push(objective)
            index++

        }
        if (personal_info) {
            // SETTING UP TITLE IN QUERY
            query += `personal_info = $${index} , `;
            values.push(personal_info)
            index++
        }
        if (languages) {
            // SETTING UP TITLE IN QUERY
            query += `languages = array_append(languages, $${index}) , `;
            values.push(languages)
            index++
        }
        if (work_experience) {
            // SETTING UP TITLE IN QUERY
            query += `work_experience = array_append(work_experience, $${index}) , `;
            values.push(work_experience)
            index++
        }
        if (interests) {
            // SETTING UP TITLE IN QUERY
            query += `interests = array_append(interests, $${index}) , `;
            values.push(interests)
            index++
        }
        if (educations) {
            // SETTING UP TITLE IN QUERY
            query += `educations = array_append(educations, $${index}) , `;
            values.push(educations)
            index++
        }
        // FINALIZING QUERY
        query += 'WHERE resumes_id = $1 RETURNING *'
        query = query.replace(/,\s+WHERE/g, " WHERE");
        console.log(query)
        const educationUpdated = await pool.query(query, values);
        if (!educationUpdated.rows[0]) {
            return res.status(401).json({
                status: false,
                message: "Resume not updated sucessfully",
            });
        }
        res.status(200).json({
            status: true,
            message: "Data Updated",
            results: educationUpdated.rows[0]
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: err.message
        });
    }
}
exports.deleteResumes = async (req, res) => {
    const db = await pool.connect();
    try {

    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Internal server error"
        });
    }
}
exports.getAllResumes = async (req, res) => {
    const db = await pool.connect();
    try {

    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Internal server error"
        });
    }
}
exports.getUserResumes = async (req, res) => {
    try {
        // DESTRUCTURING DATA FROM REQUEST QUERY
        const { user_id } = req.query;
        // CHECKING IF THE DATA IS RECIEVED
        if (!user_id) {
            return res.status(404).json({
                status: false,
                message: "User id must be provided"
            });
        }

        // SETTING UP QUERY TO GET THE REQUIRED RESUME
        const query = 'SELECT * FROM resumes WHERE user_id = $1';

        // FETCHING RESUME FROM DB
        const resume = await pool.query(query, [user_id]);
        // CHECKING IF THE RESUME IS NOT FETECHED THEN SENDING RESPONSE WITH STATUS FALSE
        if (!resume.rows[0]) {
            return res.status(404).json({
                status: false,
                message: "Resume with this id does not exsists"
            });
        }
        // CHECKING IF RESUME HAS SKILLS ARRAY THEN FETECHING DATA FOR EACH SKILL ID
        await Promise.all(resume.rows.map(async (resumes, index) => {
            if(resumes.resume_template_id){
                const resumeQuery = 'SELECT * FROM templates WHERE template_id = $1'
                const resumeData = await pool.query(resumeQuery, [resumes.resume_template_id]);
                if(resumeData.rows[0]){
                    resume.rows[index].resume_template_id = resumeData.rows[0];
                }
            }
            if(resumes.skills){
                if (resumes.skills.length > 0) {
                    const skillsQuery = 'SELECT * FROM skills WHERE skill_id IN (SELECT UNNEST($1::int[]))'
                    const skillsData = await pool.query(skillsQuery, [resumes.skills]);
                    if (skillsData.rows[0]) {   
                        resume.rows[index].skills = skillsData.rows;
                    }
                }
            }
            // CHECKING IF RESUME HAS languages ARRAY THEN FETECHING DATA FOR EACH languages ID
            if(resumes.languages){
                if (resumes.languages.length > 0) {
                    const languagesQuery = 'SELECT * FROM languages WHERE language_id IN (SELECT UNNEST($1::int[]))'
                    const languagesData = await pool.query(languagesQuery, [resumes.languages]);
        
                    if (languagesData.rows[0]) {
                        resume.rows[index].languages = languagesData.rows;
                    }
                }
            }

            // CHECKING IF RESUME HAS work_experience ARRAY THEN FETECHING DATA FOR EACH work_experience ID
            if(resumes.work_experience){
                if (resumes.work_experience.length > 0) {
                    const work_experienceQuery = 'SELECT * FROM workExperience WHERE work_experience_id IN (SELECT UNNEST($1::int[]))'
                    const work_experienceData = await pool.query(work_experienceQuery, [resumes.work_experience]);
        
                    if (work_experienceData.rows[0]) {
                        resume.rows[index].work_experience = work_experienceData.rows;
                    }
                }
            }
            // CHECKING IF RESUME HAS educations ARRAY THEN FETECHING DATA FOR EACH educations ID
            if(resumes.educations){
                if (resumes.educations.length > 0) {
                    const educationsQuery = 'SELECT * FROM educations WHERE education_id IN (SELECT UNNEST($1::int[]))'
                    const educationsData = await pool.query(educationsQuery, [resumes.educations]);
        
                    if (educationsData.rows[0]) {
                        resume.rows[index].educations = educationsData.rows;
                    }
                }
            }

            // CHECKING IF RESUME HAS objective THEN FETECHING DATA FOR OBJECTIVE ID
            if(resumes.objective){
                if (resumes.objective !== null) {
                    const objectiveQuery = 'SELECT * FROM objectives WHERE objective_id = $1'
                    const objectiveData = await pool.query(objectiveQuery, [resumes.objective]);
        
                    if (objectiveData.rows[0]) {
                        resume.rows[index].objective = objectiveData.rows[0];
                    }
                }
            }
            // CHECKING IF RESUME HAS personal_info THEN FETECHING DATA FOR personal_info ID
            if(resumes.personal_info){
                if (resumes.personal_info !== null) {
                    const personal_infoQuery = 'SELECT * FROM personal_info WHERE personal_info_id = $1'
                    const personal_infoData = await pool.query(personal_infoQuery, [resumes.personal_info]);
        
                    if (personal_infoData.rows[0]) {
                        resume.rows[index].personal_info = personal_infoData.rows[0];
                    }
                    
                }
            }
        }))
        res.status(200).json({
            status: true,
            message: "Resume found",
            results: resume.rows
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: err.message
        });
    }
}
exports.getResumesById = async (req, res) => {
    // CONNECTING TO DB
    const db = await pool.connect();
    try {

        // DESTRUCTURING DATA FROM REQUEST QUERY
        const { resume_id } = req.query;

        // CHECKING IF THE DATA IS RECIEVED
        if (!resume_id) {
            return res.status(404).json({
                status: false,
                message: "Resume id must be provided"
            });
        }

        // SETTING UP QUERY TO GET THE REQUIRED RESUME
        const query = 'SELECT * FROM resumes WHERE resumes_id = $1';

        // FETCHING RESUME FROM DB
        const resume = await db.query(query, [resume_id]);

        // CHECKING IF THE RESUME IS NOT FETECHED THEN SENDING RESPONSE WITH STATUS FALSE
        if (!resume.rows[0]) {
            return res.status(404).json({
                status: false,
                message: "Resume with this id does not exsists"
            });
        }

        // CHECKING IF RESUME HAS SKILLS ARRAY THEN FETECHING DATA FOR EACH SKILL ID
        if (resume.rows[0].skills.length > 0) {
            const skillsQuery = 'SELECT * FROM skills WHERE skill_id IN (SELECT UNNEST($1::int[]))'
            const skillsData = await db.query(skillsQuery, [resume.rows[0].skills]);

            if (skillsData.rows[0]) {
                resume.rows[0].skills = skillsData.rows;
            }
        }

        // CHECKING IF RESUME HAS languages ARRAY THEN FETECHING DATA FOR EACH languages ID
        if (resume.rows[0].languages.length > 0) {
            const languagesQuery = 'SELECT * FROM languages WHERE language_id IN (SELECT UNNEST($1::int[]))'
            const languagesData = await db.query(languagesQuery, [resume.rows[0].languages]);

            if (languagesData.rows[0]) {
                resume.rows[0].languages = languagesData.rows;
            }
        }

        // CHECKING IF RESUME HAS work_experience ARRAY THEN FETECHING DATA FOR EACH work_experience ID
        if (resume.rows[0].work_experience.length > 0) {
            const work_experienceQuery = 'SELECT * FROM workExperience WHERE work_experience_id IN (SELECT UNNEST($1::int[]))'
            const work_experienceData = await db.query(work_experienceQuery, [resume.rows[0].work_experience]);

            if (work_experienceData.rows[0]) {
                resume.rows[0].work_experience = work_experienceData.rows;
            }
        }

        // CHECKING IF RESUME HAS educations ARRAY THEN FETECHING DATA FOR EACH educations ID
        if (resume.rows[0].educations.length > 0) {
            const educationsQuery = 'SELECT * FROM educations WHERE education_id IN (SELECT UNNEST($1::int[]))'
            const educationsData = await db.query(educationsQuery, [resume.rows[0].educations]);

            if (educationsData.rows[0]) {
                resume.rows[0].educations = educationsData.rows;
            }
        }

        // CHECKING IF RESUME HAS objective THEN FETECHING DATA FOR OBJECTIVE ID
        if (resume.rows[0].objective !== null) {
            const objectiveQuery = 'SELECT * FROM objectives WHERE objective_id = $1'
            const objectiveData = await db.query(objectiveQuery, [resume.rows[0].objective]);

            if (objectiveData.rows[0]) {
                resume.rows[0].objective = objectiveData.rows[0];
            }
        }

        // CHECKING IF RESUME HAS personal_info THEN FETECHING DATA FOR personal_info ID
        if (resume.rows[0].personal_info !== null) {
            const personal_infoQuery = 'SELECT * FROM personal_info WHERE personal_info_id = $1'
            const personal_infoData = await db.query(personal_infoQuery, [resume.rows[0].personal_info]);

            if (personal_infoData.rows[0]) {
                resume.rows[0].personal_info = personal_infoData.rows[0];
            }
        }
        res.status(200).json({
            status: false,
            message: "Resume found",
            results: resume.rows[0]
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: err.message
        });
    }
}
exports.deleteResume = async(req,res)=>{
    const {resume_id} = req.query; 
    try {
        if(!resume_id){
            return res.json({
                status:false,
                message:'Resume_id is required'
            })
        }
        const query = 'DELETE FROM resumes WHERE resumes_id = $1'
        const deleteResume = await pool.query(query,[resume_id]);
        if(deleteResume.rowCount < 1){
            return res.json({
                status:false,
                message:'Resume_id is incorrect'
            })
        }
        res.json({
            status:true,
            message:'CV Deleted Sucessfully',
        })
    } catch (error) {
        return res.json({
            status:false,
            message:error.message
        })
    }
}