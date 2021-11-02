const express = require('express')
const { MongoClient } = require('mongodb');
const admin = require("firebase-admin");
require('dotenv').config();
const cors = require('cors');;
const app = express();
const port = process.env.PORT || 5000;

// firebase admin initialization



const serviceAccount = require('./ema-john-4a67e-firebase-adminsdk-t7g69-ad2ea1bab4.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});



//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f6j7z.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const idToken = req.headers.authorization.split("Bearer ")[1];
        console.log('inside separate function', idToken);
        try {
            const decodedUser = await admin.auth().verifyIdToken(idToken);
            req.decodedUserEmail = decodedUser.email;
            //     const decodedUser = await admin.auth().verifyIdToken(idToken);
            console.log("decodedUser :", decodedUser);
            //     req.decodedUserEmail = decodedUser.email;
        }
        catch {

        }
    }

    next()

}


async function run() {

    try {
        await client.connect();
        console.log('database connect successfully');

        const database = client.db('online_shop')
        const productCollection = database.collection('products');
        const orderCollection = database.collection('orders');

        //GET Products API
        app.get('/products', async (req, res) => {
            //console.log(req.query);
            const cursor = productCollection.find({});
            const page = req.query.page;
            const size = parseInt(req.query.size);


            let products;
            const count = await cursor.count();
            if (page) {
                products = await cursor.skip(page * size).limit(size).toArray()
            }
            else {
                products = await cursor.toArray();
            }


            res.send({
                count,
                products

            });

        })

        // Use POST to get data by keys
        app.post('/products/byKeys', async (req, res) => {

            const keys = req.body;
            const query = { key: { $in: keys } }
            const products = await productCollection.find(query).toArray();
            res.json(products);

        });

        // ADD  API Orders Post   

        app.get('/orders', verifyToken, async (req, res) => {
            //console.log(req.headers.authorization);
            const email = req.query.email;
            console.log(req.decodedUserEmail);
            console.log(email);
            if (req.decodedUserEmail == email) {
                const query = { email: email }
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                res.json(orders)
                // res.send(orders);
            } else {
                res.status(401).send('User not Authorized');
            }


        })

        app.post('/orders', async (req, res) => {

            const order = req.body;
            order.createdAt = new Date();
            const result = await orderCollection.insertOne(order);
            res.send(result);

        });


    }
    finally {
        // await client.close();
    }

}
run().catch(console.dir)


app.get('/', (req, res) => {
    res.send('Ema jon server  is running')
})
app.listen(port, () => {
    console.log('Ema jon server running at port ', port);
})