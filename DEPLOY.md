# Deploy Choatix License Backend (Free)

## Step 1: Create Neon Database (2 min)

1. Go to https://neon.tech
2. Sign up with GitHub
3. Create a new project (any name)
4. Copy the **connection string** (looks like `postgresql://...@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`)

## Step 2: Push to GitHub

```bash
cd C:\Users\evald\Documents\choatix-v2
git add .
git commit -m "Backend for cloud hosting"
git push
```

## Step 3: Deploy to Render (2 min)

1. Go to https://render.com
2. Sign up with GitHub
3. Click **New** > **Web Service**
4. Connect your `zylenofficial/choatix-v2` repo
5. Settings:
   - **Name**: `choatix-license`
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
   - **Plan**: Free
6. Add environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: (paste your Neon connection string)
7. Click **Create Web Service**

## Step 4: Get Your Backend URL

After deploy, Render gives you a URL like:
`https://choatix-license.onrender.com`

Test it: open `https://choatix-license.onrender.com/api/health` in browser

## Step 5: Update the App

The app needs to know your backend URL. Open `src/lib/license.ts` and replace:

```js
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
```

With your actual URL:

```js
const BACKEND_URL = 'https://choatix-license.onrender.com'
```

Then rebuild:
```bash
npm run electron:build
```

## Step 6: Update Bot

In `choatix-discord-system/bot/.env`, change:

```
BACKEND_URL=http://localhost:3001
```

To:

```
BACKEND_URL=https://choatix-license.onrender.com
```

## Step 7: Generate Keys

Open `generate-keys.bat` and change the URL from `localhost:3001` to your Render URL.

## That's It!

- Your backend runs 24/7 for free
- Even when your PC is off, clients can verify licenses
- Data persists in Neon PostgreSQL (free 0.5 GB)
