packer {
  required_plugins {
    amazon = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

# Define variables
variable "aws_profile" {
  type = string
}

variable "aws_region" {
  description = "AWS region where the AMI will be created"
  type        = string
}

variable "aws_instance_type" {
  description = "Instance type to use for building the AMI"
  type        = string
}

variable "aws_source_ami" {
  description = "Source AMI to use for building the custom image"
  type        = string
}

variable "aws_vpc_id" {
  description = "VPC ID where the build instance will run"
  type        = string
}

variable "aws_subnet_id" {
  description = "Subnet ID within the VPC where the build instance will run"
  type        = string
}

variable "volume_size" {
  description = "Size of the root volume in GB"
  type        = number
}

variable "prod_db_user" {
  type = string
}

variable "prod_db_password" {
  type = string
}

variable "prod_db_name" {
  type = string
}

variable "prod_db_port" {
  type = string
  # default = "5432"
}

variable "demo_account_id" {
  description = "AWS Account ID for the demo account where the AMI should be shared."
  type        = string
}


# Define the source for AWS Amazon AMI
source "amazon-ebs" "ubuntu" {
  profile       = var.aws_profile
  region        = var.aws_region
  ami_name      = "ubuntu-24.04-${formatdate("YYYY-MM-DD-hh-mm-ss", timestamp())}"
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

  # Check if webapp.zip exists before provisioning
  provisioner "file" {
    source      = "./webapp.zip"
    destination = "/tmp/webapp.zip"
  }

  # Provision the systemd service file
  provisioner "file" {
    source      = "./packer/service/csye6225.service"
    destination = "/tmp/csye6225.service"
  }

  # Use sudo to move the service file to systemd directory and reload systemd daemon
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

  # Start and set up the web app
  provisioner "shell" {
    script = "./packer/scripts/app_setup.sh"
  }

  # Transfer the environment file
  provisioner "file" {
    source      = "./environment/development.env"
    destination = "/tmp/development.env"
  }

  # Copy the environment file to the correct location
  provisioner "shell" {
    inline = [
      "sudo mv /tmp/development.env /var/www/webapp/.env"
    ]
  }

  # Install PostgreSQL
  provisioner "shell" {
    script = "./packer/scripts/postgres_setup.sh"
    environment_vars = [
      "DB_USER=${var.prod_db_user}",
      "DB_PASSWORD=${var.prod_db_password}",
      "DB_NAME=${var.prod_db_name}",
      "DB_PORT=${var.prod_db_port}"
    ]
  }
  post-processor "shell-local" {
    inline = [
      "echo \"Sharing AMI with account ${var.demo_account_id}\"",
      "echo Modifying image permissions for AMI ID {{.BuildID}}",
      "aws ec2 modify-image-attribute --image-id {{.BuildID}} --launch-permission 'Add=[{\"UserId\":\"${var.demo_account_id}\"}]'"
    ]
  }
}