import { NextRequest, NextResponse } from 'next/server'
import { extractPDF, analyzeFilename } from '@/lib/pdf-extractor'
import { classifyContent } from '@/lib/classifier'
import { Role } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const role = (formData.get('role') as Role) || 'staff'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

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
    return NextResponse.json({ error: 'Failed to analyze PDF' }, { status: 500 })
  }
}
