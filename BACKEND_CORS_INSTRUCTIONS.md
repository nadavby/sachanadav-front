# CORS Configuration Instructions for Backend

## Problem Diagnosis

The frontend is experiencing CORS (Cross-Origin Resource Sharing) issues when making requests to the backend at `http://localhost:3000` from `http://localhost:3002`. This is indicated by errors like:

```
Access to XMLHttpRequest at 'http://localhost:3000/items/user/[USER_ID]' from origin 'http://localhost:3002' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: It does not have HTTP ok status.
```

## Solution

For Express.js backend, you'll need to configure proper CORS headers to allow the frontend to communicate with the API.

### 1. Install the CORS package (if not already installed)

```bash
npm install cors
```

### 2. Configure CORS in your Express app

Here's how to properly configure CORS in your backend's main server file:

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// CORS Configuration
const corsOptions = {
  origin: ['http://localhost:3002', 'https://your-production-domain.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true, // Important for cookies/auth
  maxAge: 86400 // Cache preflight requests for 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Rest of your Express configuration...
```

### 3. Make sure OPTIONS requests are handled properly

For preflight requests (OPTIONS method), ensure they're handled correctly:

```javascript
// Handle OPTIONS requests explicitly if needed
app.options('*', cors(corsOptions));
```

### 4. Additional headers for specific routes

For specific routes that might need additional configuration:

```javascript
// For routes that need special CORS handling
app.get('/items/user/:userId', (req, res, next) => {
  // Set additional headers if needed
  res.header('Access-Control-Allow-Origin', 'http://localhost:3002');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  
  // Continue to the route handler
  next();
});
```

### 5. Testing CORS configuration

To test if your CORS configuration is working:

1. Start your backend server on port 3000
2. Start your frontend on port 3002
3. Open the browser developer tools (F12) and check the Network tab
4. Look for the requests to the backend and check if they succeed without CORS errors

If issues persist, check that:
- The OPTIONS preflight request returns a 200 status code
- The response headers include the correct `Access-Control-Allow-*` headers
- Both the frontend and backend are running on the expected ports

## Socket.IO CORS Configuration

If you're using Socket.IO, make sure to configure CORS there as well:

```javascript
const io = require('socket.io')(server, {
  cors: {
    origin: ['http://localhost:3002', 'https://your-production-domain.com'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

## Additional Notes

- The frontend has been updated to include `withCredentials: true` in all API requests
- Browser automatically sets the `Referer` header - don't try to configure it in allowed headers
- Make sure your API endpoints are correctly handling authentication and setting proper status codes
- If using a proxy server or load balancer, ensure it doesn't strip CORS headers 
- If your backend requires the Referer header for security, it's already being sent by the browser 