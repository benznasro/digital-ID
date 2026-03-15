# Passport Photo App

A Python computer vision application that captures photos, removes the background, and applies a white background like passport photos.

## Features

- Camera capture with live preview
- Background removal using AI (rembg) or alternative method
- White background for passport-style photos
- Save processed photos to file
- REST API for web and mobile integration
- Modular core library for easy embedding in other projects

---

## Quick Start

### Installation

```bash
pip install -r requirements.txt

# For best results, install rembg (optional but recommended):
pip install rembg
```

### Run the API Server

```bash
# Install API dependencies first
pip install fastapi uvicorn

# Run the server
python api.py
```

The API will be available at:
- API Docs (Swagger UI): http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health Check: http://localhost:8000/api/health

---

## API Integration Guide

### Endpoint 1: Process Base64 Image

**POST** `/api/process`

This endpoint accepts a base64 encoded image and returns a processed passport photo.

Request format:
```json
{
    "image": "base64_encoded_image_data",
    "output_format": "png"
}
```

JavaScript/Fetch example:
```javascript
const response = await fetch('http://localhost:8000/api/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image: 'base64_encoded_image_data',
    output_format: 'png'
  })
});

const result = await response.json();
// result.image contains base64 encoded processed image
```

### Endpoint 2: Upload File

**POST** `/api/process/file`

This endpoint accepts an image file upload and returns the processed image.

HTML Form Example:
```html
<form action="http://localhost:8000/api/process/file" method="post" enctype="multipart/form-data">
  <input type="file" name="file" accept="image/*">
  <button type="submit">Process</button>
</form>
```

JavaScript/Fetch example:
```javascript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('http://localhost:8000/api/process/file', {
  method: 'POST',
  body: formData
});

const blob = await response.blob();
// blob contains the processed image
```

### Health Check

**GET** `/api/health`

Use this endpoint to verify the API is running.

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00",
  "processor": {
    "rembg_available": true,
    "recommended_settings": true,
    "processor_ready": true
  }
}
```

---

## Developer Integration

### Use as a Python Library

The core processing module can be imported and used directly in your Python projects:

```python
from passport_core import PassportPhotoProcessor, process_image, process_image_base64

# Method 1: Using the class
processor = PassportPhotoProcessor()

# From file path
result = processor.process_image("photo.jpg", "base64")

# From bytes
result = processor.process_image(image_bytes, "pil")

# From PIL Image
result = processor.process_image(pil_image, "base64")

# Method 2: Using convenience functions
result = process_image("photo.jpg", "base64")
result = process_image_base64("data:image/jpeg;base64,...")
```

### Supported Input Formats

The processor accepts images in multiple formats:
- File path (str) - Path to an image file on disk
- Bytes (raw image data) - Raw bytes from HTTP request or file
- PIL Image - PIL Image object
- NumPy array (OpenCV format) - BGR numpy array
- Base64 encoded string - Base64 encoded image data

### Supported Output Formats

Specify the desired output format as a string:
- "pil" - Returns PIL Image object
- "opencv" - Returns NumPy array (BGR format)
- "base64" - Returns Base64 encoded string (PNG format)
- "bytes" - Returns raw image bytes (PNG format)

---

## Interactive Mode (Camera)

### Run with Camera

```bash
python passport_photo_app.py
```

Then:
1. Select option 1 to take a new photo
2. Position yourself in front of the camera
3. Press SPACE to capture
4. The app will process the photo (remove background)
5. Preview the result and choose to save or retake

### Process Existing Image

```bash
python passport_photo_app.py input_image.jpg output_image.jpg
```

---

## Architecture

```
passport_photo_app/
├── passport_core.py        # Core processing library (reusable)
├── api.py                 # FastAPI REST server
├── config.py              # Configuration settings
├── passport_photo_app.py  # Interactive CLI app
├── requirements.txt        # Dependencies
└── passport_photos/        # Output directory
```

---

## Configuration

Create a .env file or set environment variables:

```env
HOST=0.0.0.0
PORT=8000
DEBUG=false
OUTPUT_DIR=output
```

---

## How It Works

1. **Capture**: Uses OpenCV to capture images from your webcam (or load from file)
2. **Background Removal**: 
   - Uses rembg (AI-based) for accurate results
   - Falls back to basic image processing if rembg is not available
3. **White Background**: Replaces removed background with pure white (255,255,255)
4. **Save/Return**: Exports as image file or returns via API

---

## Requirements

- Python 3.8 or higher
- Webcam/Camera (for interactive mode)
- OpenCV - Camera capture and image processing
- NumPy - Numerical operations
- Pillow - Image manipulation
- FastAPI + Uvicorn - For API server
- rembg - Optional but recommended for better background removal

---

## Troubleshooting

### Camera not opening
- Check if camera is connected and not in use by another application
- Try changing camera_index in the code (default is 0)
- On some systems, you may need to use camera_index 1 or higher

### Poor background removal
- Install rembg for better results: pip install rembg
- Ensure good lighting when taking photos
- Use a contrasting background (avoid white backgrounds)
- Make sure the subject is clearly separated from the background

### Installation errors
- Make sure you have Python 3.8 or higher
- Try upgrading pip: pip install --upgrade pip
- Check for any error messages in the output

