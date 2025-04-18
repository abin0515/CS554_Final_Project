//Here you will import route files and export them as used in previous labs
import userRouter from './users.js'
import postRouter from './posts.js'
import testRouter from './test.js'
import uploadRouter from './uploads.js'

const constructorMethod = (app) => {
    app.use('/', userRouter);
    app.use('/test', testRouter);
    app.use('/posts', postRouter);
    app.use('/uploads', uploadRouter);
  
    app.use('*', (req, res) => {
      res.status(404).json({error: '404 Not found'});
      
    });
  };
  
  export default constructorMethod;