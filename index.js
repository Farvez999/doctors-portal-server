const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
// const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middle wares
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mordayw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const appointmentOptionsCollection = client.db("doctorsPortal").collection("appointmentOptions");
        const bookingsCollection = client.db("doctorsPortal").collection("bookings");

        /***
         * API Naming Convention 
         * app.get('/bookings')
         * app.get('/bookings/:id')
         * app.post('/bookings')
         * app.patch('/bookings/:id')
         * app.delete('/bookings/:id')
        */

        //All data get
        app.get('/appointmentOptions', async (req, res) => {
            const date = req.query.date
            // console.log(date)
            const query = {};
            const options = await appointmentOptionsCollection.find(query).toArray();

            const bookingQuery = { appointmentDate: date }
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();

            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name)
                const bookslots = optionBooked.map(book => book.slot)
                const remainingSlots = option.slots.filter(slot => !bookslots.includes(slot))
                option.slots = remainingSlots;
            })
            res.send(options);
        });

        // bookings post (submit data)
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking)

            const query = {
                appointmentDate: booking.appointmentDate,
                email: booking.email,
                treatment: booking.treatment

            }

            const alreadyBooked = await bookingsCollection.find(query).toArray();

            if (alreadyBooked.length) {
                const message = `You have already Booking on ${booking.appointmentDate}`
                return res.send({ acknowledged: false, message });
            }

            const result = await bookingsCollection.insertOne(booking)
            res.send(result);
        })


    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Doctor Portal is Running')
})

app.listen(port, () => {
    console.log(`Doctor Portal running on Server ${port}`);
})