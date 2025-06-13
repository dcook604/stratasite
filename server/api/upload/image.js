import multer from 'multer';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';
import { randomBytes } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

// Ensure uploads directory exists
const uploadsDir = join(process.cwd(), 'public', 'uploads', 'marketplace');

const ensureUploadsDir = async () => {
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await ensureUploadsDir();

      // Use multer middleware
      const multerMiddleware = upload.single('image');
      
      await new Promise((resolve, reject) => {
        multerMiddleware(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      // Generate unique filename
      const fileExtension = req.file.originalname.split('.').pop();
      const filename = `${randomBytes(16).toString('hex')}.${fileExtension}`;
      const filepath = join(uploadsDir, filename);

      // Process and save image with sharp
      await sharp(req.file.buffer)
        .resize(800, 800, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85 })
        .toFile(filepath);

      const imageUrl = `/uploads/marketplace/${filename}`;
      
      res.status(200).json({ 
        success: true, 
        imageUrl,
        message: 'Image uploaded successfully' 
      });

    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to upload image' 
      });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { imageUrl } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is required' });
      }

      // Extract filename from URL
      const filename = imageUrl.split('/').pop();
      const filepath = join(uploadsDir, filename);

      // Delete file if it exists
      try {
        await fs.unlink(filepath);
        res.status(200).json({ success: true, message: 'Image deleted successfully' });
      } catch (error) {
        if (error.code === 'ENOENT') {
          res.status(404).json({ error: 'Image not found' });
        } else {
          throw error;
        }
      }

    } catch (error) {
      console.error('Image deletion error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to delete image' 
      });
    }
  } else {
    res.setHeader('Allow', ['POST', 'DELETE']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for multer
  },
}; 