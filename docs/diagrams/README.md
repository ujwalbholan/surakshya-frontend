# Suraksha concept paper — diagrams

Mermaid source files for figures referenced in [`SURAKSHA_CONCEPT_PAPER.md`](../SURAKSHA_CONCEPT_PAPER.md).

| File | Figure | Section |
|------|--------|---------|
| `01-ecosystem-architecture.mmd` | Three-tier ecosystem | §3 |
| `02-sos-sequence.mmd` | Citizen SOS sequence | §8 |

## Export to PNG/SVG (for Word/LaTeX)

**Option A — Mermaid Live Editor**

1. Open [mermaid.live](https://mermaid.live)
2. Paste file contents
3. Export as PNG or SVG

**Option B — Mermaid CLI**

```bash
npx @mermaid-js/mermaid-cli -i docs/diagrams/01-ecosystem-architecture.mmd -o docs/diagrams/01-ecosystem-architecture.png
npx @mermaid-js/mermaid-cli -i docs/diagrams/02-sos-sequence.mmd -o docs/diagrams/02-sos-sequence.png
```

Figures are also embedded as Mermaid blocks inside the concept paper for GitHub/Markdown viewers.
