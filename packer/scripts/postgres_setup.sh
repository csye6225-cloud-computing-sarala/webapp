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
