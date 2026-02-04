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
const STORY_ATLAS_DIR = path.join(__dirname, 'public', 'data', 'story-atlas');
const STORY_ENTRIES_FILE = path.join(STORY_ATLAS_DIR, 'entries.json');
const STORY_CHAR_REF_FILE = path.join(STORY_ATLAS_DIR, 'character-ref.json');
const STORY_ART_STYLE_FILE = path.join(STORY_ATLAS_DIR, 'art-style.json');
const STORIES_FILE = path.join(__dirname, 'public', 'data', 'stories.json');
const DAILY_COMIC_SETTINGS_FILE = path.join(MUSES_DIR, 'character-settings.json');
const PRODUCT_IDEAS_FILE = path.join(__dirname, 'public', 'data', 'product-ideas.json');
const PRODUCT_IMAGES_DIR = path.join(__dirname, 'public', 'data', 'product-images');

// Ensure directories exist
await fs.mkdir(MUSES_DIR, { recursive: true });
await fs.mkdir(STORY_ATLAS_DIR, { recursive: true });
await fs.mkdir(PRODUCT_IMAGES_DIR, { recursive: true });

/**
 * Daily Comic: Get character settings
 */
app.get('/api/muses/character-settings', async (req, res) => {
  try {
    const data = await fs.readFile(DAILY_COMIC_SETTINGS_FILE, 'utf-8');
    const settings = JSON.parse(data);
    res.json(settings);
  } catch (error) {
    // File doesn't exist yet, return empty settings
    res.json({
      characterAName: 'Wooly',
      characterBName: 'Mr. Wolf',
      characterARefImage: '',
      characterBRefImage: ''
    });
  }
});

/**
 * Daily Comic: Save character settings
 */
app.post('/api/muses/character-settings', async (req, res) => {
  try {
    const { characterAName, characterBName, characterARefImage, characterBRefImage } = req.body;

    const settings = {
      characterAName: characterAName || 'Wooly',
      characterBName: characterBName || 'Mr. Wolf',
      characterARefImage: characterARefImage || '',
      characterBRefImage: characterBRefImage || ''
    };

    await fs.writeFile(
      DAILY_COMIC_SETTINGS_FILE,
      JSON.stringify(settings, null, 2)
    );

    res.json({ success: true, message: 'Character settings saved' });
  } catch (error) {
    console.error('Error saving character settings:', error);
    res.status(500).json({ error: 'Failed to save character settings' });
  }
});

/**
 * Save prompt history for a muse entry
 */
