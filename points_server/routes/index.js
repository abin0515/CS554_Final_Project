import boardRouter from './board.js';

// const router = Router();
const constructorMethod = (app) => {
  app.use('/board', boardRouter);

  app.use('*', (req, res) => {
    res.status(404).send("Please check you url!");
  });
};

export default constructorMethod;