import fs from "fs/promises";
import path from "path";

// Ward data provided from the municipality API
type Ward = {
  value: string;
  text: string;
};

const WARD_LIST: Ward[] = [
  { value: "5650", text: "WARD-OOB" },
  { value: "800", text: "WD-01" },
  { value: "801", text: "WD-02" },
  { value: "802", text: "WD-03" },
  { value: "803", text: "WD-04" },
  { value: "804", text: "WD-05" },
  { value: "805", text: "WD-06" },
  { value: "806", text: "WD-07" },
  { value: "807", text: "WD-08" },
  { value: "808", text: "WD-09" },
  { value: "809", text: "WD-10" },
  { value: "810", text: "WD-11" },
  { value: "811", text: "WD-12" },
  { value: "812", text: "WD-13" },
  { value: "813", text: "WD-14" },
  { value: "814", text: "WD-15" },
  { value: "815", text: "WD-16" },
  { value: "816", text: "WD-17" },
  { value: "817", text: "WD-18" },
  { value: "818", text: "WD-19" },
  { value: "819", text: "WD-20" },
  { value: "820", text: "WD-21" },
  { value: "821", text: "WD-22" },
  { value: "822", text: "WD-23" },
  { value: "823", text: "WD-24" },
  { value: "824", text: "WD-25" },
  { value: "825", text: "WD-26" },
  { value: "826", text: "WD-27" },
  { value: "827", text: "WD-28" },
  { value: "828", text: "WD-29" },
  { value: "829", text: "WD-30" },
  { value: "830", text: "WD-31" },
  { value: "831", text: "WD-32" },
  { value: "832", text: "WD-33" },
  { value: "833", text: "WD-34" },
  { value: "834", text: "WD-35" },
  { value: "835", text: "WD-36" },
  { value: "836", text: "WD-37" },
  { value: "837", text: "WD-38" },
  { value: "838", text: "WD-39" },
  { value: "839", text: "WD-40" },
  { value: "840", text: "WD-41" },
  { value: "841", text: "WD-42" },
  { value: "842", text: "WD-43" },
  { value: "843", text: "WD-44" },
  { value: "844", text: "WD-45" },
  { value: "845", text: "WD-46" },
  { value: "846", text: "WD-47" },
  { value: "847", text: "WD-48" },
];

// Extract ward number from "WD-01" -> 1, "WARD-OOB" -> 0
function parseWardNumber(text: string) {
  const match = text.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

async function fetchStreetsForWard(ward: Ward) {
  // Replace this URL pattern if your endpoint structure differs
  const url = `https://tnurban.vercel.app/api/municipalities/24/${ward.value}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();

    // Expecting response to return streets array, e.g. ["Street 1", "Street 2"] or { streets: [...] }
    const streets = Array.isArray(data) ? data : data.streets || [];
    return streets;
  } catch (error) {
    console.error(
      `❌ Failed to fetch streets for ${ward.text} (ID: ${ward.value}):`,
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

async function main() {
  console.log(`🚀 Starting extraction for ${WARD_LIST.length} wards...`);

  const result: {
    municipality_id: number;
    municipality_name: string;
    total_wards: number;
    wards: Array<{
      ward_no: number;
      ward_code: string;
      ward_id: string;
      streets: unknown[];
    }>;
  } = {
    municipality_id: 24,
    municipality_name: "Avadi",
    total_wards: WARD_LIST.length,
    wards: [],
  };

  for (const ward of WARD_LIST) {
    const wardNo = parseWardNumber(ward.text);
    console.log(`Fetching ${ward.text} (Ward ${wardNo})...`);

    const streets = await fetchStreetsForWard(ward);

    result.wards.push({
      ward_no: wardNo,
      ward_code: ward.text,
      ward_id: ward.value,
      streets: streets,
    });

    // Polite delay to prevent hitting API rate limits
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  // Save into src/data/avadi-wards.json
  const outputDir = path.join(__dirname, "../", "data");
  await fs.mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, "avadi-wards.json");
  await fs.writeFile(outputPath, JSON.stringify(result, null, 2), "utf-8");

  console.log(`\n✅ Finished! Data successfully saved to: ${outputPath}`);
}

main().catch(console.error);
