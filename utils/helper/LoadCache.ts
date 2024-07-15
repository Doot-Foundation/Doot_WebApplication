import { Cache } from "o1js";

const cacheFiles = [
  { name: "step-vk-doot-getprice", type: "string" },
  { name: "step-vk-doot-initbase", type: "string" },
  { name: "step-vk-doot-settle", type: "string" },
  { name: "step-vk-doot-update", type: "string" },
  { name: "step-vk-doot-verify", type: "string" },
  { name: "wrap-vk-doot", type: "string" },
];

import fs from "fs";
import path from "path";

function getHeaderData(filename: string) {
  const filePath = path.join(
    process.cwd(),
    "utils",
    "constants",
    "cache",
    `${filename}.header`
  );
  return fs.readFileSync(filePath, "utf8");
}

function getFileData(filename: string) {
  const filePath = path.join(
    process.cwd(),
    "utils",
    "constants",
    "cache",
    filename
  );
  return fs.readFileSync(filePath, "utf8");
}

export async function fetchFiles(): Promise<any> {
  return Promise.all(
    cacheFiles.map(async (file: any) => {
      const header = getHeaderData(file.name);
      const data = getFileData(file.name);

      return { file, header, data };
    })
  ).then((cacheList) =>
    cacheList.reduce((acc: any, { file, header, data }) => {
      acc[file.name] = { file, header, data };

      return acc;
    }, {})
  );
}

export const DootFileSystem = (files: any): Cache => ({
  read({ persistentId, uniqueId, dataType }: any) {
    // read current uniqueId, return data if it matches
    if (!files[persistentId]) {
      return undefined;
    }

    const currentId = files[persistentId].header;
    if (currentId !== uniqueId) {
      return undefined;
    }

    if (dataType === "string") {
      return new TextEncoder().encode(files[persistentId].data);
    }

    return undefined;
  },
  write({ persistentId, uniqueId, dataType }: any, data: any) {},
  canWrite: true,
});
