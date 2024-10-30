#!/bin/bash

# Update package lists
sudo apt-get update

# Install necessary packages
sudo apt-get install -y unzip

# Create the directory for the web application
sudo mkdir -p /var/www/webapp

# Unzip the webapp.zip file to the correct location
sudo unzip /tmp/webapp.zip -d /var/www/webapp

# # Set the ownership of the webapp directory
# sudo chown -R www-data:www-data /var/www/webapp
sudo chown -R csye6225:csye6225 /opt/csye6225
sudo chmod -R 755 /opt/csye6225
 
# Start and enable your service (assuming you have a service setup)
sudo systemctl start csye6225.service
sudo systemctl enable csye6225.service
