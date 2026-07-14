/*
 * Local DOM-to-canvas proxy for the navigation glass capture. It paints only
 * branches intersecting the small capture rect, keeping scroll updates much
 * cheaper than rasterizing the complete page.
 */

const EXCLUDED_DOM_ANCESTORS = [
  ".site-nav-shell",
  ".viewport-frame-glass-regions",
  "script",
  "style",
].join(",");

export function isDomTextCaptureMutation(mutation: MutationRecord) {
  const target =
    mutation.target.nodeType === Node.TEXT_NODE
      ? mutation.target.parentElement
      : mutation.target instanceof Element
        ? mutation.target
        : null;
  return Boolean(target && !target.closest(EXCLUDED_DOM_ANCESTORS));
}

function intersects(a: DOMRectReadOnly, b: DOMRectReadOnly) {
  return (
    a.right > b.left &&
    a.left < b.right &&
    a.bottom > b.top &&
    a.top < b.bottom
  );
}

export function getCanvasFont(
  style: Pick<
    CSSStyleDeclaration,
    "fontStyle" | "fontWeight" | "fontSize" | "fontFamily"
  >,
) {
  const fontStyle = style.fontStyle || "normal";
  const fontWeight = style.fontWeight || "400";
  const fontSize = style.fontSize || "10px";
  const fontFamily = style.fontFamily || "sans-serif";

  // Keep the shorthand conservative. Safari rejects some computed
  // font-stretch/font-variant combinations and silently keeps Canvas' default
  // 10px sans-serif, making every captured DOM node appear the same size.
  return `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`;
}

export function getLineBaseline(
  rect: Pick<DOMRectReadOnly, "top" | "height">,
  captureTop: number,
  ascent: number,
  descent: number,
) {
  const fontHeight = ascent + descent;
  const lineLeading = (rect.height - fontHeight) * 0.5;
  return rect.top - captureTop + lineLeading + ascent;
}

function transformCharacter(character: string, transform: string) {
  if (transform === "uppercase") return character.toLocaleUpperCase();
  if (transform === "lowercase") return character.toLocaleLowerCase();
  return character;
}

interface SvgCacheEntry {
  key: string;
  image: HTMLImageElement;
  ready: boolean;
}

interface PaintState {
  ctx: CanvasRenderingContext2D;
  captureRect: DOMRectReadOnly;
  range: Range;
  onAssetReady?: () => void;
  glyphCount: number;
}

const svgImageCache = new WeakMap<SVGSVGElement, SvgCacheEntry>();

export function toCanvasColor(value: string) {
  const srgb = value.trim().match(
    /^color\(srgb\s+(-?\d*\.?\d+)\s+(-?\d*\.?\d+)\s+(-?\d*\.?\d+)(?:\s*\/\s*(-?\d*\.?\d+))?\)$/i,
  );
  if (!srgb) return value;
  const channel = (input: string) =>
    Math.round(Math.max(0, Math.min(1, Number.parseFloat(input))) * 255);
  const alpha = Math.max(
    0,
    Math.min(1, Number.parseFloat(srgb[4] ?? "1")),
  );
  return `rgba(${channel(srgb[1])}, ${channel(srgb[2])}, ${channel(
    srgb[3],
  )}, ${alpha})`;
}

function pixelValue(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function beginRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  style: CSSStyleDeclaration,
  inset = 0,
) {
  const maxRadius = Math.max(0, Math.min(width, height) * 0.5 - inset);
  const radii = [
    style.borderTopLeftRadius,
    style.borderTopRightRadius,
    style.borderBottomRightRadius,
    style.borderBottomLeftRadius,
  ].map((value) => Math.min(maxRadius, pixelValue(value)));
  ctx.beginPath();
  ctx.roundRect(
    x + inset,
    y + inset,
    Math.max(0, width - inset * 2),
    Math.max(0, height - inset * 2),
    radii,
  );
}

function paintElementBox(
  ctx: CanvasRenderingContext2D,
  rect: DOMRectReadOnly,
  captureRect: DOMRectReadOnly,
  style: CSSStyleDeclaration,
) {
  const x = rect.left - captureRect.left;
  const y = rect.top - captureRect.top;

  if (style.backgroundColor !== "transparent") {
    beginRoundedRect(ctx, x, y, rect.width, rect.height, style);
    ctx.fillStyle = toCanvasColor(style.backgroundColor);
    ctx.fill();
  }

  const borderWidth = Math.max(
    pixelValue(style.borderTopWidth),
    pixelValue(style.borderRightWidth),
    pixelValue(style.borderBottomWidth),
    pixelValue(style.borderLeftWidth),
  );
  if (borderWidth > 0 && style.borderTopStyle !== "none") {
    beginRoundedRect(
      ctx,
      x,
      y,
      rect.width,
      rect.height,
      style,
      borderWidth * 0.5,
    );
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = toCanvasColor(style.borderTopColor);
    ctx.stroke();
  }
}

