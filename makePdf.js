const path = require("path");
const fs = require("fs");

const directory = "./base64/PP_000000011173.pdf"; // Thay đổi đường dẫn thư mục
const pdfExportPath = "./data_2.pdf";

const partsPath = [];
try {
  const files = fs.readdirSync(directory);
  const regex = /^(\d+)-(\d+)___(\d+)-(\d+)-([a-zA-Z]+)_(\d+)\.pdf\.txt$/;
  for (const fileName of files) {
    if (regex.test(fileName)) {
      const pathValue = {};
      pathValue["key"] = fileName.split("-")[0];
      pathValue["path"] = path.join(directory, fileName);
      partsPath.push(pathValue);
    }
  }

  partsPath.sort((a, b) => Number(a.key) - Number(b.key));
  console.log(partsPath.length);

  const writableStream = fs.createWriteStream(pdfExportPath);
  for (const { path } of partsPath) {
    const base64String = fs.readFileSync(path, "utf-8");
    const buffer = Buffer.from(base64String, "base64");
    writableStream.write(buffer);
  }
  writableStream.end();
  writableStream.on("finish", () => {
    console.log("Ghi vào stream đã hoàn tất");
  });
} catch (error) {
  console.error("Lỗi:", error.message);
}
