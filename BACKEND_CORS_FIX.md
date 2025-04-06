# Backend CORS Configuration for Socket.IO

To fix the CORS errors when connecting from different origins/ports, please apply the following changes to your Socket.IO server configuration:

## Express Server CORS Configuration

```javascript
// Add this to your Express server setup
const express = require('express');
const cors = require('cors');
const app = express();

// Configure CORS for regular API requests
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if(!origin) return callback(null, true);
    
    // Define allowed origins - adjust as needed
    const allowedOrigins = [
      'http://localhost:3003',
      'http://localhost:3002',
      'http://localhost:3000',
      // Add your production domains here
    ];
    
    if(allowedOrigins.indexOf(origin) === -1){
      return callback(new Error('CORS policy: Origin not allowed'), false);
    }
    
    return callback(null, true);
  },
  credentials: true
}));

// Rest of your Express setup...
```

## Socket.IO CORS Configuration

```javascript
// When setting up your Socket.IO server:
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer, {
  cors: {
    origin: [
      'http://localhost:3003',
      'http://localhost:3002',
      'http://localhost:3000',
      // Add your production domains here
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Rest of your Socket.IO setup...
```

## Check All Socket Event Handlers

Make sure your Socket.IO authentication flow is properly handling events:

```javascript
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('authenticate', ({ userId }) => {
    console.log('User authenticated:', userId);
    // Associate this socket with the user
    socket.join(`user:${userId}`);
    socket.userId = userId;
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});
```

## Testing the Connection

After making these changes, restart your backend server and test the connection from the frontend.

If you're still experiencing issues, please check the server logs for any error messages and ensure your firewall/network is allowing connections between these ports.

## Additional Security Note

For production environments, consider:
1. Limiting the allowed origins to your specific domain(s)
2. Using secure WebSockets (wss://) for production
3. Implementing additional authentication mechanisms for socket connections 