function paintGlassButtonOutline(
  ctx: CanvasRenderingContext2D,
  rect: DOMRectReadOnly,
  captureRect: DOMRectReadOnly,
  style: CSSStyleDeclaration,
) {
  const x = rect.left - captureRect.left;
  const y = rect.top - captureRect.top;
  const borderWidth = Math.max(0.5, pixelValue(style.borderTopWidth));

  beginRoundedRect(
    ctx,
    x,
    y,
    rect.width,
    rect.height,
    style,
    borderWidth * 0.5,
  );
  ctx.lineWidth = borderWidth;
  ctx.strokeStyle = toCanvasColor(style.borderTopColor);
  ctx.stroke();

  ctx.save();
  ctx.globalAlpha *= 0.28;
  beginRoundedRect(ctx, x, y, rect.width, rect.height, style, 1);
  ctx.lineWidth = 0.75;
  ctx.strokeStyle = toCanvasColor(style.color);
  ctx.stroke();
  ctx.restore();
}

function clipToElement(
  ctx: CanvasRenderingContext2D,
  rect: DOMRectReadOnly,
  captureRect: DOMRectReadOnly,
  style: CSSStyleDeclaration,
) {
  beginRoundedRect(
    ctx,
    rect.left - captureRect.left,
    rect.top - captureRect.top,
    rect.width,
    rect.height,
    style,
  );
  ctx.clip();
}

function drawFittedMedia(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  rect: DOMRectReadOnly,
  captureRect: DOMRectReadOnly,
  style: CSSStyleDeclaration,
) {
  if (sourceWidth <= 0 || sourceHeight <= 0) return;
  const x = rect.left - captureRect.left;
  const y = rect.top - captureRect.top;
  let drawWidth = rect.width;
  let drawHeight = rect.height;
  let drawX = x;
  let drawY = y;

  if (style.objectFit === "contain" || style.objectFit === "cover") {
    const scale =
      style.objectFit === "cover"
        ? Math.max(rect.width / sourceWidth, rect.height / sourceHeight)
        : Math.min(rect.width / sourceWidth, rect.height / sourceHeight);
    drawWidth = sourceWidth * scale;
    drawHeight = sourceHeight * scale;
    drawX += (rect.width - drawWidth) * 0.5;
    drawY += (rect.height - drawHeight) * 0.5;
  }

  ctx.save();
  clipToElement(ctx, rect, captureRect, style);
  try {
    ctx.drawImage(source, drawX, drawY, drawWidth, drawHeight);
  } catch {
    // Media can become unavailable between layout and paint.
  }
  ctx.restore();
}

function isSafeImageSource(source: string) {
  if (!source) return false;
  try {
    const url = new URL(source, window.location.href);
    return (
      url.origin === window.location.origin ||
      url.protocol === "data:" ||
      url.protocol === "blob:"
    );
  } catch {
    return false;
  }
}

