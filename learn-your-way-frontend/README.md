# Learn Your Way - Frontend Application

A modern, personalized learning platform built with React, Redux, and Tailwind CSS, inspired by Google's Learn Your Way design system.

## 🎨 Design Reference

UI/UX patterns replicated from: [https://learnyourway.withgoogle.com/](https://learnyourway.withgoogle.com/)

## ✨ Features

### Authentication & Onboarding
- **Email/Password Authentication** with real-time validation
- **Google OAuth Integration** for seamless sign-in
- **COPPA Compliance** with parental consent for users under 13
- **Multi-step Profile Setup** wizard with progress tracking
- **Learning Style Quiz** (Visual, Auditory, Kinesthetic, Reading/Writing)
- **Personalized Recommendations** based on learning preferences

### Core Features
- **Content Upload** (PDF, DOC, DOCX, TXT)
- **Interactive Learning** with adaptive content
- **Quiz & Assessment System**
- **Knowledge Graph Visualization**
- **Mind Map Generation**
- **Real-time Collaboration** (Study Rooms)
- **Progress Analytics & Tracking**

## 🛠️ Tech Stack

### Frontend Framework
- **React 18.2** - UI framework
- **Vite** - Build tool and dev server
- **React Router Dom 6** - Client-side routing

### State Management
- **Redux Toolkit** - Global state management
- **Redux Thunk** - Async actions

### Styling
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Icons** - Icon library

### Forms & Validation
- **Formik** - Form management
- **Yup** - Schema validation

### API & Data
- **Axios** - HTTP client
- **Socket.io Client** - WebSocket for real-time features
- **JWT Decode** - Token parsing

### Authentication
- **@react-oauth/google** - Google OAuth integration

## 📁 Project Structure

```
learn-your-way-frontend/
├── src/
│   ├── components/
│   │   ├── auth/              # Authentication components
│   │   │   ├── LoginForm.jsx
│   │   │   └── SignUpForm.jsx
│   │   ├── dashboard/         # Dashboard components
│   │   ├── learning/          # Learning interface components
│   │   ├── quiz/              # Quiz components
│   │   ├── profile/           # User profile components
│   │   ├── upload/            # File upload components
│   │   ├── mindmap/           # Mind map visualization
│   │   ├── collaboration/     # Real-time collaboration
│   │   └── shared/            # Reusable components
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Card.jsx
│   │       ├── Modal.jsx
│   │       ├── Toast.jsx
│   │       ├── LoadingSpinner.jsx
│   │       ├── ProgressBar.jsx
│   │       ├── Select.jsx
│   │       └── Checkbox.jsx
│   ├── pages/
│   │   ├── Home.jsx           # Landing page
│   │   ├── Dashboard.jsx      # User dashboard
│   │   ├── Learn.jsx          # Learning interface
│   │   ├── Quiz.jsx           # Quiz interface
│   │   ├── Profile.jsx        # User profile
│   │   ├── Upload.jsx         # Content upload
│   │   └── StudyRoom.jsx      # Collaboration space
│   ├── services/
│   │   ├── api.js             # API client configuration
│   │   ├── auth.js            # Authentication service
│   │   ├── websocket.js       # WebSocket service
│   │   └── storage.js         # Local storage service
│   ├── store/
│   │   ├── slices/
│   │   │   ├── authSlice.js   # Auth state
│   │   │   ├── userSlice.js   # User state
│   │   │   ├── profileSlice.js # Profile state
│   │   │   ├── preferencesSlice.js # Preferences state
│   │   │   ├── learningStyleSlice.js # Learning style state
│   │   │   └── uiSlice.js     # UI state (modals, toasts, etc.)
│   │   └── store.js           # Redux store configuration
│   ├── hooks/                 # Custom React hooks
│   ├── utils/
│   │   ├── validation.js      # Validation utilities
│   │   ├── helpers.js         # Helper functions
│   │   └── constants.js       # App constants
│   ├── styles/
│   │   └── index.css          # Global styles
│   ├── App.jsx                # Root component
│   └── main.jsx               # Entry point
├── public/                    # Static assets
├── .env.example               # Environment variables template
├── index.html                 # HTML template
├── package.json               # Dependencies
├── vite.config.js             # Vite configuration
├── tailwind.config.js         # Tailwind configuration
├── postcss.config.js          # PostCSS configuration
└── README.md                  # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

1. **Clone the repository**
   ```bash
   cd learn-your-way-platform/learn-your-way-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   - API endpoints for backend agents
   - Google OAuth client ID
   - Feature flags
   - App configuration

4. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🌐 API Integration

The frontend connects to multiple backend agents:

### Security Agent (Port 8017)
- Authentication (signup, login, logout)
- Token verification and refresh
- Password management

### Personalization Agent (Port 8002)
- User profile management
- Learning preferences
- Learning style quiz
- Personalized recommendations

### Content Ingestion Agent (Port 8001)
- File upload and processing
- Content management

### Assessment Agent (Port 8003)
- Quiz generation and management
- Quiz submission and grading

### Analytics Agent (Port 8004)
- User activity tracking
- Progress analytics

### Learning Science Agent (Port 8005)
- Spaced repetition algorithms
- Learning recommendations
- Next topic suggestions

### Knowledge Graph Agent (Port 8006)
- Knowledge graph visualization
- Related topics discovery

### Mindmap Agent (Port 8007)
- Mind map generation
- Mind map visualization

## 🎨 Design System

### Colors
- **Primary**: Blue (#1e88e5) - Main brand color
- **Secondary**: Pink (#e91e63) - Accent color
- **Success**: Green (#4caf50)
- **Warning**: Orange (#ff9800)
- **Error**: Red (#f44336)
- **Neutral**: Gray scale

### Typography
- **Font Family**: Inter (body), Poppins (headings)
- **Font Sizes**: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl, 8xl, 9xl

### Components
All components follow the Google Material Design principles with custom styling inspired by learnyourway.withgoogle.com

## 🔐 Authentication Flow

1. **Sign Up**
   - Email/password or Google OAuth
   - Age verification (COPPA compliance)
   - Parental consent (if under 13)
   - Terms & Privacy acceptance

2. **Profile Setup** (Multi-step wizard)
   - Basic information (name, grade, school)
   - Learning preferences
   - Interests & goals
   - Learning style quiz

3. **Dashboard**
   - Personalized recommendations
   - Progress tracking
   - Quick access to features

## 🔒 Security Features

- JWT-based authentication
- Automatic token refresh
- Secure local storage
- COPPA compliance
- Input validation and sanitization
- XSS protection
- CSRF protection

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- Touch-friendly interface
- Adaptive layouts

## 🌍 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📄 License

This project is part of the Learn Your Way platform.

## 👥 Contributing

Please follow the existing code style and patterns when contributing.

## 🐛 Known Issues

None at this time.

## 📞 Support

For support, please contact the development team.

---

Built with ❤️ using React, Redux, and Tailwind CSS
