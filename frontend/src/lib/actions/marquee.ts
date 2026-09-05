/**
 * Marquee auto-scroll action. When text overflows its container and the user
 * hovers, the text scrolls horizontally to reveal the full content.
 * On mouse leave, it scrolls back to the start.
 *
 * Usage: <span use:marquee>{longText}</span>
 *
 * Note: the element should NOT have `truncate` (overflow:hidden + ellipsis),
 * because that masks the true content width from scrollWidth. Instead, this
 * action takes over the overflow handling and uses a measuring clone.
 */
export function marquee(node: HTMLElement) {
  let startDelay = 0;
  let currentAnim: Animation | null = null;

  // Compute the full natural width of the content by cloning it into a
  // hidden measuring element. This works even when the host has overflow:hidden
  // (which would otherwise mask scrollWidth).
  function measureOverflow(): { overflows: boolean; distance: number } {
    const clone = node.cloneNode(false) as HTMLElement;
    // Strip any width constraints so the clone expands to its full text width
    clone.style.position = 'absolute';
    clone.style.visibility = 'hidden';
    clone.style.overflow = 'visible';
    clone.style.width = 'auto';
    clone.style.maxWidth = 'none';
    clone.style.whiteSpace = 'nowrap';
    clone.style.left = '-9999px';

    while (node.firstChild) clone.appendChild(node.firstChild.cloneNode(true));

    document.body.appendChild(clone);
    const fullWidth = clone.scrollWidth;
    document.body.removeChild(clone);

    const containerWidth = node.clientWidth;
    const distance = fullWidth - containerWidth;
    return { overflows: distance > 0, distance };
  }

  function startScroll() {
    const { overflows, distance } = measureOverflow();
    if (!overflows || currentAnim) return;

    const speed = 30; // px per second
    const duration = (distance / speed) * 1000;

    currentAnim = node.animate(
      [{ transform: 'translateX(0)' }, { transform: `translateX(-${distance}px)` }],
      { duration, fill: 'forwards', easing: 'linear' },
    );
  }

  function stopScroll() {
    if (currentAnim) {
      currentAnim.cancel();
      currentAnim = null;
    }
    node.animate(
      [{ transform: `translateX(-${node.scrollLeft}px)` }, { transform: 'translateX(0)' }],
      { duration: 200, fill: 'forwards', easing: 'ease-out' },
    );
  }

  // Take over overflow handling
  node.style.overflow = 'hidden';
  node.style.textOverflow = 'clip';
  node.style.whiteSpace = 'nowrap';

  node.addEventListener('mouseenter', () => {
    startDelay = setTimeout(startScroll, 800) as unknown as number;
  });
  node.addEventListener('mouseleave', () => {
    clearTimeout(startDelay);
    stopScroll();
  });

  return {
    destroy() {
      clearTimeout(startDelay);
      if (currentAnim) {
        currentAnim.cancel();
        currentAnim = null;
      }
    },
  };
}
