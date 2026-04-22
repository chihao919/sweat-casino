import sharp from "sharp";

const INPUT = "/Users/chihao1/Downloads/Gemini_Generated_Image_y1ql5qy1ql5qy1ql.png";
const OUT_DIR = "/Users/chihao1/Downloads/runrun/public/skins";

// Image: 2816 x 1536
// Manual crop coordinates for each character (visually measured)
// Format: [left, top, width, height, slug]
const crops = [
  // Row 1
  [80,  160, 380, 300, "basic-runner"],
  [640, 140, 400, 310, "morning-jogger"],
  [1200, 150, 400, 300, "night-runner"],
  [1770, 150, 390, 300, "storm-chaser"],
  [2320, 140, 400, 310, "trail-blazer"],
  // Row 2
  [1210, 620, 400, 310, "thunder-warrior"],
  [1780, 610, 380, 310, "ice-phantom"],
  [2330, 590, 400, 330, "phoenix-rising"],
  // Row 3
  [70,  1080, 400, 330, "flame-sprinter"],
  [1210, 1100, 400, 310, "shadow-assassin"],
  [1760, 1080, 420, 330, "marathon-god"],
];

async function main() {
  for (const [left, top, width, height, slug] of crops) {
    await sharp(INPUT)
      .extract({ left, top, width, height })
      .resize(300, 300, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(`${OUT_DIR}/${slug}.png`);
    console.log(`${slug} OK`);
  }
  console.log("Done!");
}

main().catch(console.error);
