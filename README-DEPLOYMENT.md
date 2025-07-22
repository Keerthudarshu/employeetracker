# Employee Tracker - Vercel Deployment Guide

## 🚀 Deployment Steps

### 1. Prerequisites
- Neon PostgreSQL database (already configured)
- Vercel account
- Git repository (already set up)

### 2. Deploy to Vercel

#### Option A: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts and select your project settings
```

#### Option B: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository: `Keerthudarshu/employeetracker`
4. Configure environment variables (see below)
5. Click "Deploy"

### 3. Environment Variables
Set these in Vercel Dashboard → Project → Settings → Environment Variables:

```
DATABASE_URL=postgresql://neondb_owner:npg_DvENXdJyM43V@ep-broad-heart-aevcq6xf-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NODE_ENV=production
```

### 4. Post-Deployment Setup
After successful deployment, run the setup script to create initial data:

```bash
# Run this once after deployment
vercel env pull .env.local
npm run setup-production
```

### 5. Access Your Application
- **Frontend**: `https://your-app.vercel.app`
- **Admin Login**: Username: `admin`, Password: `admin123`
- **Employee Login**: ID: `EMP001`, Password: `employee123`

## 📋 Application Features
- **Admin Dashboard**: Employee management, reports viewing, analytics
- **Employee Portal**: Daily report submission, personal report history
- **Real-time Data**: Connected to Neon PostgreSQL database
- **Responsive Design**: Works on desktop and mobile devices

## 🔧 Technical Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: Neon PostgreSQL
- **ORM**: Drizzle ORM
- **Deployment**: Vercel
- **Build Tool**: Vite

## 🔑 Default Credentials
### Admin Access
- Username: `admin`
- Password: `admin123`

### Employee Access  
- Employee ID: `EMP001`
- Password: `employee123`
- Name: John Doe

## 🛡️ Security Notes
- Change default passwords after first login
- Environment variables are securely stored in Vercel
- Database connections use SSL encryption
- Session-based authentication with secure tokens
