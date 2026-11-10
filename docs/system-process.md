# System Architecture and Code Process

This document explains the end-to-end architecture, technical workflows, and code lifecycle of the AI-Powered Reviewer application.

---

## 1. System Architecture

The application has three main layers: a React Native client, an Express.js API server, and a Supabase backend.

```
┌────────────────────────────────────────────────────────┐
│                   Mobile Client                        │
│   Expo (SDK 52) • React Native • NativeWind (Tailwind) │
│   Expo Router • Tabler Icons • Apple HIG Polish        │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼ (HTTPS / JSON / JWT)
┌────────────────────────────────────────────────────────┐
│                   Express API Server                   │
│   Node.js 24 • MVC Architecture • Service Layer        │
│   Worker Isolation • Groq AI • Gemini Backup           │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼ (PostgREST / Service-Role RPCs)
┌────────────────────────────────────────────────────────┐
│                   Supabase Backend                     │
│   PostgreSQL 15 • Row Level Security • Supabase Auth   │
│   Private Storage Bucket (materials)                   │
└────────────────────────────────────────────────────────┘
```

### Technology Choices
- **Client**: Expo with React Native, styled using NativeWind (Tailwind CSS). Navigation uses file-based Expo Router.
- **Server**: Node.js Express server structured in an MVC pattern with a dedicated service layer. Text extraction runs in isolated child processes.
- **AI Engine**: Primary generation uses Groq (`llama-3.3-70b-versatile`). If Groq returns rate limits, timeouts, or server errors, the system automatically falls back to Google Gemini (`gemini-2.5-flash`).
- **Database & Storage**: PostgreSQL with strict Row Level Security (RLS) on every table. Course modules upload directly to an owner-prefixed private Supabase Storage bucket.

---

## 2. End-to-End System Workflows

The application operates across five core phases:

```
[1. Auth & Session] ➔ [2. Module Ingestion] ➔ [3. AI Quiz Generation] ➔ [4. Live Quiz Session] ➔ [5. Inter-Quiz Adaptation]
```

---

### Phase 1: Authentication and Session Management

```
User Input ──▶ Supabase Auth ──▶ JWT Access Token ──▶ Session Storage (AsyncStorage)
                                          │
                                          ▼ (Authorization: Bearer <token>)
                               Express authMiddleware ──▶ req.user attached
```

1. **Sign-In & Registration**:
   - Mobile screens (`mobile/src/app/(auth)/login.jsx` and `register.jsx`) call Supabase Auth using email and password.
   - On successful sign-in, the session tokens are saved according to the "Remember Me" preference via `mobile/src/lib/session-storage.js` (using React Native `AsyncStorage`).
2. **Password Recovery**:
   - `verify-email.jsx` requests a recovery code via Brevo transactional email.
   - `otp.jsx` verifies the code with Supabase, establishing a verified recovery session in `recovery-session.js`.
   - `set-password.jsx` updates the password and signs out clean.
3. **Server Authentication Guard**:
   - All protected server routes pass through `server/src/middleware/authMiddleware.js`.
   - The middleware inspects the `Authorization: Bearer <token>` header, verifies the JWT against Supabase Auth, and attaches `req.user` (with `req.user.id`) to the request object. If invalid or missing, it responds with `401 Unauthorized`.

---

### Phase 2: Course Module Ingestion and Text Extraction

```
[PDF / DOCX File]
       │
       ▼
[mobile/src/app/(main)/materials/import.jsx]
       │ (multipart/form-data upload)
       ▼
[server/src/controllers/materialController.js]
       │
       ▼
[server/src/services/materialValidation.js] (MIME & Magic Bytes check)
       │
       ▼
[Supabase Private Storage: materials/<ownerId>/<materialId>/raw]
       │
       ▼
[server/src/services/materialExtraction.js] (Supervises isolated worker)
       │
       ▼
[server/src/services/materialExtractionWorker.js] (PDF.js / Mammoth in child process)
       │
       ▼
[Database: public.material_sections] (Eligible sections, page numbers, word counts)
       │
       ▼
[mobile/src/components/MaterialReviewForm.jsx] (Student selects BSIT Subject)
       │
       ▼
[Database RPC: approve_material] (Atomic status transition to 'ready')
```

