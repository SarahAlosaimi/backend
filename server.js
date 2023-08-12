


const express = require("express");
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');


const app = express();
app.use(cors()); 
app.use(express.json()); //  this line to parse JSON requests
app.use(express.static(path.join(__dirname, 'public')));


  

const db = mysql.createConnection({
    host : "us-cdbr-east-06.cleardb.net",
    user: "bcbbaa29459c0c",
    password: "2a0e07e8",
    database : "heroku_b1974455352ea96",
}); 

const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    },

  });

  const upload = multer({ storage }).single('profilePicture');





// ***************************** insert for register *****************************
app.post('/register' , (req, res ) => {


    upload(req, res, (err) => {
        if (err) {
          console.error('Error uploading profile picture:', err);
          return res.status(500).json({ error: 'Error uploading profile picture' });
        }
        // Extract uploaded file path
        const profilePicturePath = req.file ? req.file.path : null;
        console.log(profilePicturePath);

    // Insert data into the database

    const sql = "INSERT INTO `students`(`firstname`, `lastname`, `email`, `password`, `birthdate`, `profile_picture`) VALUES (?, ?, ?, ?, ? , ?)";
    const values = [
 
        req.body.firstName, 
        req.body.lastName, 
        req.body.email,
        req.body.password, // Hashed password is sent from the client
        req.body.birthdate, 
        profilePicturePath,

    ]; 

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error inserting data into database" });
        }
        console.log({insertedId: result.insertId});
        return res.json({ message: "Data inserted successfully", insertedId: result.insertId });
    });
});
});


//***************************** GPpage ***************************** */

app.post('/GPpage', (req, res) => {

    // Update data in the database

    const sql = "UPDATE `students` SET `LevelofStudy`=?, `Program`=?, `Faculty`=? WHERE id = ?";
    const values = [
        req.body.dropdown1,
        req.body.dropdown2,
        req.body.dropdown3,
        req.body.id  // userInfo is the ID of the user I want to updated
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error updating data into the database" });
        }
        console.log("Data updated successfully");
        return res.json({ message: "Data updated successfully" });
    });
});





//***************************** Verify Login ***************************** */
app.post('/login', async (req, res) => {
    const email = req.body.email;
    const plainPassword = req.body.password;

    const sql = "SELECT * FROM students WHERE email = ?";
    const values = [email];

    db.query(sql, values, async (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send({ error: "Server side error" });
        }
console.log(result);
        if (result.length > 0) {
            const hashedPasswordFromDB = result[0].password;
            const isPasswordValid = await bcrypt.compare(plainPassword, hashedPasswordFromDB);
            const pID = result[0].program_id;

            if (isPasswordValid) {
                console.log("Login success");
                
                res.send({ message: "success" , pID: pID });
            } else {
                console.log("Incorrect password");
              res.send({ message: "Incorrect password" });
            }
        } else {
            console.log("No user found");
            return res.json({ message: "No user found" });
        }
    });



});



// Endpoint to fetch programs from the database
app.get('/getPrograms', (req, res) => {
    const sql = "SELECT * FROM programs"; 
    db.query(sql, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error fetching programs from the database" });
      }
      return res.json(result);
    });
  });
  


  app.post('/enroll', (req, res) => {
    const userId = req.body.userId;
    const programId = req.body.programId;

    const sql = "UPDATE students SET program_id = ? WHERE id = ?";
    const values = [programId, userId];
    
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error enrolling in program" });
        }
        console.log(programId);
        return res.json({ message: "successful" });
    });
});


app.get('/getStudentInfo', (req, res) => {
    const userId = req.query.userId; // Assuming you pass the user ID as a query parameter
    console.log(userId)
    const studentInfoQuery = "SELECT s.firstname, s.lastname, s.profile_picture , p.level, p.program, p.faculty FROM students s JOIN programs p ON s.program_id = p.id WHERE s.id = ?";
    
    db.query(studentInfoQuery, [userId], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error fetching student information" });
      }
  
      if (results.length > 0) {
        const studentInfo = results[0];
        return res.json(studentInfo);
      } else {
        return res.status(404).json({ message: "Student information not found" });
      }
    });
  });
  












app.listen(process.env.PORT || 3000 , () => { 
    console.log("Server is listening on port 3000" );
}








);

