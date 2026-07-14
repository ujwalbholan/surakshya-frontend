import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

export type ReportPdfRow = Record<string, string | number>

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadReportPdf(options: {
  title: string
  subtitle?: string
  filename: string
  columns: string[]
  rows: (string | number)[][]
}) {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(options.title, 14, 18)
  if (options.subtitle) {
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(options.subtitle, 14, 26)
  }
  autoTable(doc, {
    startY: options.subtitle ? 32 : 24,
    head: [options.columns],
    body: options.rows,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [192, 57, 43] },
  })
  doc.save(options.filename)
}
