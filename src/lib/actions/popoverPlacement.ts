export function clampToViewport(node: HTMLElement, margin: number = 8) {
  function place() {
    const anchor = node.offsetParent as HTMLElement | null;
    if (!anchor) return;

    const left = anchor.getBoundingClientRect().left + node.offsetLeft;
    const width = node.offsetWidth;
    const viewport = document.documentElement.clientWidth;

    let shift = 0;
    if (left + width > viewport - margin) shift = viewport - margin - (left + width);
    if (left + shift < margin) shift = margin - left;

    node.style.translate = shift ? `${Math.round(shift)}px` : '';
  }

  place();
  window.addEventListener('resize', place);

  return {
    destroy() {
      window.removeEventListener('resize', place);
    }
  };
}
