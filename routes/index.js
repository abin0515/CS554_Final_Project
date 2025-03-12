//Here you will import route files and export them as used in previous labs
import userRounter from './users.js'
const constructorMethod = (app) => {
    app.use('/', userRounter);
    
  
    app.use('*', (req, res) => {
      res.status(404).json({error: '404 Not found'});
      
    });
  };
  
  export default constructorMethod;