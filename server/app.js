import express from 'express';
import session from 'express-session'
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import configRoutes from './routes/index.js'

const app = express();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use CORS middleware
app.use(cors()); // Allows all origins by default

// Static files middleware - Serve files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public'))); 
// This will make http://localhost:3000/uploads/posts/your-image.jpg work

// If you want requests to /images/your-image.jpg to map to /public/uploads/posts/your-image.jpg:
// app.use('/images', express.static(path.join(__dirname, 'public/uploads/posts')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        name: 'FinalProject',
        secret: "This is a secret",
        saveUninitialized: false,
        resave: false,
        cookie: { maxAge: 1800000 }
    })
);
// app.use(middleware.logger);


configRoutes(app);
app.listen(3000, () => {
    console.log("We've now got a server!");
    console.log('Your routes will be running on http://localhost:3000');
});