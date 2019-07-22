import ColorRow from "../base/ColorRow";
import FixedArray from "../base/FixedArray";
import LedMetadata from "../base/LedMetadata";

interface LedMetadataAndIndex {
  metadata: LedMetadata;
  index: number;
}

export default class RowColumnLedMapper {
  public readonly ledRows: FixedArray<ColorRow>;
  private readonly originalIndices: number[][];
  private readonly originalLedColors: ColorRow;

  constructor(ledMetadatas: LedMetadata[], ledColors: ColorRow) {
    if (ledMetadatas.length !== ledColors.length) {
      throw new Error("ledMetadatas isn't the same length as ledColors");
    }

    if (ledMetadatas.length === 0) {
      throw new Error("must have at least one LED");
    }

    // create `groupedByRowRaw` which might not start at 0 and might have gaps
    const groupedByRowRaw: LedMetadataAndIndex[][] = [];
    let minRow = ledMetadatas[0].rowHint;
    let maxRow = ledMetadatas[0].rowHint;
    ledMetadatas.forEach((metadata, index) => {
      const lmai: LedMetadataAndIndex = { metadata, index };
      const row = metadata.rowHint;
      if (row < minRow) {
        minRow = row;
      }
      if (row > maxRow) {
        maxRow = row;
      }
      let lmais: LedMetadataAndIndex[] | undefined = groupedByRowRaw[row];
      if (lmais === undefined) {
        lmais = [];
        groupedByRowRaw[row] = lmais;
      }
      lmais.push(lmai);
    });

    // migrate to `groupedByRowClean` which starts at 0 and has at least an empty array for every row
    const numRows = (maxRow - minRow + 1);
    const groupedByRowClean: LedMetadataAndIndex[][] = new Array(numRows);
    for (let i = 0; i < numRows; ++i) {
      const row = minRow + i;
      groupedByRowClean[i] = groupedByRowRaw[row] || [];
    }

    // sort every row in order of ascending x position
    groupedByRowClean.forEach(lmaisForRow => {
      lmaisForRow.sort((a, b) => a.metadata.position.x - b.metadata.position.x);
    });

    this.originalIndices = groupedByRowClean.map(lmaisForRow => {
      return lmaisForRow.map(lmai => lmai.index);
    });

    this.ledRows = new FixedArray(this.originalIndices.length, i => new ColorRow(this.originalIndices[i].length));

    this.originalLedColors = ledColors;
  }

  public finishFrame() {
    this.ledRows.forEach((ledRow, rowNum) => {
      const rowOriginalIndices = this.originalIndices[rowNum];
      ledRow.forEach((color, i) => {
        const originalIndex = rowOriginalIndices[i];
        this.originalLedColors.set(originalIndex, color);
      });
    });
  }
}
