import type { TracingSearchType } from "@langfuse/shared";

// Helper function to get the current search mode value for the radio group
export function getSearchMode(
  searchType: TracingSearchType[] | undefined,
  tableAllowsFullTextSearch = false,
): string {
  if (!searchType || !tableAllowsFullTextSearch) return "metadata";
  if (searchType.includes("content")) return "metadata_fulltext";
  if (searchType.includes("input")) return "metadata_fulltext_input";
  if (searchType.includes("output")) return "metadata_fulltext_output";
  return "metadata";
}

export function hasFullTextSearchType(
  searchType: TracingSearchType[] | undefined,
): boolean {
  return Boolean(
    searchType?.some(
      (type) => type === "content" || type === "input" || type === "output",
    ),
  );
}

// Helper function to convert search mode value to search type array
export function searchModeToType(mode: string): TracingSearchType[] {
  switch (mode) {
    case "metadata_fulltext":
      return ["id", "content"];
    case "metadata_fulltext_input":
      return ["id", "input"];
    case "metadata_fulltext_output":
      return ["id", "output"];
    default:
      return ["id"];
  }
}
