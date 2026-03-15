"""
Passport Photo Core Module
==========================

A reusable library for passport photo background removal and processing.
This module can be easily integrated into web applications, APIs, or other projects.

Author: Passport Photo App Team
License: MIT
"""

# Standard library imports
import cv2
import numpy as np
from PIL import Image
import io
import base64
from typing import Union, Optional, Tuple

# Try to import rembg for background removal
# rembg is an AI-powered background removal library
try:
    from rembg import remove
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False
    print("Warning: 'rembg' not installed. Using alternative background removal method.")


class PassportPhotoProcessor:
    """
    Core processing class for passport photo background removal.
    
    This class provides reusable methods for:
    - Background removal from images
    - White background application
    - Image format conversion (PIL, OpenCV, Base64)
    
    Usage:
        processor = PassportPhotoProcessor()
        result = processor.process_image(input_image)
    """
    
    def __init__(self, use_recommended_settings: bool = True):
        """
        Initialize the processor.
        
        Args:
            use_recommended_settings: Apply recommended settings for best results
        """
        self.recommended_settings = use_recommended_settings
        self._rembg_available = REMBG_AVAILABLE
    
    @property
    def is_rembg_available(self) -> bool:
        """Check if rembg library is available."""
        return REMBG_AVAILABLE
    
    def process_image(
        self, 
        image: Union[np.ndarray, Image.Image, bytes, str],
        return_format: str = "pil"
    ) -> Union[np.ndarray, Image.Image, bytes, str]:
        """
        Process an image to remove background and apply white background.
        
        This is the main entry point for processing passport photos.
        It accepts various input formats and returns the processed image
        in the requested format.
        
        Args:
            image: Input image. Can be:
                   - str: File path to image
                   - bytes: Raw image data
                   - Image.Image: PIL Image object
                   - np.ndarray: OpenCV image array
            return_format: Output format - "pil", "opencv", "base64", or "bytes"
        
        Returns:
            Processed image in the requested format
        
        Raises:
            ValueError: If image format is invalid or processing fails
        """
        # Convert input to OpenCV format (internal processing format)
        cv_image = self._to_opencv(image)
        
        # Process the image (remove background and apply white)
        processed = self._process_cv_image(cv_image)
        
        # Convert to requested output format
        return self._from_opencv(processed, return_format)
    
    def _to_opencv(self, image: Union[np.ndarray, Image.Image, bytes, str]) -> np.ndarray:
        """
        Convert various image formats to OpenCV format.
        
        OpenCV uses BGR color format, while PIL uses RGB.
        This method standardizes all inputs to OpenCV format.
        
        Args:
            image: Input in any supported format
        
        Returns:
            OpenCV image as numpy array (BGR format)
        
        Raises:
            ValueError: If image cannot be converted
        """
        
        if isinstance(image, str):
            # File path - read image from disk
            img = cv2.imread(image)
            if img is None:
                raise ValueError(f"Cannot read image from path: {image}")
            return img
        
        elif isinstance(image, bytes):
            # Raw bytes - decode image from memory
            nparr = np.frombuffer(image, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError("Cannot decode image from bytes")
            return img
        
        elif isinstance(image, Image.Image):
            # PIL Image - convert to OpenCV format
            if image.mode == 'RGBA':
                # Keep alpha channel for processing (RGBA has 4 channels)
                return np.array(image)
            elif image.mode == 'RGB':
                # Convert RGB to BGR for OpenCV compatibility
                return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            else:
                # Convert any other format to RGB first
                image = image.convert('RGB')
                return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        elif isinstance(image, np.ndarray):
            # OpenCV image - already in correct format
            if len(image.shape) == 2:
                # Grayscale - convert to BGR
                return cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
            return image
        
        else:
            raise ValueError(f"Unsupported image type: {type(image)}")
    
    def _from_opencv(
        self, 
        cv_image: np.ndarray, 
        format: str = "pil"
    ) -> Union[np.ndarray, Image.Image, bytes, str]:
        """
        Convert OpenCV image to requested format.
        
        Converts the internal BGR OpenCV format to the requested
        output format for use in different contexts.
        
        Args:
            cv_image: OpenCV image (BGR format)
            format: Desired output format ("pil", "opencv", "base64", "bytes")
        
        Returns:
            Image in requested format
        
        Raises:
            ValueError: If format is not supported
        """
        
        format = format.lower()
        
        if format == "opencv":
            # Return as-is (BGR numpy array)
            return cv_image
        
        elif format == "pil":
            # Convert BGR to RGB, then to PIL Image
            if len(cv_image.shape) == 3 and cv_image.shape[2] == 3:
                return Image.fromarray(cv2.cvtColor(cv_image, cv2.COLOR_BGR2RGB))
            return Image.fromarray(cv_image)
        
        elif format == "base64":
            # Return as base64 encoded PNG string
            # Useful for web APIs and JSON responses
            pil_image = self._from_opencv(cv_image, "pil")
            buffer = io.BytesIO()
            pil_image.save(buffer, format='PNG')
            return base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        elif format == "bytes":
            # Return as raw PNG bytes
            # Useful for file downloads and storage
            pil_image = self._from_opencv(cv_image, "pil")
            buffer = io.BytesIO()
            pil_image.save(buffer, format='PNG')
            return buffer.getvalue()
        
        else:
            raise ValueError(f"Unsupported format: {format}. Use: pil, opencv, base64, or bytes")
    
    def _process_cv_image(self, image: np.ndarray) -> np.ndarray:
        """
        Internal method to process the image.
        
        Routes to appropriate background removal method based on
        availability of rembg library.
        
        Args:
            image: OpenCV image (BGR format)
        
        Returns:
            Processed image with white background
        """
        
        if REMBG_AVAILABLE:
            return self._remove_background_rembg(image)
        else:
            return self._remove_background_alternative(image)
    
    def _remove_background_rembg(self, image: np.ndarray) -> np.ndarray:
        """
        Remove background using rembg AI model.
        
        Uses deep learning (U2Net model) for accurate background removal.
        This provides much better results than traditional computer vision
        methods, especially for complex backgrounds.
        
        Args:
            image: OpenCV image (BGR format)
        
        Returns:
            Image with white background
        """
        # Convert OpenCV image (BGR) to PIL Image (RGB)
        # rembg requires PIL Image input
        if len(image.shape) == 3 and image.shape[2] == 4:
            # Already RGBA format
            image_pil = Image.fromarray(image)
        else:
            image_pil = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        
        # Use rembg for accurate background removal
        # Returns PIL Image with alpha channel (RGBA)
        output = remove(image_pil)
        
        # Get numpy array from PIL Image
        output_arr = np.array(output)
        
        # Extract RGB and Alpha separately (RGBA format)
        if output_arr.shape[2] == 4:
            # Get alpha channel (4th channel) - contains transparency info
            # Values: 0 = fully transparent (background), 255 = fully opaque (foreground)
            alpha = output_arr[:, :, 3]
            
            # Get RGB channels (first 3 channels)
            rgb_channels = output_arr[:, :, :3]
            
            # Create pure white background (#FFFFFF)
            # This is the passport photo standard background color
            white_bg = np.full((output_arr.shape[0], output_arr.shape[1], 3), 255, dtype=np.uint8)
            
            # Create foreground mask: pixels where alpha > threshold are foreground
            # Using threshold of 10 to include slightly transparent edges
            foreground_mask = alpha > 10
            
            # Create result: use original RGB where foreground, white where background
            # This ensures only the person/object is kept with white background
            result_rgb = np.where(foreground_mask[:, :, np.newaxis], rgb_channels, white_bg)
            
            # Apply edge smoothing to remove dark outlines/artifacts
            # Without this, there may be dark halos around the subject
            result_rgb = self._smooth_edges(result_rgb, foreground_mask)
            
            # Convert RGB to BGR for OpenCV compatibility
            result = cv2.cvtColor(result_rgb, cv2.COLOR_RGB2BGR)
        else:
            # If somehow not RGBA, just convert directly
            result = cv2.cvtColor(output_arr, cv2.COLOR_RGB2BGR)
        
        return result
    
    def _remove_background_alternative(self, image: np.ndarray) -> np.ndarray:
        """
        Alternative background removal using basic image processing.
        
        This method works without rembg library.
        Uses threshold-based segmentation which works best with:
        - Solid, contrasting backgrounds
        - Good lighting conditions
        - Clear separation between subject and background
        
        Args:
            image: OpenCV image (BGR format)
        
        Returns:
            Image with white background
        """
        # Convert to grayscale
        # Reduces complexity from 3 channels to 1
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur
        # Reduces noise and smooths the image for better thresholding
        # Kernel size (21,21) is large for significant smoothing
        blurred = cv2.GaussianBlur(gray, (21, 21), 0)
        
        # Threshold to get foreground
        # Pixels brighter than 240 are considered background (set to 0)
        # Then invert so foreground becomes white (255)
        _, mask = cv2.threshold(blurred, 240, 255, cv2.THRESH_BINARY_INV)
        
        # Apply morphological operations to clean up the mask
        # These operations remove small noise and fill small holes
        
        # MORPH_CLOSE: fills small holes in the foreground
        kernel = np.ones((5, 5), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        
        # MORPH_OPEN: removes small noise from background
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        
        # Invert mask
        # Now: white = foreground, black = background
        mask = cv2.bitwise_not(mask)
        
        # Create white background
        white_bg = np.ones_like(image) * 255
        
        # Apply mask to get foreground
        # Keep only pixels where mask is white
        foreground = cv2.bitwise_and(image, image, mask=mask)
        
        # Combine with white background
        # Add white background where mask is black
        result = cv2.bitwise_and(white_bg, white_bg, mask=cv2.bitwise_not(mask))
        result = cv2.add(foreground, result)
        
        return result
    
    def _smooth_edges(self, image: np.ndarray, mask: np.ndarray) -> np.ndarray:
        """
        Smooth the edges of the subject to remove dark outlines/artifacts.
        
        When using AI background removal, there may be dark halos around
        the subject due to anti-aliasing in the original image.
        This method applies Gaussian blur to the mask and blends to
        create smooth, natural edges.
        
        Args:
            image: RGB image with potentially harsh edges
            mask: Binary foreground mask
        
        Returns:
            Image with smooth edges
        """
        # Convert mask to uint8
        # Required format for cv2.GaussianBlur
        mask_uint8 = (mask * 255).astype(np.uint8)
        
        # Apply Gaussian blur to the mask for smooth edges
        # Large kernel (21,21) creates very smooth transitions
        mask_blurred = cv2.GaussianBlur(mask_uint8, (21, 21), 0)
        
        # Normalize mask to 0-1 range
        # Converts from 0-255 to 0.0-1.0 for multiplication
        mask_normalized = mask_blurred / 255.0
        
        # Create pure white background
        white_bg = np.full(image.shape, 255, dtype=np.uint8)
        
        # Blend the image with white background using the smoothed mask
        # This creates a soft transition at the edges
        result = (image * mask_normalized[:, :, np.newaxis] + 
                  white_bg * (1 - mask_normalized[:, :, np.newaxis])).astype(np.uint8)
        
        return result
    
    def get_status(self) -> dict:
        """
        Get the current status of the processor.
        
        Returns information about the processor configuration
        and available features.
        
        Returns:
            Dictionary containing status information
        """
        return {
            "rembg_available": REMBG_AVAILABLE,
            "recommended_settings": self.recommended_settings,
            "processor_ready": True
        }


# Convenience functions for simple usage
# These provide a quick way to process images without creating a class instance

def process_image(
    image: Union[np.ndarray, Image.Image, bytes, str],
    return_format: str = "pil"
) -> Union[np.ndarray, Image.Image, bytes, str]:
    """
    Convenience function to process a passport photo.
    
    This is a simple wrapper that creates a processor instance
    and processes the image. Use this for quick one-off processing.
    
    Args:
        image: Input image (any supported format)
               - str: File path
               - bytes: Raw image data
               - PIL Image: PIL Image object
               - np.ndarray: OpenCV array
        return_format: Output format - "pil", "opencv", "base64", or "bytes"
    
    Returns:
        Processed image in the requested format
    
    Example:
        # From file path
        result = process_image("photo.jpg", "base64")
        
        # From bytes
        result = process_image(image_bytes, "pil")
        
        # From PIL Image
        result = process_image(pil_image, "base64")
    """
    processor = PassportPhotoProcessor()
    return processor.process_image(image, return_format)


def process_image_base64(image_base64: str) -> str:
    """
    Process a base64 encoded image and return base64 result.
    
    Helper function specifically for base64 to base64 processing.
    Handles the base64 decoding and encoding automatically.
    
    Args:
        image_base64: Base64 encoded input image
                      Can include data URI prefix (e.g., "data:image/jpeg;base64,...")
                      or be just the base64 string
    
    Returns:
        Base64 encoded processed image in PNG format
    
    Example:
        result = process_image_base64("data:image/jpeg;base64,...")
        # Returns: "iVBORw0KGgoAAAANSUhEUgAA..."
    """
    # Remove data URI prefix if present
    # Supports formats like: "data:image/jpeg;base64,ABCD1234"
    if "base64," in image_base64:
        image_base64 = image_base64.split("base64,")[1]
    
    # Decode base64 to bytes
    image_bytes = base64.b64decode(image_base64)
    
    # Process the image
    processor = PassportPhotoProcessor()
    result_bytes = processor.process_image(image_bytes, "bytes")
    
    # Encode back to base64
    return base64.b64encode(result_bytes).decode('utf-8')

