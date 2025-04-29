# CS554 Final Project

## Database Deployments

### Database Services
Both MongoDB and Redis have been deployed in an AWS VM for our project:

- **MongoDB**: Deployed and accessible at `18.188.222.62:27017` 
- **Redis**: Deployed using Redis Stack Server and accessible at `18.188.222.62:6379`

### Messaging Service
- **RabbitMQ**: Deployed using RabbitMQ and accessible on browser at `18.188.222.62:15672`
Because we have multiple servers in the backend, we use RabbitMQ as a message queue to facilitate communication across these servers.

Management Dashboard Access:
username: `myuser`, password: `mypassword`

### Connection Configuration
The connection details for both databases are configured in the `config/settings.js` file. Please refer to this file for the connection strings when developing features that require database access.



### Getting Started
1. Clone this repository
2. Run `npm install` to install all dependencies
3. Start the application with `npm start`, for react-ui, run `npm run dev`

