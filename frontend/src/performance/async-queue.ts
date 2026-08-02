/** Kepler ERP — async job queue (UI thread bloklanmaz) */

type QueuedJob<T> = {
  id: string
  name: string
  run: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: unknown) => void
}

const queue: QueuedJob<unknown>[] = []
let processing = false
let jobCounter = 0

async function drainQueue(): Promise<void> {
  if (processing) return
  processing = true
  while (queue.length > 0) {
    const job = queue.shift()!
    try {
      const result = await job.run()
      job.resolve(result)
    } catch (error) {
      job.reject(error)
    }
    await new Promise((r) => setTimeout(r, 0))
  }
  processing = false
}

export function enqueueJob<T>(name: string, run: () => Promise<T>): Promise<T> {
  jobCounter += 1
  return new Promise<T>((resolve, reject) => {
    queue.push({
      id: `job-${jobCounter}`,
      name,
      run,
      resolve: resolve as (value: unknown) => void,
      reject,
    })
    void drainQueue()
  })
}

export function getQueueLength(): number {
  return queue.length
}

export function scheduleBackgroundTask<T>(_name: string, run: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        try {
          resolve(run())
        } catch (e) {
          reject(e)
        }
      })
    } else {
      setTimeout(() => {
        try {
          resolve(run())
        } catch (e) {
          reject(e)
        }
      }, 0)
    }
  })
}
