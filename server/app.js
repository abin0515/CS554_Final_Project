import express from 'express';
import session from 'express-session'
import cors from 'cors';

import configRoutes from './routes/index.js'

const app = express();

// Use CORS middleware
app.use(cors()); // Allows all origins by default

// If you want to restrict it to only your frontend origin (recommended for production):
// app.use(cors({ origin: 'http://localhost:5173' })); 

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