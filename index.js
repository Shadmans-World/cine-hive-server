const express = require("express");
const cors = require('cors')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000;
const {
  MongoClient,
  ServerApiVersion,
  ObjectId
} = require('mongodb');

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.bho7r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    // await client.connect();

    const movieCollection = client.db("MoviesDB").collection('movies');
    const usersCollection = client.db("CIneUsersDB").collection('cineUsers');
    const favoritesCollection = client.db("MoviesDB").collection('favorites');

    app.get('/movies', async (req, res) => {
      const cursor = movieCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post('/movies', async (req, res) => {
      const movie = req.body;
      const result = await movieCollection.insertOne(movie);
      res.send(result);
    });

    app.get('/movies/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await movieCollection.findOne(query);
      res.send(result);
    });

    app.delete('/movies/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await movieCollection.deleteOne(query);
      res.send(result);
    });

    app.put('/movies/:id', async (req, res) => {
      const id = req.params.id;
      const updatedMovie = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: updatedMovie,
      };
      const result = await movieCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    app.get('/featured', async (req, res) => {
      try {
       
        const cursor = movieCollection.find().sort({ rating: -1 }).limit(6);  
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching featured movies:", error);
        res.status(500).send({ message: "Error fetching featured movies" });
      }
    });

    // User routes
    app.post('/users', async (req, res) => {
      const user = req.body;

      const existingUser = await usersCollection.findOne({ email: user.email });

      if (existingUser) {
        return res.status(400).send({ message: 'User with this email already exists.' });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get('/users', async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // Favorites routes
    app.post('/favorites', async (req, res) => {
      const favoriteMovie = req.body;

      const existingFavorite = await favoritesCollection.findOne({
        userEmail: favoriteMovie.userEmail,
        movieId: favoriteMovie.movieId
      });

      if (existingFavorite) {
        return res.status(400).send({
          message: 'This movie is already in your favorites.'
        });
      }

      const result = await favoritesCollection.insertOne(favoriteMovie);
      res.send(result);
    });

    app.get('/favorites', async (req, res) => {
      const cursor = favoritesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // Get user's favorite movies
    app.get('/favorites/:email', async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await favoritesCollection.find(query).toArray();
      res.send(result);
    });

    // Delete a favorite movie
    app.delete('/favorites/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await favoritesCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.log);

app.get('/', (req, res) => {
  res.send('WELCOME TO CINEHIVE');
});

app.listen(port, (req, res) => {
  console.log('CineHive is running on PORT: ', port);
});
