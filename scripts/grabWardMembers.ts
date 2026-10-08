import { WardMember, wardMembersData } from "@/data/wards/wardMemberListData";
import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";

/*
// Grab data from the HTML table and convert it into a JSON array
(() => {
    // Select all table rows inside the table body (or just all tr elements)
    const rows = document.querySelectorAll("table tr, tbody tr");
    
    const tableData = Array.from(rows).map(row => {
        const cells = Array.from(row.querySelectorAll("td"));
        
        // Skip empty rows or header rows that don't contain <td> elements
        if (cells.length === 0) return null;
        
        // Loop through each cell in the row
        const rowData = cells.map(td => {
            const img = td.querySelector("img");
            // If an image exists, extract its source URL; otherwise, get the clean text
            return img ? img.src : td.textContent.trim();
        });

        // Map the array indices to explicit JSON keys
        return {
            id: rowData[0] || "",
            ward: rowData[1] || "",
            name: rowData[2] || "",
            address: rowData[3] || "",
            phone: rowData[4] || "",
            extra_field: rowData[5] || "",
            party: rowData[6] || "",
            image_path: rowData[7] || ""
        };
    }).filter(row => row !== null); // Remove empty/null entries

    // Print the final beautifully formatted JSON payload
    console.log(JSON.stringify(tableData, null, 2));
})();
*/

const OUTPUT_DIR = path.resolve(process.cwd(), "public/img/officials/wards");
const DATA_FILE = path.resolve(process.cwd(), "data/wards/wardListData.ts");

// Create the output directory if it doesn't already exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Creates a filesystem-safe filename from the member name.
 */
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "_");
}

/**
 * Downloads a single image.
 */
async function downloadImage(member: WardMember): Promise<void> {
  const url = member.image_path;

  // Skip if there is no valid image URL
  if (!url || !url.startsWith("http")) {
    console.log(
      `⚠️ Skipped: No valid image URL for ${member.name || `Unknown ID: ${member.id}`}`,
    );
    return;
  }

  const sanitizedName = sanitizeFileName(member.name);
  const extension = path.extname(new URL(url).pathname) || ".jpg";

  const fileName = `${member.ward}_${sanitizedName}${extension}`;
  const localFilePath = path.join(OUTPUT_DIR, fileName);

  try {
    console.log(`⏳ Downloading ${fileName}...`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("Response body is empty.");
    }

    const nodeStream = Readable.fromWeb(response.body as any);
    const fileStream = fs.createWriteStream(localFilePath);

    nodeStream.pipe(fileStream);
    await finished(fileStream);

    console.log(`✅ Saved ${fileName}`);
  } catch (error) {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    const message = error instanceof Error ? error.message : String(error);

    console.error(`❌ Failed downloading ${fileName}: ${message}`);
  }
}

/**
 * Updates wardMembersData by adding a local avatar path for each downloaded image.
 * Existing image_path values are preserved.
 */
async function updateAvatars(): Promise<void> {
  const source = await fsp.readFile(DATA_FILE, "utf8");
  const imageFiles = await fsp.readdir(OUTPUT_DIR);

  let updatedSource = source;

  for (const member of wardMembersData) {
    const sanitizedName = sanitizeFileName(member.name);

    const imageFile = imageFiles.find((file) =>
      file.startsWith(`${member.ward}_${sanitizedName}.`),
    );

    if (!imageFile) {
      console.warn(`⚠️ No local image found for ${member.name}`);
      continue;
    }

    const avatar = `/img/officials/wards/${imageFile}`;
    const escapedName = member.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const objectRegex = new RegExp(
      `(\\{[\\s\\S]*?name:\\s*"${escapedName}"[\\s\\S]*?\\})`,
      "g",
    );

    updatedSource = updatedSource.replace(objectRegex, (objectText) => {
      if (/avatar:\s*"[^"]*"/.test(objectText)) {
        // Replace existing avatar
        return objectText.replace(/avatar:\s*"[^"]*"/, `avatar: "${avatar}"`);
      }

      // Insert avatar after image_path
      return objectText.replace(
        /(image_path:\s*"[^"]*",?)/,
        `$1\n    avatar: "${avatar}",`,
      );
    });
  }

  await fsp.writeFile(DATA_FILE, updatedSource, "utf8");

  console.log("✅ Updated avatar paths.");
}

/**
 * Main execution controller.
 */
async function run(): Promise<void> {
  console.log(
    `🚀 Starting downloads for ${wardMembersData.length} ward members...`,
  );

  for (const member of wardMembersData) {
    await downloadImage(member);
  }

  console.log("🎉 All downloads completed.");

  await updateAvatars();
}

void run();
