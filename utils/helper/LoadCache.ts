import { Cache } from "o1js";
import fs from "fs";
import path from "path";

// Type definitions
interface CacheFile {
  name: string;
  type: string;
}

interface CacheMap {
  [key: string]: {
    file: CacheFile;
    header: string;
    data: string;
  };
}

// Cache file configurations
const aggregationCacheFiles: CacheFile[] = [
  { name: "step-vk-doot-prices-aggregation-program20-base", type: "string" },
  {
    name: "step-vk-doot-prices-aggregation-program20-generateaggregationproof",
    type: "string",
  },
  { name: "wrap-vk-doot-prices-aggregation-program20", type: "string" },
];

const cacheFiles: CacheFile[] = [
  { name: "lagrange-basis-fp-8192", type: "string" },
  { name: "lagrange-basis-fp-16384", type: "string" },
  { name: "step-vk-doot-getprices", type: "string" },
  { name: "step-vk-doot-initbase", type: "string" },
  { name: "step-vk-doot-settle", type: "string" },
  { name: "step-vk-doot-update", type: "string" },
  { name: "step-vk-doot-verify", type: "string" },
  { name: "wrap-vk-doot", type: "string" },
];

// Cache paths
const DOOT_CACHE_PATH = path.join(
  process.cwd(),
  "utils",
  "constants",
  "doot_cache"
);
const AGGREGATION_CACHE_PATH = path.join(
  process.cwd(),
  "utils",
  "constants",
  "aggregation_cache"
);

// File reading functions with proper error handling
function readCacheFile(
  basePath: string,
  filename: string,
  isHeader: boolean = false
): string {
  try {
    const filePath = path.join(
      basePath,
      `${filename}${isHeader ? ".header" : ""}`
    );
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    console.error(
      `Error reading cache file ${filename}:`,
      error instanceof Error ? error.message : "Unknown error"
    );
    throw error;
  }
}

async function processCacheFiles(
  files: CacheFile[],
  basePath: string
): Promise<CacheMap> {
  try {
    const cacheList = await Promise.all(
      files.map(async (file) => ({
        file,
        header: readCacheFile(basePath, file.name, true),
        data: readCacheFile(basePath, file.name),
      }))
    );

    return cacheList.reduce((acc: CacheMap, cache) => {
      acc[cache.file.name] = cache;
      return acc;
    }, {});
  } catch (error) {
    console.error(
      "Error processing cache files:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw error;
  }
}

export async function fetchDootFiles(): Promise<CacheMap> {
  return processCacheFiles(cacheFiles, DOOT_CACHE_PATH);
}

export async function fetchAggregationFiles(): Promise<CacheMap> {
  return processCacheFiles(aggregationCacheFiles, AGGREGATION_CACHE_PATH);
}

interface FileSystemParams {
  persistentId: string;
  uniqueId: string;
  dataType: string;
}

export const FileSystem = (files: CacheMap): Cache => ({
  read({ persistentId, uniqueId, dataType }: FileSystemParams) {
    try {
      const file = files[persistentId];
      if (!file || file.header !== uniqueId) {
        return undefined;
      }

      return dataType === "string"
        ? new TextEncoder().encode(file.data)
        : undefined;
    } catch (error) {
      console.error(
        "Error reading from FileSystem:",
        error instanceof Error ? error.message : "Unknown error"
      );
      return undefined;
    }
  },
  write: (
    { persistentId, uniqueId, dataType }: FileSystemParams,
    data: any
  ) => {},
  canWrite: true,
});
