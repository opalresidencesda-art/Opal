import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const SOURCE_PATH = "/tmp/drive-crawl-results.json";
const OUTPUT_JSON = "/root/projects/opal-residence/scripts/property-image-import/drive_inventory.json";
const OUTPUT_MARKDOWN = "/root/projects/opal-residence/scripts/property-image-import/drive_inventory.md";

function toIso(timestampMs) {
  return Number.isFinite(timestampMs) ? new Date(timestampMs).toISOString() : null;
}

function parseLocationCandidate(text) {
  const normalized = text.trim().replace(/\s+/g, " ");
  const match = normalized.match(/(?:^|\s)([1235])\s*\/\s*(\d{1,3})(?:\s|$)/i);
  if (!match) return null;
  const gang = Number(match[1]);
  const houseNumber = match[2].padStart(2, "0");
  return {
    raw_match: match[0].trim(),
    gang,
    house_number: houseNumber,
    unit_code: `OP ${gang} - ${houseNumber}`,
  };
}

function substantiveComments(comments) {
  return comments.filter((comment) => comment.exact_text.trim().length > 0);
}

const raw = JSON.parse(readFileSync(SOURCE_PATH, "utf8"));
const items = raw.items.map((item) => {
  const comments = substantiveComments(item.comments || []).map((comment) => ({
    comment_id: comment.comment_id,
    author: comment.author,
    author_id: comment.author_id,
    created_at: toIso(comment.timestamp_ms),
    modified_at: toIso(comment.modified_timestamp_ms),
    exact_text: comment.exact_text,
    location_candidate: parseLocationCandidate(comment.exact_text),
  }));
  const candidates = comments.map((comment) => comment.location_candidate).filter(Boolean);
  const uniqueUnitCodes = [...new Set(candidates.map((candidate) => candidate.unit_code))];
  const classification = comments.length === 0
    ? "no_comment"
    : candidates.length === 0
      ? "comment_without_location"
      : uniqueUnitCodes.length > 1
        ? "conflicting_locations"
        : "single_location_candidate";

  return {
    source_order: item.source_order,
    file_id: item.file_id,
    filename: item.filename || item.title,
    mime_type: item.mime || null,
    visible_size: item.visible_size || null,
    viewer_url: item.viewer_url || `https://drive.google.com/file/d/${item.file_id}/view`,
    download_url: item.download_url || null,
    comments,
    parsed_unit_code: uniqueUnitCodes.length === 1 ? uniqueUnitCodes[0] : null,
    classification,
    database_match: "not_checked_against_production",
    import_status: "not_uploaded",
  };
});

const substantiveCommented = items.filter((item) => item.comments.length > 0).length;
const locationCandidates = items.filter((item) => item.classification === "single_location_candidate").length;
const conflicts = items.filter((item) => item.classification === "conflicting_locations").length;
const inventory = {
  generated_at: new Date().toISOString(),
  source_folder_url: raw.folder_url,
  extraction_method: "Public Google Drive folder DOM plus per-file Google Drive viewer comment sync response",
  verification: {
    folder_dom_file_count: raw.folder.dom_row_count,
    extracted_file_count: items.length,
    extraction_errors: items.filter((item) => item.error).length,
    substantive_commented_file_count: substantiveCommented,
    single_location_candidate_count: locationCandidates,
    conflicting_location_count: conflicts,
    no_substantive_comment_count: items.length - substantiveCommented,
  },
  safety: {
    comments_are_preserved_exactly: true,
    location_parsing_is_candidate_only: true,
    production_database_checked: false,
    uploads_performed: false,
  },
  items,
};

mkdirSync(dirname(OUTPUT_JSON), { recursive: true });
writeFileSync(OUTPUT_JSON, `${JSON.stringify(inventory, null, 2)}\n`);

const rows = items.map((item) => {
  const comment = item.comments.map((entry) => entry.exact_text.replace(/\|/g, "\\|")).join("; ") || "—";
  return `| ${item.source_order} | ${item.filename} | \`${item.file_id}\` | ${comment} | ${item.parsed_unit_code || "—"} | ${item.classification} |`;
});
const markdown = `# Google Drive Property Image Inventory\n\n- Source: ${inventory.source_folder_url}\n- Files: ${items.length}\n- Files with substantive comments: ${substantiveCommented}\n- Single location candidates: ${locationCandidates}\n- Conflicting locations: ${conflicts}\n- Production database checked: No\n- Uploads performed: No\n\nLocation values below are parser candidates only. They must match exactly one existing production property before import.\n\n| # | File | File ID | Exact comment | Parsed candidate | Classification |\n|---:|---|---|---|---|---|\n${rows.join("\n")}\n`;
writeFileSync(OUTPUT_MARKDOWN, markdown);

console.log(JSON.stringify(inventory.verification));
console.log(OUTPUT_JSON);
console.log(OUTPUT_MARKDOWN);
