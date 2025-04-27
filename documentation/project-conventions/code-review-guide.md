# Code Review Guide

## 1. General Principles
•⁠  ⁠Every feature/bugfix must go through a *pull request (PR)*.
•⁠  ⁠*No direct commits* to ⁠ main ⁠ branch.
•⁠  ⁠Reviews focus on *improving code quality* and *learning*, not criticism.

## 2. Pull Request (PR) Process
•⁠  ⁠*Small PRs*: Preferably under 300 lines.
•⁠  ⁠*Clear PR Titles*: Follow Angular commit message format:
  - ⁠ feat: add new voting functionality ⁠
  - ⁠ fix: correct player role assignment bug ⁠
•⁠  ⁠*Link PR to Issue*.
•⁠  ⁠*Checklist in PR Description*:
  - [ ] Code compiles and runs
  - [ ] Tests written or updated
  - [ ] No commented-out code
  - [ ] ESLint and Prettier pass
  - [ ] Linked issue number

## 3. Responsibilities of PR Creator
•⁠  ⁠Test your code before submitting.
•⁠  ⁠Ensure code builds and runs cleanly.
•⁠  ⁠Add screenshots/demo for UI changes.

## 4. Responsibilities of Reviewer
•⁠  ⁠Review:
  - Logic correctness
  - Naming consistency
  - Code formatting
  - Basic security (input validation)
  - Test presence
•⁠  ⁠Be polite and constructive.
•⁠  ⁠Use in-line comments.
•⁠  ⁠Approve only if code is ready.

## 5. Merging Rules
•⁠  ⁠Reviewer merges the PR after approval.
•⁠  ⁠Squash merge preferred unless otherwise specified.
•⁠  ⁠Always pull latest ⁠ main ⁠ into your branch before merging if needed.