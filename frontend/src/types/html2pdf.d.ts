declare module 'html2pdf.js' {
  export type Html2PdfOptions = {
    margin?: number | [number, number, number, number]
    filename?: string
    image?: { type?: string; quality?: number }
    html2canvas?: Record<string, unknown>
    jsPDF?: { unit?: string; format?: string; orientation?: 'portrait' | 'landscape' }
    pagebreak?: { mode?: string | string[]; avoid?: string | string[] }
  }

  export type Html2PdfWorker = {
    from: (element: HTMLElement) => Html2PdfWorker
    set: (options: Html2PdfOptions) => Html2PdfWorker
    save: () => Promise<void>
  }

  export default function html2pdf(): Html2PdfWorker
}
