export const ICON_SIZES: readonly number[];
export const ICON_SVG: string;
export function encodePng(width: number, height: number, rgba: Buffer): Buffer;
export function iconPixels(size: number, svg?: string): Buffer;
export function iconPng(size: number, svg?: string): Buffer;
