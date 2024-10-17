#!/bin/bash

# Add PostgreSQL APT repository to get the latest versions
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

# Import PostgreSQL signing key
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update package lists
sudo apt-get update

# Install the PostgreSQL server and contrib packages
sudo apt-get install -y postgresql postgresql-contrib

# Enable and start the PostgreSQL service
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Set up PostgreSQL user and database
if [ -z "${TEST_DB_USER}" ] || [ -z "${TEST_DB_PASSWORD}" ]; then
  echo "DB_USER or DB_PASSWORD environment variable is not set. Exiting."
  exit 1
fi

# Check if user exists, create or alter user if necessary
if sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${TEST_DB_USER}';" | grep -q 1; then
  echo "User exists, altering password..."
  sudo -u postgres psql -c "ALTER USER ${TEST_DB_USER} WITH PASSWORD '${TEST_DB_PASSWORD}';"
else
  echo "User does not exist, creating user..."
  sudo -u postgres psql -c "CREATE USER ${TEST_DB_USER} WITH PASSWORD '${TEST_DB_PASSWORD}';"
fi

# Check if database exists, create database if necessary
if sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${TEST_DB_NAME}';" | grep -q 1; then
  echo "Database ${TEST_DB_NAME} already exists."
else
  echo "Creating database ${TEST_DB_NAME}..."
  sudo -u postgres psql -c "CREATE DATABASE ${TEST_DB_NAME} OWNER ${TEST_DB_USER};"
fi
