# AI-powered reviewer

Shared language for private, independent IT review by BSIT students and instructors at PSU Asingan. The [roadmap](planning/ai-powered-reviewer-roadmap.md) records the behavior rules and technical decisions.

## Language

**Module**:
A privately uploaded school learning document used as source material for review content.
_Avoid_: Course, class

**Subject**:
A personal label for an IT area that groups a user's review topics; it does not establish an official curriculum category.

**Topic**:
A specific area of review within a subject, named and reused by the user for generation and progress tracking.

**Question**:
A multiple-choice practice item with answer options, a correct answer, and an explanation, using either conceptual content or a coding-syntax snippet.

**Quiz**:
A freshly generated collection of questions for a study session, based on a module or selected IT topic and using one question type.
_Avoid_: Exam, assignment

**Study session**:
One run of answering a generated quiz, which may be interrupted and resumed with the same quiz. Starting another session generates a fresh quiz rather than a retake.

**Flashcard set**:
A personal collection of front/back cards for technical terms from a module or selected topic.

**Flashcard review**:
An activity in which the user views a flashcard set; it qualifies as completed for a study day only when every card back has been viewed that day.

**Study day**:
A calendar date on which the user completes a quiz or a qualifying flashcard review; multiple qualifying activities still count as one day.

**Practice estimate**:
A summary of correctness in recent recorded topic answers, shown with its sample count. This is the app's meaning of subject mastery and does not establish examination readiness.
_Avoid_: Proven mastery, verified exam readiness
