import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { appConfig } from '@/config/navigation'
import { login, LoginFailedError, saveAuthSession } from '@/services/auth'
import { isAxiosError } from '@/services/api'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    try {
      const response = await login({ email, password })
      saveAuthSession(response)
      navigate('/dashboard')
    } catch (err) {
      if (
        err instanceof LoginFailedError ||
        (isAxiosError(err) && err.response?.status === 401)
      ) {
        setError('E-posta veya şifre hatalı.')
        return
      }

      console.error('Login request failed:', err)
      setError('E-posta veya şifre hatalı.')
    }
  }

  return (
    <Card className="border-border/60 shadow-xl">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground shadow-md">
          K
        </div>
        <div>
          <CardTitle className="text-3xl tracking-wide">{appConfig.name}</CardTitle>
          <p className="mt-1 text-lg font-medium text-primary">{appConfig.product}</p>
        </div>
        <CardDescription>{appConfig.tagline}</CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@kepler-erp.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <Button type="submit" className="w-full" size="lg">
            Giriş Yap
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-xs text-muted-foreground">
          Enterprise SSO available for production tenants
        </p>
      </CardFooter>
    </Card>
  )
}
