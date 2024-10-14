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

DigitalOcean Deployment
To deploy the application on a DigitalOcean droplet, follow these steps:

1. SSH into the Droplet
SSH into your DigitalOcean droplet using your SSH key:

````bash
ssh do
2. Copy Project to the Droplet
Copy the project files (e.g., a zipped version of your project) to the server:

````bash
scp -i ~/.ssh/<your_ssh_key> -r ~/path_to_your_project/fileName.zip <server_alias>:/root/<destination_directory>

3. Install Required Software
Once on the server, install the required software:

Install unzip:
````bash
sudo apt-get update
sudo apt-get install unzip

Install nodejs and npm:
````bash
sudo apt install nodejs npm

4. Unzip the Project
Unzip the copied project file:
````bash
unzip fileName.zip
cd fileName

5. Install Project Dependencies
````bash
npm install

6. Install and Configure PostgreSQL
Install PostgreSQL and set up the database:
````bash
sudo apt install postgresql postgresql-contrib

Access the PostgreSQL shell:
````bash
sudo -u postgres psql

Create the database and user:
````sql
CREATE USER <user> WITH ENCRYPTED PASSWORD '<password>';
CREATE DATABASE cloud_prod;
GRANT ALL PRIVILEGES ON DATABASE cloud_prod TO <password>;
\q

7. Configure Environment Variables
In the root directory of the project, create a .env file with your environment variables:
````bash
DB_HOST=<IP>
DB_USER=<user>
DB_PASSWORD=<password>
DB_NAME=cloud_prod
DB_DIALECT=postgres
DB_PORT=<port>
PORT=<port>

8. Start the Application
Run the application in production mode:
````bash
npm start

Author
Sarala Sharanappa Kanakagiri
`````

*Test Runs*
Test Run 1
Test Run 2
Test Run 3
Test Run 4
Test Run 5
Test Run 6
Test Run 7
Test Run 8