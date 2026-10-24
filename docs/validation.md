# Phase 1: PDF/DOCX extraction validation

## Status and reproduction

Measured locally on 2026-10-23. This is a standalone Windows benchmark, not an upload API or an Android import implementation. No source file is uploaded, sent to an AI provider, or added to Git. The existing Express health endpoint is unchanged.

From `server/` in PowerShell:

```powershell
npm.cmd run check:extraction
npm.cmd run benchmark:extraction -- "C:\Users\Administrator\Documents\CC106_Study Guide_5.pdf"
```

Pass additional authorized PDF/DOCX paths as separate arguments. The benchmark requires at least one real sample and fails if an expected fixture outcome is wrong. It runs sequentially: five fresh extraction processes per usable sample, one per rejected fixture. Repeated extracted text and references must match exactly.

Inputs stay at their original paths. Synthetic fixtures, extracted text, full JSON results, hashes, and rendered real-PDF previews are written under the Git-ignored `server/.extraction-local/`. These files remain on this computer after benchmarking; delete that directory when the local evidence is no longer needed. The check command removes only its own temporary `check/` subdirectory, including after a failed assertion.

The independent PowerShell memory monitor uses a process-scoped execution-policy bypass to run the repository's monitor script. It does not change the machine's execution policy. Do not use this command to process unknown files in production.

## Measured corpus and quality

The real sample is `CC106_Study Guide_5.pdf`: CC106, Application Development and Emerging Technologies, Module 5, User Interface Prototyping. It is 536,468 bytes with six pages. The user supplied its local path for this task; processing was local only. Redistribution and external-provider processing rights have not been established, so the module and extracted text remain ignored.

All six rendered pages were visually compared with extracted text. This is a qualitative review, not a measured word-accuracy percentage or instructor evaluation.

| Content | Observed result | Support decision |
|---|---|---|
| Real PDF pages 1–6 | All six page references present; prose, headings, lists, and reference text readable; no duplicated or missing whole pages observed | Text preview supported, with review |
| Real PDF headers and footers | Footer/author text appears before body text; a superscript edition marker splits across lines; bullet glyphs remain private-use characters | Reading order and typography are imperfect; do not infer layout from text order |
| Real PDF page 2, Figure 5.1; page 3, Figure 5.3 | Text-based table cells present, but columns and row relationships flatten into text | Exclude table-dependent questions unless relationships are verified |
| Real PDF page 2, Figure 5.2 | Prototype-development diagram absent from extracted text; image flag present | Exclude diagram-dependent content; no OCR |
| Real PDF page 4, Figure 5.4 | Phone mockup images absent; image flag present | Exclude image-dependent content |
| Real PDF page 5, Figure 5.5 | Entire image-based comparison table absent; caption remains; image flag present | The caption cannot stand in for the missing table |
| Synthetic ordinary PDF/DOCX | Expected text matches exactly; PDF page and DOCX extracted-paragraph references verified | Controlled prose extraction passes |
| Synthetic mixed PDF | Text retained, both image pages warned; entirely image-only PDF rejected | Partial text is reviewable; images excluded |
| Synthetic multi-column PDF | Content-stream order differs from intended visual column order | No automatic column reconstruction or approval |
| Synthetic code PDF/DOCX | Operators `>=`, `<=`, `!=`, `&&` preserved; exact indentation results recorded below | Formatting-dependent code requires verified layout |
| Synthetic tables | PDF spacing and DOCX table relationships cannot be relied upon | Warn and require verification; raw text is not a table model |

The remaining 40 samples are generated fixtures covering ordinary text, code, tables, mixed content, multiple columns, external hyperlink labels, increasing pages/text/bytes/expanded sizes, and malformed or unsupported files. DOCX coverage is **synthetic only**; no real DOCX module was supplied. Long-module coverage is synthetic. The password fixture exercises PDF.js's password-required branch with a synthetic security dictionary; it does not establish support for every encryption variant.

## Resource measurements

Environment: Node **v24.22.1**, Windows **10.0.26200 x64**, Intel Core i7-6820HQ @ 2.70 GHz, **7.83 GiB** reported physical RAM. Installed versions: PDF.js **6.4.299**, Mammoth **1.13.0**, Mammoth's JSZip **3.10.2**. These measurements are not portable performance guarantees.

The final benchmark passed **41 samples / 145 extraction runs**: 26 usable samples, each run five times, plus 15 expected rejections. “Usable” means reviewable text, not approval for generation. The following figures are the maximum of the five runs, not averages:

