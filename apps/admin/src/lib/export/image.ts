import { toPng } from 'html-to-image';

export async function captureElementPng(
  element: HTMLElement,
  options?: { pixelRatio?: number; backgroundColor?: string },
): Promise<string> {
  return toPng(element, {
    cacheBust: true,
    pixelRatio: options?.pixelRatio ?? 2,
    backgroundColor: options?.backgroundColor ?? '#ffffff',
    filter: (node) => {
      if (!(node instanceof HTMLElement)) return true;
      if (node.dataset.exportIgnore != null) return false;
      // Leaflet zoom/attribution chrome — keep the map tiles/markers only
      if (node.classList.contains('leaflet-control-container')) return false;
      return true;
    },
  });
}
