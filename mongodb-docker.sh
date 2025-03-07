#!/bin/bash
# Run this script with: bash mongodb-docker.sh [command]

# MongoDB Docker management script for Idleverse

function check_docker() {
  if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    echo "Visit https://docs.docker.com/get-docker/ for installation instructions."
    exit 1
  fi

  if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit https://docs.docker.com/compose/install/ for installation instructions."
    exit 1
  fi
}

function start_mongodb() {
  echo "Starting MongoDB container..."
  docker-compose up -d mongodb
  echo "Waiting for MongoDB to start..."
  sleep 5
  echo "MongoDB is now running on localhost:27017"
  echo "Connection string: mongodb://localhost:27017/idleverse"
}

function stop_mongodb() {
  echo "Stopping MongoDB container..."
  docker-compose stop mongodb
  echo "MongoDB container stopped."
}

function status_mongodb() {
  echo "MongoDB container status:"
  docker-compose ps mongodb
}

function reset_mongodb() {
  echo "WARNING: This will delete all data in MongoDB."
  read -p "Are you sure you want to continue? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Stopping MongoDB container..."
    docker-compose down -v
    echo "Starting fresh MongoDB container..."
    docker-compose up -d mongodb
    echo "MongoDB has been reset."
  fi
}

function shell_mongodb() {
  echo "Opening MongoDB shell..."
  docker-compose exec mongodb mongosh
}

# Check if Docker is installed
check_docker

# Process command line arguments
case "$1" in
  start)
    start_mongodb
    ;;
  stop)
    stop_mongodb
    ;;
  status)
    status_mongodb
    ;;
  reset)
    reset_mongodb
    ;;
  shell)
    shell_mongodb
    ;;
  *)
    echo "Usage: $0 {start|stop|status|reset|shell}"
    echo
    echo "  start  - Start the MongoDB container"
    echo "  stop   - Stop the MongoDB container"
    echo "  status - Check the status of the MongoDB container"
    echo "  reset  - Reset the MongoDB container (WARNING: DELETES ALL DATA)"
    echo "  shell  - Open a MongoDB shell in the container"
    exit 1
esac

exit 0
