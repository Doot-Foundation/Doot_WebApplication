import { Cache } from "o1js";

const cacheFiles = [
  { name: "srs-fp-65536", type: "string" },
  { name: "srs-fq-32768", type: "string" },
  { name: "step-pk-doot-init", type: "string" },
  { name: "step-pk-doot-initbase", type: "string" },
  { name: "step-pk-doot-updatebase", type: "string" },
  { name: "step-pk-doot-updateindividual", type: "string" },
  { name: "step-pk-doot-verify", type: "string" },
  { name: "step-vk-doot-init", type: "string" },
  { name: "step-vk-doot-initbase", type: "string" },
  { name: "step-vk-doot-updatebase", type: "string" },
  { name: "step-vk-doot-updateindividual", type: "string" },
  { name: "step-vk-doot-verify", type: "string" },
  { name: "wrap-pk-doot", type: "string" },
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
      console.log("read");
      console.log({ persistentId, uniqueId, dataType });
      return undefined;
    }

    const currentId = files[persistentId].header;
    if (currentId !== uniqueId) {
      console.log("current id did not match persistent id");
      return undefined;
    }

    if (dataType === "string") {
      console.log("found in cache", { persistentId, uniqueId, dataType });
      return new TextEncoder().encode(files[persistentId].data);
    }

    return undefined;
  },
  write({ persistentId, uniqueId, dataType }: any, data: any) {
    console.log("write");
    console.log({ persistentId, uniqueId, dataType });
  },
  canWrite: true,
});
