packer {
  required_plugins {
    amazon = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

# Define variables (as in your original code)

# Define the source for AWS Amazon AMI
source "amazon-ebs" "ubuntu" {
  profile       = var.aws_profile
  region        = var.aws_region
  ami_name      = var.aws_ami_name
  instance_type = var.aws_instance_type
  vpc_id        = var.aws_vpc_id
  subnet_id     = var.aws_subnet_id

  # Use the latest Ubuntu 24.04 LTS AMI
  source_ami_filter {
    filters = {
      name                = "ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["099720109477"] # Canonical ID for Ubuntu
  }

  ssh_username = "ubuntu"

  ami_block_device_mappings {
    device_name           = "/dev/sda1"
    volume_size           = var.volume_size
    delete_on_termination = true
    volume_type           = "gp2"
  }
}

# Build section with provisioners
build {
  sources = [
    "source.amazon-ebs.ubuntu"
  ]

  # Install 'unzip' and other required tools before using them
  provisioner "shell" {
    inline = [
      "sudo apt-get update",
      "sudo apt-get install -y unzip"
    ]
  }

  # Upload webapp.zip to /tmp directory
  provisioner "file" {
    source      = "./webapp.zip"
    destination = "/tmp/webapp.zip"
  }

  # Ensure webapp.zip exists and unzip it
  provisioner "shell" {
    inline = [
      "if [ ! -f /tmp/webapp.zip ]; then echo 'webapp.zip not found!' && exit 1; fi",
      "sudo unzip /tmp/webapp.zip -d /var/www/webapp",
      "sudo chown -R www-data:www-data /var/www/webapp"
    ]
  }

  # Provision the systemd service file
  provisioner "file" {
    source      = "./packer/service/csye6225.service"
    destination = "/tmp/csye6225.service"
  }

  # Move the service file and reload systemd daemon
  provisioner "shell" {
    inline = [
      "sudo mv /tmp/csye6225.service /etc/systemd/system/csye6225.service",
      "sudo systemctl daemon-reload",
      "sudo systemctl enable csye6225.service"
    ]
  }

  # Provision OS updates
  provisioner "shell" {
    script = "./packer/scripts/os_update.sh"
  }

  # Create user for the application
  provisioner "shell" {
    script = "./packer/scripts/user_creation.sh"
  }

  # Install Node.js
  provisioner "shell" {
    script = "./packer/scripts/node_setup.sh"
  }

  # Install PostgreSQL
  provisioner "shell" {
    script = "./packer/scripts/postgres_setup.sh"
  }

  # Start and set up the web app
  provisioner "shell" {
    script = "./packer/scripts/app_setup.sh"
  }
}