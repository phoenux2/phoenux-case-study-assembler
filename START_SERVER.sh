#!/bin/bash

# Start the Phoenux Case Study Assembler dev server
# This script properly sources nvm to ensure npm is available

echo "🚀 Starting Phoenux Case Study Assembler..."

# Source nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Verify npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm not found. Please install Node.js via nvm."
    exit 1
fi

echo "✓ Using Node $(node --version)"
echo "✓ Using npm $(npm --version)"

# Navigate to project directory
cd "$(dirname "$0")"

# Start the dev server
echo ""
echo "Starting Next.js development server..."
echo "The app will be available at:"
echo ""
echo "  📋 Templates:     http://localhost:3000/templates"
echo "  🏠 Home:          http://localhost:3000"
echo "  📁 Projects:      http://localhost:3000/projects"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
