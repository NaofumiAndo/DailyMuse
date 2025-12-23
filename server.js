import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const MUSES_DIR = path.join(__dirname, 'public', 'data', 'muses');
const INDEX_FILE = path.join(MUSES_DIR, 'index.json');

// Ensure muses directory exists
await fs.mkdir(MUSES_DIR, { recursive: true });

/**
 * Save a muse entry (images + metadata)
 */
app.post('/api/muses', async (req, res) => {
  try {
    const { entry } = req.body;

    if (!entry || !entry.scheduledDate) {
      return res.status(400).json({ error: 'Invalid entry data' });
    }

    const { scheduledDate, titleImage, comicImage, ...metadata } = entry;

    // Save title image
    if (titleImage && titleImage.startsWith('data:image')) {
      const base64Data = titleImage.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      await fs.writeFile(
        path.join(MUSES_DIR, `${scheduledDate}-title.jpg`),
        buffer
      );
    }

    // Save comic image
    if (comicImage && comicImage.startsWith('data:image')) {
      const base64Data = comicImage.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      await fs.writeFile(
        path.join(MUSES_DIR, `${scheduledDate}-comic.jpg`),
        buffer
      );
    }

    // Save metadata
    const metadataToSave = {
      ...metadata,
      id: scheduledDate,
      scheduledDate,
      titleImage: `/data/muses/${scheduledDate}-title.jpg`,
      comicImage: `/data/muses/${scheduledDate}-comic.jpg`
    };

    await fs.writeFile(
      path.join(MUSES_DIR, `${scheduledDate}.json`),
      JSON.stringify(metadataToSave, null, 2)
    );

    // Update index
    let index = [];
    try {
      const indexData = await fs.readFile(INDEX_FILE, 'utf-8');
      index = JSON.parse(indexData);
    } catch (error) {
      // Index doesn't exist yet
    }

    if (!index.includes(scheduledDate)) {
      index.push(scheduledDate);
      index.sort((a, b) => b.localeCompare(a)); // Sort descending
      await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2));
    }

    res.json({ success: true, message: 'Muse saved successfully' });
  } catch (error) {
    console.error('Error saving muse:', error);
    res.status(500).json({ error: 'Failed to save muse' });
  }
});

/**
 * Delete a muse entry
 */
app.delete('/api/muses/:date', async (req, res) => {
  try {
    const { date } = req.params;

    // Delete files
    await fs.unlink(path.join(MUSES_DIR, `${date}-title.jpg`)).catch(() => {});
    await fs.unlink(path.join(MUSES_DIR, `${date}-comic.jpg`)).catch(() => {});
    await fs.unlink(path.join(MUSES_DIR, `${date}.json`)).catch(() => {});

    // Update index
    let index = [];
    try {
      const indexData = await fs.readFile(INDEX_FILE, 'utf-8');
      index = JSON.parse(indexData);
    } catch (error) {
      // Index doesn't exist
    }

    index = index.filter(d => d !== date);
    await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2));

    res.json({ success: true, message: 'Muse deleted successfully' });
  } catch (error) {
    console.error('Error deleting muse:', error);
    res.status(500).json({ error: 'Failed to delete muse' });
  }
});

/**
 * Update a muse entry's date (rename files)
 */
app.put('/api/muses/:oldDate', async (req, res) => {
  try {
    const { oldDate } = req.params;
    const { newDate } = req.body;

    if (!newDate) {
      return res.status(400).json({ error: 'New date is required' });
    }

    if (oldDate === newDate) {
      return res.json({ success: true, message: 'No changes needed' });
    }

    // Check if new date already exists
    try {
      await fs.access(path.join(MUSES_DIR, `${newDate}.json`));
      return res.status(409).json({ error: 'A muse is already scheduled for that date' });
    } catch (error) {
      // File doesn't exist, good to proceed
    }

    // Rename files
    await fs.rename(
      path.join(MUSES_DIR, `${oldDate}-title.jpg`),
      path.join(MUSES_DIR, `${newDate}-title.jpg`)
    );
    await fs.rename(
      path.join(MUSES_DIR, `${oldDate}-comic.jpg`),
      path.join(MUSES_DIR, `${newDate}-comic.jpg`)
    );

    // Update metadata file
    const metadataPath = path.join(MUSES_DIR, `${oldDate}.json`);
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
    metadata.scheduledDate = newDate;
    metadata.id = newDate;
    metadata.titleImage = `/data/muses/${newDate}-title.jpg`;
    metadata.comicImage = `/data/muses/${newDate}-comic.jpg`;

    await fs.writeFile(
      path.join(MUSES_DIR, `${newDate}.json`),
      JSON.stringify(metadata, null, 2)
    );
    await fs.unlink(metadataPath);

    // Update index
    let index = [];
    try {
      const indexData = await fs.readFile(INDEX_FILE, 'utf-8');
      index = JSON.parse(indexData);
    } catch (error) {
      // Index doesn't exist
    }

    index = index.filter(d => d !== oldDate);
    if (!index.includes(newDate)) {
      index.push(newDate);
      index.sort((a, b) => b.localeCompare(a));
      await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2));
    }

    res.json({ success: true, message: 'Muse date updated successfully' });
  } catch (error) {
    console.error('Error updating muse date:', error);
    res.status(500).json({ error: 'Failed to update muse date' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ GitHub Storage API running on http://localhost:${PORT}`);
});
