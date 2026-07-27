import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("local mode can create a project and add a text source", async ({
  page,
}) => {
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();

  await page.goto("/projects/new");
  await expect(
    page.getByRole("heading", { name: "New project" }),
  ).toBeVisible();

  const title = `E2E Project ${Date.now()}`;
  await page.getByLabel("Project title").fill(title);
  await page.getByLabel("Client name").fill("Test Client");
  await page.getByRole("button", { name: "Create project" }).click();

  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.getByLabel("Note title").fill("Kickoff notes");
  await page
    .getByLabel("Content")
    .fill("The client needed a clearer onboarding flow.");
  await page.getByRole("button", { name: "Add text source" }).click();

  await expect(page.getByText("Kickoff notes")).toBeVisible();
  await expect(page.getByText("Source saved.")).toBeVisible();
});

test("question engine asks one adaptive question at a time", async ({
  page,
}) => {
  await page.goto("/projects/new");
  const title = `Question Flow ${Date.now()}`;
  await page.getByLabel("Project title").fill(title);
  await page.getByRole("button", { name: "Create project" }).click();

  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText("Next question")).toBeVisible();
  await expect(
    page.getByText("What problem did this project solve?"),
  ).toBeVisible();
  await expect(page.getByText(/Why this question:/i)).toBeVisible();

  await page.getByLabel("Answer").fill("Users abandoned onboarding mid-flow.");
  await page.getByRole("button", { name: "Save answer" }).click();

  await expect(page.getByText("What was your primary role?")).toBeVisible();
  await page.getByLabel("Product designer").check();
  await page.getByRole("button", { name: "Save answer" }).click();

  await expect(
    page.getByText("Who was the primary audience or user?"),
  ).toBeVisible();
});

test("phase 2 can rebuild blocks, approve, and assemble website output", async ({
  page,
}) => {
  await page.goto("/projects/new");
  const title = `Phase2 ${Date.now()}`;
  await page.getByLabel("Project title").fill(title);
  await page.getByLabel("Summary").fill("Reduce onboarding drop-off");
  await page.getByRole("button", { name: "Create project" }).click();

  await page.getByLabel("Answer").fill("Users abandoned onboarding mid-flow.");
  await page.getByRole("button", { name: "Save answer" }).click();
  await page.getByLabel("Product designer").check();
  await page.getByRole("button", { name: "Save answer" }).click();
  await page.getByLabel("Answer").fill("New mobile shoppers");
  await page.getByRole("button", { name: "Save answer" }).click();
  await page.getByLabel("Yes").check();
  await page.getByRole("button", { name: "Save answer" }).click();
  await page.getByLabel("Answer").fill("Activation +22% after redesign");
  await page.getByRole("button", { name: "Save answer" }).click();

  // Skip optional confidence if it appears later; rebuild now.
  await page.getByRole("button", { name: "Rebuild blocks" }).click();
  await expect(page.getByText("Challenge")).toBeVisible();
  await page.getByRole("button", { name: "Approve" }).first().click();

  // Approve remaining draft blocks quickly
  for (let i = 0; i < 6; i++) {
    const approveButtons = page.getByRole("button", { name: "Approve" });
    const count = await approveButtons.count();
    if (count === 0) break;
    await approveButtons.first().click();
  }

  await page.locator("#output_type").selectOption("website");
  await page.getByRole("button", { name: "Assemble output" }).click();
  await expect(page.getByText(/Assembled from approved blocks only/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
});
