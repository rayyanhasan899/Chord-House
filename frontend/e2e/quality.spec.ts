import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

async function evidence(
  info: import("@playwright/test").TestInfo,
  name: string,
  data: unknown,
) {
  await info.attach(name, {
    body: JSON.stringify(data, null, 2),
    contentType: "application/json",
  });
}

declare global {
  interface Window {
    __qualityContexts: AudioContext[];
    __qualityWorkerMs: number[];
    __qualityStops: number;
    __qualityHz: number;
  }
}

test("noisy harmonic capture stays local responsive and releases on interruption", async ({
  page,
  browser,
}, info) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    window.__qualityContexts = [];
    window.__qualityWorkerMs = [];
    window.__qualityStops = 0;
    window.__qualityHz = 41.2034446;
    const NativeAudio = window.AudioContext;
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        let sent = 0;
        const post = this.postMessage.bind(this);
        this.postMessage = (
          message: unknown,
          options: Transferable[] | StructuredSerializeOptions = [],
        ) => {
          sent = performance.now();
          if (Array.isArray(options)) post(message, options);
          else post(message, options);
        };
        this.addEventListener("message", () => {
          window.__qualityWorkerMs.push(performance.now() - sent);
        });
      }
    };
    window.AudioContext = class extends NativeAudio {
      constructor(options?: AudioContextOptions) {
        super(options);
        window.__qualityContexts.push(this);
      }
    };
    const capture = async () => {
      const context = window.__qualityContexts.at(-1) || new NativeAudio();
      await context.resume();
      const destination = context.createMediaStreamDestination();
      const nodes: OscillatorNode[] = [];
      for (const [harmonic, amplitude] of [
        [1, 0.18],
        [2, 0.28],
        [3, 0.1],
      ]) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = window.__qualityHz * harmonic;
        gain.gain.value = amplitude;
        oscillator.connect(gain).connect(destination);
        oscillator.start();
        nodes.push(oscillator);
      }
      const buffer = context.createBuffer(
        1,
        context.sampleRate,
        context.sampleRate,
      );
      let state = 18;
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) {
        state = (state * 16807) % 2147483647;
        samples[i] = (state / 2147483647 - 0.5) * 0.012;
      }
      const noise = context.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      noise.connect(destination);
      noise.start();
      const track = destination.stream.getAudioTracks()[0];
      const stop = track.stop.bind(track);
      track.stop = () => {
        window.__qualityStops++;
        nodes.forEach((node) => node.stop());
        noise.stop();
        stop();
        if (context !== window.__qualityContexts.at(-1))
          void context.close().catch(() => {});
      };
      return destination.stream;
    };
    // Bind the injected capture to navigator itself so a browser cannot return
    // a refreshed native MediaDevices wrapper after stopping the first stream.
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: capture },
    });
  });
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST")
      posts.push(new URL(request.url()).pathname);
  });
  await page.goto("/tuner");
  expect(await page.evaluate(() => isSecureContext)).toBe(true);
  const results = [];
  for (const [instrument, hz] of [
    ["Bass guitar", 41.2034446],
    ["Acoustic guitar", 82.406889],
  ] as const) {
    await page
      .getByRole("combobox", { name: "Instrument", exact: true })
      .selectOption(instrument);
    await page.evaluate((value) => {
      window.__qualityHz = value;
    }, hz);
    await page
      .getByRole("button", { name: "Start microphone", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "In tune", exact: true }),
    ).toBeVisible({ timeout: 15000 });
    const text = await page
      .locator("p")
      .filter({ hasText: /^\d+\.\d{2} Hz · -?\d+\.\d cents$/ })
      .innerText();
    const detected = Number(text.split(" ")[0]);
    const error = 1200 * Math.log2(detected / hz);
    expect(Math.abs(error)).toBeLessThanOrEqual(5);
    results.push({
      instrument,
      targetHz: hz,
      detectedHz: detected,
      centsError: error,
    });
    await page.getByRole("button", { name: "Stop", exact: true }).click();
  }
  await page
    .getByRole("button", { name: "Start microphone", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "In tune", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => window.__qualityContexts.at(-1)!.suspend());
  await expect(page.getByRole("status")).toContainText(
    "Audio paused or interrupted",
  );
  expect(await page.evaluate(() => window.__qualityStops)).toBe(3);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__qualityContexts.every((c) => c.state === "closed"),
      ),
    )
    .toBe(true);
  expect(posts).toEqual([]);
  const workerMs = await page.evaluate(() => window.__qualityWorkerMs);
  expect(workerMs.length).toBeGreaterThan(0);
  // A generous regression gate; raw values remain in evidence for review.
  expect(Math.max(...workerMs)).toBeLessThan(2000);
  await evidence(info, "capture-measurements", {
    browser: browser.version(),
    project: info.project.name,
    results,
    workerMs,
    physicalCapture: false,
    posts,
  });
});

