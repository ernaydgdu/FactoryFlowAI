import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, UserCog } from 'lucide-react'

import { useAuth } from '@/application/platform/iam/auth-context'
import {
  UserAccountDomainError,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUserList,
} from '@/application/platform/iam/use-iam'
import { PageHeader } from '@/components/erp/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DEFAULT_FACTORY_ID,
  KEPLER_ROLE_LABELS,
  KEPLER_ROLES,
  type KeplerRole,
} from '@/domain/platform/iam/types'

export function UserManagementPage() {
  const { user } = useAuth()
  const { data: users = [], isLoading } = useUserList(user?.factoryId)
  const createMutation = useCreateUserMutation(user?.id ?? 'system')
  const updateMutation = useUpdateUserMutation(user?.id ?? 'system')

  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<KeplerRole>('PLANNER')
  const [factoryId, setFactoryId] = useState(user?.factoryId ?? DEFAULT_FACTORY_ID)

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setFormError('')

    try {
      await createMutation.mutateAsync({ email, password, fullName, role, factoryId })
      setShowForm(false)
      setEmail('')
      setPassword('')
      setFullName('')
      setRole('PLANNER')
    } catch (err) {
      setFormError(err instanceof UserAccountDomainError ? err.message : 'Kullanıcı oluşturulamadı.')
    }
  }

  async function handleRoleChange(userId: string, nextRole: KeplerRole) {
    try {
      await updateMutation.mutateAsync({ userId, input: { role: nextRole } })
    } catch {
      setFormError('Rol güncellenemedi.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kullanıcılar & Roller"
        description="Fabrika kapsamlı erişim ve yetkilendirme yönetimi."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings">
                <ArrowLeft className="size-4" /> Ayarlara Dön
              </Link>
            </Button>
            <Button size="sm" onClick={() => setShowForm((value) => !value)}>
              <Plus className="size-4" /> Yeni Kullanıcı
            </Button>
          </div>
        }
      />

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Yeni Kullanıcı</CardTitle>
            <CardDescription>Pilot fabrika kapsamında kullanıcı oluşturun.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
              <label className="space-y-2 text-sm">
                <span className="font-medium">Ad Soyad</span>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium">E-posta</span>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium">Şifre</span>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium">Rol</span>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value as KeplerRole)}
                >
                  {KEPLER_ROLES.map((item) => (
                    <option key={item} value={item}>
                      {KEPLER_ROLE_LABELS[item]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm md:col-span-2">
                <span className="font-medium">Fabrika ID</span>
                <Input value={factoryId} onChange={(e) => setFactoryId(e.target.value)} required />
              </label>
              {formError ? (
                <p className="text-sm text-destructive md:col-span-2">{formError}</p>
              ) : null}
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  Kaydet
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="size-5" />
            Aktif Kullanıcılar
          </CardTitle>
          <CardDescription>
            Fabrika: {user?.factoryId ?? DEFAULT_FACTORY_ID} · {users.length} kullanıcı
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Yükleniyor...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Ad Soyad</th>
                    <th className="py-2 pr-4 font-medium">E-posta</th>
                    <th className="py-2 pr-4 font-medium">Rol</th>
                    <th className="py-2 pr-4 font-medium">Fabrika</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((row) => (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="py-3 pr-4 font-medium">{row.fullName}</td>
                      <td className="py-3 pr-4">{row.email}</td>
                      <td className="py-3 pr-4">
                        <select
                          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                          value={row.role}
                          disabled={row.id === user?.id || updateMutation.isPending}
                          onChange={(e) =>
                            void handleRoleChange(row.id, e.target.value as KeplerRole)
                          }
                        >
                          {KEPLER_ROLES.map((item) => (
                            <option key={item} value={item}>
                              {KEPLER_ROLE_LABELS[item]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{row.factoryId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
