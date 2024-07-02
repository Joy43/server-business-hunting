import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from 'mongodb';
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  port: process.env.SMTP_PORT || 587,
});

const sendEmail = async (mailOptions) => {
  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const db = client.db('Business');
    const userCollection = db.collection('user');
    const productCollection = db.collection('product');
    const ordersCollection = db.collection('orders');

    // Add to cart route with email functionality
    app.post('/addcart', async (req, res) => {
      const orderData = req.body;

      try {
        const result = await ordersCollection.insertOne(orderData);

        // Send email to owner
        const ownerMailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.OWNER_EMAIL || "owner@example.com", // Update with your owner's email
          subject: "New Order Received",
          text: JSON.stringify(orderData),
        };
        await sendEmail(ownerMailOptions);

        // Send confirmation email to user
        const userMailOptions = {
          from: process.env.EMAIL_USER,
          to: orderData.email,
          subject: "Thank you for your order",
          text: `Dear ${orderData.name},\n\nThank you for your order. We have received your order and will process it soon.\n\nBest regards,\nYour Company Name`,
        };
        await sendEmail(userMailOptions);

        res.send(result);
      } catch (error) {
        console.error("Error adding order:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // Retrieve all orders
    app.get('/addcart', async (req, res) => {
      try {
        const result = await ordersCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).send("add card data fetching error");
      }
    });

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

    // Product routes
    app.post('/product', async (req, res) => {
      const products = req.body;

      try {
        const result = await productCollection.insertOne(products);
        res.send(result);
      } catch (error) {
        console.error("Error adding products", error);
        res.status(500).send("Internal Server Error");
      }
    });

    app.get('/product', async (req, res) => {
      try {
        const result = await productCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error('Error fetching product data', error);
        res.status(500).send("Internal Server Error");
      }
    });

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on: ${PORT}`);
    });

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
