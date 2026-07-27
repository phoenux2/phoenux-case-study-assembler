import { expect, test } from "@playwright/test";

test("local mode can create a project and add a text source", async ({
  page,
}) => {
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();

  await page.getByRole("link", { name: /new project/i }).first().click();
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
