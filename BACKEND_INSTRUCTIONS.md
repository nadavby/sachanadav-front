# Backend Implementation Instructions for Notifications System

The frontend has been updated to support a notifications system for item matches. Below are the requirements for the backend implementation to support this feature:

## API Endpoints to Implement

1. **Get Item Matches**
   - Endpoint: `GET /api/image-comparison/find-matches/:itemId`
   - Description: This endpoint should return potential matches for a given item
   - Response Format:
     ```json
     {
       "item": { /* Original item data */ },
       "matches": [
         {
           "item": { /* Matched item data including owner info */ },
           "score": 0.85 // Similarity score from 0 to 1
         },
         // Additional matches...
       ]
     }
     ```

2. **Update Item Model**
   - Add `ownerName` and `ownerEmail` fields to the Item schema
   - Populate these fields when returning items, especially in match results

3. **Match Processing Logic**
   - Implement logic to find potential matches for items
   - Use the Google Cloud Vision API to compare images
   - Calculate similarity scores based on image analysis and other item attributes
   - Sort matches by score in descending order
   - Filter out low-confidence matches (e.g., below 0.3 similarity)

## Implementation Details

### 1. Update Item Schema

```javascript
// In the Item model
const itemSchema = new mongoose.Schema({
  // Existing fields...
  ownerName: {
    type: String,
    required: false
  },
  ownerEmail: {
    type: String,
    required: false
  },
  // Other fields...
});
```

### 2. Populate Owner Information

When returning items, populate the owner information:

```javascript
// In the controller for fetching items
const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Populate owner information
    if (item.owner) {
      const owner = await User.findById(item.owner, 'userName email');
      if (owner) {
        item.ownerName = owner.userName;
        item.ownerEmail = owner.email;
      }
    }
    
    return res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
```

### 3. Image Comparison Service

Create a service to handle image comparison:

```javascript
// In imageComparisonService.js
const compareImages = async (image1Url, image2Url) => {
  try {
    // Call Google Vision API for image analysis
    const [image1Analysis, image2Analysis] = await Promise.all([
      analyzeImage(image1Url),
      analyzeImage(image2Url)
    ]);
    
    // Calculate similarity score based on labels and objects
    const score = calculateSimilarityScore(image1Analysis, image2Analysis);
    
    return {
      isMatch: score > 0.6, // Threshold for considering it a match
      score,
      matchedObjects: getMatchedObjects(image1Analysis, image2Analysis)
    };
  } catch (error) {
    console.error('Error comparing images:', error);
    throw error;
  }
};

const findMatches = async (itemId) => {
  try {
    // Get the original item
    const item = await Item.findById(itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    
    // Get potential matches based on item type (lost items match with found items)
    const potentialMatches = await Item.find({
      itemType: item.itemType === 'lost' ? 'found' : 'lost',
      isResolved: false, // Only consider unresolved items
      _id: { $ne: itemId } // Exclude the current item
    });
    
    // Process each potential match
    const matchResults = await Promise.all(
      potentialMatches.map(async (potentialMatch) => {
        // Skip if no images
        if (!item.imgURL || !potentialMatch.imgURL) {
          return { item: potentialMatch, score: 0 };
        }
        
        // Compare images
        const comparison = await compareImages(item.imgURL, potentialMatch.imgURL);
        
        // Populate owner information
        if (potentialMatch.owner) {
          const owner = await User.findById(potentialMatch.owner, 'userName email');
          if (owner) {
            potentialMatch.ownerName = owner.userName;
            potentialMatch.ownerEmail = owner.email;
          }
        }
        
        return {
          item: potentialMatch,
          score: comparison.score
        };
      })
    );
    
    // Sort by score in descending order and filter low-confidence matches
    const sortedMatches = matchResults
      .filter(match => match.score > 0.3)
      .sort((a, b) => b.score - a.score);
    
    return {
      item,
      matches: sortedMatches
    };
  } catch (error) {
    console.error('Error finding matches:', error);
    throw error;
  }
};
```

### 4. Configure the API Controller

```javascript
// In the controller file
const findMatches = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    // Call the service to find matches
    const matches = await imageComparisonService.findMatches(itemId);
    
    return res.json(matches);
  } catch (error) {
    console.error('Error finding matches:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
```

### 5. Set Up Routes

```javascript
// In the routes file
router.get('/image-comparison/find-matches/:itemId', findMatches);
```

## Vision API Debugging

To resolve the 403 Forbidden error with the Vision API:

1. Add a Referer header to API requests:
```javascript
// In the Vision API client configuration
const visionClient = new vision.ImageAnnotatorClient({
  // Existing configuration...
  headers: {
    'Referer': 'https://yourdomain.com' // Replace with your actual domain
  }
});
```

2. Ensure proper API key authentication:
```javascript
// Alternative authentication method
const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: path.join(__dirname, '../config/google-vision-credentials.json')
});
```

3. Add detailed logging to debug Vision API calls:
```javascript
const analyzeImage = async (imageUrl) => {
  try {
    console.log('Vision API - Analyze Image Request:', {
      imageUrl,
      headers: visionClient.auth.authClient.getRequestHeaders()
    });
    
    const [result] = await visionClient.labelDetection(imageUrl);
    
    console.log('Vision API - Analyze Image Response:', {
      status: 200,
      labels: result.labelAnnotations.map(label => label.description)
    });
    
    return result;
  } catch (error) {
    console.error('Vision API - Analyze Image Error:', {
      message: error.message,
      status: error.code,
      details: error.details
    });
    throw error;
  }
};
```

By implementing these changes, the backend will provide the necessary functionality to support the notification system for item matches. 