export interface LedInfo {
  position: { x: number, y: number, z: number };
  hardwareChannel: number;
  hardwareIndex: number;
  
  // "intended" row, even if not physically arranged in even rows
  rowHint: number;
}

export default LedInfo;
