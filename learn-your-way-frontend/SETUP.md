# Learn Your Way - Frontend Setup Guide

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: For cloning the repository

Check your versions:
```powershell
node --version
npm --version
```

## Installation Steps

### 1. Navigate to Frontend Directory
```powershell
cd learn-your-way-platform\learn-your-way-frontend
```

### 2. Install Dependencies
```powershell
npm install
```

This will install:
- React 18.2 + React Router Dom
- Redux Toolkit for state management
- Tailwind CSS for styling
- Formik + Yup for form validation
- Axios for API calls
- Framer Motion for animations
- Socket.io-client for WebSocket
- Google OAuth for authentication
- And more...

### 3. Configure Environment Variables

Copy the example environment file:
```powershell
Copy-Item .env.example .env
```

Edit `.env` and configure your backend endpoints:
```env
# App Configuration
VITE_APP_NAME=Learn Your Way
VITE_APP_ENV=development
VITE_MINIMUM_AGE=13

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# API Endpoints (update ports if needed)
VITE_API_BASE_URL=http://localhost:8000/api
VITE_CONTENT_SERVICE_URL=http://localhost:8001
VITE_PERSONALIZATION_SERVICE_URL=http://localhost:8002
VITE_ASSESSMENT_SERVICE_URL=http://localhost:8003
VITE_ANALYTICS_SERVICE_URL=http://localhost:8004
VITE_LEARNING_SCIENCE_SERVICE_URL=http://localhost:8005
VITE_KNOWLEDGE_GRAPH_SERVICE_URL=http://localhost:8006
VITE_MINDMAP_SERVICE_URL=http://localhost:8007
VITE_SECURITY_SERVICE_URL=http://localhost:8017

# WebSocket
VITE_WS_URL=http://localhost:8000
```

### 4. Start Development Server
```powershell
npm run dev
```

The application will start at `http://localhost:5173`

## Available Scripts

### Development
```powershell
npm run dev          # Start development server with HMR
```

### Building
```powershell
npm run build        # Build for production
npm run preview      # Preview production build locally
```

### Code Quality
```powershell
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## Quick Start Guide

### 1. First Run
1. Open `http://localhost:5173` in your browser
2. You'll see the landing page with "Re-imagining textbooks for every learner"
3. Click "Get Started Free" to sign up

### 2. Create Account
Two options:
- **Email signup**: Fill out the form with name, email, password, age
  - If under 13, parental consent is required (COPPA compliance)
  - Password must meet strength requirements
- **Google OAuth**: Click "Sign up with Google" for instant access

### 3. Complete Profile (Coming Soon)
After signup, you'll be guided through:
- Basic info (grade, school)
- Learning preferences
- Subject interests
- Learning style quiz

### 4. Dashboard
Once authenticated, you'll see:
- **Quick Actions**: Upload content, continue learning, take quizzes
- **Stats**: Courses, study hours, goals, achievements
- **Recent Courses**: Continue where you left off
- **Upcoming Quizzes**: See what's due
- **Recommendations**: Personalized course suggestions

### 5. Upload Content
1. Navigate to Upload page
2. Drag & drop PDF/DOC/DOCX/TXT files (up to 50MB)
3. Select subject and grade level
4. Add optional description
5. Click "Upload and Process Files"
6. Files will be transformed into interactive lessons

### 6. Learning
- Browse content by subject, grade, or search
- Switch between grid and list views
- Track progress on each course
- Continue learning or start new courses

### 7. Take Quizzes
- View quiz instructions
- Answer multiple choice questions
- See immediate results with explanations
- Review correct/incorrect answers
- Retake quizzes to improve

### 8. Profile Settings
- Update personal information
- Select learning interests (subjects)
- Set learning goals
- Manage account settings
- Enable/disable notifications

### 9. Study Rooms
- Join collaborative study sessions
- Video chat with peers (simulated)
- Real-time chat messaging
- Share study materials
- Track session time

## Architecture Overview

### State Management (Redux)
```
store/
├── slices/
│   ├── authSlice.js          # Authentication state
│   ├── userSlice.js          # User data
│   ├── profileSlice.js       # Profile information
│   ├── preferencesSlice.js   # User preferences
│   ├── learningStyleSlice.js # Learning style data
│   └── uiSlice.js            # UI state (modals, toasts)
```

