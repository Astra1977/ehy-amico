export function createGameSession({
  play,
  store,
  id,
  stage,
  info,
  onReward,
  onSave = () => {},
  restart = false,
}) {
  const controller = new AbortController();
  const cleaners = [];
  let disposed = false,
    paused = false,
    last = 0,
    frame;
  const ctx = {
    play,
    stage,
    restart,
    difficulty: store.data.settings.difficulty,
    soundEnabled: store.data.settings.sound,
    onCleanup(fn) {
      cleaners.push(fn);
    },
    readAdventure(requestedStage = stage) {
      if (!Number.isInteger(requestedStage) || requestedStage < 1 || requestedStage > 5) return null;
      const data = store.data.adventures?.[id]?.[requestedStage];
      return data ? JSON.parse(JSON.stringify(data)) : null;
    },
    saveAdventure(value) {
      const result = store.saveAdventure(id, stage, value);
      onSave();
      return result;
    },
    tip: null,
    get paused() {
      return paused;
    },
    setPaused(value) {
      paused = value;
      last = 0;
      play.dispatchEvent(new Event("game:pausechange"));
    },
    info,
    listen(target, event, fn) {
      target.addEventListener(event, fn, { signal: controller.signal });
    },
    best(key, value) {
      const g = store.data.games[id];
      if (Number.isFinite(value) && value > g.best) {
        g.best = value;
        store.save();
      }
    },
    score() {
      return store.data.games[id].best;
    },
    complete(level) {
      if (level <= store.data.games[id].completed) return;
      const before = store.data.games[id].completed;
      if (
        store.complete(id, level, store.data.games[id].best) &&
        store.data.games[id].completed > before
      )
        onReward(level);
    },
    frames(fn) {
      const tick = (now) => {
        if (disposed) return;
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
        last = now;
        if (!paused && !document.hidden) fn(dt);
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      controller.abort();
      cleaners.reverse().forEach((fn) => fn());
    },
  };
  ctx.listen(window, "blur", () => ctx.setPaused(true));
  ctx.listen(document, "visibilitychange", () => {
    if (document.hidden) ctx.setPaused(true);
  });
  return ctx;
}
