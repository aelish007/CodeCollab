# CodeBoard Deployment Guide

This guide will help you deploy your CodeBoard application to make it live on the internet. CodeBoard consists of two parts that need to be deployed separately:

1. Frontend (React application)
2. Backend (Node.js/Express server)

## Prerequisites

- GitHub account (to push your code)
- Netlify account (for frontend deployment)
- Vercel account (for backend deployment)
- Your project code pushed to GitHub (follow the instructions in `github-push-instructions.md`)

## Step 1: Deploy the Backend to Vercel

1. Sign up or log in to [Vercel](https://vercel.com/)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure the project:
   - Root Directory: `CodeBoard/backend`
   - Framework Preset: Node.js
5. Add the following environment variables:
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `PORT`: 3001 (though Vercel will override this)
6. Click "Deploy"
7. Once deployed, note the URL of your backend (e.g., `https://codeboard-backend.vercel.app`)

## Step 2: Deploy the Frontend to Netlify

1. Sign up or log in to [Netlify](https://netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect to your GitHub repository
4. Configure the build settings:
   - Base directory: `CodeBoard/frontend`
   - Build command: `npm run build`
   - Publish directory: `CodeBoard/frontend/dist`
5. Add the following environment variable:
   - `VITE_SERVER_URL`: The URL of your deployed backend from Step 1 (e.g., `https://codeboard-backend.vercel.app`)
6. Click "Deploy site"

## Step 3: Update CORS Settings in Backend

After deploying both frontend and backend, you need to update the CORS settings in your backend code to allow requests from your deployed frontend URL:

1. In your backend's `index.js` file, update the CORS configuration:

```javascript
const io = new Server(server, {
    cors: {
        origin: ["https://your-frontend-netlify-url.netlify.app", "http://localhost:5173"],
        methods: ["GET", "POST"],
    },
});
```

2. Redeploy your backend to Vercel

## Step 4: Verify Your Deployment

1. Visit your Netlify frontend URL
2. Test the application by creating a room and testing the features
3. Ensure that the frontend can communicate with the backend

## Troubleshooting

### Connection Issues

If your frontend cannot connect to the backend:

1. Check that the `VITE_SERVER_URL` environment variable is set correctly in Netlify
2. Verify that CORS is properly configured in the backend
3. Check the browser console for any error messages

### Deployment Failures

1. Check the build logs in Netlify or Vercel for error messages
2. Ensure all dependencies are properly listed in your package.json files
3. Verify that your .env files are not being pushed to GitHub (they should be in .gitignore)

## Maintaining Your Deployment

When you make changes to your code:

1. Push the changes to GitHub
2. Netlify and Vercel will automatically rebuild and redeploy your application

Congratulations! Your CodeBoard application is now live and accessible to users worldwide.