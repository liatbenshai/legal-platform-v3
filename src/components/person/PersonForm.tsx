'use client'

import { useEffect, useState } from 'react'
import { createPerson, updatePerson, type PersonInput } from '@/lib/db/persons'
import { createClient } from '@/lib/db/supabase'
import { personSchema } from '@/lib/schemas'
import type { Gender, Person } from '@/lib/types'

interface PersonFormProps {
  open: boolean
  clientId: string
  initialValues?: Person
  onClose: () => void
  onSaved: () => void
}

interface FormState {
  firstName: string
  lastName: string
  idNumber: string
  gender: Gender | ''
  birthDate: string
  address: string
  city: string
  phone: string
  email: string
}

const emptyForm: FormState = {
  firstName: '',
  lastName: '',
  idNumber: '',
  gender: '',
  birthDate: '',
  address: '',
  city: '',
  phone: '',
  email: '',
}

function personToForm(p: Person): FormState {
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    idNumber: p.idNumber,
    gender: p.gender,
    birthDate: p.birthDate ? p.birthDate.toISOString().slice(0, 10) : '',
    address: p.address,
    city: p.city,
    phone: p.phone ?? '',
    email: p.email ?? '',
  }
}

const personFormSchema = personSchema.omit({ id: true, clientId: true })

export function PersonForm({
  open,
  clientId,
  initialValues,
  onClose,
  onSaved,
}: PersonFormProps) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(initialValues ? personToForm(initialValues) : emptyForm)
      setErrors({})
      setSubmitError(null)
    }
  }, [open, initialValues])

  if (!open) return null

  const isEditing = Boolean(initialValues)

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const candidate = {
      firstName: form.firstName,
      lastName: form.lastName,
      idNumber: form.idNumber,
      gender: form.gender as Gender,
      birthDate: form.birthDate ? new Date(form.birthDate) : undefined,
      address: form.address,
      city: form.city,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
    }

    if (!candidate.gender) {
      setErrors({ gender: 'יש לבחור מגדר' })
      return
    }

    const result = personFormSchema.safeParse(candidate)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string' && !fieldErrors[field]) {
          fieldErrors[field] = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    setIsSaving(true)
    const supabase = createClient()
    const input: PersonInput = result.data

    try {
      if (isEditing && initialValues) {
        await updatePerson(supabase, initialValues.id, input)
      } else {
        await createPerson(supabase, clientId, input)
      }
      onSaved()
      onClose()
    } catch {
      setSubmitError('שגיאה בשמירה. נסה/י שוב.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="person-form-title"
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative my-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="סגירה"
          className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full text-2xl leading-none"
        >
          ×
        </button>

        <h2
          id="person-form-title"
          className="text-2xl font-bold text-slate-800 mb-6 text-center"
        >
          {isEditing ? 'עריכת אדם' : 'הוספת אדם חדש'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                שם פרטי <span className="text-red-600">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                value={form.firstName}
                onChange={(e) => setField('firstName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.firstName && (
                <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                שם משפחה <span className="text-red-600">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                value={form.lastName}
                onChange={(e) => setField('lastName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.lastName && (
                <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="idNumber"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              תעודת זהות <span className="text-red-600">*</span>
            </label>
            <input
              id="idNumber"
              type="text"
              inputMode="numeric"
              maxLength={9}
              value={form.idNumber}
              onChange={(e) =>
                setField('idNumber', e.target.value.replace(/\D/g, ''))
              }
              dir="ltr"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            />
            {errors.idNumber && (
              <p className="text-xs text-red-600 mt-1">{errors.idNumber}</p>
            )}
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-700 mb-2">
              מגדר <span className="text-red-600">*</span>
            </span>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={form.gender === 'male'}
                  onChange={() => setField('gender', 'male')}
                  className="w-4 h-4"
                />
                <span>זכר</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={form.gender === 'female'}
                  onChange={() => setField('gender', 'female')}
                  className="w-4 h-4"
                />
                <span>נקבה</span>
              </label>
            </div>
            {errors.gender && (
              <p className="text-xs text-red-600 mt-1">{errors.gender}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              כתובת <span className="text-red-600">*</span>
            </label>
            <input
              id="address"
              type="text"
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.address && (
              <p className="text-xs text-red-600 mt-1">{errors.address}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              עיר <span className="text-red-600">*</span>
            </label>
            <input
              id="city"
              type="text"
              value={form.city}
              onChange={(e) => setField('city', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.city && (
              <p className="text-xs text-red-600 mt-1">{errors.city}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                טלפון
              </label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                dir="ltr"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              />
            </div>
            <div>
              <label
                htmlFor="birthDate"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                תאריך לידה
              </label>
              <input
                id="birthDate"
                type="date"
                value={form.birthDate}
                onChange={(e) => setField('birthDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.birthDate && (
                <p className="text-xs text-red-600 mt-1">{errors.birthDate}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              אימייל
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              dir="ltr"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          {submitError && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
            >
              {submitError}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
            >
              {isSaving ? 'שומר...' : 'שמור'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
