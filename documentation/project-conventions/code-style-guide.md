# Coding Style Guide

## 1. General Principles
- ⁠Write *clean, readable, consistent* code.
- ⁠Prioritize *clarity over cleverness*.
- ⁠Code must be *self-documenting* (good names, minimal comments explaining why, not what).

## 2. File and Folder Structure
- ⁠*kebab-case* for filenames (e.g., ⁠ game-controller.js ⁠, ⁠ user-service.js ⁠).

## 3. Naming Conventions
- ⁠*Variables, functions:* ⁠ camelCase ⁠
- ⁠*Classes, constructors:* ⁠ PascalCase ⁠
- ⁠*Constants:* ⁠ UPPER_SNAKE_CASE ⁠

Example:
```javascript
const player = {
  name: 'John',
  role: 'civilian',
};
```

## 4. JavaScript Practices
- *Quotes:* Single quotes ⁠ ' ' ⁠ unless interpolation is needed (then backticks `` ` ``).
- ⁠Use ⁠ const ⁠ and ⁠ let ⁠ only (no ⁠ var ⁠).
- ⁠Use template literals for string interpolation.
- ⁠Handle errors with ⁠ try-catch ⁠ blocks.

## 5. Express/Node.js Practices
- ⁠Use *async/await* for asynchronous code.
- ⁠Modularise routes and controllers.
- ⁠Use environment variables (⁠ process.env ⁠).
- ⁠Validate all incoming data.

## 6. Comments
- ⁠Comment complex logic and public functions.
- ⁠Use JSDoc style:
```javascript
/**
 * Starts a new game session.
 * @param {string} hostId - ID of the player hosting the game.
 */
function startGameSession(hostId) { ... }
```
 
## 7. Linting
- ⁠Enforce rules using *ESLint* (Airbnb Style Guide preferred).
- ⁠Auto-format using *Prettier*.

## 8. HTML Conventions
- Always use **semantic HTML5 elements** (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, etc.).
- Always close all tags (even optional ones like `<li>`, `<td>`, etc.).
- Use **lowercase** for all tag names and attributes.
- Attribute order: `id`, `class`, then others (e.g., `src`, `href`, `alt`, `title`).
- Use **double quotes** for attribute values:
  ```html
  <img src="logo.png" alt="Undercover Game Logo">
  ```
- Use meaningful `alt` text for images (important for accessibility).
- Forms must have associated labels.

## 9. CSS/Tailwind/Bootstrap Conventions
- Use **kebab-case** for class names if writing custom CSS:
  ```css
  .game-header {
    font-size: 2rem;
    text-align: center;
    margin-bottom: 1rem;
  }

  .player-card {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 0.5rem;
    padding: 1rem;
  }
  ```
- Tailwind/Bootstrap utility classes should be **stacked logically**, not scattered randomly:
  ```html
  <div class="flex flex-col items-center justify-center p-4">
    <h1 class="text-2xl font-bold">Welcome to Undercover</h1>
  </div>
  ```
- Avoid using **IDs** for styling (use classes).
- Group related CSS classes together for readability.
- Prefer existing Tailwind or Bootstrap utility classes when possible instead of writing custom CSS.