import {
  expect,
  test,
  type Page,
} from "@playwright/test";

const EMAIL =
  process.env.ALUMNI_VISUAL_EMAIL ||
  "";

const PASSWORD =
  process.env.ALUMNI_VISUAL_PASSWORD ||
  "";

const ROUTES = [
  ["/feed", "feed"],
  ["/explore", "buscar"],
  ["/messages", "mensajes"],
  ["/profile", "perfil"],
  ["/more", "mas"],
  ["/events", "eventos"],
  ["/community", "comunidades"],
  ["/notifications", "notificaciones"],
] as const;

async function login(
  page: Page
) {
  await page.goto(
    "/login"
  );

  await page
    .getByPlaceholder(
      "tu@correo.com"
    )
    .fill(EMAIL);

  await page
    .getByPlaceholder(
      "Tu contraseña"
    )
    .fill(PASSWORD);

  await page
    .getByRole(
      "button",
      {
        name:
          "Entrar a Alumni",
      }
    )
    .click();

  await page.waitForURL(
    /\/feed/,
    {
      timeout: 20_000,
    }
  );
}

test.describe(
  "ALUMNI visual mobile",
  () => {
    test.skip(
      !EMAIL ||
        !PASSWORD,
      "Define ALUMNI_VISUAL_EMAIL y ALUMNI_VISUAL_PASSWORD."
    );

    test.beforeEach(
      async ({
        page,
      }) => {
        await login(page);

        await page.addStyleTag({
          content: `
            *,
            *::before,
            *::after {
              caret-color:
                transparent !important;
              animation-duration:
                0.001ms !important;
              animation-delay:
                0ms !important;
              transition-duration:
                0.001ms !important;
            }
          `,
        });
      }
    );

    for (
      const [
        route,
        name,
      ] of ROUTES
    ) {
      test(
        name,
        async ({
          page,
        }) => {
          await page.goto(
            route
          );

          await page.waitForLoadState(
            "networkidle"
          );

          await page.waitForTimeout(
            300
          );

          await expect(
            page
          ).toHaveScreenshot(
            `${name}.png`,
            {
              fullPage: true,
            }
          );
        }
      );
    }
  }
);

/* ALUMNI_DESIGN_CONSOLIDATION_1_0:VISUAL */
