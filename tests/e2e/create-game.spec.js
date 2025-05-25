import { test, expect } from "@playwright/test";

test("User can create and join a game", async ({ browser }) => {
  //User creates and joins a game room
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
  const page1 = await context.newPage();
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
    await expect(page1.locator("#player-list")).toContainText(
      `${host}${user1}`
    );

    
});
