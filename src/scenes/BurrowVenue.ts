import { FOOT, INCH } from "src/util/Units";
import * as Three from "three";
import { Vector3 } from "three";

import { boxHelper } from "./SceneUtils";

const EXTRA_OBJECT_MATERIAL_GREEN = () => {
  return new Three.MeshBasicMaterial({
    color: 0x000100,
    transparent: true,
    // opacity: 0.2,
    side: Three.DoubleSide
  });
};

// table (https://www.target.com/p/6-folding-banquet-table-off-white-plastic-dev-group/-/A-14324329)
function banquetTable(attrs: {
  translateBy: Vector3;
  riserHeight?: number;
  rotateY?: number;
}) {
  const tableWidth = 6 * FOOT;
  const tableDepth = 30 * INCH;
  const tableThickness = 2 * INCH;
  const legHeight = 27.25 * INCH;
  const legInset = 6 * INCH;

  const object = new Three.Object3D();
  object.add(
    boxHelper({
      width: tableWidth,
      height: tableThickness,
      depth: tableDepth,
      translateBy: new Vector3(0, legHeight, 0)
    })()
  );

  const { riserHeight } = attrs;

  const leg = boxHelper({
    width: 1 * INCH,
    height: legHeight,
    depth: 1 * INCH
  })();
  [
    [-1, -1],
    [-1, 1],
    [1, 1],
    [1, -1]
  ].forEach(([x, z]) => {
    const thisLeg = leg.clone();
    const legX = x * (tableWidth * 0.5 - legInset);
    const legZ = z * (tableDepth * 0.5 - legInset);
    thisLeg.position.copy(new Vector3(legX, 0, legZ));
    object.add(thisLeg);

    if (riserHeight) {
      const riser = boxHelper({
        width: 6 * INCH,
        depth: 6 * INCH,
        height: riserHeight,
        translateBy: new Vector3(legX, -1 * riserHeight, legZ)
      })();
      object.add(riser);
    }
  });

  if (attrs.rotateY) {
    object.rotateY(attrs.rotateY);
  }

  if (riserHeight) {
    object.children.forEach(c => c.translateY(riserHeight));
  }

  object.position.add(attrs.translateBy);

  return object;
}

// center is middle of front row of tables
function djTables(attrs: { translateBy: Vector3 }) {
  const scene = new Three.Object3D();

  scene.add(
    banquetTable({
      translateBy: new Vector3(-3.05 * FOOT, 0, 0)
    })
  );

  scene.add(
    banquetTable({
      translateBy: new Vector3(3.05 * FOOT, 0, 0)
    })
  );

  scene.add(
    banquetTable({
      riserHeight: 6 * INCH,
      translateBy: new Vector3(-3.05 * FOOT, 0, 0.7)
    })
  );

  scene.add(
    banquetTable({
      riserHeight: 6 * INCH,
      translateBy: new Vector3(3.05 * FOOT, 0, 0.7)
    })
  );

  scene.add(
    banquetTable({
      rotateY: Math.PI / 2,
      riserHeight: 6 * INCH,
      translateBy: new Vector3(7.45 * FOOT, 0, 1.25)
    })
  );

  scene.add(
    banquetTable({
      rotateY: Math.PI / 2,
      riserHeight: 3 * INCH,
      translateBy: new Vector3(-7.45 * FOOT, 0, 1.25)
    })
  );

  scene.position.add(attrs.translateBy);

  return scene;
}

export function createBurrowVenue(attrs: {
  keyboardInFront: boolean;
  hideKeyboard?: boolean;
}) {
  const tablesTranslateZ = attrs.keyboardInFront ? 1.5 : -1;
  const keyboardTranslateZ =
    tablesTranslateZ + (attrs.keyboardInFront ? -1.5 : 1.35);
  const shoulderHeight = 57 * INCH;

  return {
    model: attrs.hideKeyboard
      ? undefined
      : {
          url: "./keyboard.gltf",
          scale: new Vector3(0.1, 0.1, 0.12),
          translateBy: new Vector3(0, 0, keyboardTranslateZ)
        },
    extraObjects: [
      // piano size
      // boxHelper({
      //   width: 1.336,
      //   height: 0.145,
      //   depth: 0.376,
      //   translateBy: new Vector3(0, 0.63, 0)
      // })
      () => djTables({ translateBy: new Vector3(0, 0, tablesTranslateZ) }),
      boxHelper({
        width: 20 * INCH,
        height: shoulderHeight,
        depth: 10 * INCH,
        translateBy: new Vector3(0, 0, keyboardTranslateZ + 0.5),
        material: EXTRA_OBJECT_MATERIAL_GREEN()
      }),
      boxHelper({
        width: 10 * INCH,
        height: 12 * INCH,
        depth: 10 * INCH,
        translateBy: new Vector3(
          0,
          shoulderHeight + 1 * INCH,
          keyboardTranslateZ + 0.5
        ),
        material: EXTRA_OBJECT_MATERIAL_GREEN()
      })
    ]
  };
}
