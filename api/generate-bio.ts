import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GoogleGenAI } from '@google/genai'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, birthYear, deathYear, birthPlace, highlights = [] } = req.body
    const apiKey = process.env.GEMINI_API_KEY

    if (!name) {
      return res.status(400).json({ error: 'Name is required.' })
    }

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || !apiKey.trim()) {
      await new Promise(r => setTimeout(r, 1200))
      return res.json({
        story: `${name} was born in ${birthYear || 'the early 20th century'}${birthPlace ? ` in ${birthPlace}` : ''}. Growing up during an era of significant global transformation, they carried a unique strength, passing down traditions that defined the family's spirit.\n\nThroughout their life, they were known as a pillar of strength, showing a great love for community, family dedication, and personal passions${highlights.length > 0 ? ` including ${highlights.join(', ')}` : ''}.\n\nThe legacy they left behind continues to inspire their descendants. Today, we preserve their memories, letters, and snapshots, keeping their story forever alive.`,
        quote: `"History is not just about nations, it is the living thread of love and family that connects us all."`,
        isMock: true,
      })
    }

    const client = new GoogleGenAI({ apiKey })
    const promptText = `Generate a touching, well-structured, narrative biography (3-4 paragraphs) for our family tree platform.
Subject name: "${name}"
Birth Year: ${birthYear || 'Unknown'}
Death Year: ${deathYear || 'Present'}
Birth Place: ${birthPlace || 'Unknown'}
Key accomplishments/highlights: ${highlights.length > 0 ? highlights.join(', ') : 'dedication to family, hard work, and passing down traditions.'}

Write it in a warm, respectful, and slightly nostalgic historical narrative style.
Also, generate a poignant quote in first-person (or attributed to them) that captures their life philosophy.
Format output as JSON: { "story": "...", "quote": "..." }`

    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: { story: { type: 'STRING' }, quote: { type: 'STRING' } },
          required: ['story', 'quote'],
        },
      },
    })

    let jsonRes = { story: '', quote: '' }
    try {
      if (response.text) jsonRes = JSON.parse(response.text.trim())
    } catch {
      jsonRes = { story: response.text || 'Failed to generate story.', quote: 'The past is our foundation.' }
    }

    return res.json({ ...jsonRes, isMock: false })
  } catch (error: any) {
    console.error('Bio Generation Error:', error)
    return res.status(500).json({ error: error.message || 'An error occurred during biography generation.' })
  }
}
