Scrimverse Frontend

A modern, responsive React application for managing esports tournaments, scrims, team registrations, and competitive gaming events.

🎯 Overview

Scrimverse Frontend is a feature-rich React-based web application that provides an intuitive interface for players and hosts to manage tournaments, scrims, teams, and competitive gaming activities. Built with modern web technologies and best practices.

✨ Key Features


🏆 Tournament & Scrim Management



Browse Tournaments: Explore upcoming and ongoing tournaments with advanced filtering

Tournament Details: View comprehensive tournament information, rules, and schedules

Scrim Listings: Quick practice matches with simplified registration

Live Standings: Real-time leaderboards and match results

Match Tracking: Follow match progress and results

Registration System: Easy team registration with payment integration


👥 User Roles & Dashboards

Player Features



Player Dashboard: Personalized dashboard with tournament history

Team Management: Create and manage teams, handle join requests

Tournament Registration: Register teams for tournaments and scrims

Match History: View past matches and performance statistics

Profile Management: Update profile, avatar, and gaming credentials

Leaderboards: Track rankings and achievements

Host Features



Host Dashboard: Comprehensive tournament management interface

Create Tournaments: Set up tournaments with custom rules and formats

Create Scrims: Quick scrim creation with simplified settings

Match Management: Create matches, update scores, manage groups

Registration Management: Approve/reject team registrations

Winner Selection: Declare winners and distribute prizes

Analytics: View tournament statistics and participant data


🎨 User Interface



Modern Design: Clean, intuitive, and responsive UI

Dark Mode Support: Eye-friendly dark theme

Mobile Responsive: Optimized for all screen sizes

Smooth Animations: Engaging micro-interactions

Toast Notifications: Real-time feedback for user actions

Loading States: Skeleton loaders and progress indicators


🔐 Authentication & Security



JWT Authentication: Secure token-based authentication

Google OAuth: One-click social login

Email Verification: Email-based account verification

Password Reset: Secure password recovery flow

Protected Routes: Role-based access control

Session Management: Automatic token refresh


💳 Payment Integration



PhonePe Integration: Seamless payment processing

Pricing Plans: Visual plan selection (Basic, Featured, Premium)

Payment Status: Real-time payment tracking

Transaction History: Complete payment records


🎮 Gaming Features



Multi-Game Support: BGMI, Free Fire, COD Mobile, Valorant

Custom Banners: Upload tournament/scrim banners (Premium)

Default Assets: Game-specific default banners

Team Rosters: Manage player lineups

Points System: Comprehensive scoring and ranking


🛠️ Tech Stack



Framework: React 18.2.0

Routing: React Router DOM 6.21.0

HTTP Client: Axios 1.6.2

Styling: CSS3 + TailwindCSS 3.4.0

Authentication: JWT + Google OAuth (@react-oauth/google)

UI Components: Custom components with Lucide React icons

Image Processing: html2canvas for standings export

Build Tool: Create React App (react-scripts 5.0.1)

Testing: Jest + React Testing Library

Code Quality: ESLint, Prettier, Husky, lint-staged


📋 Prerequisites


Node.js 16.0 or higher
npm 8.0 or higher (or yarn)
Backend API running (see backend README)


🚀 Local Setup

1. Clone the Repository


git clone https://gitlab.com/sukruth1/scrimverse-frontend.git
cd scrimverse-frontend


2. Install Dependencies


npm install
# or
yarn install


3. Environment Configuration

Create a .env file in the project root:

# Backend API URL (Django server)
REACT_APP_API_URL=http://localhost:8000/api

# Media URL (for images/files)
REACT_APP_MEDIA_URL=http://localhost:8000

# Google OAuth Client ID (optional)
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id


4. Start Development Server


npm start
# or
yarn start


The application will open at http://localhost:3000/
5. Build for Production


npm run build
# or
yarn build


Production-ready files will be in the build/ directory.

📁 Project Structure


