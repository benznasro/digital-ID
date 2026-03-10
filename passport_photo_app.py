"""
Passport Photo App
A computer vision application that captures photos, removes background,
and applies a white background like passport photos.
"""

import cv2
import numpy as np
from PIL import Image
import os
import sys

# Try to import rembg for background removal
try:
    from rembg import remove
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False
    print("Warning: 'rembg' not installed. Using alternative background removal method.")


class PassportPhotoApp:
    """Main application class for passport photo capture and processing."""
    
    def __init__(self, camera_index=0):
        """Initialize the application with camera settings."""
        self.camera_index = camera_index
        self.cap = None
        self.output_dir = "passport_photos"
        
        # Create output directory if it doesn't exist
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
    
    def start_camera(self):
        """Start the camera capture."""
        self.cap = cv2.VideoCapture(self.camera_index)
        
        if not self.cap.isOpened():
            raise ValueError("Cannot open camera. Please check your camera connection.")
        
        print("Camera started successfully!")
        print("Press 'SPACE' to capture photo")
        print("Press 'Q' to quit")
    
    def show_camera_feed(self):
        """Display camera feed in a window."""
        if self.cap is None:
            self.start_camera()
        
        window_name = "Passport Photo Capture"
        cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
        
        while True:
            ret, frame = self.cap.read()
            
            if not ret:
                print("Failed to grab frame")
                break
            
            # Flip frame horizontally for mirror effect
            frame = cv2.flip(frame, 1)
            
            # Add instructions text on frame
            cv2.putText(frame, "Press SPACE to capture, Q to quit", 
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 
                       0.7, (0, 255, 0), 2)
            
            cv2.imshow(window_name, frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord(' '):  # Space key
                return frame
            elif key == ord('q') or key == ord('Q'):
                return None
        
        return None
    
    def capture_photo(self):
        """Capture a single photo from camera."""
        return self.show_camera_feed()
    
    def remove_background_alternative(self, image):
        """
        Alternative background removal using basic image processing.
        This method works without rembg library.
        """
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur
        blurred = cv2.GaussianBlur(gray, (21, 21), 0)
        
        # Threshold to get foreground
        _, mask = cv2.threshold(blurred, 240, 255, cv2.THRESH_BINARY_INV)
        
        # Apply morphological operations to clean up the mask
        kernel = np.ones((5, 5), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        
        # Invert mask
        mask = cv2.bitwise_not(mask)
        
        # Create white background
        white_bg = np.ones_like(image) * 255
        
        # Apply mask to get foreground
        foreground = cv2.bitwise_and(image, image, mask=mask)
        
        # Combine with white background
        result = cv2.bitwise_and(white_bg, white_bg, mask=cv2.bitwise_not(mask))
        result = cv2.add(foreground, result)
        
        return result
    
    def remove_background(self, image):
        """
        Remove background from image.
        Uses rembg if available, otherwise uses alternative method.
        """
        # Convert OpenCV image (BGR) to PIL Image (RGB)
        image_pil = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        
        if REMBG_AVAILABLE:
            # Use rembg for accurate background removal
            output = remove(image_pil)
            
            # Get numpy array BEFORE converting from RGBA
            output_arr = np.array(output)
            
            # Extract RGB and Alpha separately (RGBA format)
            if output_arr.shape[2] == 4:
                # Get alpha channel (4th channel)
                alpha = output_arr[:, :, 3]
                
                # Get RGB channels (not BGR yet)
                rgb_channels = output_arr[:, :, :3]
                
                # Create pure white background (#FFFFFF)
                white_bg = np.full((output_arr.shape[0], output_arr.shape[1], 3), 255, dtype=np.uint8)
                
                # Create foreground mask: pixels where alpha > threshold are foreground
                foreground_mask = alpha > 10
                
                # Create result: use original RGB where foreground, white where background
                # This ensures BLACK RGB values from transparent areas don't show through
                result_rgb = np.where(foreground_mask[:, :, np.newaxis], rgb_channels, white_bg)
                
                # Apply edge smoothing to remove dark outlines
                result_rgb = self.smooth_edges(result_rgb, foreground_mask)
                
                # Convert RGB to BGR for OpenCV
                result = cv2.cvtColor(result_rgb, cv2.COLOR_RGB2BGR)
            else:
                # If somehow not RGBA, just convert directly
                result = cv2.cvtColor(output_arr, cv2.COLOR_RGB2BGR)
        else:
            # Use alternative method
            result = self.remove_background_alternative(image)
        
        return result
    
    def smooth_edges(self, image, mask):
        """
        Smooth the edges of the subject to remove dark outlines/artifacts.
        """
        # Convert mask to uint8
        mask_uint8 = (mask * 255).astype(np.uint8)
        
        # Apply Gaussian blur to the mask for smooth edges
        mask_blurred = cv2.GaussianBlur(mask_uint8, (21, 21), 0)
        
        # Normalize mask to 0-1 range
        mask_normalized = mask_blurred / 255.0
        
        # Create pure white background
        white_bg = np.full(image.shape, 255, dtype=np.uint8)
        
        # Blend the image with white background using the smoothed mask
        result = (image * mask_normalized[:, :, np.newaxis] + 
                  white_bg * (1 - mask_normalized[:, :, np.newaxis])).astype(np.uint8)
        
        return result
    
    def process_photo(self, image):
        """Process the captured photo - remove background and apply white background."""
        if image is None:
            return None
        
        print("Processing photo - removing background...")
        processed = self.remove_background(image)
        
        return processed
    
    def save_photo(self, image, filename=None):
        """Save the processed photo to file."""
        if image is None:
            print("No image to save")
            return None
        
        if filename is None:
            filename = f"passport_photo_{len(os.listdir(self.output_dir)) + 1}.jpg"
        
        filepath = os.path.join(self.output_dir, filename)
        
        # Convert BGR to RGB for saving
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        cv2.imwrite(filepath, image_rgb)
        
        print(f"Photo saved to: {filepath}")
        return filepath
    
    def run_interactive(self):
        """Run the application in interactive mode."""
        try:
            self.start_camera()
            
            while True:
                print("\n--- Passport Photo App ---")
                print("1. Take new photo")
                print("2. Exit")
                
                choice = input("Enter choice (1-2): ").strip()
                
                if choice == '1':
                    print("\nPosition yourself in front of the camera...")
                    frame = self.capture_photo()
                    
                    if frame is not None:
                        print("\nProcessing photo...")
                        processed = self.process_photo(frame)
                        
                        if processed is not None:
                            # Show the processed photo
                            cv2.imshow("Processed Photo", processed)
                            cv2.waitKey(0)
                            cv2.destroyAllWindows()
                            
                            save = input("Save this photo? (y/n): ").strip().lower()
                            if save == 'y':
                                filename = input("Enter filename (or press Enter for default): ").strip()
                                self.save_photo(processed, filename if filename else None)
                    
                elif choice == '2':
                    break
                else:
                    print("Invalid choice. Please try again.")
        
        finally:
            self.cleanup()
    
    def process_image_file(self, input_path, output_path=None):
        """Process an existing image file."""
        # Read the image
        image = cv2.imread(input_path)
        
        if image is None:
            raise ValueError(f"Cannot read image from: {input_path}")
        
        # Process the image
        processed = self.process_photo(image)
        
        if processed is not None:
            # Save or return
            if output_path:
                cv2.imwrite(output_path, cv2.cvtColor(processed, cv2.COLOR_BGR2RGB))
                print(f"Processed image saved to: {output_path}")
                return output_path
            else:
                return processed
        
        return None
    
    def cleanup(self):
        """Clean up resources."""
        if self.cap is not None:
            self.cap.release()
        cv2.destroyAllWindows()
        print("Resources cleaned up.")


def main():
    """Main entry point for the application."""
    print("=" * 50)
    print("  Passport Photo App")
    print("  Take photos with white background like passport")
    print("=" * 50)
    
    # Check if rembg is available
    if not REMBG_AVAILABLE:
        print("\nNote: For best results, install rembg:")
        print("  pip install rembg\n")
    
    # Check for command line arguments
    if len(sys.argv) > 1:
        # Process a file
        input_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) > 2 else None
        
        app = PassportPhotoApp()
        result = app.process_image_file(input_file, output_file)
        
        if result:
            print("Image processing complete!")
        else:
            print("Image processing failed.")
    else:
        # Run interactive mode
        app = PassportPhotoApp()
        app.run_interactive()


if __name__ == "__main__":
    main()
