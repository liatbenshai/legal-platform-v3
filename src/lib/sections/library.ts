import sec001 from '@templates/poa-property/SEC_001.json'
import sec002 from '@templates/poa-property/SEC_002.json'
import sec003 from '@templates/poa-property/SEC_003.json'
import sec004 from '@templates/poa-property/SEC_004.json'
import sec005 from '@templates/poa-property/SEC_005.json'
import sec006 from '@templates/poa-property/SEC_006.json'
import sec007 from '@templates/poa-property/SEC_007.json'
import sec008 from '@templates/poa-property/SEC_008.json'
import sec009 from '@templates/poa-property/SEC_009.json'
import sec010 from '@templates/poa-property/SEC_010.json'
import sec011 from '@templates/poa-property/SEC_011.json'
import sec012 from '@templates/poa-property/SEC_012.json'
import sec013 from '@templates/poa-property/SEC_013.json'
import sec014 from '@templates/poa-personal/SEC_014.json'
import sec015 from '@templates/poa-personal/SEC_015.json'
import sec016 from '@templates/poa-personal/SEC_016.json'
import sec017 from '@templates/poa-personal/SEC_017.json'
import sec018 from '@templates/poa-personal/SEC_018.json'
import sec019 from '@templates/poa-personal/SEC_019.json'
import sec020 from '@templates/poa-personal/SEC_020.json'
import sec021 from '@templates/poa-personal/SEC_021.json'
import sec022 from '@templates/poa-medical/SEC_022.json'
import sec023 from '@templates/poa-medical/SEC_023.json'
import sec024 from '@templates/poa-medical/SEC_024.json'
import sec025 from '@templates/poa-medical/SEC_025.json'
import sec026 from '@templates/poa-personal/SEC_026.json'

import type { ActorRole, DocumentType } from '@/lib/types'

export interface LibrarySectionVariant {
  id: string
  label: string
  content: string
}

export interface LibrarySection {
  sectionId: string
  category: DocumentType
  documentTypes: DocumentType[]
  title: string
  description: string
  variants: LibrarySectionVariant[]
  requiredActors: ActorRole[]
  legalBasis: string
  isRequired: boolean
  conflictsWith: string[]
  tags: string[]
}

export const sectionLibrary: LibrarySection[] = [
  sec001,
  sec002,
  sec003,
  sec004,
  sec005,
  sec006,
  sec007,
  sec008,
  sec009,
  sec010,
  sec011,
  sec012,
  sec013,
  sec014,
  sec015,
  sec016,
  sec017,
  sec018,
  sec019,
  sec020,
  sec021,
  sec022,
  sec023,
  sec024,
  sec025,
  sec026,
] as LibrarySection[]

export const CATEGORY_LABELS: Record<DocumentType, string> = {
  'poa-property': 'רכושי',
  'poa-personal': 'אישי',
  'poa-medical': 'רפואי',
  'will-individual': 'צוואת יחיד',
  'will-mutual': 'צוואה הדדית',
  prenup: 'הסכם ממון',
  divorce: 'גירושין',
  partition: 'פירוק שיתוף',
  'fee-agreement': 'שכר טרחה',
}