scrimverse-frontend/
├── public/                    # Static files
│   ├── index.html            # HTML template
│   ├── favicon.ico           # Favicon
│   └── assets/               # Public assets
├── src/
│   ├── components/           # Reusable components
│   │   ├── Navbar.js        # Navigation bar
│   │   ├── Footer.js        # Footer component
│   │   ├── TournamentCard.js # Tournament card
│   │   ├── ScrimCard.js     # Scrim card
│   │   ├── ProtectedRoute.js # Route protection
│   │   ├── Toast.js         # Toast notifications
│   │   ├── Modal components/ # Various modals
│   │   └── ...              # 60+ components
│   ├── pages/                # Page components
│   │   ├── HomePage.js      # Landing page
│   │   ├── LoginPage.js     # Login page
│   │   ├── RegisterPage.js  # Registration page
│   │   ├── TournamentList.js # Tournament listing
│   │   ├── TournamentDetail.js # Tournament details
│   │   ├── ScrimList.js     # Scrim listing
│   │   ├── ScrimDetail.js   # Scrim details
│   │   ├── PlayerDashboard.js # Player dashboard
│   │   ├── HostDashboard.js # Host dashboard
│   │   ├── CreateTournament.js # Tournament creation
│   │   ├── CreateScrim.js   # Scrim creation
│   │   ├── ManageTournament.js # Tournament management
│   │   ├── CreateTeam.js    # Team creation
│   │   ├── TeamManagement.js # Team management
│   │   └── ...              # 60+ pages
│   ├── context/              # React Context
│   │   └── AuthContext.js   # Authentication context
│   ├── hooks/                # Custom hooks
│   │   ├── useToast.js      # Toast notifications hook
│   │   └── usePhonePe.js    # PhonePe payment hook
│   ├── utils/                # Utility functions
│   │   ├── api.js           # API client
│   │   └── helpers.js       # Helper functions
│   ├── App.js                # Main app component
│   ├── index.js              # Entry point
│   └── index.css             # Global styles
├── .env                       # Environment variables
├── .eslintrc.js              # ESLint configuration
├── .prettierrc               # Prettier configuration
├── package.json              # Dependencies
└── tailwind.config.js        # TailwindCSS config



🎨 Available Scripts

Development


# Start development server
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:ci

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check


Production


# Build for production
npm run build

# Serve production build locally (requires serve package)
npx serve -s build



🔌 Key Components

Authentication Components



LoginPage: User login with email/password or Google OAuth

RegisterPage: User registration with role selection (Player/Host)

ProtectedRoute: Route wrapper for authenticated access

GoogleOAuthCompleteModal: Google OAuth completion flow

Tournament Components



TournamentCard: Tournament preview card with key details

TournamentDetail: Comprehensive tournament information

CreateTournament: Multi-step tournament creation wizard

ManageTournament: Host tournament management interface

TournamentPlanSelector: Pricing plan selection

RegistrationModal: Team registration modal

Scrim Components



ScrimCard: Scrim preview card

ScrimDetail: Scrim information and registration

CreateScrim: Scrim creation form

ScrimConfigModal: Scrim configuration settings

Team Components



CreateTeam: Team creation form

TeamManagement: Team roster and settings management

TeamDetailsModal: Team information display

JoinRequestsModal: Handle team join requests

AddPlayersModal: Add players to team

Match Components



MatchConfigModal: Match creation and configuration

MatchPointsModal: Update match scores

GroupManagementView: Manage tournament groups

PointsTableModal: View points table

Dashboard Components



PlayerDashboard: Player overview and statistics

HostDashboard: Host tournament management

PlayerTournamentCard: Player's tournament card

UI Components



Navbar: Responsive navigation with role-based menu

Footer: Site footer with links

Toast: Notification system

CountdownTimer: Tournament countdown

EmailVerificationBanner: Email verification reminder

ConfirmModal: Confirmation dialogs

ErrorBoundary: Error handling wrapper


🎯 User Flows

Player Flow



Sign Up → Email verification → Player dashboard

Browse Tournaments → View details → Register team → Make payment

Create Team → Invite players → Manage roster

Join Tournament → Track matches → View standings

View Results → Check leaderboard → Earn achievements

Host Flow



Sign Up as Host → Wait for admin approval → Host dashboard

