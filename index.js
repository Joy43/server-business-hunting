import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from 'mongodb';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uri = process.env.MONGODB_URL;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const db = client.db('Business');
    const userCollection = db.collection('user');
 const productCollection=db.collection('product');
    // User routes
    app.get('/user', async (req, res) => {
      try {
        const result = await userCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // 
    app.post('/user', async (req, res) => {
      const user = req.body;
      const query = { email: user.email };

      try {
        const existingUser = await userCollection.findOne(query);
        if (existingUser) {
          return res.send({ message: 'User already exists', insertedId: null });
        }
        const result = await userCollection.insertOne(user);
        res.send({ insertedId: result.insertedId });
      } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).send("Internal Server Error");
      }
    });


    // ------product-----

    app.post('/product',async(req,res)=>{
const products=req.body;

try{
const result=await productCollection.insertOne(products);
res.send(result)
}catch(error){
console.error("error add products",error);
res.status(500).send("Internal Server Error");
}

    })

  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

run().catch(console.error);

app.get("/", (req, res) => {
  res.status(200).send("Server is ready");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Something went wrong:", err);
  res.status(500).send("Something went wrong!");
});

app.listen(PORT, () => {
  console.log(`Server is running on :${PORT}`);
});
