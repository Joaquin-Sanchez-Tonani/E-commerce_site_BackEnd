require('dotenv').config();
const cors = require('cors')
const mysql = require('mysql')
const express = require('express');
const app = express();
const http = require('http')

const corsOptions = {
    origin: 'https://joaquin-sanchez-tonani-ecommerce.netlify.app/',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
};

app.use(cors(corsOptions));
app.use(express.json());

const serverHttp = http.createServer(app);
serverHttp.listen(process.env.HTTP_PORT, process.env.IP);
serverHttp.on('listening', () => console.info(`Notes App running at http://${process.env.IP}:${process.env.HTTP_PORT}`));

const db = {
    host: process.env.SECRET_HOST,
    port: process.env.SECRET_PORT,
    user: process.env.SECRET_USER,
    password: process.env.SECRET_KEY,
    database: process.env.SECRET_DATABASE
}

const userValidationFromDataBase = (data,r,res,r2) =>{
    if(data[0].username === r.user && data[0].password === r.password){
        res.json({ validAdmin: true})
    }else if(r2[0].username === r.user && r2[0].password === r.password){
        res.json({ valid: true})
    }else{
        res.json({ valid: false})
    }
}   

const userEmailValidationFromDataBase = async (data,r,res,connection) =>{
    for(let i = 0;i < data.length;i++){
        if(data[i].email === r.email || data[i].username === r.user){
            return res.json({ isAvailable: false})
        }
    }
    await connection.query(
        `INSERT INTO user(username,password,email,admin)Values("${r.user}","${r.password}","${r.email}",0)`)
    return res.json({ isAvailable: true})
}

app.post('/apiForValidation', async (req,res) =>{
    const connection = mysql.createConnection(db);
    try{
        await connection.connect();
        const results = await new Promise((resolve,reject)=>{
            connection.query('SELECT * FROM user WHERE admin = 1', (error, result)=>{
                if(error){
                    reject(error);
                }else{
                    resolve(result)
                }
            })
        })
        const results2 = await new Promise((resolve,reject)=>{
            connection.query('SELECT * FROM user', (error, result)=>{
                if(error){
                    reject(error);
                }else{
                    resolve(result)
                }
            })
        })
        if(req.body.email){
            userEmailValidationFromDataBase(results2,req.body,res,connection)
        }else{
            userValidationFromDataBase(results,req.body,res,results2)
        }
        connection.end()


    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Error al consultar a la base de datos.'})
    }
})

