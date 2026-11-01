export function node(tag, text, cls) {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
}
export function button(parent, text, fn, cls) {
  const b = node("button", text, cls);
  b.type = "button";
  b.onclick = fn;
  parent.append(b);
  return b;
}
export function fossilImage(kind) {
  const image = node("img");
  image.src = "./assets/fossil-" + kind + ".svg";
  image.alt = "";
  image.draggable = false;
  return image;
}
export function installDrag(root, ctx, onSelect, onDrop) {
  let drag = null,
    ghost = null;
  const clear = () => {
    ghost?.remove();
    ghost = null;
    drag = null;
  };
  ctx.listen(root, "pointerdown", (e) => {
    const source = e.target.closest("[data-drag]");
    if (!source || ctx.paused || e.button > 0) return;
    e.preventDefault();
    root.setPointerCapture(e.pointerId);
    drag = {
      id: source.dataset.drag,
      x: e.clientX,
      y: e.clientY,
      pointer: e.pointerId,
      moved: false,
      source,
    };
  });
  ctx.listen(root, "pointermove", (e) => {
    if (!drag || drag.pointer !== e.pointerId) return;
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8)
      drag.moved = true;
    if (drag.moved && e.clientY > innerHeight - 50) window.scrollBy(0, 14);
    else if (drag.moved && e.clientY < 70) window.scrollBy(0, -14);
    if (drag.moved && !ghost) {
      ghost = drag.source.cloneNode(true);
      ghost.className = "edu-drag-ghost";
      ghost.removeAttribute("id");
      ghost.setAttribute("aria-hidden", "true");
      document.body.append(ghost);
    }
    if (ghost) {
      ghost.style.left = e.clientX + "px";
      ghost.style.top = e.clientY + "px";
    }
  });
  ctx.listen(root, "pointerup", (e) => {
    if (!drag || drag.pointer !== e.pointerId) return;
    const current = drag;
    ghost?.remove();
    ghost = null;
    drag = null;
    if (ctx.paused) return;
    const target = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest("[data-drop]");
    if (current.moved && target && root.contains(target))
      onDrop(current.id, target.dataset.drop);
    else if (!current.moved) onSelect(current.id);
  });
  ctx.listen(root, "pointercancel", clear);
  ctx.listen(ctx.play, "game:pausechange", clear);
  ctx.onCleanup(clear);
}
export function focusKey(n, key) {
  n.dataset.focus = key;
  return n;
}
export function preserveFocus(root, paint) {
  const current = root.contains(document.activeElement)
    ? document.activeElement.dataset.focus
    : null;
  paint();
  if (current) {
    const element = [...root.querySelectorAll("[data-focus]")].find(
      (n) => n.dataset.focus === current && !n.disabled,
    );
    (element || root.querySelector("button:not(:disabled)"))?.focus({
      preventScroll: true,
    });
  }
}
