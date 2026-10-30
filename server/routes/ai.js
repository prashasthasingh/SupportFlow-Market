const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { auth, sellerOnly } = require('../middleware/auth');

const router = express.Router();

// POST /api/ai/generate-description — generate product description using Gemini
router.post('/generate-description', auth, sellerOnly, async (req, res) => {
  const { title, keywords } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Product title is required' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ message: 'AI service not configured' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a product copywriter for a local market app in India. Write a short, appealing product description (2-3 sentences, max 80 words) for this product sold by a local shop.

Product: "${title}"
${keywords ? `Keywords/details: ${keywords}` : ''}

Write in a warm, trustworthy tone. Highlight quality, local craftsmanship, or freshness where relevant. Return ONLY the description text, no quotes, no labels.`;

    const result = await model.generateContent(prompt);
    const description = result.response.text().trim();

    res.json({ description });
  } catch (err) {
    console.error('[AI] Gemini error:', err.message);
    res.status(500).json({ message: 'AI generation failed. You can still write your own description.' });
  }
});

module.exports = router;
