#!/bin/bash

echo "Cleaning and reinstalling Winnipen dependencies..."

echo ""
echo "Step 1: Cleaning existing node_modules..."
rm -rf node_modules
rm -rf backend/node_modules
rm -rf frontend/node_modules

echo ""
echo "Step 2: Cleaning package-lock files..."
rm -f package-lock.json
rm -f backend/package-lock.json
rm -f frontend/package-lock.json

echo ""
echo "Step 3: Installing root dependencies..."
npm install

echo ""
echo "Step 4: Installing backend dependencies..."
cd backend
npm install
cd ..

echo ""
echo "Step 5: Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "Installation complete! You can now run:"
echo "  npm run dev"
echo ""






