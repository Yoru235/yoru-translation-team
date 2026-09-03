const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const chaptersDirectory = path.resolve(
  process.cwd(),
  ".data",
  "uploads",
  "chapters"
);

const allowedExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
];

async function main() {
  const files = await fs.readdir(chaptersDirectory);

  const imageFiles = files.filter((fileName) => {
    const extension = path.extname(fileName).toLowerCase();

    return allowedExtensions.includes(extension);
  });

  console.log(`Tìm thấy ${imageFiles.length} ảnh chapter.`);

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const fileName of imageFiles) {
    // Không đóng watermark vào credit-re.jpg
    if (fileName.toLowerCase() === "credit-re.jpg") {
      console.log(`Bỏ qua: ${fileName}`);
      skipped++;
      continue;
    }

    const filePath = path.join(
      chaptersDirectory,
      fileName
    );

    const tempPath = `${filePath}.watermark-temp`;

    try {
      const metadata =
        await sharp(filePath).metadata();

      const imageWidth =
        metadata.width || 1000;

      const imageHeight =
        metadata.height || 1000;

      /*
       * Watermark tự co theo ảnh.
       *
       * Không để watermark quá lớn.
       * Không để overlay lớn hơn ảnh gốc.
       */

      const watermarkWidth = Math.min(
        Math.floor(imageWidth * 0.62),
        900
      );

      const fontSize = Math.max(
        10,
        Math.min(
          18,
          Math.floor(imageWidth * 0.022)
        )
      );

      const strokeWidth = Math.max(
        0.5,
        fontSize * 0.045
      );

      const lineGap = Math.max(
        14,
        Math.floor(fontSize * 1.45)
      );

      const watermarkHeight =
        lineGap * 2 + 8;

      /*
       * Nếu ảnh quá thấp thì giảm
       * chiều cao watermark để chắc chắn
       * overlay luôn nhỏ hơn ảnh.
       */

      const finalWatermarkHeight =
        Math.min(
          watermarkHeight,
          Math.max(2, imageHeight - 4)
        );

      const watermark = Buffer.from(`
        <svg
          width="${watermarkWidth}"
          height="${finalWatermarkHeight}"
          viewBox="0 0 ${watermarkWidth} ${finalWatermarkHeight}"
        >
          <style>
            .line1 {
              fill: #000000;
              stroke: #ffffff;
              stroke-width: ${strokeWidth}px;
              paint-order: stroke fill;
              font-size: ${fontSize}px;
              font-family: Arial Narrow, Arial, sans-serif;
              font-weight: 800;
            }

            .line2 {
              fill: #d71920;
              stroke: #ffffff;
              stroke-width: ${strokeWidth}px;
              paint-order: stroke fill;
              font-size: ${fontSize}px;
              font-family: Arial Narrow, Arial, sans-serif;
              font-weight: 800;
            }
          </style>

          <text
            x="${watermarkWidth - 8}"
            y="${Math.max(12, lineGap)}"
            text-anchor="end"
            class="line1"
          >
            YORUTEAM.COM ĐỂ ỦNG HỘ NHÓM DỊCH
          </text>

          <text
            x="${watermarkWidth - 8}"
            y="${Math.min(
              finalWatermarkHeight - 4,
              lineGap * 2
            )}"
            text-anchor="end"
            class="line2"
          >
            NẾU VIEW QUÁ ÍT = DROP TRUYỆN
          </text>
        </svg>
      `);

      /*
       * Đóng watermark vào ảnh.
       * gravity southeast = góc dưới bên phải.
       */

      const outputBuffer =
        await sharp(filePath)
          .composite([
            {
              input: watermark,
              gravity: "southeast",
            },
          ])
          .toBuffer();

      /*
       * Ghi ra file tạm trước.
       * Thành công mới thay file gốc.
       */

      await fs.writeFile(
        tempPath,
        outputBuffer
      );

      await fs.rename(
        tempPath,
        filePath
      );

      success++;

      console.log(
        `✓ Đã đóng watermark: ${fileName}`
      );
    } catch (error) {
      failed++;

      console.error(
        `✗ Lỗi: ${fileName}`
      );

      console.error(error);

      try {
        await fs.unlink(tempPath);
      } catch {}
    }
  }

  console.log("");
  console.log("========== HOÀN TẤT ==========");
  console.log(`Thành công: ${success}`);
  console.log(`Bỏ qua:     ${skipped}`);
  console.log(`Lỗi:        ${failed}`);
  console.log("==============================");
}

main().catch((error) => {
  console.error("WATERMARK MIGRATION ERROR:");
  console.error(error);
  process.exit(1);
});