test("production navigation transfer and responsiveness measurements", async ({
  page,
  browser,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) =>
    errors.push(`${page.url()}: ${error.message}`),
  );
  const measurements = [];
  for (const [path, name] of [
    ["/", "Home"],
    ["/tuner", "Tuner"],
    ["/metronome", "Metronome"],
    ["/chords", "Chords"],
  ]) {
    const started = Date.now();
    if (path === "/") await page.goto(path);
    else
      await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name, exact: true })
        .click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Await real controls/data rather than measuring only an empty shell.
    if (path === "/tuner")
      await expect(
        page.getByRole("combobox", { name: "Tuning", exact: true }),
      ).toHaveValue("Guitar standard");
    if (path === "/chords")
      await expect(
        page.getByRole("button", { name: "Play chord", exact: true }),
      ).toBeEnabled();
    const routeReadyMs = Date.now() - started;
    expect(routeReadyMs).toBeLessThan(10000);
    const measurement = await page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType(
        "resource",
      ) as PerformanceResourceTiming[];
      return {
        path: location.pathname,
        initialDocumentDomContentLoadedMs: navigation.domContentLoadedEventEnd,
        scriptsTransferred: resources
          .filter((r) => r.initiatorType === "script")
          .reduce((sum, r) => sum + r.transferSize, 0),
        audioResources: resources.filter((r) =>
          /\.(mp3|wav|ogg)(\?|$)/.test(r.name),
        ).length,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(measurement.initialDocumentDomContentLoadedMs).toBeLessThan(10000);
    expect(measurement.scriptsTransferred).toBeLessThan(1_500_000);
    expect(measurement.audioResources).toBe(0);
    expect(measurement.overflow).toBe(false);
    measurements.push({ ...measurement, routeReadyMs });
  }
  expect(errors).toEqual([]);
  await evidence(info, "navigation-measurements", {
    browser: browser.version(),
    project: info.project.name,
    viewport: page.viewportSize(),
    environment: "production build, local CI network; no device CPU throttling",
    measurements,
  });
});

for (const missing of ["AudioContext", "Worker", "mediaDevices"])
  test(`tuner explains missing ${missing} before requesting capture`, async ({
    page,
  }) => {
    await page.addInitScript((name) => {
      Object.defineProperty(
        name === "mediaDevices" ? navigator : window,
        name,
        {
          configurable: true,
          value: undefined,
        },
      );
    }, missing);
    await page.goto("/tuner");
    await page
      .getByRole("button", { name: "Start microphone", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "does not support microphone tuning",
    );
    await expect(
      page.getByRole("button", { name: "Start microphone", exact: true }),
    ).toBeEnabled();
  });

test("unsupported playback explains recovery without losing controls", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "AudioContext", { value: undefined });
  });
  await page.goto("/metronome");
  await page
    .getByRole("button", { name: "Start metronome", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Web Audio" }),
  ).toContainText("Web Audio is unavailable");
  await page.goto("/chords");
  await page.getByRole("button", { name: "Play chord", exact: true }).click();
  await expect(
    page.getByText("Audio is unavailable.", { exact: false }),
  ).toBeVisible();
});

async function signIn(page: Page) {
  const email = `quality-${randomUUID()}@example.com`;
  const password = "Disposable quality phrase 123!";
  const headers = { Origin: "http://127.0.0.1:3100" };
  expect(
    (
      await page.request.post("/api/v1/auth/register", {
        headers,
        data: {
          email,
          password,
          display_name: "Quality learner",
          acknowledge_privacy: true,
        },
      })
    ).status(),
  ).toBe(201);
  expect(
    (
      await page.request.post("/api/v1/auth/login", {
        headers,
        data: { email, password },
      })
    ).status(),
  ).toBe(200);
}

test("failed save preserves input and retry persists exactly one task", async ({
  page,
}) => {
  test.skip(
    !process.env.CHORD_E2E_MAIL_DIR,
    "Requires disposable API/database runner",
  );
  await signIn(page);
  await page.goto("/dashboard");
  const title = "Retain my unsaved practice plan";
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page.route("**/api/v1/workspace", (route) =>
    route.request().method() === "POST" ? route.abort() : route.continue(),
  );
  await page.getByRole("button", { name: "Save item", exact: true }).click();
  await expect(page.locator(".feedback.error")).toBeVisible();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(title);
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toHaveCount(0);
  await page.unroute("**/api/v1/workspace");
  await page.getByRole("button", { name: "Save item", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toHaveCount(1);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toHaveCount(1);
});
