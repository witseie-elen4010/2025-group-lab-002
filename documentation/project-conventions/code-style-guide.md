# Coding Style Guide

## 1. General Principles
•⁠  ⁠Write *clean, readable, consistent* code.
•⁠  ⁠Prioritize *clarity over cleverness*.
•⁠  ⁠Code must be *self-documenting* (good names, minimal comments explaining why, not what).

## 2. File and Folder Structure
•⁠  ⁠*kebab-case* for filenames (e.g., ⁠ game-controller.js ⁠, ⁠ user-service.js ⁠).

## 3. Naming Conventions
•⁠  ⁠*Variables, functions:* ⁠ camelCase ⁠
•⁠  ⁠*Classes, constructors:* ⁠ PascalCase ⁠
•⁠  ⁠*Constants:* ⁠ UPPER_SNAKE_CASE ⁠

Example:
⁠ javascript
const MAX_PLAYERS = 12;

function startGameSession() { ... }

class GameController { ... }
 ⁠

## 4. Code Formatting
•⁠  ⁠*Quotes:* Single quotes ⁠ ' ' ⁠ unless interpolation is needed (then backticks `` ` ``).

## 5. JavaScript Practices
•⁠  ⁠Use ⁠ const ⁠ and ⁠ let ⁠ only (no ⁠ var ⁠).
•⁠  ⁠Prefer arrow functions unless necessary.
•⁠  ⁠Use template literals for string interpolation.
•⁠  ⁠Handle errors with ⁠ try-catch ⁠ blocks.

## 6. Express/Node.js Practices
•⁠  ⁠Use *async/await* for asynchronous code.
•⁠  ⁠Modularise routes and controllers.
•⁠  ⁠Use environment variables (⁠ process.env ⁠).
•⁠  ⁠Validate all incoming data.

## 7. Comments
•⁠  ⁠Comment complex logic and public functions.
•⁠  ⁠Use JSDoc style:
⁠ javascript
/**
 * Starts a new game session.
 * @param {string} hostId - ID of the player hosting the game.
 */
function startGameSession(hostId) { ... }
 ⁠

## 8. Linting
•⁠  ⁠Enforce rules using *ESLint* (Airbnb Style Guide preferred).
•⁠  ⁠Auto-format using *Prettier*.