function paintSvgElement(
  element: SVGSVGElement,
  rect: DOMRectReadOnly,
  style: CSSStyleDeclaration,
  state: PaintState,
) {
  const key = `${style.color}|${element.outerHTML}`;
  let entry = svgImageCache.get(element);

  if (!entry || entry.key !== key) {
    const clone = element.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(rect.width));
    clone.setAttribute("height", String(rect.height));
    clone.style.color = style.color;
    clone.style.opacity = "1";
    const image = new Image();
    entry = { key, image, ready: false };
    svgImageCache.set(element, entry);
    image.onload = () => {
      const current = svgImageCache.get(element);
      if (!current || current.image !== image) return;
      current.ready = true;
      state.onAssetReady?.();
    };
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      new XMLSerializer().serializeToString(clone),
    )}`;
  }

  if (!entry.ready) return;
  drawFittedMedia(
    state.ctx,
    entry.image,
    rect.width,
    rect.height,
    rect,
    state.captureRect,
    style,
  );
}

function paintReplacedElement(
  element: Element,
  rect: DOMRectReadOnly,
  style: CSSStyleDeclaration,
  state: PaintState,
) {
  if (element instanceof HTMLImageElement) {
    if (
      element.complete &&
      element.naturalWidth > 0 &&
      isSafeImageSource(element.currentSrc || element.src)
    ) {
      drawFittedMedia(
        state.ctx,
        element,
        element.naturalWidth,
        element.naturalHeight,
        rect,
        state.captureRect,
        style,
      );
    }
    return true;
  }

  if (element instanceof HTMLCanvasElement) {
    drawFittedMedia(
      state.ctx,
      element,
      element.width,
      element.height,
      rect,
      state.captureRect,
      style,
    );
    return true;
  }

  if (element instanceof HTMLVideoElement) {
    if (element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      drawFittedMedia(
        state.ctx,
        element,
        element.videoWidth,
        element.videoHeight,
        rect,
        state.captureRect,
        style,
      );
    }
    return true;
  }

  if (element instanceof SVGSVGElement) {
    paintSvgElement(element, rect, style, state);
    return true;
  }

  return false;
}

function paintTextNode(
  node: Text,
  style: CSSStyleDeclaration,
  opacity: number,
  state: PaintState,
) {
  const text = node.textContent ?? "";
  if (!text.trim()) return;

  state.range.selectNodeContents(node);
  const lineRects = Array.from(state.range.getClientRects());
  if (!lineRects.some((rect) => intersects(rect, state.captureRect))) return;

  const { ctx } = state;
  ctx.save();
  ctx.font = getCanvasFont(style);
  ctx.fillStyle = toCanvasColor(style.color);
  ctx.globalAlpha = opacity;
  const fontSize = Number.parseFloat(style.fontSize) || 10;
  const lineMetrics = ctx.measureText("Mg");
  const lineAscent =
    lineMetrics.fontBoundingBoxAscent ||
    lineMetrics.actualBoundingBoxAscent ||
    fontSize * 0.8;
  const lineDescent =
    lineMetrics.fontBoundingBoxDescent ||
    lineMetrics.actualBoundingBoxDescent ||
    fontSize * 0.2;

  for (let index = 0; index < text.length; index += 1) {
    const originalCharacter = text[index];
    if (!originalCharacter || /[\r\n\t]/.test(originalCharacter)) continue;

    state.range.setStart(node, index);
    state.range.setEnd(node, index + 1);
    const rect = state.range.getClientRects()[0];
    if (!rect || !intersects(rect, state.captureRect)) continue;

    const character = transformCharacter(
      originalCharacter,
      style.textTransform,
    );
    if (!character.trim()) continue;

    ctx.fillText(
      character,
      rect.left - state.captureRect.left,
      getLineBaseline(
        rect,
        state.captureRect.top,
        lineAscent,
        lineDescent,
      ),
    );
    state.glyphCount += 1;
  }
  ctx.restore();
}

function paintElementTree(
  element: Element,
  inheritedOpacity: number,
  state: PaintState,
  root: HTMLElement,
) {
  if (element !== root && element.closest(EXCLUDED_DOM_ANCESTORS)) return;

  const style = getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") return;
  const localOpacity = Number.parseFloat(style.opacity);
  const opacity = inheritedOpacity *
    (Number.isFinite(localOpacity) ? localOpacity : 1);
  if (opacity <= 0.001) return;

  const rect = element.getBoundingClientRect();
  const hasBox = rect.width > 0 && rect.height > 0;
  if (hasBox && !intersects(rect, state.captureRect)) return;

  if (hasBox) {
    state.ctx.save();
    state.ctx.globalAlpha = opacity;
    if (element instanceof HTMLElement) {
      paintElementBox(state.ctx, rect, state.captureRect, style);
    }
    const replaced = paintReplacedElement(element, rect, style, state);
    state.ctx.restore();
    if (replaced) return;
  }

  for (const child of element.childNodes) {
    if (child instanceof Text) {
      paintTextNode(child, style, opacity, state);
    } else if (child instanceof Element) {
      paintElementTree(child, opacity, state, root);
    }
  }

  if (
    hasBox &&
    element instanceof HTMLElement &&
    element.matches(".glass-button-surface")
  ) {
    state.ctx.save();
    state.ctx.globalAlpha = opacity;
    paintGlassButtonOutline(
      state.ctx,
      rect,
      state.captureRect,
      style,
    );
    state.ctx.restore();
  }
}

export function paintDomLayer(
  target: HTMLCanvasElement,
  captureRect: DOMRectReadOnly,
  dpr: number,
  onAssetReady?: () => void,
) {
  const width = Math.max(1, Math.round(captureRect.width * dpr));
  const height = Math.max(1, Math.round(captureRect.height * dpr));
  if (target.width !== width) target.width = width;
  if (target.height !== height) target.height = height;

  const ctx = target.getContext("2d", { alpha: true });
  if (!ctx) return 0;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const root = document.querySelector<HTMLElement>(".site-content-layer");
  if (!root) return 0;
  const range = document.createRange();
  const state: PaintState = {
    ctx,
    captureRect,
    range,
    onAssetReady,
    glyphCount: 0,
  };
  paintElementTree(root, 1, state, root);
  range.detach();
  ctx.globalAlpha = 1;
  return state.glyphCount;
}
