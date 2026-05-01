import { NextRequest, NextResponse } from 'next/server'
import { extractPDF, analyzeFilename } from '@/lib/pdf-extractor'
import { classifyContent } from '@/lib/classifier'
import { Role } from '@/lib/types'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const role = (formData.get('role') as Role) || 'staff'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured on this deployment' }, { status: 500 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { text, pageCount, metadata } = await extractPDF(buffer)
    const filenameSignals = analyzeFilename(file.name)

    const result = await classifyContent({
      type: 'pdf',
      value: text,
      filename: file.name,
      role,
      metadata: {
        pageCount,
        title: metadata.Title,
        language: metadata.Language,
        lastModified: metadata.ModDate,
        ...filenameSignals
      }
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('PDF analysis error:', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
