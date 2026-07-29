# Running Locally on Your Mac Mini

## ✅ Project Location

The project is installed on your Mac mini at:
```
/Users/shahrukh/phoenux-case-study-assembler
```

## 🚀 Quick Start

### Option 1: Use the Start Script (Easiest)
```bash
cd /Users/shahrukh/phoenux-case-study-assembler
./START_SERVER.sh
```

### Option 2: Manual Start
```bash
cd /Users/shahrukh/phoenux-case-study-assembler

# Load nvm (Node Version Manager)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Start the server
npm run dev
```

## 🌐 Access the Application

Once the server is running, open your browser and visit:

### Main Pages
- **Home**: http://localhost:3000
- **Templates Showcase**: http://localhost:3000/templates
- **Projects**: http://localhost:3000/projects
- **Create New Project**: http://localhost:3000/projects/new

### Template Demos (Direct HTML)
- **Website Case Study**: http://localhost:3000/api/templates/demo/website
- **LinkedIn Carousel**: http://localhost:3000/api/templates/demo/linkedin-carousel
- **LinkedIn Post**: http://localhost:3000/api/templates/demo/linkedin-post
- **Upwork Portfolio**: http://localhost:3000/api/templates/demo/upwork
- **PDF Presentation**: http://localhost:3000/api/templates/demo/pdf

### Interactive Previews
- http://localhost:3000/templates/preview/website
- http://localhost:3000/templates/preview/linkedin-carousel
- http://localhost:3000/templates/preview/upwork

## 🛠️ Common Commands

```bash
# Stop the server (press Ctrl+C in the terminal)

# Restart the server
./START_SERVER.sh

# Build for production
npm run build

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 🐛 Troubleshooting

### "npm: command not found"
Make sure nvm is loaded:
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

### Port 3000 already in use
Kill existing processes:
```bash
lsof -ti:3000 | xargs kill -9
```

### Pages not loading
1. Make sure the server is running (look for "Ready in" message)
2. Check http://localhost:3000 in your browser
3. Clear browser cache
4. Try a different browser

### Server won't start
```bash
# Check Node/npm versions
node --version  # Should be v20 or higher
npm --version   # Should be v10 or higher

# Reinstall dependencies
cd /Users/shahrukh/phoenux-case-study-assembler
rm -rf node_modules package-lock.json
npm install
```

## 📂 Project Structure

```
/Users/shahrukh/phoenux-case-study-assembler/
├── src/
│   ├── app/                    # Next.js pages and routes
│   │   ├── (app)/templates/    # Templates showcase
│   │   └── api/templates/      # Template API endpoints
│   ├── components/             # React components
│   └── lib/                    # Utilities and services
│       └── templates/          # HTML template generators
├── .data/                      # Local JSON storage (no database)
├── package.json                # Dependencies
├── START_SERVER.sh             # Easy server startup script
└── README.md                   # Main documentation
```

## 💾 Data Storage

The app runs in **local mode** without a database. All data is stored in:
```
/Users/shahrukh/phoenux-case-study-assembler/.data/
```

To use Supabase database:
1. Create a Supabase project
2. Copy `.env.example` to `.env.local`
3. Add your Supabase credentials
4. Restart the server

## 🌍 Network Access

The server is also accessible on your local network at:
```
http://192.168.0.10:3000
```

You can access it from other devices on the same WiFi.

## ✨ Features

- 5 professional output templates
- Drag-and-drop project creation
- Local file storage (no database required)
- Responsive Tailwind design
- API endpoints for template generation

---

For deployment instructions, see [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)

For more details, see [README.md](./README.md)
