//Here you will import route files and export the constructor method as shown in lecture code and worked in previous labs.
import likesRouter from './likes.js';
import { authenticate } from '../middleware/authenticate.js';

// const router = Router();
const constructorMethod = (app) => {
  app.use('/likes', authenticate, likesRouter);

  app.use('*', (req, res) => {
    res.status(404).send("Please check you url!");
  });
};

export default constructorMethod;
