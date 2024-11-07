#!/bin/bash

# Update package lists
sudo apt-get update

# Install necessary packages
sudo apt-get install -y unzip

# Create the directory for the web application and logs
sudo mkdir -p /var/www/webapp/logs

# Unzip the webapp.zip file to the correct location
sudo unzip /tmp/webapp.zip -d /var/www/webapp

# Set the ownership of the webapp directory and logs directory to csye6225
sudo chown -R csye6225:csye6225 /var/www/webapp
sudo chmod -R 755 /var/www/webapp

# Set permissions for the logs directory specifically
sudo chmod 755 /var/www/webapp/logs

# sudo systemctl start csye6225.service
sudo systemctl enable csye6225.service