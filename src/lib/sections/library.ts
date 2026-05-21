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
import sec027 from '@templates/poa-medical/SEC_027.json'
import sec028 from '@templates/poa-personal/SEC_028.json'
import sec029 from '@templates/poa-property/SEC_029.json'
import sec030 from '@templates/poa-personal/SEC_030.json'
import sec031 from '@templates/poa-property/SEC_031.json'
import sec032 from '@templates/poa-property/SEC_032.json'
import sec033 from '@templates/poa-property/SEC_033.json'
import sec034 from '@templates/poa-property/SEC_034.json'
import sec035 from '@templates/poa-property/SEC_035.json'
import sec036 from '@templates/poa-property/SEC_036.json'
import sec037 from '@templates/poa-property/SEC_037.json'
import sec038 from '@templates/poa-personal/SEC_038.json'
import sec039 from '@templates/poa-personal/SEC_039.json'
import sec040 from '@templates/poa-personal/SEC_040.json'
import sec041 from '@templates/poa-personal/SEC_041.json'
import sec042 from '@templates/poa-personal/SEC_042.json'
import sec043 from '@templates/poa-personal/SEC_043.json'
import sec044 from '@templates/poa-personal/SEC_044.json'
import sec045 from '@templates/poa-medical/SEC_045.json'
import sec046 from '@templates/poa-medical/SEC_046.json'
import sec047 from '@templates/poa-medical/SEC_047.json'
import sec048 from '@templates/poa-medical/SEC_048.json'
import sec049 from '@templates/poa-medical/SEC_049.json'
import sec050 from '@templates/poa-medical/SEC_050.json'
import sec051 from '@templates/poa-medical/SEC_051.json'
import sec052 from '@templates/poa-medical/SEC_052.json'
import sec053 from '@templates/poa-medical/SEC_053.json'
import sec054 from '@templates/poa-medical/SEC_054.json'

// === Will Individual sections (basic starters) ===
import secW01 from '@templates/will-individual/SEC_W01.json'
import secW02 from '@templates/will-individual/SEC_W02.json'
import secW03 from '@templates/will-individual/SEC_W03.json'
// הערה: SEC_W04 (אישור עדים) הוסר מהספרייה — הוא מתווסף אוטומטית
// בסוף כל צוואת יחיד דרך auto-sections.ts

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
  sec027,
  sec028,
  sec029,
  sec030,
  sec031,
  sec032,
  sec033,
  sec034,
  sec035,
  sec036,
  sec037,
  sec038,
  sec039,
  sec040,
  sec041,
  sec042,
  sec043,
  sec044,
  sec045,
  sec046,
  sec047,
  sec048,
  sec049,
  sec050,
  sec051,
  sec052,
  sec053,
  sec054,
  // Will Individual
  secW01,
  secW02,
  secW03,
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
