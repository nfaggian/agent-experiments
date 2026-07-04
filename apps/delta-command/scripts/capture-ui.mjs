const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  for (const [path, file] of [
    ["/team", "/opt/cursor/artifacts/team-timeline-styled.png"],
    ["/dashboard", "/opt/cursor/artifacts/dashboard-styled.png"],
    ["/opportunities", "/opt/cursor/artifacts/opportunities-styled.png"],
  ]) {
    await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: file, fullPage: true });
  }

  await browser.close();
})();
