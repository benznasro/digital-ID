import fs from 'fs';
import path from 'path';
import multer from 'multer';
import pool from '../../db.js';

const UPLOAD_DIR = path.resolve(process.cwd(), '../uploads/person_photos');

const ensureUploadDir = () => {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
};

const imageOnly = (req, file, cb) => {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'));
  }
  cb(null, true);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safeExt = ext.length <= 10 ? ext : '.jpg';
    cb(null, `person_${Date.now()}_${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

const uploader = multer({
  storage,
  fileFilter: imageOnly,
  limits: { fileSize: 6 * 1024 * 1024 },
});

const runSingleUpload = (req, res) => {
  return new Promise((resolve, reject) => {
    uploader.single('photo')(req, res, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
};

const toPositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const roleCanUploadForOthers = new Set(['admin', 'government', 'police', 'hospital']);

const selectActivePhotoForPerson = async (personId) => {
  const result = await pool.query(
    `SELECT id, person_id, original_name, mime_type, file_size_bytes, photo_url, is_active, uploaded_by_user_id, created_at
     FROM person_photos
     WHERE person_id = $1 AND is_active = true
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
    [personId]
  );
  return result.rows[0] || null;
};

export const uploadPersonPhoto = async (req, res) => {
  try {
    await runSingleUpload(req, res);

    if (!req.file) {
      return res.status(400).json({ error: 'photo file is required (multipart field: photo)' });
    }

    const tokenPersonId = toPositiveInt(req.user.person_id);
    const requestedPersonId = toPositiveInt(req.body.person_id);

    let personId = tokenPersonId;

    if (requestedPersonId && requestedPersonId !== tokenPersonId) {
      if (!roleCanUploadForOthers.has(req.user.role)) {
        return res.status(403).json({ error: 'You are not allowed to upload for another person' });
      }
      personId = requestedPersonId;
    }

    if (!personId) {
      return res.status(400).json({ error: 'person_id is required for this account' });
    }

    const personExists = await pool.query('SELECT id FROM person WHERE id = $1', [personId]);
    if (!personExists.rows.length) {
      return res.status(404).json({ error: 'Person not found' });
    }

    const photoUrl = `/uploads/person_photos/${req.file.filename}`;
    const uploadedByUserId = toPositiveInt(req.user.id);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE person_photos
         SET is_active = false,
             deactivated_at = now()
         WHERE person_id = $1 AND is_active = true`,
        [personId]
      );

      const insertResult = await client.query(
        `INSERT INTO person_photos (
          person_id,
          original_name,
          stored_name,
          mime_type,
          file_size_bytes,
          storage_path,
          photo_url,
          is_active,
          uploaded_by_user_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8)
        RETURNING id, person_id, original_name, mime_type, file_size_bytes, photo_url, is_active, uploaded_by_user_id, created_at`,
        [
          personId,
          req.file.originalname || null,
          req.file.filename,
          req.file.mimetype,
          req.file.size,
          req.file.path,
          photoUrl,
          uploadedByUserId,
        ]
      );

      await client.query('COMMIT');
      return res.status(201).json(insertResult.rows[0]);
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Photo upload failed' });
  }
};

export const getMyPhoto = async (req, res) => {
  try {
    const personId = toPositiveInt(req.user.person_id);
    if (!personId) {
      return res.status(400).json({ error: 'No person is linked to this account' });
    }

    const photo = await selectActivePhotoForPerson(personId);
    if (!photo) {
      return res.status(404).json({ error: 'No active photo found' });
    }

    return res.json(photo);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getPhotoByPersonId = async (req, res) => {
  try {
    const personId = toPositiveInt(req.params.personId);
    if (!personId) {
      return res.status(400).json({ error: 'Invalid person id' });
    }

    const photo = await selectActivePhotoForPerson(personId);
    if (!photo) {
      return res.status(404).json({ error: 'No active photo found' });
    }

    return res.json(photo);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