app.post('/api/muses/prompt-history', async (req, res) => {
  try {
    const { scheduledDate, fullPrompt, timestamp } = req.body;

    if (!scheduledDate || !fullPrompt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const historyFile = path.join(MUSES_DIR, `${scheduledDate}-prompt-history.json`);

    // Load existing history or create new
    let history = [];
    try {
      const existingData = await fs.readFile(historyFile, 'utf-8');
      history = JSON.parse(existingData);
    } catch (error) {
      // File doesn't exist yet, will create new
    }

    // Add new prompt to history
    history.push({
      timestamp: timestamp || Date.now(),
      prompt: fullPrompt
    });

    // Save updated history
    await fs.writeFile(historyFile, JSON.stringify(history, null, 2));

    res.json({ success: true, message: 'Prompt history saved' });
  } catch (error) {
    console.error('Error saving prompt history:', error);
    res.status(500).json({ error: 'Failed to save prompt history' });
  }
});

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
    const isDailyComic = entry.comicType === 'daily-comic';

    // Save title image (only for four-panel comics)
    if (!isDailyComic && titleImage && titleImage.startsWith('data:image')) {
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
      titleImage: isDailyComic ? '' : `/data/muses/${scheduledDate}-title.jpg`,
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

    // Delete files (title image may not exist for daily comics)
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

    // Read metadata first to check comic type
    const metadataPath = path.join(MUSES_DIR, `${oldDate}.json`);
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
    const isDailyComic = metadata.comicType === 'daily-comic';

    // Rename title image file (only if it exists - not for daily comics)
    if (!isDailyComic) {
      await fs.rename(
        path.join(MUSES_DIR, `${oldDate}-title.jpg`),
        path.join(MUSES_DIR, `${newDate}-title.jpg`)
      ).catch(() => {});
    }

    // Rename comic image file
    await fs.rename(
      path.join(MUSES_DIR, `${oldDate}-comic.jpg`),
      path.join(MUSES_DIR, `${newDate}-comic.jpg`)
    );

    // Update metadata file
    metadata.scheduledDate = newDate;
    metadata.id = newDate;
    metadata.titleImage = isDailyComic ? '' : `/data/muses/${newDate}-title.jpg`;
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

/**
 * Story Atlas: Save character reference image
 */
app.post('/api/story-atlas/character-ref', async (req, res) => {
  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    await fs.writeFile(
      STORY_CHAR_REF_FILE,
      JSON.stringify({ imageData }, null, 2)
    );

    res.json({ success: true, message: 'Character reference saved' });
  } catch (error) {
    console.error('Error saving character reference:', error);
    res.status(500).json({ error: 'Failed to save character reference' });
  }
});

/**
 * Story Atlas: Save art style
 */
app.post('/api/story-atlas/art-style', async (req, res) => {
  try {
    const { artStyle } = req.body;

    await fs.writeFile(
      STORY_ART_STYLE_FILE,
      JSON.stringify({ artStyle: artStyle || '' }, null, 2)
    );

    res.json({ success: true, message: 'Art style saved' });
  } catch (error) {
    console.error('Error saving art style:', error);
    res.status(500).json({ error: 'Failed to save art style' });
  }
});

/**
 * Story Atlas: Generate illustration preview (doesn't save to entries.json)
 */
app.post('/api/story-atlas/generate', async (req, res) => {
  try {
    const { narration, characterRef, artStyle } = req.body;

    if (!narration) {
      return res.status(400).json({ error: 'Narration is required' });
    }

    // Import Gemini functions
    const { generateStoryIllustration } = await import('./services/gemini-story.js');

    // Generate illustration
    const illustrationData = await generateStoryIllustration(narration, characterRef, artStyle);

    // Just return the image data for preview - don't save to entries.json yet
    res.json({
      success: true,
      illustration: `data:image/jpeg;base64,${illustrationData}`
    });
  } catch (error) {
    console.error('Error generating story illustration:', error);
    res.status(500).json({ error: error.message || 'Failed to generate illustration' });
  }
});

/**
 * Story Atlas: Submit preview and save entry
 */
app.post('/api/story-atlas/submit', async (req, res) => {
  try {
    const { narration, illustration } = req.body;

    if (!narration || !illustration) {
      return res.status(400).json({ error: 'Narration and illustration are required' });
    }

    // Save illustration image
    const timestamp = Date.now();
    const filename = `${timestamp}.jpg`;
    const base64Data = illustration.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    await fs.writeFile(
      path.join(STORY_ATLAS_DIR, filename),
      buffer
    );

    // Load existing entries
    let entries = [];
    try {
      const data = await fs.readFile(STORY_ENTRIES_FILE, 'utf-8');
      entries = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet
    }

    // Add new entry
    const newEntry = {
      id: timestamp.toString(),
      narration,
      illustration: `/data/story-atlas/${filename}`,
      createdAt: timestamp
    };

    entries.push(newEntry);

    // Save updated entries
    await fs.writeFile(
      STORY_ENTRIES_FILE,
      JSON.stringify(entries, null, 2)
    );

    res.json({
      success: true,
      message: 'Story entry saved successfully'
    });
  } catch (error) {
    console.error('Error saving story entry:', error);
    res.status(500).json({ error: 'Failed to save story entry' });
  }
});

/**
 * Story Atlas: Update an entry's narration
 */
app.put('/api/story-atlas/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { narration } = req.body;

    if (!narration || !narration.trim()) {
      return res.status(400).json({ error: 'Narration is required' });
    }

    // Load existing entries
    let entries = [];
    try {
      const data = await fs.readFile(STORY_ENTRIES_FILE, 'utf-8');
      entries = JSON.parse(data);
    } catch (error) {
      return res.status(404).json({ error: 'No entries found' });
    }

    // Find the entry to update
    const entryIndex = entries.findIndex(e => e.id === id);
    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Update the narration
    entries[entryIndex].narration = narration;

    // Save updated entries
    await fs.writeFile(
      STORY_ENTRIES_FILE,
      JSON.stringify(entries, null, 2)
    );

    res.json({ success: true, message: 'Narration updated successfully' });
  } catch (error) {
    console.error('Error updating narration:', error);
    res.status(500).json({ error: 'Failed to update narration' });
  }
});

/**
 * Story Atlas: Replace an entry's image
 */
app.put('/api/story-atlas/entries/:id/image', async (req, res) => {
  try {
    const { id } = req.params;
    const { illustration } = req.body;

    if (!illustration) {
      return res.status(400).json({ error: 'Illustration is required' });
    }

    // Load existing entries
    let entries = [];
    try {
      const data = await fs.readFile(STORY_ENTRIES_FILE, 'utf-8');
      entries = JSON.parse(data);
    } catch (error) {
      return res.status(404).json({ error: 'No entries found' });
    }

    // Find the entry to update
    const entryIndex = entries.findIndex(e => e.id === id);
    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const oldEntry = entries[entryIndex];

    // Delete old image file
    const oldFilename = oldEntry.illustration.split('/').pop();
    await fs.unlink(path.join(STORY_ATLAS_DIR, oldFilename)).catch(() => {});

    // Save new illustration image
    const timestamp = Date.now();
    const filename = `${timestamp}.jpg`;
    const base64Data = illustration.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    await fs.writeFile(
      path.join(STORY_ATLAS_DIR, filename),
      buffer
    );

    // Update the entry
    entries[entryIndex].illustration = `/data/story-atlas/${filename}`;

    // Save updated entries
    await fs.writeFile(
      STORY_ENTRIES_FILE,
      JSON.stringify(entries, null, 2)
    );

    res.json({ success: true, message: 'Image replaced successfully' });
  } catch (error) {
    console.error('Error replacing image:', error);
    res.status(500).json({ error: 'Failed to replace image' });
  }
});

