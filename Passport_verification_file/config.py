"""
Configuration for Passport Photo API Server
============================================

This file contains all configuration settings for the API server.
Settings can be overridden using environment variables.

Usage:
    from config import Config
    print(Config.PORT)  # Get port setting

Environment Variables:
    HOST        - Server host address (default: 0.0.0.0)
    PORT        - Server port number (default: 8000)
    DEBUG       - Enable debug mode (default: false)
    OUTPUT_DIR  - Directory for output files (default: output)
"""

import os
from typing import Optional


class Config:
    """
    Application configuration settings class.
    
    All settings can be overridden using environment variables.
    This allows for easy configuration without modifying code.
    """
    
    # Server Settings
    # ----------------
    # Host address to bind the server to
    # Use "0.0.0.0" to make server accessible from all network interfaces
    # Use "127.0.0.1" for localhost only
    HOST: str = os.getenv("HOST", "0.0.0.0")
    
    # Port number for the server
    # Common ports: 8000, 8080, 3000
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Debug mode flag
    # When True: enables auto-reload, detailed error messages
    # When False: production mode, optimized performance
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # API Settings
    # ------------
    # Title shown in API documentation
    API_TITLE: str = "Passport Photo API"
    
    # API version string
    API_VERSION: str = "1.0.0"
    
    # API description for documentation
    # Supports Markdown format
    API_DESCRIPTION: str = """
Passport Photo Processing API

This API provides endpoints for processing passport photos with background removal.

Features:
- AI-powered background removal (rembg)
- Support for multiple image formats
- Base64 encoding support for easy web integration
- Fast processing

Usage:
Send an image as base64 or file upload, and receive a processed passport photo.
    """
    
    # Processing Settings
    # -------------------
    # Default image format for output
    # Options: png, jpg, jpeg
    # PNG recommended for quality, JPEG for smaller file size
    DEFAULT_OUTPUT_FORMAT: str = "png"
    
    # Maximum allowed image file size in bytes
    # 10MB = 10 * 1024 * 1024 = 10485760 bytes
    # Prevents memory issues from very large uploads
    MAX_IMAGE_SIZE: int = 10 * 1024 * 1024
    
    # List of supported image formats for upload
    # Only these formats will be accepted
    SUPPORTED_FORMATS: list = ["jpg", "jpeg", "png", "webp", "bmp"]
    
    # CORS Settings (Cross-Origin Resource Sharing)
    # ------------------------------------------------
    # These settings control which web pages can access the API
    # Important for browser-based integrations
    
    # List of allowed origins for CORS
    # "*" allows all origins (development)
    # Specific domains like ["https://example.com"] for production
    CORS_ORIGINS: list = [
        "*",  # Allow all origins for development
    ]
    
    # Output Settings
    # ---------------
    # Directory where processed images will be saved
    OUTPUT_DIR: str = os.getenv("OUTPUT_DIR", "output")
    
    @classmethod
    def get_cors_origins(cls) -> list:
        """
        Get CORS origins as list.
        
        Returns:
            List of allowed origin strings
        """
        return cls.CORS_ORIGINS
    
    @classmethod
    def validate(cls) -> tuple[bool, Optional[str]]:
        """
        Validate configuration settings.
        
        Checks that all settings have valid values.
        Call this before starting the server.
        
        Returns:
            Tuple of (is_valid, error_message)
            is_valid: True if all settings are valid
            error_message: None if valid, or error description
        """
        if cls.MAX_IMAGE_SIZE <= 0:
            return False, "MAX_IMAGE_SIZE must be positive"
        
        if cls.PORT <= 0 or cls.PORT > 65535:
            return False, "PORT must be between 1 and 65535"
        
        return True, None


# Environment variables can be set in a .env file
# Example .env file contents:
# ----------------
# HOST=0.0.0.0
# PORT=8000
# DEBUG=true
# OUTPUT_DIR=output
# ----------------
#
# To use .env file, install python-dotenv:
#   pip install python-dotenv
# Then add at the top of your main file:
#   from dotenv import load_dotenv
#   load_dotenv()

