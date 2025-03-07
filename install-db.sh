#!/bin/bash
# Run this script with: bash install-db.sh

# Install MongoDB, Mongoose, and other packages
npm install mongoose dotenv
npm install jsonwebtoken bcryptjs

# Install optional packages for session management if needed later
npm install express-session connect-mongo

echo "Database dependencies installed!"
