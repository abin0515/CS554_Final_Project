# CS554 Final Project

## Database Deployments

### Database Services
Both MongoDB and Redis have been deployed in an AWS VM for our project:

- **MongoDB**: Deployed and accessible at `18.188.222.62:27017` 
- **Redis**: Deployed using Redis Stack Server and accessible at `18.188.222.62:6379`

### Connection Configuration
The connection details for both databases are configured in the `config/settings.js` file. Please refer to this file for the connection strings when developing features that require database access.



### Getting Started
1. Clone this repository
2. Run `npm install` to install all dependencies
3. Start the application with `npm start`

Remember, all database services are already configured and running in the AWS VM, so no local database setup is required for development.
