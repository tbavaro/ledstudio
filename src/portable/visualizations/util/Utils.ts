import palette from "google-palette";
import * as Colors from "../../base/Colors";

export function randomPalette(size: number) {
    if (size > 8) {
        throw new Error("only get random palette's of size 8 or less");
    }
    const schemes = palette.listSchemes("all");
    const scheme = schemes[Math.floor(Math.random() * schemes.length)];
    return (scheme(size) as string[]).map(Colors.hex2Color);
}

