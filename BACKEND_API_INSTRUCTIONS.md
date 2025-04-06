# Backend API Specifications for Item Upload

## Item Creation Endpoint

**Endpoint:** `POST /items`  
**Content-Type:** `multipart/form-data`

### Expected Request Format

The frontend sends the following fields:

| Field Name    | Data Type     | Description                                   | Example                                |
|---------------|---------------|-----------------------------------------------|----------------------------------------|
| name          | String        | Item name/type                                | "Mobile Phone", "Wallet", etc.         |
| description   | String        | Detailed description of the item              | "Black leather wallet with ID cards"   |
| category      | String        | Category group name                           | "Electronics", "Personal Items", etc.  |
| location      | JSON String   | JSON object with lat/lng coordinates          | `{"lat": 32.0853, "lng": 34.7818}`     |
| date          | String        | ISO date string                               | "2023-09-15"                           |
| itemType      | String        | Whether item is lost or found                 | "lost" or "found"                      |
| owner         | String        | MongoDB ObjectId of the user                  | "6123456789abcdef01234567"             |
| image         | File          | Image file of the item                        | (binary data)                          |

### Example cURL Request

```bash
curl -X POST http://localhost:3000/items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Mobile Phone" \
  -F "description=Black iPhone 13 with red case" \
  -F "category=Electronics" \
  -F "location={\"lat\": 32.0853, \"lng\": 34.7818}" \
  -F "date=2023-09-15" \
  -F "itemType=lost" \
  -F "owner=6123456789abcdef01234567" \
  -F "image=@/path/to/image.jpg"
```

### Expected Response

The API should respond with:

```json
{
  "success": true,
  "data": {
    "_id": "61234567890abcdef01234567",
    "name": "Mobile Phone",
    "description": "Black iPhone 13 with red case",
    "category": "Electronics",
    "location": {
      "lat": 32.0853, 
      "lng": 34.7818
    },
    "date": "2023-09-15T00:00:00.000Z",
    "itemType": "lost",
    "owner": "6123456789abcdef01234567",
    "imageUrl": "http://example.com/uploads/image123.jpg",
    "createdAt": "2023-09-15T12:34:56.789Z",
    "updatedAt": "2023-09-15T12:34:56.789Z"
  },
  "matchResults": [] // Optional array of potential matches
}
```

## Common Issues and Solutions

### 400 Bad Request Error

If you're seeing 400 Bad Request errors, check:

1. **Field Names**: Ensure the backend is expecting the field names exactly as shown above
2. **Data Types**: Make sure the backend correctly parses JSON strings for the location field
3. **Required Fields**: Confirm which fields are required in your MongoDB schema
4. **File Handling**: Ensure proper multipart/form-data parsing is set up on the server

### Debugging Tips

1. Log the received form data on the server:
   ```javascript
   app.post('/items', upload.single('image'), (req, res) => {
     console.log('Body:', req.body);
     console.log('File:', req.file);
     // Rest of handler...
   });
   ```

2. Check that your Mongoose/MongoDB model matches these field names
3. Ensure your middleware correctly processes multipart/form-data:
   ```javascript
   const multer = require('multer');
   const upload = multer({ dest: 'uploads/' });
   ```

## MongoDB Schema Reference

Here's a sample Mongoose schema that aligns with the frontend data:

```javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ItemSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  location: {
    lat: Number,
    lng: Number,
  },
  date: {
    type: Date,
    required: true,
  },
  itemType: {
    type: String,
    enum: ['lost', 'found'],
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Item', ItemSchema);
``` 