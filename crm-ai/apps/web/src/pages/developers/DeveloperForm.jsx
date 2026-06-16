import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { X } from 'lucide-react'

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Name is required'
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email format'
  return errors
}

export default function DeveloperForm({ developer, onSubmit, onClose }) {
  const [form, setForm] = useState({
    name: developer?.name || '',
    email: developer?.email || '',
    phone: developer?.phone || '',
    role: developer?.role || '',
    status: developer?.status || 'available',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const v = validate(form)
    if (Object.keys(v).length) { setErrors(v); return }
    setSaving(true)
    try {
      await onSubmit(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--text)]">
            {developer ? 'Edit Developer' : 'New Developer'}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] cursor-pointer">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name *" name="name" value={form.name} onChange={handleChange} error={errors.name} required />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} />
          <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} />
          <Input label="Role" name="role" value={form.role} onChange={handleChange} placeholder="e.g. Frontend, Backend, Full Stack" />
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--text)]">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="available">Available</option>
              <option value="busy">Busy</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : developer ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
