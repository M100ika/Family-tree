import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GoogleGenAI } from '@google/genai'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { base64, mimeType = 'image/jpeg', fileName = 'document' } = req.body
    const apiKey = process.env.GEMINI_API_KEY

    if (!base64) {
      return res.status(400).json({ error: 'No document base64 data received' })
    }

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || !apiKey.trim()) {
      await new Promise(r => setTimeout(r, 1500))
      return res.json({
        transcription: `OFFICIAL RECORD TRANSCRIPTION\n-----------------------------\nThis certificate certifies the marriage of Arthur Vance, aged 29 of Market Rasen, Lincolnshire, of the Union of England, and Eleanor Thorne, aged 21 of Lincolnshire, daughter of Robert Thorne. Signed on June 4th, 1912 by St. Mary's parish clerk, Reverend W. Jenkins.\n\nNotes: Document is written in a standard Copperplate cursive script. Wear is visible along the crease lines. Excellent historical evidence.`,
        metadata: {
          confidence: 0.94,
          handwritingStyle: 'Early 20th Century Cursive',
          namesFound: ['Arthur Vance', 'Eleanor Thorne', 'Robert Thorne', 'Jenkins'],
          datesFound: ['June 4, 1912'],
        },
        isMock: true,
      })
    }

    const client = new GoogleGenAI({ apiKey })
    const promptText = `Analyze this scanned historical family archival record, document or photograph.
If it is a document (letter, certificate, record, diary entry), provide a verbatim transcription, correct any difficult-to-read cursive to standard readable English text, and note down key dates, places, and historic names mentioned.
If it is a photo or artifact, describe what is shown in high detail (vintage, dress code, family members, location hint) and propose its historical context.
Provide a clear, readable text format with proper headings or sections.`

    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ inlineData: { data: base64, mimeType } }, promptText],
    })

    return res.json({
      transcription: response.text || 'Failed to extract transcription text.',
      metadata: { confidence: 0.98, handwritingStyle: 'Analyzed by AI', namesFound: [], datesFound: [] },
      isMock: false,
    })
  } catch (error: any) {
    console.error('OCR API Error:', error)
    return res.status(500).json({ error: error.message || 'An error occurred during OCR transcription.' })
  }
}
