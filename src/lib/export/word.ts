import {
  AlignmentType,
  Document as DocxDocument,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import { saveAs } from 'file-saver'
import type { InflectedWord } from '@/lib/engine/dictionary'
import { renderDocument } from '@/lib/engine/renderer'
import type { Document, Person } from '@/lib/types'

const FONT = 'David'
const SIZE_TITLE = 32 // 16pt
const SIZE_HEADING = 28 // 14pt
const SIZE_SUBHEADING = 26 // 13pt
const SIZE_BODY = 24 // 12pt
const LINE_SPACING = 360 // 1.5 line spacing (240 = single, 360 = 1.5)

interface ExportOptions {
  document: Document
  persons: Person[]
  dictionary?: Record<string, InflectedWord>
}

/**
 * Parse inline **bold** markers in a line of text into alternating
 * regular and bold TextRuns. Returns a list of TextRuns ready to be
 * placed inside a Paragraph.
 */
function parseInlineBold(text: string): TextRun[] {
  const segments = text.split(/(\*\*[^*]+\*\*)/g).filter((s) => s.length > 0)
  return segments.map((segment) => {
    const boldMatch = segment.match(/^\*\*([^*]+)\*\*$/)
    if (boldMatch) {
      return new TextRun({
        text: boldMatch[1],
        font: FONT,
        size: SIZE_BODY,
        bold: true,
        rightToLeft: true,
      })
    }
    return new TextRun({
      text: segment,
      font: FONT,
      size: SIZE_BODY,
      rightToLeft: true,
    })
  })
}

function isSubheading(line: string): boolean {
  return /^\*\*[^*]+\*\*$/.test(line.trim())
}

function makeSubheading(line: string): Paragraph {
  const text = line.trim().replace(/^\*\*|\*\*$/g, '')
  return new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    spacing: { before: 200, after: 100, line: LINE_SPACING },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: SIZE_SUBHEADING,
        bold: true,
        rightToLeft: true,
      }),
    ],
  })
}

function makeBodyParagraph(line: string): Paragraph {
  return new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: LINE_SPACING },
    children: parseInlineBold(line),
  })
}

function makeSectionHeading(number: number, title: string): Paragraph {
  return new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 160, line: LINE_SPACING },
    children: [
      new TextRun({
        text: `${number}. ${title}`,
        font: FONT,
        size: SIZE_HEADING,
        bold: true,
        rightToLeft: true,
      }),
    ],
  })
}

function makeDocumentTitle(title: string): Paragraph {
  return new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.CENTER,
    heading: HeadingLevel.TITLE,
    spacing: { after: 400, line: LINE_SPACING },
    children: [
      new TextRun({
        text: title,
        font: FONT,
        size: SIZE_TITLE,
        bold: true,
        rightToLeft: true,
      }),
    ],
  })
}

function safeFilename(title: string): string {
  // Strip filesystem-unfriendly chars but keep Hebrew letters
  const cleaned = title.replace(/[\\/:*?"<>|]/g, '').trim()
  return `${cleaned || 'מסמך'}.docx`
}

export async function exportToWord(opts: ExportOptions): Promise<void> {
  const rendered = renderDocument({
    document: opts.document,
    persons: opts.persons,
    dictionary: opts.dictionary,
  })

  const children: Paragraph[] = []

  children.push(makeDocumentTitle(opts.document.title))

  let mainIndex = 0
  for (const section of rendered) {
    if (section.level === 'main') {
      mainIndex += 1
    }
    children.push(makeSectionHeading(mainIndex, section.title))

    const lines = section.content.split('\n')
    for (const rawLine of lines) {
      const line = rawLine.replace(/\r$/, '')
      if (!line.trim()) continue
      if (isSubheading(line)) {
        children.push(makeSubheading(line))
      } else {
        children.push(makeBodyParagraph(line))
      }
    }
  }

  const docx = new DocxDocument({
    creator: 'Legal Platform v3',
    title: opts.document.title,
    styles: {
      default: {
        document: {
          run: { font: FONT, size: SIZE_BODY, rightToLeft: true },
          paragraph: { spacing: { line: LINE_SPACING } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(docx)
  saveAs(blob, safeFilename(opts.document.title))
}
