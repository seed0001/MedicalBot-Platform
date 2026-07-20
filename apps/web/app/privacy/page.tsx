import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import Link from 'next/link'

async function loadLegalDoc(filename: string) {
  const path = join(process.cwd(), '../../legal', filename)
  return readFile(path, 'utf8')
}

export default async function PrivacyPage() {
  const content = await loadLegalDoc('PRIVACY-NOTICE.md')

  return (
    <main className="legal-page">
      <p><Link href="/">← Back</Link></p>
      <article className="legal-doc">
        <pre>{content}</pre>
      </article>
    </main>
  )
}
