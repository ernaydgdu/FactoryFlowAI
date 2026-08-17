import { useState, type FormEvent } from 'react'

import { useAuth } from '@/application/platform/iam/auth-context'
import {
  UserAccountDomainError,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUserList,
} from '@/application/platform/iam/use-iam'
import { PageHeader } from '@/components/erp'
import { FormField, FormGrid, selectClass } from '@/components/erp/form-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  KEPLER_ROLES,
  KEPLER_ROLE_LABELS,
  type KeplerRole,
  type UserAccount,
} from '@/domain/platform/iam/types'

function formatDate(value?: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const usersQuery = useUserList()
  const createUserMutation = useCreateUserMutation(currentUser?.id ?? '')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formError, setFormError] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<KeplerRole>('VIEWER')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)

  const users = usersQuery.data ?? []

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    try {
      await createUserMutation.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        factoryId: currentUser?.factoryId ?? 'factory-ist-001',
      })
      setFullName('')
      setEmail('')
      setPassword('')
      setRole('VIEWER')
      setShowCreateForm(false)
    } catch (err) {
      if (err instanceof UserAccountDomainError) {
        setFormError(err.message)
        return
      }
      setFormError('Kullanıcı oluşturulamadı.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kullanıcı Yönetimi"
        description="Sistem kullanıcılarını görüntüleyin, yeni kullanıcı oluşturun, rol ve durum değiştirin."
        actions={
          <Button onClick={() => setShowCreateForm((prev) => !prev)}>
            {showCreateForm ? 'Vazgeç' : 'Yeni Kullanıcı Ekle'}
          </Button>
        }
      />

      {showCreateForm ? (
        <Card>
          <CardContent className="pt-6">
            <form className="space-y-4" onSubmit={handleCreateSubmit}>
              <FormGrid cols={4}>
                <FormField label="Ad Soyad" id="new-user-fullname" required>
                  <Input
                    id="new-user-fullname"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                  />
                </FormField>
                <FormField label="E-posta" id="new-user-email" required>
                  <Input
                    id="new-user-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </FormField>
                <FormField label="Şifre" id="new-user-password" required>
                  <Input
                    id="new-user-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={6}
                    required
                  />
                </FormField>
                <FormField label="Rol" id="new-user-role" required>
                  <select
                    id="new-user-role"
                    className={selectClass}
                    value={role}
                    onChange={(event) => setRole(event.target.value as KeplerRole)}
                  >
                    {KEPLER_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {KEPLER_ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </FormField>
              </FormGrid>

              {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

              <div className="flex justify-end">
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? 'Oluşturuluyor...' : 'Kullanıcı Oluştur'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2">Ad Soyad</th>
                  <th className="px-3 py-2">E-posta</th>
                  <th className="px-3 py-2">Rol</th>
                  <th className="px-3 py-2">Durum</th>
                  <th className="px-3 py-2">Oluşturulma Tarihi</th>
                  <th className="px-3 py-2 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {usersQuery.isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : users.length > 0 ? (
                  users.map((u) => (
                    <UserRow
                      key={u.id}
                      account={u}
                      isSelf={u.id === currentUser?.id}
                      isEditing={editingUserId === u.id}
                      onStartEdit={() => setEditingUserId(u.id)}
                      onStopEdit={() => setEditingUserId(null)}
                      actorUserId={currentUser?.id ?? ''}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                      Henüz kullanıcı bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function UserRow({
  account,
  isSelf,
  isEditing,
  onStartEdit,
  onStopEdit,
  actorUserId,
}: {
  account: UserAccount
  isSelf: boolean
  isEditing: boolean
  onStartEdit: () => void
  onStopEdit: () => void
  actorUserId: string
}) {
  const updateUserMutation = useUpdateUserMutation(actorUserId)
  const [role, setRole] = useState<KeplerRole>(account.role)
  const [status, setStatus] = useState(account.status)
  const [error, setError] = useState('')

  async function handleSave() {
    setError('')
    try {
      await updateUserMutation.mutateAsync({
        userId: account.id,
        input: { role, status },
      })
      onStopEdit()
    } catch (err) {
      if (err instanceof UserAccountDomainError) {
        setError(err.message)
        return
      }
      setError('Güncellenemedi.')
    }
  }

  if (isEditing) {
    return (
      <tr className="border-b border-border/60 bg-muted/20">
        <td className="px-3 py-2 font-medium">{account.fullName}</td>
        <td className="px-3 py-2 text-muted-foreground">{account.email}</td>
        <td className="px-3 py-2">
          <select
            className={selectClass}
            value={role}
            onChange={(event) => setRole(event.target.value as KeplerRole)}
          >
            {KEPLER_ROLES.map((r) => (
              <option key={r} value={r}>
                {KEPLER_ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </td>
        <td className="px-3 py-2">
          <select
            className={selectClass}
            value={status}
            onChange={(event) => setStatus(event.target.value as UserAccount['status'])}
            disabled={isSelf}
          >
            <option value="ACTIVE">Aktif</option>
            <option value="DISABLED">Pasif</option>
          </select>
        </td>
        <td className="px-3 py-2 tabular-nums">{formatDate(account.createdAt)}</td>
        <td className="px-3 py-2">
          <div className="flex items-center justify-end gap-2">
            {error ? <span className="text-xs text-destructive">{error}</span> : null}
            <Button variant="outline" size="sm" onClick={onStopEdit} disabled={updateUserMutation.isPending}>
              İptal
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-border/60">
      <td className="px-3 py-2 font-medium">
        {account.fullName}
        {isSelf ? <span className="ml-2 text-xs text-muted-foreground">(Siz)</span> : null}
      </td>
      <td className="px-3 py-2 text-muted-foreground">{account.email}</td>
      <td className="px-3 py-2">{KEPLER_ROLE_LABELS[account.role]}</td>
      <td className="px-3 py-2">
        <span
          className={
            account.status === 'ACTIVE'
              ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700'
              : 'rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
          }
        >
          {account.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
        </span>
      </td>
      <td className="px-3 py-2 tabular-nums">{formatDate(account.createdAt)}</td>
      <td className="px-3 py-2 text-right">
        <Button variant="outline" size="sm" onClick={onStartEdit}>
          Düzenle
        </Button>
      </td>
    </tr>
  )
}
