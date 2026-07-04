import { chromium } from "playwright";

const routes = [
  ["/dashboard", "/opt/cursor/artifacts/dashboard-styled.png"],
  ["/team", "/opt/cursor/artifacts/team-timeline-styled.png"],
  ["/opportunities", "/opt/cursor/artifacts/opportunities-styled.png"],
  ["/projects", "/opt/cursor/artifacts/projects-styled.png"],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

for (const [path, file] of routes) {
  await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => {
    const sidebar = document.querySelector(".nav-drawer");
    if (!sidebar) return false;
    const bg = getComputedStyle(sidebar).backgroundColor;
    return bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`Saved ${file}`);
}

await browser.close();
