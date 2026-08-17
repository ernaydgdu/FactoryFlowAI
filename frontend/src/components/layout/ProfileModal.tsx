import { useState, type FormEvent } from 'react'

import { useAuth } from '@/application/platform/iam/auth-context'
import { UserAccountDomainError, useChangePasswordMutation } from '@/application/platform/iam/use-iam'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KEPLER_ROLE_LABELS } from '@/domain/platform/iam/types'

type ProfileModalProps = {
  open: boolean
  onClose: () => void
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user } = useAuth()
  const changePasswordMutation = useChangePasswordMutation()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!open) return null

  function resetAndClose() {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess(false)
    onClose()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess(false)

    if (newPassword.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalı.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Yeni şifreler eşleşmiyor.')
      return
    }

    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword })
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      if (err instanceof UserAccountDomainError) {
        setError(err.message)
        return
      }
      setError('Şifre değiştirilemedi.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      onClick={resetAndClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="profile-modal-title" className="text-base font-semibold">
          Profilim
        </h2>

        <div className="mt-4 space-y-1 rounded-md bg-muted/40 p-3 text-sm">
          <p className="font-medium">{user?.fullName ?? '—'}</p>
          <p className="text-muted-foreground">{user?.email ?? '—'}</p>
          <p className="text-muted-foreground">
            {user?.role ? KEPLER_ROLE_LABELS[user.role] : '—'}
          </p>
        </div>

        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          <p className="text-sm font-medium">Şifre Değiştir</p>

          <div className="space-y-2">
            <Label htmlFor="profile-current-password">Mevcut Şifre</Label>
            <Input
              id="profile-current-password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-new-password">Yeni Şifre</Label>
            <Input
              id="profile-new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-confirm-password">Yeni Şifre (Tekrar)</Label>
            <Input
              id="profile-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={6}
              required
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {success ? <p className="text-sm text-green-600">Şifreniz başarıyla değiştirildi.</p> : null}

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={resetAndClose}>
              Kapat
            </Button>
            <Button type="submit" size="sm" disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? 'Kaydediliyor...' : 'Şifreyi Değiştir'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
