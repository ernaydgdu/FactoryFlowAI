import { MessageCircle, Send } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { fetchAskQuestion } from '@/infrastructure/api/dashboard-api.repository'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function AiAdvisorChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isLoading])

  async function sendMessage() {
    const text = input.trim()
    if (!text || isLoading) return

    setMessages((prev) => [...prev, { id: createId(), role: 'user', content: text }])
    setInput('')
    setIsLoading(true)

    try {
      const { answer } = await fetchAskQuestion(text)
      setMessages((prev) => [...prev, { id: createId(), role: 'assistant', content: answer }])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sunucuya ulaşılamadı.'
      setMessages((prev) => [...prev, { id: createId(), role: 'assistant', content: `⚠️ ${message}` }])
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void sendMessage()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="size-4" />
          Tekstil AI Danışman
        </CardTitle>
        <CardDescription>
          Üretim, malzeme ve tekstil bilgi tabanı hakkında soru sorun
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          ref={scrollRef}
          className="flex h-80 flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-muted/20 p-3"
        >
          {messages.length === 0 ? (
            <p className="m-auto max-w-xs text-center text-sm text-muted-foreground">
              Örn: &quot;Pamuklu kumaşın büzülme oranı nedir?&quot; gibi bir soru sorabilirsiniz.
            </p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap',
                  message.role === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : 'mr-auto border border-border bg-card',
                )}
              >
                {message.content}
              </div>
            ))
          )}
          {isLoading ? (
            <div className="mr-auto max-w-[85%] rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
              Yanıt hazırlanıyor…
            </div>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Sorunuzu yazın..."
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60"
          />
          <Button type="submit" size="sm" disabled={!input.trim() || isLoading}>
            <Send className="size-4" />
            Gönder
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
