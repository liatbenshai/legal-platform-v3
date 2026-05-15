'use client'

import { useState } from 'react'
import type { Person } from '@/lib/types'
import { createPerson, updatePerson } from '@/lib/db/persons'
import { createClient } from '@/lib/db/supabase'
import { personSchema } from '@/lib/schemas'
import { z } from 'zod'

interface PersonFormProps {
  clientId: string
  onSuccess?: (person: Person) => void
  onCancel?: () => void
  initialData?: Person
}

const personFormSchema = personSchema.omit({ id: true, clientId: true })
type PersonInput = z.infer<typeof personFormSchema>

export function PersonForm({
  clientId,
  onSuccess,
  onCancel,
  initialData,
}: PersonFormProps) {
  const [formData, setFormData] = useState<Partial<PersonInput>>(
    initialData || {
      firstName: '',
      lastName: '',
      idNumber: '',
      gender: 'male',
      address: '',
      city: '',
      phone: '',
      email: '',
      birthDate: undefined,
    }
  )

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.currentTarget
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'date' && value
          ? new Date(value)
          : type === 'radio'
            ? value
            : value,
    }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      const validated = personFormSchema.parse({
        ...formData,
        phone:
          typeof formData.phone === 'string' && formData.phone.trim()
            ? formData.phone.trim()
            : undefined,
        email:
          typeof formData.email === 'string' && formData.email.trim()
            ? formData.email.trim()
            : undefined,
      })

      const supabase = createClient()
      const person = initialData
        ? await updatePerson(supabase, initialData.id, validated)
        : await createPerson(supabase, clientId, validated)

      onSuccess?.(person)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.issues.forEach((issue) => {
          const field = issue.path[0] as string
          if (!fieldErrors[field]) fieldErrors[field] = issue.message
        })
        setErrors(fieldErrors)
      } else {
        setErrors({ submit: 'שגיאה בשמירה. נסה/י שוב.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">שם פרטי</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            required
          />
          {errors.firstName && (
            <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">שם משפחה</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            required
          />
          {errors.lastName && (
            <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">תעודת זהות</label>
        <input
          type="text"
          name="idNumber"
          value={formData.idNumber || ''}
          onChange={handleChange}
          placeholder="9 ספרות"
          className="w-full px-3 py-2 border border-gray-300 rounded"
          required
        />
        {errors.idNumber && (
          <p className="text-red-600 text-xs mt-1">{errors.idNumber}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">מגדר</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="gender"
              value="male"
              checked={formData.gender === 'male'}
              onChange={handleChange}
              className="ml-2"
            />
            זכר
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="gender"
              value="female"
              checked={formData.gender === 'female'}
              onChange={handleChange}
              className="ml-2"
            />
            נקבה
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">כתובת</label>
        <input
          type="text"
          name="address"
          value={formData.address || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">עיר</label>
        <input
          type="text"
          name="city"
          value={formData.city || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">טלפון</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">אימייל</label>
          <input
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          תאריך לידה (אופציונלי)
        </label>
        <input
          type="date"
          name="birthDate"
          value={
            formData.birthDate
              ? formData.birthDate instanceof Date
                ? formData.birthDate.toISOString().split('T')[0]
                : formData.birthDate
              : ''
          }
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        />
      </div>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">
          {errors.submit}
        </div>
      )}

      <div className="flex gap-2 justify-end pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          disabled={isLoading}
        >
          בטל
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          disabled={isLoading}
        >
          {isLoading ? 'שומר...' : 'שמור'}
        </button>
      </div>
    </form>
  )
}
