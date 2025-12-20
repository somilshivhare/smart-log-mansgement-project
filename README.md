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

## Deployment

This project is configured for deployment using **Vercel (Frontend) + Render (Backend)**.

### Recommended Deployment Platforms

- **Frontend**: Deploy to [Vercel](https://vercel.com) for best performance and CDN
- **Backend**: Deploy to [Render](https://render.com) for WebSocket support (Socket.io)

### Important Notes

1. **Environment Variables**: Never commit `.env` files. All sensitive data should be set in your deployment platform's environment variables section.

2. **Database**: Use MongoDB Atlas for production. Update the `MONGO_URI` with your Atlas connection string.

3. **CORS**: The backend automatically uses the `FRONTEND_URL` environment variable for CORS configuration.

4. **Google OAuth**: Update Google OAuth redirect URIs in Google Cloud Console to include your production URLs.

5. **Health Check**: The backend includes a `/health` endpoint for monitoring services.

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

