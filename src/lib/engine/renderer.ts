import type { Document, EmbeddedPerson, SectionLevel } from '@/lib/types'
import { dictionary, type InflectedWord } from './dictionary'

/**
 * RenderContext — context לרינדור.
 * שים לב: persons הוסר. הנתונים מגיעים מ-document.actors[X].persons inline.
 */
export interface RenderContext {
  document: Document
  dictionary?: Record<string, InflectedWord>
}

export interface RenderedSection {
  id: string
  title: string
  content: string
  level: SectionLevel
  order: number
}

function formatHebrewDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function resolvePlaceholder(expr: string, ctx: RenderContext): string {
  if (!expr.includes('.')) {
    return ctx.document.variables[expr] ?? `{{${expr}}}`
  }

  const [actorRole, ...rest] = expr.split('.')
  const property = rest.join('.')

  const actor = ctx.document.actors.find((a) => a.role === actorRole)
  if (!actor) return `{{${expr}}}`

  const persons: EmbeddedPerson[] = actor.persons ?? []
  if (persons.length === 0) return `{{${expr}}}`

  const isPlural = persons.length > 1
  const allFemale = persons.every((p) => p.gender === 'female')

  switch (property) {
    case 'שם':
      return persons.map((p) => `${p.firstName} ${p.lastName}`).join(' ו-')
    case 'שם_פרטי':
      return persons.map((p) => p.firstName).join(' ו-')
    case 'שם_משפחה':
      return persons.map((p) => p.lastName).join(' ו-')
    case 'תז':
    case 'ת.ז.':
      return persons.map((p) => p.idNumber).join(', ')
    case 'כתובת':
      return persons.map((p) => p.address).join(', ')
    case 'עיר':
      return persons.map((p) => p.city).join(', ')
    case 'תאריך_לידה':
      return persons
        .map((p) => (p.birthDate ? formatHebrewDate(p.birthDate) : ''))
        .join(', ')
    case 'טלפון':
      return persons.map((p) => p.phone ?? '').join(', ')
    case 'אימייל':
      return persons.map((p) => p.email ?? '').join(', ')
  }

  const dict = ctx.dictionary ?? dictionary
  const word = dict[property]
  if (!word) return property

  if (isPlural) {
    return word.plural_female && allFemale ? word.plural_female : word.plural
  }
  if (allFemale) return word.female
  return word.male
}

export function renderText(text: string, ctx: RenderContext): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
    return resolvePlaceholder(expr.trim(), ctx)
  })
}

export function renderDocument(ctx: RenderContext): RenderedSection[] {
  return ctx.document.sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((section) => ({
      id: section.id,
      title: renderText(section.title, ctx),
      content: renderText(section.content, ctx),
      level: section.level,
      order: section.order,
    }))
}

export function extractPlaceholders(text: string): string[] {
  const found = new Set<string>()
  for (const match of text.matchAll(/\{\{([^}]+)\}\}/g)) {
    found.add(match[1].trim())
  }
  return Array.from(found)
}
