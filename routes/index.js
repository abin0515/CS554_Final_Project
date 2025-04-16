//Here you will import route files and export them as used in previous labs
import userRouter from './users.js'
import testRouter from './test.js'

const constructorMethod = (app) => {
    app.use('/', userRouter);
    
    
  
    app.use('*', (req, res) => {
      res.status(404).json({error: '404 Not found'});
      
    });
  };
  
  export default constructorMethod;