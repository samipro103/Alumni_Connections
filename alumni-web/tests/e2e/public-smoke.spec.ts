import { expect, test } from "@playwright/test";

test.describe("ALUMNI public smoke", () => {
  test("la landing responde sin error de servidor", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("login carga su formulario esencial", async ({ page }) => {
    const response = await page.goto("/login", {
      waitUntil: "domcontentloaded",
    });

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(500);
    await expect(
      page.getByRole("heading", { name: "Inicia sesión" })
    ).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Entrar a Alumni" })
    ).toBeVisible();
  });

  test("registro abre sin enviar ni crear datos", async ({ page }) => {
    const response = await page.goto("/register", {
      waitUntil: "domcontentloaded",
    });

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});

test.describe("ALUMNI anonymous security smoke", () => {
  test("un visitante anónimo no puede abrir el centro admin", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { name: "Acceso restringido" })
    ).toBeVisible({ timeout: 15_000 });
  });

  test("un visitante anónimo no puede ver observabilidad", async ({ page }) => {
    await page.goto("/admin/observability", {
      waitUntil: "domcontentloaded",
    });

    await expect(
      page.getByRole("heading", { name: "Acceso restringido" })
    ).toBeVisible({ timeout: 15_000 });
  });
});
