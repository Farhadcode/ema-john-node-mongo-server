const express = require('express')
const { MongoClient } = require('mongodb');
require('dotenv').config();
const cors = require('cors');;
const app = express();
const port = process.env.PORT || 5000;



//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f6j7z.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });



async function run() {

    try {
        await client.connect();
        console.log('database connect successfully');

        const database = client.db('online_shop')
        const productCollection = database.collection('products');

        //GET Products API
        app.get('/products', async (req, res) => {
            console.log(req.query);
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
            // res.send(products);
            res.send(products);

        })


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