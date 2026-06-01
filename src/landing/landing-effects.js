import { terminalLines } from "./landing-data";
import { setupMonolithCanvas } from "./monolith-canvas";

export function setupLandingEffects({ root, cursor, ring, panel, canvas, terminal }) {
  const cleanups = [
    setupCursor(root, cursor, ring),
    setupReveal(root),
    setupMonolithCanvas(panel, canvas),
    setupTerminal(terminal),
  ];

  return () => {
    cleanups
      .slice()
      .reverse()
      .forEach((cleanup) => cleanup?.());
  };
}

function setupCursor(root, cursor, ring) {
  if (!root || !cursor || !ring || window.matchMedia("(pointer: coarse)").matches) {
    return () => {};
  }

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  let frameId = 0;
  let active = true;

  cursor.style.left = `${mouseX}px`;
  cursor.style.top = `${mouseY}px`;
  ring.style.left = `${ringX}px`;
  ring.style.top = `${ringY}px`;

  const handleMove = (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    cursor.style.left = `${mouseX}px`;
    cursor.style.top = `${mouseY}px`;
  };

  const handleEnter = () => {
    cursor.style.width = "5px";
    cursor.style.height = "5px";
    ring.style.width = "55px";
    ring.style.height = "55px";
  };

  const handleLeave = () => {
    cursor.style.width = "10px";
    cursor.style.height = "10px";
    ring.style.width = "36px";
    ring.style.height = "36px";
  };

  const interactiveElements = root.querySelectorAll("button, a, .sig-card, .arch-cell");

  interactiveElements.forEach((element) => {
    element.addEventListener("mouseenter", handleEnter);
    element.addEventListener("mouseleave", handleLeave);
  });

  document.addEventListener("mousemove", handleMove);

  function animateRing() {
    if (!active) {
      return;
    }

    ringX += (mouseX - ringX) * 0.11;
    ringY += (mouseY - ringY) * 0.11;

    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;

    frameId = window.requestAnimationFrame(animateRing);
  }

  frameId = window.requestAnimationFrame(animateRing);

  return () => {
    active = false;
    window.cancelAnimationFrame(frameId);
    document.removeEventListener("mousemove", handleMove);

    interactiveElements.forEach((element) => {
      element.removeEventListener("mouseenter", handleEnter);
      element.removeEventListener("mouseleave", handleLeave);
    });
  };
}

function setupReveal(root) {
  if (!root) {
    return () => {};
  }

  const elements = root.querySelectorAll(".rev");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
        }
      });
    },
    { threshold: 0.12 },
  );

  elements.forEach((element) => observer.observe(element));

  return () => {
    observer.disconnect();
  };
}

function setupTerminal(terminal) {
  if (!terminal) {
    return () => {};
  }

  let timeoutId = 0;
  let started = false;

  const observer = new IntersectionObserver(
    (entries) => {
      if (started || !entries[0]?.isIntersecting) {
        return;
      }

      started = true;
      let index = 0;

      const addLine = () => {
        if (index >= terminalLines.length) {
          return;
        }

        const line = terminalLines[index];
        const row = document.createElement("div");
        const prompt = document.createElement("span");
        const text = document.createElement("span");

        row.className = "tl";
        prompt.className = "tp";
        prompt.textContent = line.prompt;

        text.className = line.tone ? `tt ${line.tone}` : "tt";
        text.textContent = line.text;

        row.append(prompt, text);
        terminal.appendChild(row);
        terminal.scrollTop = terminal.scrollHeight;

        index += 1;

        if (index < terminalLines.length) {
          const delay = line.tone === "" ? 80 : line.tone === "hi" ? 220 : 90;
          timeoutId = window.setTimeout(addLine, delay + Math.random() * 130);
          return;
        }

        const cursor = document.createElement("span");
        cursor.className = "tcur";
        text.appendChild(cursor);
      };

      addLine();
      observer.disconnect();
    },
    { threshold: 0.25 },
  );

  observer.observe(terminal);

  return () => {
    observer.disconnect();
    window.clearTimeout(timeoutId);
    terminal.replaceChildren();
  };
}
