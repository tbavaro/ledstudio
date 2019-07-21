import * as fs from "fs";
import * as handlebars from "handlebars";

const VISUALIZATION_ROOT = "src/portable/visualizations";
const INCLUDE_ROOT = "../portable/visualizations";
const TEMPLATE_FILE = "codegen/Visualizations.ts.template";
const OUTPUT_FILE = "src/generated/Visualizations.ts";

function crawl(root: string, relPath: string, visitor: (relPath: string, name: string) => void) {
  fs.readdirSync(`${root}/${relPath}`, { withFileTypes: true }).forEach(entry => {
    if (entry.isFile() && entry.name.match(/^.*\.ts$/)) {
      visitor(relPath, entry.name);
    } else if (entry.isDirectory()) {
      crawl(root, `${relPath}${entry.name}/`, visitor);
    }
  });
}

interface IncludeEntry {
  variableName: string;
  includePath: string;
}
const includeEntries: IncludeEntry[] = [];

interface AddToRegistryEntry {
  groupName: string;
  visualizationName: string;
  variableName: string;
}
const addToRegistryEntries: AddToRegistryEntry[] = [];

crawl(VISUALIZATION_ROOT, "", (relPath: string, fileName: string) => {
  const fileNameWithoutExtension = fileName.replace(/\.ts$/, "");
  const includePath = `${INCLUDE_ROOT}/${relPath}${fileNameWithoutExtension}`;
  const groupName = relPath.replace(/\/$/, "") || "<root>";
  const visualizationName = fileNameWithoutExtension.replace(/Visualization$/i, "");
  const variableName = fileNameWithoutExtension;

  includeEntries.push({
    variableName,
    includePath
  });

  addToRegistryEntries.push({
    groupName,
    visualizationName,
    variableName
  });

  // console.log(JSON.stringify({
  //   groupName,
  //   name: visualizationName,
  //   includePath
  // }, null, 2));
});

function sortWithTransform<T>(arr: T[], func: (value: T) => string): T[] {
  arr.sort((a, b) => {
    const av = func(a);
    const bv = func(b);
    if (av < bv) {
      return -1;
    } else if (av > bv) {
      return 1;
    } else {
      return 0;
    }
  });
  return arr;
}

sortWithTransform(includeEntries, e => e.includePath.toLowerCase());
sortWithTransform(addToRegistryEntries, e => `${e.groupName}\t${e.visualizationName}`);

const data = {
  includeEntries,
  addToRegistryEntries
};

const template = handlebars.compile(fs.readFileSync(TEMPLATE_FILE, { encoding: "utf8" }));
const generatedCode = template(data);

fs.writeFileSync(OUTPUT_FILE, generatedCode, { encoding: "utf8" });
