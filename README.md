# Smart Log Management Project

A full-stack MERN application for document verification and management.

## Project Structure

```
├── client/          # React + Vite frontend
├── server/          # Express.js backend
└── package.json     # Root package.json
```

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (MongoDB Atlas or local instance)
- npm or yarn

## Local Development Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Variables

#### Server Environment Variables (`server/.env`)

Create a `.env` file in the `server` directory with the following variables:

```env
MONGO_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
JWT_SECRET=your_jwt_secret_key
PORT=4000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
GEMINI_API_KEY=your_gemini_api_key
```

#### Client Environment Variables (`client/.env`)

Create a `.env` file in the `client` directory:

```env
VITE_API_PATH=http://localhost:4000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

### 3. Run the Application

#### Start the Server

```bash
cd server
npm run dev
```

The server will run on `http://localhost:4000`

#### Start the Client

```bash
cd client
npm run dev
```

The client will run on `http://localhost:5173`

## Railway Deployment

### Prerequisites for Railway

1. A Railway account (sign up at [railway.app](https://railway.app))
2. GitHub repository connected to Railway
3. MongoDB Atlas database (or Railway MongoDB service)

### Deployment Steps

#### 1. Deploy Backend (Server)

1. Create a new project in Railway
2. Add a new service and select "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect the Node.js project
5. Set the root directory to `server`
6. Configure the following environment variables in Railway:

   - `MONGO_URI` - Your MongoDB connection string
   - `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
   - `CLOUDINARY_API_KEY` - Cloudinary API key
   - `CLOUDINARY_API_SECRET` - Cloudinary API secret
   - `JWT_SECRET` - Your JWT secret (use a strong random string)
   - `PORT` - Railway will set this automatically, but you can use `PORT` variable
   - `GOOGLE_CLIENT_ID` - Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
   - `GOOGLE_REDIRECT_URI` - Update to your Railway frontend URL (e.g., `https://your-frontend.railway.app/auth/google/callback`)
   - `GEMINI_API_KEY` - Gemini API key
   - `NODE_ENV` - Set to `production`

7. Railway will automatically:
   - Install dependencies (`npm install`)
   - Run the start command (`npm start`)

#### 2. Deploy Frontend (Client)

1. Add another service in the same Railway project
2. Select "Deploy from GitHub repo" (same repository)
3. Set the root directory to `client`
4. Configure build and start commands:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview` (or use a static file server)
   
   **Note:** For Vite apps, you might want to use a static file server. Consider adding `serve` package:
   ```json
   "scripts": {
     "preview": "vite preview",
     "serve": "serve dist -s"
   }
   ```

5. Configure environment variables:
   - `VITE_API_PATH` - Your Railway backend URL (e.g., `https://your-backend.railway.app/api`)
   - `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID
   - `VITE_GOOGLE_REDIRECT_URI` - Your Railway frontend URL (e.g., `https://your-frontend.railway.app/auth/google/callback`)

#### 3. Update CORS Settings

After deployment, update the CORS origin in `server/server.js` to include your Railway frontend URL:

```javascript
cors({
  origin: [
    "http://localhost:5173",
    "https://your-frontend.railway.app"
  ],
  credentials: true,
  // ... rest of config
})
```

### Railway Configuration

The project includes a `railway.json` file for Railway-specific configuration. Railway will automatically:
- Detect Node.js projects
- Install dependencies
- Run the start command

### Important Notes

1. **Environment Variables**: Never commit `.env` files. All sensitive data should be set in Railway's environment variables section.

2. **Database**: Use MongoDB Atlas for production. Update the `MONGO_URI` with your Atlas connection string.

3. **CORS**: Make sure to update CORS settings to allow your production frontend URL.

4. **Google OAuth**: Update Google OAuth redirect URIs in Google Cloud Console to include your production URLs.

5. **Static Files**: For the frontend, Railway can serve static files. Make sure the build output (`dist` folder) is properly configured.

## Scripts

### Server Scripts
- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm test` - Run tests

### Client Scripts
- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Technologies Used

### Backend
- Express.js
- MongoDB with Mongoose
- Socket.io
- JWT Authentication
- Cloudinary (for file uploads)
- Google OAuth
- Gemini AI

### Frontend
- React
- Vite
- Framer Motion
- Tailwind CSS
- React Router
- Axios

## License

ISC