/**
 * Story Atlas: Delete an entry
 */
app.delete('/api/story-atlas/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Load existing entries
    let entries = [];
    try {
      const data = await fs.readFile(STORY_ENTRIES_FILE, 'utf-8');
      entries = JSON.parse(data);
    } catch (error) {
      return res.status(404).json({ error: 'No entries found' });
    }

    // Find the entry to delete
    const entryToDelete = entries.find(e => e.id === id);
    if (!entryToDelete) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Delete the image file
    const filename = entryToDelete.illustration.split('/').pop();
    await fs.unlink(path.join(STORY_ATLAS_DIR, filename)).catch(() => {});

    // Remove entry from array
    entries = entries.filter(e => e.id !== id);

    // Save updated entries
    await fs.writeFile(
      STORY_ENTRIES_FILE,
      JSON.stringify(entries, null, 2)
    );

    res.json({ success: true, message: 'Story entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting story entry:', error);
    res.status(500).json({ error: 'Failed to delete story entry' });
  }
});

/**
 * Stories: Get all stories
 */
app.get('/api/stories', async (req, res) => {
  try {
    const data = await fs.readFile(STORIES_FILE, 'utf-8');
    const stories = JSON.parse(data);
    res.json(stories);
  } catch (error) {
    console.error('Error loading stories:', error);
    res.status(500).json({ error: 'Failed to load stories' });
  }
});

/**
 * Stories: Update a story's metadata
 */
app.put('/api/stories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    // Load existing stories
    let stories = [];
    try {
      const data = await fs.readFile(STORIES_FILE, 'utf-8');
      stories = JSON.parse(data);
    } catch (error) {
      return res.status(404).json({ error: 'Stories file not found' });
    }

    // Find the story to update
    const storyIndex = stories.findIndex(s => s.id === id);
    if (storyIndex === -1) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Update the story
    stories[storyIndex].title = title;
    stories[storyIndex].description = description;

    // Save updated stories
    await fs.writeFile(
      STORIES_FILE,
      JSON.stringify(stories, null, 2)
    );

    res.json({ success: true, message: 'Story updated successfully' });
  } catch (error) {
    console.error('Error updating story:', error);
    res.status(500).json({ error: 'Failed to update story' });
  }
});

/**
 * Product Ideas: Generate product image
 */
app.post('/api/product-ideas/generate-image', async (req, res) => {
  try {
    const { idea } = req.body;

    if (!idea) {
      return res.status(400).json({ error: 'Product idea is required' });
    }

    // Import Gemini functions
    const { generateProductImage } = await import('./services/gemini-product.js');

    // Generate image
    const imageData = await generateProductImage(idea);

    res.json({
      success: true,
      image: `data:image/jpeg;base64,${imageData}`
    });
  } catch (error) {
    console.error('Error generating product image:', error);
    res.status(500).json({ error: error.message || 'Failed to generate product image' });
  }
});

/**
 * Product Ideas: Submit and analyze product idea
 */
app.post('/api/product-ideas/submit', async (req, res) => {
  try {
    const { idea, image } = req.body;

    if (!idea || !image) {
      return res.status(400).json({ error: 'Idea and image are required' });
    }

    // Import Gemini functions
    const { analyzeProductIdea } = await import('./services/gemini-product.js');

    // Analyze the idea (get pros, cons, similar products)
    const analysis = await analyzeProductIdea(idea);

    // Save product image
    const timestamp = Date.now();
    const filename = `${timestamp}.jpg`;
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    await fs.writeFile(
      path.join(PRODUCT_IMAGES_DIR, filename),
      buffer
    );

    // Load existing product ideas
    let ideas = [];
    try {
      const data = await fs.readFile(PRODUCT_IDEAS_FILE, 'utf-8');
      ideas = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet
    }

    // Add new product idea
    const newIdea = {
      id: timestamp.toString(),
      idea,
      image: `/data/product-images/${filename}`,
      pros: analysis.pros,
      cons: analysis.cons,
      similarProducts: analysis.similarProducts,
      createdAt: timestamp
    };

    ideas.unshift(newIdea); // Add to beginning

    // Save updated product ideas
    await fs.writeFile(
      PRODUCT_IDEAS_FILE,
      JSON.stringify(ideas, null, 2)
    );

    res.json({
      success: true,
      message: 'Product idea submitted successfully',
      idea: newIdea
    });
  } catch (error) {
    console.error('Error submitting product idea:', error);
    res.status(500).json({ error: error.message || 'Failed to submit product idea' });
  }
});

/**
 * Product Ideas: Get all product ideas
 */
app.get('/api/product-ideas', async (req, res) => {
  try {
    const data = await fs.readFile(PRODUCT_IDEAS_FILE, 'utf-8');
    const ideas = JSON.parse(data);
    res.json(ideas);
  } catch (error) {
    console.error('Error loading product ideas:', error);
    res.status(500).json({ error: 'Failed to load product ideas' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ GitHub Storage API running on http://localhost:${PORT}`);
});
