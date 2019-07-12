import palette from "google-palette";
import * as Colors from "../../base/Colors";

let schemeIdx = 0;

export function randomPalette(size: number) {
    if (size > 8) {
        throw new Error("only get random palette's of size 8 or less");
    }
    const schemes = [
        "cb-Accent",
        "cb-Blues",
        "cb-BrBG",
        "cb-BuGn",
        "cb-Dark2",
        "cb-GnBu",
        "cb-Greens",
        "cb-OrRd",
        "cb-PRGn",
        "cb-PuBuGn",
        "cb-PuOr",
        "cb-PuRd",
        "cb-RdBu",
        "cb-RdYlGn",
        "cb-Reds",
        "cb-YlGnBu",
        "cb-YlOrRd",
        "mpn65",
        "rainbow",
        "sol-accent",
        "tol-dv",
        "tol-rainbow",
    ];
    const scheme = schemes[schemeIdx];
    schemeIdx = (schemeIdx + 1) % schemes.length;
    return (palette(scheme, size) as string[]).map(Colors.hex2Color);
}

