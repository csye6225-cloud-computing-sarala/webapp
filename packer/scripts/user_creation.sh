#!/bin/bash

# Check if group exists, if not, create it
if ! getent group csye6225 > /dev/null 2>&1; then
    sudo groupadd csye6225
    echo "Group csye6225 created."
else
    echo "Group csye6225 already exists."
fi

# Create the user and add to the group
sudo useradd -m -g csye6225 csye6225
echo "User csye6225 created and added to csye6225 group."
