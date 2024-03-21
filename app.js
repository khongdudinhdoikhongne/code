const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const path = require("path");
puppeteer.use(StealthPlugin());
const { writeFileSync, existsSync, mkdirSync } = require("fs");

const getHeaderValues = (headers) => {
  if (!Array.isArray(headers)) return;
  const results = {
    contentRange: null,
    contentLength: null,
  };
  for (const header of headers) {
    if (header.name === "Content-Range") {
      results["contentRange"] = header.value?.split("bytes ")[1];
    } else if (header.name === "Content-Length") {
      results["contentLength"] = header.value;
    }
  }
  return results;
};

const writeLog = (path, message) => {
  writeFileSync(path, `[${new Date().toISOString()}]    ${message}\n`, {
    flag: "a+",
  });
};
const getRandomName = () => Math.random().toString() + Math.random().toString();

const handlePage = async (page) => {
  console.log("[BROWSER   ] new page opened.");
  // Dat thoi gian gan nhu vo han
  await page.setDefaultNavigationTimeout(600000000);
  await page.setDefaultTimeout(600000000);

  const client = await page.target().createCDPSession();
  await client.send("Fetch.enable", {
    patterns: [{ urlPattern: "*.pdf", requestStage: "Response" }],
  });

  client.on("Fetch.requestPaused", async (event) => {
    const { requestId, responseStatusCode, request, responseHeaders } = event;
    const { url } = request;
    try {
      if (responseStatusCode === 206 || responseStatusCode === 200) {
        console.log(`[REQUEST     ] - "${requestId}" - ${url} paused.`);

        let contentDisposition = url.split("/") || [];
        contentDisposition =
          contentDisposition[contentDisposition.length - 1] || getRandomName();
        // Tao thu muc chua file base cua pdf.
        const folderPath = path.join("./base64", contentDisposition);
        if (!existsSync(folderPath)) {
          mkdirSync(folderPath);
        }

        // Luu cac phan cua pdf vao thu muc cua no
        if (responseStatusCode === 206) {
          const responseCdp = await client.send("Fetch.getResponseBody", {
            requestId,
          });
          const headers = getHeaderValues(responseHeaders);
          if (headers.contentRange && headers.contentLength) {
            let nameFile = `${headers.contentRange}-${headers.contentLength}-${
              contentDisposition || ""
            }.txt`.replaceAll("/", "___");
            try {
              writeFileSync(path.join(folderPath, nameFile), responseCdp.body);
              console.log(`[INFO     ] - ${nameFile} saved.`);
              writeLog(
                path.join(folderPath, "log.txt"),
                `[INFO     ] - ${nameFile} saved.`
              );
            } catch (error) {
              console.log(`[ERROR     ] - ${nameFile}.`);
              writeLog(
                path.join(folderPath, "log.txt"),
                `[ERROR     ] - ${nameFile}.`
              );
              writeLog(
                path.join(folderPath, "log.txt"),
                `${JSON.stringify(error)}.`
              );
            }
          } else {
            let nameFile = `${headers.contentRange || ""}-${
              headers.contentLength || ""
            }-${contentDisposition || ""}-${getRandomName()}.txt`.replaceAll(
              "/",
              "___"
            );
            try {
              writeFileSync(path.join(folderPath, nameFile), responseCdp.body);
              console.log(`[INFO     ] - ${nameFile} saved.`);
              writeLog(
                path.join(folderPath, "log.txt"),
                `[INFO     ] - ${nameFile} saved.`
              );
            } catch (error) {
              console.log(`[ERROR     ] - ${nameFile}.`);
              writeLog(
                path.join(folderPath, "log.txt"),
                `[ERROR     ] - ${nameFile}.`
              );
              writeLog(
                path.join(folderPath, "log.txt"),
                `${JSON.stringify(event)}.`
              );
              writeLog(
                path.join(folderPath, "log.txt"),
                `${JSON.stringify(error)}.`
              );
            }
          }
        } else if (responseStatusCode === 200) {
          const responseCdp = await client.send("Fetch.getResponseBody", {
            requestId,
          });

          let nameFile = `AAA-200--${getRandomName()}.txt`.replaceAll(
            "/",
            "___"
          );
          try {
            writeFileSync(path.join(folderPath, nameFile), responseCdp.body);
            console.log(`[INFO     ] - ${nameFile} saved.`);
            writeLog(
              path.join(folderPath, "log.txt"),
              `[INFO     ] - ${nameFile} saved.`
            );
          } catch (error) {
            console.log(`[ERROR     ] - ${nameFile}.`);
            writeLog(
              path.join(folderPath, "log.txt"),
              `[ERROR     ] - ${nameFile}.`
            );
            writeLog(
              path.join(folderPath, "log.txt"),
              `${JSON.stringify(event)}.`
            );
            writeLog(
              path.join(folderPath, "log.txt"),
              `${JSON.stringify(error)}.`
            );
          }
        }
        // .then((responseCdp) => {

        // })
        // .catch((error) => {
        //   console.log(`[ERROR     ] Request "${requestId}" - ${url} paused.`);
        //   console.log(error);
        // });
      }

      if (requestId) {
        await client.send("Fetch.continueRequest", { requestId });
      }
    } catch (error) {
      console.log(error);
      writeLog("./global-error-log.txt", `${url}\n`);
      writeLog("./global-error-log.txt", `${JSON.stringify(error)}\n`);
    }
  });
};

(async () => {
  const browser = await puppeteer.launch({
    userDataDir: "./profiles/p_1",
    headless: false,
    ignoreHTTPSErrors: true,
    args: [
      "--disable-web-security",
      "--proxy-server=socks5://localhost:9050",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });

  browser.on("targetcreated", async (target) => {
    if (target.type() === "page") {
      const page = await target.page();
      handlePage(page);
    }
  });

  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto(
    ["https://www.abhilekh-patal.in/", "https://www.google.com"][0]
  );
})();

// tuan@breizh.im