| Sample | Extracted characters | Extraction time | Peak child memory |
|---|---:|---:|---:|
| Real CC106 module, 6 pages | 11,219 | 1,666 ms | 146.2 MiB |
| Ordinary synthetic PDF | 103 | 676 ms | 92.7 MiB |
| Ordinary synthetic DOCX | 106 | 136 ms | 60.4 MiB |
| Synthetic 100-page PDF | 7,092 | 1,188 ms | 97.8 MiB |
| Synthetic 200,000-character PDF | 200,000 | 1,432 ms | 113.6 MiB |
| Synthetic 200,000-character DOCX | 200,000 | 197 ms | 66.5 MiB |
| Synthetic 20 MiB expanded DOCX | 61 | 267 ms | 69.6 MiB |
| Synthetic 5 MiB PDF | 62 | 665 ms | 99.0 MiB |
| Synthetic 5 MiB DOCX | 61 | 243 ms | 60.6 MiB |

Real-module full elapsed time, including monitor/worker setup and shutdown, ranged from **1,610 to 2,811 ms**; extraction-only time ranged from **1,083 to 1,666 ms**. The largest observed extraction time and memory across the final corpus were **1,666 ms / 146.2 MiB**. The chosen 10-second and 384 MiB termination budgets provide local headroom; they are not measured maximum server capacity. CPU time includes child bootstrap and multiple runtime threads, so it can exceed wall time.

The synthetic PDF code fixture preserved all four tested operators but **lost indentation** (`exactLines: false`); it fails the requirement for formatting-dependent code. The DOCX code fixture preserved the tested operators and leading spaces (`exactLines: true`), but this single case does not establish support for all Word code formatting. Both remain in review state.

Byte-boundary fixtures contain padding, and the expanded-DOCX fixture contains highly compressible placeholder media. The text-boundary fixtures repeat simple text; the 100-page fixture has short paragraphs. These isolate individual limits and do not establish performance at every combined worst case or for complex real documents. Only the real module's six-page prose/image mix was examined visually.

Real source SHA-256: `3391c580a375ec2f1652f75d0d92191e790c101a45c45901f5559a3bef2daead`. Five-run extracted-section hash: `c7e328e837c717d9a9413a52dffc7602d09a7f9d1c78d40c9cbd881d5c056ac5`. The private report records individual runs and all fixture hashes.

## Local processing limits

These are the supported ceilings for this benchmark corpus on the measured Windows machine, not a guarantee for arbitrary documents or a production host. Values are enforced in `server/scripts/extraction/extract.mjs`.

| Limit | Ceiling and unit | Enforcement and evidence |
|---|---|---|
| File size, either format | 5,242,880 bytes (5 MiB) | Stat check plus bounded read; exact boundary accepted for both formats, one byte over rejected |
| PDF pages | 100 | Read page count before iterating; 10/50/100 pass, 101 rejects |
| Extracted text, either format | 200,000 JavaScript string code units | PDF checked per page; DOCX after bounded extraction; 10,000/100,000/200,000 pass, 200,001 rejects |
| Expanded DOCX | 20,971,520 bytes (20 MiB), summed over all non-directory ZIP entries | Check declared sizes, then count actual streamed decompression before Mammoth; 1/10/20 MiB pass, one byte over rejects; falsified small size metadata also rejects |
| DOCX archive entries | 2,048 non-directory entries | Checked before decompression; over-limit fixture rejects |
| Extraction duration | 10 seconds after monitor readiness | Parent kills child independently of parser/event-loop progress; a reduced-budget test verifies termination |
| Extraction memory | 384 MiB process peak working set; additionally 192 MiB V8 old-space | Independent monitor reads peak working set every 25 ms and kills an over-budget child; reduced-budget test verifies termination and recovery |
| Concurrency | One extraction at a time in the benchmark CLI | No parallel benchmark calls; no production concurrency control is implemented |

PDF text count includes a normalized trailing line break per nonempty page. DOCX counts only nonempty raw-text paragraphs after splitting Mammoth's paragraph separators. These are character limits, not token budgets. DOCX has no reliable page count and is not assigned a fictional page limit.

The memory monitor detects and terminates excess allocation; it is not an OS reservation or a strict no-overshoot cap. Its 25 ms polling can overshoot, and the OS may schedule it later. Production requires host-specific containment and a rerun under that host's actual memory budget. Memory figures exclude the parent, PowerShell monitor, and optional PDF preview rendering. A file that meets byte/page limits can still be rejected for time or memory.

