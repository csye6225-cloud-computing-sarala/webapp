#!/bin/bash
# Unzip and set up the web app
cd /tmp
sudo unzip webapp.zip -d /var/www/webapp

# Set correct ownership to the csye6225 user
sudo chown -R csye6225:csye6225 /var/www/webapp

# Reload systemd to recognize the new service
sudo systemctl daemon-reload
sudo systemctl enable csye6225.service