### Services
```
services/
├── api.js        # Axios client + 8 backend service integrations
├── auth.js       # Authentication logic + COPPA compliance
├── storage.js    # LocalStorage/SessionStorage management
└── websocket.js  # WebSocket client for real-time features
```

### Components
```
components/
├── auth/         # Login, Signup forms
├── shared/       # Reusable UI components (Button, Input, Card, etc.)
└── [feature]/    # Feature-specific components (coming soon)
```

### Pages
```
pages/
├── Home.jsx       # Landing page
├── Dashboard.jsx  # User dashboard
├── Learn.jsx      # Learning content browser
├── Quiz.jsx       # Quiz interface
├── Profile.jsx    # Profile settings
├── Upload.jsx     # File upload
└── StudyRoom.jsx  # Collaboration space
```

## Backend Integration

The frontend connects to 8 backend microservices:

1. **Security Agent (8017)**: Authentication, authorization, JWT
2. **Personalization Agent (8002)**: User profiles, preferences, learning styles
3. **Content Agent (8001)**: Content upload, storage, retrieval
4. **Assessment Agent (8003)**: Quiz generation, scoring, feedback
5. **Analytics Agent (8004)**: Learning analytics, progress tracking
6. **Learning Science Agent (8005)**: Pedagogical recommendations
7. **Knowledge Graph Agent (8006)**: Concept relationships, prerequisites
8. **Mindmap Agent (8007)**: Visual concept maps

## Troubleshooting

### Port Already in Use
If port 5173 is busy:
```powershell
# Find and kill process:
$process = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($process) {
    Stop-Process -Id $process.OwningProcess -Force
}

# Or change port in vite.config.js:
# server: { port: 3000 }
```

### Module Not Found
```powershell
# Clean install:
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

### Build Errors
```powershell
# Clear Vite cache:
Remove-Item -Recurse -Force node_modules/.vite
npm run dev
```

### Backend Connection Issues
1. Verify backend services are running:
   ```powershell
   # Check if ports are listening:
   netstat -an | Select-String "8001|8002|8003|8004|8005|8006|8007|8017"
   ```

2. Check `.env` file has correct URLs

3. Ensure CORS is enabled on backend:
   ```python
   # Python FastAPI example:
   from fastapi.middleware.cors import CORSMiddleware
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:5173"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

### Google OAuth Not Working
1. Get Google Client ID from [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add `http://localhost:5173` to authorized JavaScript origins
4. Add `http://localhost:5173` to authorized redirect URIs
5. Copy Client ID to `.env` file:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
   ```

### Tailwind CSS Not Working
1. Ensure PostCSS is configured (postcss.config.js)
2. Check tailwind.config.js exists
3. Verify styles are imported in src/styles/index.css
4. Restart dev server

### Hot Module Replacement (HMR) Issues
```powershell
# Restart dev server:
# Press Ctrl+C to stop, then:
npm run dev
```

## Production Deployment

### Build for Production
```powershell
npm run build
```

This creates optimized files in the `dist/` directory.

### Preview Production Build
```powershell
npm run preview
```

### Deploy to Hosting

**Vercel:**
```powershell
npm install -g vercel
vercel
```

**Netlify:**
```powershell
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**Manual Deployment:**
1. Upload `dist/` folder to your web server
2. Configure environment variables on hosting platform
3. Ensure backend APIs are accessible from production domain
4. Update CORS settings on backend to allow production domain

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Opera (latest 2 versions)

## Next Steps

After setup, explore:
1. 📚 Complete the onboarding flow (when implemented)
2. 🎨 Customize Tailwind theme in `tailwind.config.js`
3. 🔌 Test API integrations with backend services
4. 🧪 Run tests (when test suite is added)
5. 📊 Monitor analytics and user feedback

## Resources

- [React Documentation](https://react.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [Formik](https://formik.org/)
- [Framer Motion](https://www.framer.com/motion/)

## Support

For issues or questions:
1. Check this setup guide
2. Review the main README.md
3. Check backend agent logs for API errors
4. Review browser console for frontend errors
5. Contact the development team

## License

This project is part of the Learn Your Way platform.
