import palette from "google-palette";
import * as Colors from "../base/Colors";

let schemeIdx = 0;

export function randomPalette(size: number) {
    if (size > 8) {
        throw new Error("only get random palette's of size 8 or less");
    }
    const schemes = [
        "cb-Accent",
        "cb-Blues",
        "cb-BrBG",
        "mpn65",
        "cb-BuGn",
        "cb-Dark2",
        "cb-GnBu",
        "rainbow",
        "cb-Greens",
        "cb-OrRd",
        "sol-accent",
        "cb-PRGn",
        "cb-PuBuGn",
        "tol-dv",
        "cb-PuOr",
        "cb-PuRd",
        "cb-RdBu",
        "tol-rainbow",
        "cb-RdYlGn",
        "cb-Reds",
        "cb-YlGnBu",
        "cb-YlOrRd",
    ];
    const scheme = schemes[schemeIdx];
    console.log(scheme);
    schemeIdx = (schemeIdx + 1) % schemes.length;
    return (palette(scheme, size) as string[]).map(Colors.hex2Color);
}

