# Vercel Deployment Guide

## Prerequisites
1. Vercel account (sign up at vercel.com)
2. GitHub repository with your project

## Setup

### 1. Connect GitHub Repository
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Select the `frontend` folder as root

### 2. Configure Environment Variables
Add in Vercel dashboard:
```
DATABASE_URL=your_production_mysql_url
```

### 3. Deploy
Click "Deploy" - Vercel will automatically build and deploy.

## API Deployment (Separate)
For the backend API, consider:
- **Railway**: Great for Node.js + MySQL
- **Render**: Free tier available
- **AWS Elastic Beanstalk**: More complex but scalable

### Railway Quick Start
```bash
npm i -g railway
railway login
railway init
railway add mysql
railway up
```

## Vercel.json Configuration
Already configured in frontend/vercel.json for API proxy.

## Custom Domain
1. Go to Project Settings > Domains
2. Add your domain (e.g., gameweb.school.edu.kr)
3. Configure DNS records as instructed