1. **File Selection & Upload**:
   - The student chooses a course syllabus or lecture notes file (`.pdf` or `.docx`, up to 25 MB) using `expo-document-picker`.
   - The file streams to `POST /api/materials/upload`.
2. **Security & Validation**:
   - `materialValidation.js` inspects the file extension, checks the declared MIME type, and reads the raw file signature (magic bytes: `%PDF-` for PDFs, `PK\x03\x04` for DOCX).
   - If valid, the file is saved to the private `materials` Storage bucket under `materials/<ownerId>/<materialId>/raw`.
3. **Worker Isolation**:
   - To prevent memory leaks or malicious PDFs from crashing the web server, parsing runs in an isolated Node child process (`materialExtractionWorker.js`).
   - The parent process (`materialExtraction.js`) monitors memory consumption (RSS limits) and enforces strict execution deadlines.
   - Text is segmented into chunks stored in `public.material_sections` with page numbers, character lengths, and extraction order.
4. **Review & Approval**:
   - The student inspects the extracted pages on mobile (`materials/[materialId]/index.jsx`).
   - They choose the matching BSIT subject (e.g. *Data Communications & Networking*) using `MaterialReviewForm.jsx`.
   - Tapping "Approve Module" calls the atomic PostgreSQL function `approve_material` (`0011_material_review.sql`). This verifies ownership, links the subject label, and transitions the material status to `ready`.

---

### Phase 3: AI Quiz Generation and Failover

```
[Student Configures Quiz: Source, Question Count (5/10/20), Modality, Difficulty]
                                │
                                ▼
               [POST /api/quizzes/generations]
                                │
                                ▼
               [server/src/services/quizService.js]
               (Checks admission bounds & idempotency)
                                │
                 ┌──────────────┴──────────────┐
                 ▼                             ▼
       Primary: Groq AI               Backup: Google Gemini
    (llama-3.3-70b-versatile)          (gemini-2.5-flash)
                 │                             │
                 └──────────────┬──────────────┘
                                │
                                ▼
               [server/src/services/quizPrompts.js]
               (Strict JSON question schema & grounded citations)
                                │
                                ▼
               [server/src/validation/quizValidation.js]
               (Validates options, correct answer membership, citations)
                                │
                                ▼
               [Database RPC: publish_quiz]
               (Atomically inserts quiz, questions, and source citations)
```

1. **Quiz Creation Request**:
   - From `mobile/src/app/(main)/quizzes/create.jsx`, the student selects:
     - **Source**: An approved module or a curriculum topic.
     - **Modality**: Multiple Choice (4 choices), True/False (2 choices), or Coding Syntax (snippet + choices).
     - **Length**: 5, 10, or 20 questions.
     - **Difficulty**: Easy, Medium, or Hard.
   - Sends a `POST /api/quizzes/generations` request with an idempotent `requestId`.
2. **Context Assembly**:
   - If the source is a module, `quizService.js` loads up to 10 eligible text sections (`material_sections`) owned by the student.
   - If the source is a curriculum topic, it loads the topic name and subject name from `topics` and `subjects`.
3. **Structured Prompt Generation (`quizPrompts.js`)**:
   - Assembles system instructions requiring strict JSON output.
   - Injects section IDs so every question references specific source paragraphs.
   - Enforces IT domain grounding (BSIT curriculum standards).
4. **Generation & Fallback**:
   - `quizGeneration.js` calls the primary Groq API.
   - If Groq encounters rate limiting (429), gateway timeouts, or 5xx errors, `geminiGeneration.js` immediately takes over using Google Gemini. The client experiences zero failed attempts.
