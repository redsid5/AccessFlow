import { NextRequest, NextResponse } from 'next/server'
import { extractPDF, analyzeFilename } from '@/lib/pdf-extractor'
import { classifyContent } from '@/lib/classifier'
import { Role } from '@/lib/types'

export const maxDuration = 60

const VALID_ROLES = new Set<Role>(['staff', 'faculty', 'admin', 'student'])
const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const roleRaw = formData.get('role')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 })
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 400 })
    }

    const role: Role = VALID_ROLES.has(roleRaw as Role) ? (roleRaw as Role) : 'staff'

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
        ...filenameSignals,
      },
    })

    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
