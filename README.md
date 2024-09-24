# Cloud Application

This application, named "Cloud", is a Node.js web application using Express and Sequelize for PostgreSQL database interaction. It is set up to run in a Node.js environment, utilizing modern JavaScript features.

## Prerequisites

To run this application, you will need:

- [Node.js](https://nodejs.org/) (Version 12 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/download/) installed and running
- npm (Typically installed with Node.js)

## Installation

### 1. Clone the Repository

`````bash
git clone git@github.com:saralasharanappa/webapp.git
cd cloud

### 2. Install Dependencies
Run the following command in the root directory of the project to install the required npm packages:
````bash
npm install


### 3. Configure Environment
Create a .env file in the root directory with the necessary environment variables:
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database_name
DB_DIALECT=postgres
DB_PORT=postgres_port
PORT=node_port

Running in Development Mode
Utilize Nodemon for live reloading during development:
````bash
npm run dev

Running in Production Mode
Execute the following command to start the server using Node:
````bash
npm start

Testing
Run automated tests configured with Jest and Supertest by executing:
````bash
npm test

Author
Sarala Sharanappa Kanakagiri
`````