Create Tournament → Select plan → Configure settings → Publish

Manage Registrations → Approve teams → Create groups

Start Tournament → Create matches → Update scores

Manage Tournament → Monitor progress → Select winner


🔐 Authentication Flow


// Login with email/password
POST /api/accounts/login/
→ Receive JWT tokens
→ Store in localStorage
→ Redirect to dashboard

// Login with Google OAuth
Google OAuth flow
→ POST /api/accounts/google-auth/
→ Receive JWT tokens
→ Store in localStorage
→ Redirect to dashboard

// Protected routes
Check localStorage for token
→ If valid: Allow access
→ If expired: Refresh token
→ If no token: Redirect to login



💳 Payment Integration


// PhonePe payment flow
1. Select tournament plan
2. Click "Proceed to Payment"
3. Initiate payment via PhonePe SDK
4. Redirect to PhonePe payment page
5. Complete payment
6. Callback to backend
7. Update registration status
8. Show success/failure message



🧪 Testing


# Run all tests
npm test

# Run tests with coverage
npm run test:ci

# Run tests in watch mode
npm test -- --watch

# View coverage report
open coverage/lcov-report/index.html



🎨 Styling Guidelines

CSS Organization


Global styles in index.css

Component-specific styles in component CSS files
TailwindCSS utilities for rapid development
CSS variables for theming

Design System



Colors: Consistent color palette with CSS variables

Typography: System fonts with fallbacks

Spacing: 8px grid system

Breakpoints: Mobile-first responsive design

Animations: Smooth transitions and micro-interactions


🌍 Deployment

Production Build


# Create optimized production build
npm run build

# Test production build locally
npx serve -s build


Deployment Platforms

Netlify


# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod


Vercel


# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod


AWS S3 + CloudFront


# Build
npm run build

# Upload to S3
aws s3 sync build/ s3://your-bucket-name

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"


Environment Variables for Production

Update .env with production values:

REACT_APP_API_URL=https://api.scrimverse.com/api
REACT_APP_MEDIA_URL=https://api.scrimverse.com
REACT_APP_GOOGLE_CLIENT_ID=your-production-google-client-id



🔧 Configuration Files

ESLint Configuration

Configured to catch common React issues and enforce best practices.
Prettier Configuration

Consistent code formatting across the project.
Husky + lint-staged

Pre-commit hooks to ensure code quality:

Auto-format with Prettier
Lint with ESLint
Run tests (optional)


🐛 Troubleshooting

Common Issues

API Connection Error

# Verify backend is running
curl http://localhost:8000/api/

# Check REACT_APP_API_URL in .env
echo $REACT_APP_API_URL


Build Errors

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear React cache
rm -rf node_modules/.cache


CORS Issues

# Ensure backend CORS settings include frontend URL
# Check backend .env CORS_ALLOWED_ORIGINS


Port Already in Use

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm start


Google OAuth Not Working

# Verify REACT_APP_GOOGLE_CLIENT_ID is set
# Check Google Cloud Console OAuth settings
# Ensure authorized JavaScript origins include http://localhost:3000



📊 Performance Optimization



Code Splitting: Lazy loading for routes

Image Optimization: Compressed images and lazy loading

Bundle Analysis: Use npm run build and analyze bundle size

Caching: Service worker for offline support (optional)

Memoization: React.memo for expensive components


🤝 Contributing


Fork the repository
Create a feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Merge Request

Code Style


Follow ESLint and Prettier configurations
Write meaningful commit messages
Add comments for complex logic
Write tests for new features


📝 License

This project is proprietary and confidential.

👥 Team



Development Team: Scrimverse Frontend Team

Contact: support@scrimverse.com



📚 Additional Resources


React Documentation
React Router Documentation
TailwindCSS Documentation
Axios Documentation
Create React App Documentation


🎉 Features Roadmap



 Real-time match updates with WebSockets

 In-app chat for teams

 Tournament brackets visualization

 Advanced analytics dashboard

 Mobile app (React Native)

 Live streaming integration

 Tournament templates

 Social sharing features


Happy Gaming! 🎮