5. **Schema Validation (`quizValidation.js`)**:
   - Validates that every question has distinct choices, that `correct_option_id` exists in the options array, and that citation section IDs point to real sections.
6. **Atomic Publication**:
   - `publish_quiz` RPC (`0008_atomic_study_operations.sql`) writes the `quizzes` record, `quiz_questions`, and `quiz_question_sources` in a single database transaction.

---

### Phase 4: Live Quiz Session and Atomic Scoring

```
[Start Session: POST /api/quizzes/:id/sessions]
                       │
                       ▼
      [Database RPC: start_study_session]
      - Creates study_sessions record
      - Shuffles question candidates (session_questions)
      - Randomizes option orders per question (['b', 'a', 'd', 'c'])
                       │
                       ▼
[Student Views Question: mobile/src/app/(main)/quizzes/[sessionId]/index.jsx]
                       │
                       ▼
[Student Selects Option & Taps 'Next Question']
                       │
                       ▼
     [Submit Answer: POST /api/study-sessions/:id/answers]
                       │
                       ▼
      [Database RPC: submit_study_answer]
      - Inserts record into public.submitted_answers
      - Evaluates correctness: is_ans_correct := (option_id = correct_option_id)
      - Updates answered_count, correct_count, streaks
      - Picks next candidate question ID
      - Sets status = 'completed' when answered_count = question_count
                       │
                       ▼
[Results Screen: mobile/src/app/(main)/quizzes/[sessionId]/results.jsx]
- Final Score & Accuracy %
- Filterable answer breakdown (All / Correct / Incorrect)
- Expandable explanations and page citation excerpts
- Primary action: 'Back to Dashboard'
```

1. **Session Initialization**:
   - When a quiz starts, `start_study_session` (`0013_atomic_study_operations.sql`) creates a `study_sessions` row.
   - It populates `session_questions` with randomized candidate positions and shuffles option order arrays (`['a', 'b', 'c', 'd']`) so answers cannot be guessed by position.
2. **Question Delivery**:
   - The mobile client loads the current question through `getSafeQuestion` (`server/src/models/quizModel.js`).
   - The correct answer and explanation are omitted from this endpoint so answer keys cannot be inspected over the network.
3. **Answer Submission**:
   - The student selects a choice and taps "Next Question".
   - `submit_study_answer` RPC checks that the submitted question matches `current_question_id`, calculates correctness atomically, appends the answer to `submitted_answers`, and advances to the next question.
4. **Touch Stability on Mobile**:
   - Option selection and buttons use native Tailwind active scaling (`active:scale-[0.98]`) and static continuous curves (`style={{ borderCurve: 'continuous' }}`) instead of JavaScript-thread dynamic transform callbacks. This prevents gesture lockups on Android devices.
5. **Results & Review**:
   - When the final question is answered, the session status transitions to `completed`.
   - The mobile app navigates to `results.jsx`, where `getStudySessionResults` reveals the score, percentage, correct answer keys, full explanations, and source page citations.
   - The primary button routes to **"Back to Dashboard"** to view updated progress.

---

### Phase 5: Inter-Quiz Adaptation and Recommendations

```
[Completed Attempts in public.submitted_answers]
                       │
                       ▼
[server/src/models/progressModel.js]
- Queries recent answers
- Resolves topic and subject names through topics(id, name, subjects(id, name))
                       │
                       ▼
[server/src/services/progressEstimates.js]
- Groups answers by topic
- Applies rolling window: latest 20 answers per topic
- Enforces confidence gate: requires >= 5 answers per topic
- Categorizes mastery: Mastered (>=80%), Proficient (60-79%), Needs Practice (<60%)
                       │
                       ▼
[server/src/services/topicRecommendations.js]
- Filters eligible topics with accuracy < 70%
- Sorts weakest topics first (lowest accuracy at the top)
- Suggests question count (10) and difficulty (easy if <50%, else medium)
                       │
                       ▼
[Mobile UI: dashboard.jsx & quizzes.jsx]
- Metric-First Header card (e.g. '0% Accuracy • 5 questions   🟡 Needs Practice')
- Topic Title and Subject Name
- 'Practice This Topic' CTA pre-fills quiz creation parameters
```

