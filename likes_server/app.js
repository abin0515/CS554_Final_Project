// Setup server, session and middleware here.


import express from 'express';

const app = express();

import configRoutes from './routes/index.js'

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



configRoutes(app);

app.listen(3001, () => {
     console.log("We've now got a server!");
     console.log('Your routes will be running on http://localhost:3001');
});