Elapsed extraction time begins when the monitor is ready and ends when the child exits. Full elapsed time additionally includes worker/monitor startup and monitor shutdown; both are in the private report. CPU time and child maximum RSS are also recorded. No extraction is repeated concurrently. Preview rendering happens afterward, outside these measurements, for the authorized real PDF.

## Result contract and rejection messages

The local runner returns `{ status, sections, warnings, metrics, limits }`, plus `code` and `message` for rejection. It creates no public route, database schema, or mobile interface. Rejections return no extracted sections. Missing/unreadable files use `INVALID_FILE`; parser internals and filesystem paths are not included in user-facing messages.

Usable documents return `needs_review`. Each section has `eligibleForGeneration: false`: the benchmark does not perform approval or implement a review screen. PDF references use actual page numbers. DOCX references are ordinal **extracted paragraphs**, not original Word pages or exact source-XML paragraph numbers; table cells may become paragraphs. Review is required for all content because image detection cannot establish semantic completeness and raw text cannot establish code/table fidelity. If affected content cannot be isolated safely, the material remains unapproved. Blank/image-only PDF pages are flagged; fewer than 20 letter/number characters across the entire document is rejected as no usable text. This small threshold checks text presence, not educational sufficiency.

Every usable document receives `FORMATTING_REVIEW`: “Some code or tables may have lost their layout. Affected content cannot support questions until verified.” Image flags or pages without usable text receive: “Only selectable text was extracted. Images and scanned content are excluded. Review the extracted text before continuing.” DOCX embedded media is flagged conservatively even when it may be unreferenced. Vector diagrams and page decorations may evade image detection; the general review requirement remains.

| Code | Rejection message |
|---|---|
| `UNSUPPORTED_TYPE` | Choose a selectable-text PDF or a .docx file. Other formats are not supported. |
| `INVALID_FILE` | This file could not be read as a valid PDF or DOCX. Export a new copy and try again. |
| `PASSWORD_REQUIRED` | Password-protected documents are not supported. Upload an authorized, unprotected copy. |
| `NO_USABLE_TEXT` | No usable selectable text was found. Upload a text-based PDF or DOCX; scanned images are not read. |
| `FILE_LIMIT` | The file exceeds 5242880 bytes (5 MiB). Split it into smaller documents. |
| `PAGE_LIMIT` | The PDF exceeds 100 pages. Split it into smaller documents. |
| `TEXT_LIMIT` | Extracted text exceeds 200000 characters. Split the document into smaller sections. |
| `DOCX_EXPANDED_LIMIT` | Expanded DOCX content exceeds 20971520 bytes (20 MiB). Remove large embedded content or split the document. |
| `DOCX_ENTRY_LIMIT` | The DOCX contains more than 2048 archive entries. Export a simpler copy. |
| `TIME_LIMIT` | Extraction exceeded 10 seconds. Split or simplify the document and try again. |
| `MEMORY_LIMIT` | Extraction exceeded its 384 MiB memory budget. Split or simplify the document. |
| `WORKER_FAILED` | Extraction stopped unexpectedly. Export a simpler copy and try again. |

The runner accepts only lower limit overrides for self-checks; the `limits` field records the effective values. Display messages describe the configured default ceilings above. Infrastructure failure to start or maintain the memory monitor aborts the command rather than silently running without monitoring.

## Checks and remaining gates

`npm.cmd run check:extraction` passed all 40 fixture cases, exact/over-limit boundaries, missing-file handling, lowered timeout/memory budgets, recovery after termination, and refusal of increased limits. Cleanup completed. The benchmark additionally checks five-run text/reference stability for usable samples, exact expected prose, and code-operator preservation. `node --check` passed for all four JavaScript scripts, and `git diff --check` passed. No mobile build or live-service checks were needed for this standalone change.

The extraction scripts use the existing PDF.js and Mammoth dependencies, Mammoth's installed JSZip, and PDF.js's installed canvas renderer. There are no new packages or changes to application routes. The pinned JSZip internal declared-size field is supplemented by actual streamed-byte counting; rerun these checks when dependencies change. Raw DOCX HTML is never generated or rendered, archive entries are never written to filesystem paths, and external module links are not fetched by the extraction path.

Remaining validation: real DOCX modules, broader code/table/module samples, instructor review, production memory/time/concurrency, malicious-file containment on the chosen host, upload and deletion integration, and physical Android behavior. This sample does not establish general extraction accuracy or campus capacity. Phase 2 must reuse the enforced policy in its eventual upload flow and implement review/exclusion before generation; this CLI does not itself authorize generation.
