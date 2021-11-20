const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
const fileUpload = require('express-fileupload');

const app = express();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xflbu.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;


app.use(cors());
app.use(express.json());
app.use(bodyParser());
app.use(express.static('doctors'));
app.use(fileUpload());

const port = 5000

app.get('/', (req, res) => {
  res.send('Hello World!')
})


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const appointmentCollection = client.db("doctorsPortal").collection("appointments");
  const doctorsCollection = client.db("doctorsPortal").collection("doctors");
  
  app.post('/addAppointments', (req, res) =>{
      const appointment = req.body;
      console.log(appointment);
      appointmentCollection.insertOne(appointment)
      .then(result =>{
          res.send(result)
      })
  })

  app.post('/appointmentsByDate', (req, res) =>{
      const date = req.body;
      const email = req.body.email;
      doctorsCollection.find({email: email})
      .toArray((err, doctors) =>{
        const filter = {date: date.date};
        if(doctors.length === 0){
          filter.email = email;
        }
        appointmentCollection.find(filter)
        .toArray((err, documents) =>{
        res.send(documents);
        })
      })
  })

  app.get('/allAppointments',(req, res) =>{
    appointmentCollection.find({})
    .toArray((err, documents) =>{
      res.send(documents)
    })
  })


  app.post('/doctors', async (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const pic = req.files.file;
    const picData = pic.data;
    const encodedPic = picData.toString('base64');
    const imageBuffer = Buffer.from(encodedPic, 'base64');
    const doctor = {
        name,
        email,
        image: imageBuffer
    }
    const result = await doctorsCollection.insertOne(doctor);
    res.json(result);
  })

  app.get('/doctors', async (req, res) =>{
    const cursor = doctorsCollection.find({});
    const doctors = await cursor.toArray();
    res.json(doctors);
  })

  app.post('/isDoctor', (req,res) =>{
    const email = req.body.email;
    doctorsCollection.find({email: email})
    .toArray((err, document) =>{
      res.send(document.length > 0);
    })
  })

});


app.listen(process.env.PORT || port);