1. **Answer Aggregation**:
   - `progressModel.js` queries up to 500 recent answers for the student.
   - It resolves subject and topic names by navigating through the `topics` table relationship.
2. **Rolling Window Calculation**:
   - `progressEstimates.js` keeps only the **latest 20 answers** per topic (`WINDOW_SIZE = 20`). Recent answers carry full weight; mistakes made weeks ago do not drag down improved scores.
   - Topics with fewer than 5 answers are marked `insufficient_data` (`MIN_SAMPLE_COUNT = 5`) to prevent false recommendations from small sample sizes.
3. **Recommendation Criteria**:
   - `topicRecommendations.js` identifies eligible topics with accuracy **below 70%**.
   - Topics are sorted in ascending order of accuracy so the student's weakest area is presented first.
4. **Non-Intrusive Student Agency**:
   - The system offers recommendations as actionable suggestions. It never auto-generates or forces a test.
5. **Mobile Presentation**:
   - Both the **Dashboard** and the **Quizzes Tab** render the top recommendation using a **Metric-First Header**:
     ```
     ┌─────────────────────────────────────────────────────────────┐
     │  0% Accuracy • 5 questions                 🟡 Needs Practice│
     │                                                             │
     │  Object Oriented Programming                                │
     │  Your accuracy is 0% over the latest 5 questions. Focused   │
     │  practice is recommended to strengthen understanding.       │
     │                                                             │
     │  [                  Practice This Topic ➔                 ] │
     └─────────────────────────────────────────────────────────────┘
     ```
   - Tapping "Practice This Topic" opens `quizzes/create.jsx` with the curriculum topic pre-selected, ready for generation.

---

## 3. Database Schema Reference

The database consists of 14 migrations in `supabase/migrations/`:

| Migration | Purpose | Key Tables & RPCs |
| --- | --- | --- |
| `0001` | Profiles & Subject/Topic Labels | `profiles`, `subjects`, `topics` |
| `0002` | Materials & Section Storage | `materials`, `material_sections` |
| `0003` | Generation Queue Schema | `quiz_generations` |
| `0004` | Quizzes & Questions Schema | `quizzes`, `quiz_questions`, `quiz_question_sources` |
| `0005` | Study Sessions & Answers | `study_sessions`, `session_questions`, `submitted_answers` |
| `0007` | Storage Security | Owner-scoped RLS policies on `materials` Storage bucket |
| `0008` | Atomic Publication | RPC `publish_quiz`, RPC `recover_quiz_generations` |
| `0009` | Material Deletion | Deletion marker and cleanup handling |
| `0010` | Extraction Recovery | Durable recovery markers for unfinished imports |
| `0011` | Material Approval | RPC `approve_material` (service-role only) |
| `0012` | Question Modalities | Constraints for Multiple Choice, True/False, and Coding Syntax |
| `0013` | Atomic Study Operations | RPC `start_study_session`, RPC `submit_study_answer` |
| `0014` | Question Count Extension | Allows 5, 10, and 20 questions across check constraints |

---

## 4. Key Engineering Invariants

1. **Zero Raw Answers on Client**: Live quiz endpoints return only question prompts and shuffled option choices. Correct answer keys and explanations are held server-side until the session is completed.
2. **Atomic State Operations**: Publishing a quiz, approving a module, starting a session, and submitting an answer all occur through service-role database functions (RPCs). If any step fails, the entire transaction rolls back.
3. **Subprocess Isolation**: Untrusted student PDFs and DOCX files parse exclusively inside worker processes with memory limits. The Express HTTP server never executes binary parsing libraries on its primary event loop.
4. **Idempotency**: Quiz generation and session answering verify unique request tokens. Duplicate button taps or network retries return the existing record without generating duplicate AI calls or scoring penalties.
