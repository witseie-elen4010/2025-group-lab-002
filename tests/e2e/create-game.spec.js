import { test, expect } from "@playwright/test";

test("Game room can be created and game can start when 3 players are in the lobby", async ({
  browser,
}) => {
  // User (host) creates a game room
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("http://localhost:3000/api/users/landing");
  page.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole("button", { name: "🎭 Play as Guest" }).click();
  const usernameElement = page.locator("#username");
  await expect(usernameElement).toBeVisible();
  const host = await usernameElement.innerText();
  console.log(`Username: ${host}`);
  await page.getByRole("button", { name: "🎲 Create Room" }).click();
  const roomCodeElement = page.locator("#room-code");
  await expect(roomCodeElement).toBeVisible();
  const roomCode = await roomCodeElement.innerText();
  console.log(`Room Code: ${roomCode}`);

  //User (host) joins the game room
  await page.getByRole("button", { name: "🔑 Join Room" }).click();
  await page.getByRole("textbox", { name: "Enter Room Code" }).click();
  await page.getByRole("textbox", { name: "Enter Room Code" }).fill(roomCode);
  page.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole("button", { name: "Join Room", exact: true }).click();
  await expect(page.getByText(`Lobby Room Code: ${roomCode} 1`)).toBeVisible();
  await expect(page.locator("#player-list")).toContainText(`${host}`);

  //User 1 joins the game room
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  await page1.goto("http://localhost:3000/api/users/landing");
  page1.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page1.getByRole("button", { name: "🎭 Play as Guest" }).click();
  const usernameElement1 = page1.locator("#username");
  await expect(usernameElement1).toBeVisible();
  const user1 = await usernameElement1.innerText();
  console.log(`Username: ${user1}`);
  await page1.getByRole("button", { name: "🔑 Join Room" }).click();
  await page1.getByRole("textbox", { name: "Enter Room Code" }).click();
  await page1.getByRole("textbox", { name: "Enter Room Code" }).fill(roomCode);
  page1.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page1.getByRole("button", { name: "Join Room", exact: true }).click();
  await expect(page1.getByText(`Lobby Room Code: ${roomCode} 2`)).toBeVisible();
  console.log(`${host}${user1}`);
  await expect(page1.locator("#player-list")).toContainText(`${host}${user1}`);
  await expect(page.locator("#player-list")).toContainText(`${host}${user1}`);

  //User 2 joins the game room
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  await page2.goto("http://localhost:3000/api/users/landing");
  page2.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page2.getByRole("button", { name: "🎭 Play as Guest" }).click();
  const usernameElement2 = page2.locator("#username");
  await expect(usernameElement2).toBeVisible();
  const user2 = await usernameElement2.innerText();
  console.log(`Username: ${user2}`);
  await page2.getByRole("button", { name: "🔑 Join Room" }).click();
  await page2.getByRole("textbox", { name: "Enter Room Code" }).click();
  await page2.getByRole("textbox", { name: "Enter Room Code" }).fill(roomCode);
  page2.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page2.getByRole("button", { name: "Join Room", exact: true }).click();
  await expect(page2.getByText(`Lobby Room Code: ${roomCode} 3`)).toBeVisible();
  await expect(page2.locator("#player-list")).toContainText(
    `${host}${user1}${user2}`
  );
  await expect(page1.locator("#player-list")).toContainText(
    `${host}${user1}${user2}`
  );
  await expect(page.locator("#player-list")).toContainText(
    `${host}${user1}${user2}`
  );

  // All users should see the Start Game button
  for (const p of [page, page1, page2]) {
    await expect(
      p.getByRole("button", { name: "🚀 Start Game" })
    ).toBeVisible();
  }

  //User (host) starts the game
  await page.getByRole("button", { name: "🚀 Start Game" }).click();

  // All users should see the game screen
  for (const p of [page, page1, page2]) {
    await expect(
      p.getByText(`Suspect404 Game Room: ${roomCode} Round`)
    ).toBeVisible();
  }

  // Clean up
  await context.close();
  await context1.close();
  await context2.close();
});
