import { test, expect } from "@playwright/test";

test("User can login with correct password", async ({ page }) => {
    await page.goto("http://localhost:3000/api/users/landing");
    await page.getByRole("button", { name: "🔐 Log In" }).click();
    await expect(page.getByText("Username: Password: Login Don")).toBeVisible();
    await page.getByRole("textbox", { name: "Username:" }).click();
    await page.getByRole("textbox", { name: "Username:" }).fill("johndoe");
    await page.getByRole("textbox", { name: "Password:" }).click();
    await page.getByRole("textbox", { name: "Password:" }).fill("john123!");
    page.once("dialog", (dialog) => {
      console.log(`Dialog message: ${dialog.message()}`);
      dialog.dismiss().catch(() => {});
    });
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.getByText("Create Game Room Hello,")).toBeVisible();
    await expect(page.getByText("johndoe")).toBeVisible();
});


test("User cannot login with incorrect password", async ({ page }) => {
  await page.goto("http://localhost:3000/api/users/login");
  await page.getByRole("textbox", { name: "Username:" }).click();
  await page.getByRole("textbox", { name: "Username:" }).fill("johndoe");
  await page.getByRole("textbox", { name: "Password:" }).click();
  await page.getByRole("textbox", { name: "Password:" }).fill("skdjskf");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByText("Invalid credentials")).toBeVisible();
  await expect(page.locator("#login-error")).toContainText(
    "Invalid credentials"
  );
});

test("New user can sign up", async ({ page }) => {
  await page.goto("http://localhost:3000/api/users/sign-up");
  const random = Math.floor(Math.random() * 1000000);
  const username = `testuser${random}`;
  const email = `test${random}@example.com`;

  await page.getByRole("textbox", { name: "Username:" }).fill(username);
  await page.getByRole("textbox", { name: "Email:" }).fill(email);
  await page
    .getByRole("textbox", { name: "Password:", exact: true })
    .fill("test1234!");
  await page
    .getByRole("textbox", { name: "Confirm Password:" })
    .fill("test1234!");
  page.once("dialog", (dialog) => {
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole("button", { name: "Sign Up" }).click();
  await expect(page.getByText("Create Game Room Hello,")).toBeVisible();
  await expect(page.locator("#username")).toContainText(username);
});


test("User can log out", async ({ page }) => {
  await page.goto("http://localhost:3000/api/users/landing");
  page.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole("button", { name: "🎭 Play as Guest" }).click();
  await expect(page.getByText("Create Game Room Hello,")).toBeVisible();
  await page.goto("http://localhost:3000/api/users/landing");
  await page.getByRole("button", { name: "🔐 Log In" }).click();
  await page.getByRole("textbox", { name: "Username:" }).click();
  await page.getByRole("textbox", { name: "Username:" }).fill("johndoe");
  await page.getByRole("textbox", { name: "Password:" }).click();
  await page.getByRole("textbox", { name: "Password:" }).fill("john123!");
  page.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("button", { name: "🚪 Log Out" })).toBeVisible();
  await page.getByRole("button", { name: "🚪 Log Out" }).click();
  await expect(page.getByText("Welcome to Suspect404 Where")).toBeVisible();
});

test("User can log in as a guest", async ({ page }) => {
  await page.goto("http://localhost:3000/api/users/landing");
  page.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole("button", { name: "🎭 Play as Guest" }).click();
  await expect(page.getByText("Create Game Room Hello,")).toBeVisible();
});

test("Existing user cannot sign up", async ({ page }) => {
  await page.goto("http://localhost:3000/api/users/landing");
  await page.getByRole("button", { name: "📝 Sign Up" }).click();
  await page.getByRole("textbox", { name: "Username:" }).click();
  await page.getByRole("textbox", { name: "Username:" }).fill("johndoe");
  await page.getByRole("textbox", { name: "Email:" }).click();
  await page.getByRole("textbox", { name: "Email:" }).fill("john@example.com");
  await page.getByRole("textbox", { name: "Password:", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Password:", exact: true })
    .fill("john123!");
  await page.getByRole("textbox", { name: "Confirm Password:" }).click();
  await page
    .getByRole("textbox", { name: "Confirm Password:" })
    .fill("john123!");
  await page.getByRole("button", { name: "Sign Up" }).click();
  await expect(page.locator("#signup-error")).toContainText(
    "User already exists"
  );
});

test("User cannot sign up if passwords don't match", async ({ page }) => {
  await page.goto("http://localhost:3000/api/users/landing");
  await page.getByRole("button", { name: "📝 Sign Up" }).click();
  await page.getByRole("textbox", { name: "Username:" }).click();
  await page.getByRole("textbox", { name: "Username:" }).fill("newuser2");
  await page.getByRole("textbox", { name: "Email:" }).click();
  await page.getByRole("textbox", { name: "Email:" }).fill("new@example.com");
  await page.getByRole("textbox", { name: "Password:", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Password:", exact: true })
    .fill("new1234!");
  await page.getByRole("textbox", { name: "Confirm Password:" }).click();
  await page
    .getByRole("textbox", { name: "Confirm Password:" })
    .fill("new1235!");
  await page.getByRole("button", { name: "Sign Up" }).click();
  await expect(page.getByText("Passwords do not match.")).toBeVisible();
});

test("User cannot sign up if password is too short and doesn't contain numbers and special characters", async ({ page }) => {
  await page.goto("http://localhost:3000/api/users/landing");
  await page.getByRole("button", { name: "📝 Sign Up" }).click();
  await page.getByRole("textbox", { name: "Username:" }).click();
  await page.getByRole("textbox", { name: "Username:" }).fill("newuser2");
  await page.locator("div").filter({ hasText: "Email:" }).click();
  await page.getByRole("textbox", { name: "Email:" }).fill("new@example.com");
  await page.getByRole("textbox", { name: "Password:", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Password:", exact: true })
    .fill("new");
  await page.getByRole("textbox", { name: "Confirm Password:" }).click();
  await page.getByRole("textbox", { name: "Confirm Password:" }).fill("new");
  await page.getByRole("button", { name: "Sign Up" }).click();
  await expect(page.locator("#signup-error")).toBeVisible();
});
