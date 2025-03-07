#!/bin/bash
# Run this script with: bash start-idleverse-db.sh

echo "🎮 Starting Idleverse with Database Support 🎮"
echo "---------------------------------------------"

# Check if .env file exists, if not create it from sample
if [ ! -f .env ]; then
  echo "📄 Creating .env file from sample.env"
  cp sample.env .env
  echo "✅ Please edit .env to set your JWT secret"
  echo "   MongoDB connection is already configured for Docker."
else
  # Make sure MONGO_URI is set in existing .env file
  if ! grep -q "MONGO_URI" .env; then
    echo "📄 Adding MongoDB connection string to .env file"
    echo "\n# MongoDB Configuration\nMONGO_URI=mongodb://localhost:27017/idleverse" >> .env
  fi
  
  # Make sure JWT_SECRET is set in existing .env file
  if ! grep -q "JWT_SECRET" .env; then
    echo "📄 Adding default JWT secret to .env file"
    echo "\n# JWT Secret Key (change this in production)\nJWT_SECRET=dev_secret_key_12345" >> .env
  fi
fi

# Start MongoDB container
echo "🐳 Starting MongoDB container..."
bash mongodb-docker.sh start

# Check if the installation is needed
if [ ! -d "node_modules/mongoose" ]; then
  echo "⬇️ Installing database dependencies..."
  bash install-db.sh
fi

# Start the development server
echo "🚀 Starting Idleverse server and client..."
echo "   Server will be available at: http://localhost:5000"
echo "   Client will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

npm run dev:db
