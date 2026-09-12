import {
  defineConfig,
} from "@playwright/test";

const externalBaseUrl =
  process.env.PLAYWRIGHT_BASE_URL?.trim();

const baseURL =
  externalBaseUrl ||
  "http://localhost:3000";

export default defineConfig({
  testDir:
    "./tests/visual",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  snapshotPathTemplate:
    "{testDir}/__screenshots__/{testFilePath}/{arg}{ext}",
  expect: {
    toHaveScreenshot: {
      animations:
        "disabled",
      maxDiffPixelRatio:
        0.015,
    },
  },
  use: {
    baseURL,
    colorScheme:
      "dark",
    locale:
      "es-SV",
    trace:
      "retain-on-failure",
  },
  projects: [
    {
      name: "phone-360",
      use: {
        viewport: {
          width: 360,
          height: 780,
        },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "phone-390",
      use: {
        viewport: {
          width: 390,
          height: 844,
        },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "phone-430",
      use: {
        viewport: {
          width: 430,
          height: 932,
        },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer:
    externalBaseUrl
      ? undefined
      : {
          command:
            "npm run dev",
          url: baseURL,
          reuseExistingServer:
            true,
          timeout:
            120_000,
        },
});
