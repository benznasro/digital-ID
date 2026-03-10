"""
Passport Photo API Server
=========================

A FastAPI-based REST API for passport photo processing.
Easily integrable with web applications, mobile apps, or other services.

Run with: python api.py
Or: uvicorn api:app --host 0.0.0.0 --port 8000 --reload

API Endpoints:
- GET  /           - API information
- GET  /api/health - Health check
- GET  /api/status - Service status
- POST /api/process - Process base64 image
- POST /api/process/file - Process uploaded file
"""

import os
import io
import base64
import uuid
from datetime import datetime
from typing import Optional

# FastAPI imports
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status
from fastapi.responses import JSONResponse, StreamingResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Local imports
from config import Config
from passport_core import PassportPhotoProcessor


# Initialize FastAPI app
app = FastAPI(
    title=Config.API_TITLE,
    version=Config.API_VERSION,
    description=Config.API_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware for web integration
# This allows web pages from different domains to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the passport photo processor
# This handles all image processing operations
processor = PassportPhotoProcessor()

# Create output directory if it doesn't exist
os.makedirs(Config.OUTPUT_DIR, exist_ok=True)


# ============== Request/Response Models ==============
# Pydantic models define the structure of request and response data

class ProcessRequest(BaseModel):
    """
    Request model for base64 image processing.
    
    Attributes:
        image: Base64 encoded image string
        output_format: Output image format (png, jpg, jpeg)
    """
    image: str  # Base64 encoded image
    output_format: Optional[str] = "png"


class ProcessResponse(BaseModel):
    """
    Response model for processed image.
    
    Attributes:
        success: Whether processing was successful
        message: Status message
        image: Base64 encoded processed image (if successful)
        filename: Name of the processed file
        processing_time: Time taken to process in seconds
        processor_status: Current status of the processor
    """
    success: bool
    message: str
    image: Optional[str] = None  # Base64 encoded result
    filename: Optional[str] = None
    processing_time: Optional[float] = None
    processor_status: Optional[dict] = None


class HealthResponse(BaseModel):
    """
    Response model for health check endpoint.
    
    Attributes:
        status: Health status (e.g., "healthy")
        timestamp: Current server time
        processor: Status of the image processor
    """
    status: str
    timestamp: str
    processor: dict


# ============== API Endpoints ==============

@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint - returns API information.
    
    Use this endpoint to verify the API is running
    and get basic information about the service.
    
    Returns:
        Dictionary with API name, version, and documentation URLs
    """
    return {
        "name": Config.API_TITLE,
        "version": Config.API_VERSION,
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    
    Use this to verify the API is running and ready to process images.
    This endpoint is commonly used by:
    - Load balancers to check service health
    - Monitoring systems
    - Docker/Kubernetes health probes
    
    Returns:
        HealthResponse with status and processor information
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "processor": processor.get_status()
    }


@app.get("/api/status", tags=["Status"])
async def get_status():
    """
    Get detailed service status.
    
    Returns comprehensive information about the service including:
    - Service name and version
    - Running status
    - Whether rembg is available
    - Current configuration
    
    Returns:
        Dictionary with detailed service status
    """
    return {
        "service": Config.API_TITLE,
        "version": Config.API_VERSION,
        "status": "running",
        "rembg_available": processor.is_rembg_available,
        "uptime": datetime.now().isoformat(),
        "config": {
            "max_image_size": Config.MAX_IMAGE_SIZE,
            "supported_formats": Config.SUPPORTED_FORMATS,
            "output_format": Config.DEFAULT_OUTPUT_FORMAT
        }
    }


@app.post("/api/process", response_model=ProcessResponse, tags=["Processing"])
async def process_image_base64(request: ProcessRequest):
    """
    Process a passport photo from base64 encoded image.
    
    This endpoint accepts a base64 encoded image and returns
    a processed passport photo with white background.
    
    Request Body:
        - image: Base64 encoded image (with or without data URI prefix)
        - output_format: Output format (png, jpg, jpeg)
    
    Response:
        - success: Boolean indicating success/failure
        - message: Status message
        - image: Base64 encoded processed image
        - filename: Generated filename
        - processing_time: Time taken in seconds
    
    HTTP Status Codes:
        - 200: Success
        - 400: Invalid request (invalid base64, unsupported format)
        - 500: Server error during processing
    
    Example Request:
        {
            "image": "data:image/jpeg;base64,/9j/4AAQ...",
            "output_format": "png"
        }
    
    Example Response:
        {
            "success": true,
            "message": "Image processed successfully",
            "image": "iVBORw0KGgoAAAANSUhEUgAA...",
            "filename": "passport_abc12345.png",
            "processing_time": 1.234
        }
    """
    import time
    start_time = time.time()
    
    try:
        # Extract base64 data from URI if present
        # Handles both "data:image/jpeg;base64,XXXX" and plain "XXXX" formats
        image_data = request.image
        if "base64," in image_data:
            image_data = image_data.split("base64,")[1]
        
        # Decode base64 to bytes
        try:
            image_bytes = base64.b64decode(image_data)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid base64 image data: {str(e)}"
            )
        
        # Process the image using the passport processor
        # This removes background and applies white background
        result_bytes = processor.process_image(image_bytes, "bytes")
        
        # Encode result to base64 for JSON response
        result_base64 = base64.b64encode(result_bytes).decode('utf-8')
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        return {
            "success": True,
            "message": "Image processed successfully",
            "image": result_base64,
            "filename": f"passport_{uuid.uuid4().hex[:8]}.{request.output_format}",
            "processing_time": round(processing_time, 3),
            "processor_status": processor.get_status()
        }
    
    except ValueError as e:
        # Handle invalid input errors
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Processing failed: {str(e)}"
        )


@app.post("/api/process/file", tags=["Processing"])
async def process_image_file(
    file: UploadFile = File(...),
    output_format: Optional[str] = Form("png")
):
    """
    Process a passport photo from file upload.
    
    This endpoint accepts an image file upload and returns
    a processed passport photo with white background.
    
    Parameters:
        - file: Image file (jpg, jpeg, png, webp, bmp)
        - output_format: Output format (png, jpg, jpeg)
    
    Returns:
        Processed image file as binary stream
    
    HTTP Status Codes:
        - 200: Success - returns image file
        - 400: Invalid request (unsupported format)
        - 413: File too large
        - 500: Server error during processing
    
    Example HTML Form:
        <form action="http://localhost:8000/api/process/file" 
              method="post" enctype="multipart/form-data">
            <input type="file" name="file" accept="image/*">
            <button type="submit">Process</button>
        </form>
    
    Example JavaScript:
        const formData = new FormData();
        formData.append('file', imageFile);
        const response = await fetch('/api/process/file', {
            method: 'POST',
            body: formData
        });
        const blob = await response.blob();
    """
    import time
    start_time = time.time()
    
    # Validate file format
    # Extract file extension from filename
    file_ext = file.filename.split('.')[-1].lower() if file.filename else "jpg"
    if file_ext not in Config.SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format. Supported: {Config.SUPPORTED_FORMATS}"
        )
    
    try:
        # Read file contents from upload
        contents = await file.read()
        
        # Check file size
        # Prevents memory issues from very large uploads
        if len(contents) > Config.MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Max size: {Config.MAX_IMAGE_SIZE / (1024*1024)}MB"
            )
        
        # Process the image
        result_bytes = processor.process_image(contents, "bytes")
        
        # Determine content type for response
        # Maps format string to MIME type
        content_type = f"image/{output_format.lower()}"
        if output_format.lower() == "jpg":
            content_type = "image/jpeg"
        
        # Log processing time
        processing_time = time.time() - start_time
        print(f"Processed {file.filename} in {processing_time:.3f}s")
        
        # Return as streaming response
        # This allows for efficient download of large files
        return StreamingResponse(
            io.BytesIO(result_bytes),
            media_type=content_type,
            headers={
                "Content-Disposition": f"attachment; filename=passport_{uuid.uuid4().hex[:8]}.{output_format}"
            }
        )
    
    except HTTPException:
        # Re-raise HTTP exceptions (already properly formatted)
        raise
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Processing failed: {str(e)}"
        )


@app.post("/api/process/url", response_model=ProcessResponse, tags=["Processing"])
async def process_image_url(request: ProcessRequest):
    """
    Process a passport photo from URL.
    
    Note: This endpoint is not yet implemented.
    It is a placeholder for future URL processing capability.
    
    For production, this would:
    1. Fetch image from URL
    2. Validate the URL (security check)
    3. Download and process the image
    
    Returns:
        HTTP 501 Not Implemented error
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="URL processing not yet implemented. Use base64 or file upload."
    )


# ============== Main Entry Point ==============

if __name__ == "__main__":
    import uvicorn
    
    # Validate configuration before starting
    is_valid, error = Config.validate()
    if not is_valid:
        print(f"Configuration error: {error}")
        exit(1)
    
    # Print startup banner
    print(f"""
==================================================
     Passport Photo API Server
     Version: {Config.API_VERSION}
==================================================
  Server running at: http://{Config.HOST}:{Config.PORT}
  API Docs at:       http://{Config.HOST}:{Config.PORT}/docs
  ReDoc at:          http://{Config.HOST}:{Config.PORT}/redoc
==================================================
  rembg available:   {str(processor.is_rembg_available)}
  Max image size:    {Config.MAX_IMAGE_SIZE/(1024*1024):.0f}MB
==================================================
    """)
    
    # Run the server
    # uvicorn is an ASGI server implementation
    uvicorn.run(
        "api:app",
        host=Config.HOST,
        port=Config.PORT,
        reload=Config.DEBUG
    )

