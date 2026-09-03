import http from "http";

function fetchPage(urlPath: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 3000,
        path: urlPath,
        method: "GET",
        headers: { Host: "localhost:3000" },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode || 0, body }));
      }
    );
    req.on("error", (e) => resolve({ status: 0, body: e.message }));
    req.end();
  });
}

async function main() {
  console.log("Testing /install page download button...");
  const res = await fetchPage("/install");
  console.log("HTTP Status:", res.status);
  const targetUrl = "https://github.com/darkmd98-hue/BS/releases/latest";
  const hasUrl = res.body.includes(targetUrl);
  console.log("Contains GitHub Release URL:", hasUrl);
  const hasBetaTag = res.body.includes("v0.1.0-beta");
  console.log("Contains v0.1.0-beta tag:", hasBetaTag);
  if (res.status === 200 && hasUrl && hasBetaTag) {
    console.log("✅ /install screen verification PASSED");
  } else {
    console.error("❌ /install screen verification FAILED");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
