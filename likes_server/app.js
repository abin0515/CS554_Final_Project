// Setup server, session and middleware here.


import express from 'express';
import cors from 'cors';
const app = express();

import configRoutes from './routes/index.js'

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
     origin: ['http://localhost:5173', 'http://localhost:4173'],
     optionsSuccessStatus: 200
   };
app.use(cors(corsOptions));


configRoutes(app);

app.listen(3001, () => {
     console.log("We've now got a server!");
     console.log('Your routes will be running on http://localhost:3001');
});
