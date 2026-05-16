import {
  AlignmentType,
  Document as DocxDocument,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import {
  dictionary as staticDictionary,
  type InflectedWord,
} from '@/lib/engine/dictionary'
import { renderDocument } from '@/lib/engine/renderer'
import type { Document, Person } from '@/lib/types'

const FONT = 'David'
const SIZE_TITLE = 32 // 16pt
const SIZE_HEADING = 28 // 14pt
const SIZE_SUBHEADING = 26 // 13pt
const SIZE_BODY = 24 // 12pt
const LINE_SPACING = 360 // 1.5 line spacing

interface ExportOptions {
  document: Document
  persons: Person[]
  dictionary?: Record<string, InflectedWord>
}

function formatDateForExport(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

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
    alignment: AlignmentType.RIGHT,
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

function makeLabelValueParagraph(label: string, value: string): Paragraph {
  return new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    spacing: { after: 80, line: LINE_SPACING },
    children: [
      new TextRun({
        text: `${label}: `,
        font: FONT,
        size: SIZE_BODY,
        bold: true,
        rightToLeft: true,
      }),
      new TextRun({
        text: value,
        font: FONT,
        size: SIZE_BODY,
        rightToLeft: true,
      }),
    ],
  })
}

function makePersonBlock(heading: string, person: Person): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.RIGHT,
      spacing: { before: 200, after: 100, line: LINE_SPACING },
      children: [
        new TextRun({
          text: heading,
          font: FONT,
          size: SIZE_SUBHEADING,
          bold: true,
          rightToLeft: true,
        }),
      ],
    }),
    makeLabelValueParagraph(
      'שם מלא',
      `${person.firstName} ${person.lastName}`
    ),
    makeLabelValueParagraph('תעודת זהות', person.idNumber),
  ]
  if (person.birthDate) {
    paragraphs.push(
      makeLabelValueParagraph(
        'תאריך לידה',
        formatDateForExport(person.birthDate)
      )
    )
  }
  paragraphs.push(
    makeLabelValueParagraph('כתובת', `${person.address}, ${person.city}`)
  )
  if (person.phone) {
    paragraphs.push(makeLabelValueParagraph('טלפון', person.phone))
  }
  if (person.email) {
    paragraphs.push(makeLabelValueParagraph('דואר אלקטרוני', person.email))
  }
  return paragraphs
}

function getAttorneyTitle(
  attorneys: Person[],
  dict: Record<string, InflectedWord>
): string {
  const entry = dict['מיופה_כוח'] ?? staticDictionary['מיופה_כוח']
  if (!entry) return 'מיופה הכוח'
  if (attorneys.length > 1) {
    const allFemale = attorneys.every((p) => p.gender === 'female')
    return entry.plural_female && allFemale ? entry.plural_female : entry.plural
  }
  if (attorneys.length === 0) return entry.male
  return attorneys[0].gender === 'female' ? entry.female : entry.male
}

function makePartiesSection(opts: ExportOptions): Paragraph[] {
  const paragraphs: Paragraph[] = []
  const dict = opts.dictionary ?? staticDictionary

  paragraphs.push(
    new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.RIGHT,
      spacing: { before: 200, after: 200, line: LINE_SPACING },
      children: [
        new TextRun({
          text: 'פרטי הצדדים',
          font: FONT,
          size: SIZE_HEADING,
          bold: true,
          rightToLeft: true,
        }),
      ],
    })
  )

  // Principal block (always first)
  const principalActor = opts.document.actors.find((a) => a.role === 'ממנה')
  if (principalActor) {
    const principalPersons = principalActor.personIds
      .map((id) => opts.persons.find((p) => p.id === id))
      .filter((p): p is Person => p !== undefined)
    if (principalPersons.length > 0) {
      paragraphs.push(...makePersonBlock('פרטי הממנה', principalPersons[0]))
    }
  }

  // Attorneys block
  const attorneyActor = opts.document.actors.find((a) => a.role === 'מיופה')
  if (attorneyActor) {
    const attorneyPersons = attorneyActor.personIds
      .map((id) => opts.persons.find((p) => p.id === id))
      .filter((p): p is Person => p !== undefined)

    if (attorneyPersons.length === 1) {
      const title = getAttorneyTitle(attorneyPersons, dict)
      paragraphs.push(...makePersonBlock(`פרטי ${title}`, attorneyPersons[0]))
    } else {
      attorneyPersons.forEach((person, idx) => {
        paragraphs.push(
          ...makePersonBlock(`פרטי מיופה כוח ${idx + 1}`, person)
        )
      })
    }
  }

  return paragraphs
}

function safeFilename(title: string): string {
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
  children.push(...makePartiesSection(opts))

  // Section heading for the directives block
  children.push(
    new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.RIGHT,
      spacing: { before: 400, after: 200, line: LINE_SPACING },
      children: [
        new TextRun({
          text: 'הנחיות מקדימות',
          font: FONT,
          size: SIZE_HEADING,
          bold: true,
          rightToLeft: true,
        }),
      ],
    })
  )

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
          run: {
            font: FONT,
            size: SIZE_BODY,
            rightToLeft: true,
            language: { value: 'he-IL', bidirectional: 'he-IL' },
          },
          paragraph: {
            spacing: { line: LINE_SPACING },
            alignment: AlignmentType.RIGHT,
          },
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
  const patched = await injectSectionBidi(blob)
  saveAs(patched, safeFilename(opts.document.title))
}

/**
 * The docx package does not expose section-level `<w:bidi/>` via its
 * typed API, but without it Word treats the section as LTR even though
 * each paragraph is bidi. We unzip the .docx, modify word/document.xml
 * to inject `<w:bidi/>` into every `<w:sectPr>` block that doesn't
 * already have one, then re-zip and return the new blob.
 */
async function injectSectionBidi(blob: Blob): Promise<Blob> {
  const buffer = await blob.arrayBuffer()
  const zip = await JSZip.loadAsync(buffer)
  const documentEntry = zip.file('word/document.xml')
  if (!documentEntry) return blob

  const xml = await documentEntry.async('string')
  const patchedXml = xml.replace(
    /<w:sectPr\b([^>]*)>([\s\S]*?)<\/w:sectPr>/g,
    (_match, attrs: string, inner: string) => {
      if (/<w:bidi\b/.test(inner)) {
        return `<w:sectPr${attrs}>${inner}</w:sectPr>`
      }
      return `<w:sectPr${attrs}><w:bidi/>${inner}</w:sectPr>`
    }
  )

  if (patchedXml === xml) return blob

  zip.file('word/document.xml', patchedXml)
  return zip.generateAsync({
    type: 'blob',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}
