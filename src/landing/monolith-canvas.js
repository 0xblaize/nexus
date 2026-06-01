export function setupMonolithCanvas(container, canvas) {
  if (!container || !canvas) {
    return () => {};
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return () => {};
  }

  let width = 0;
  let height = 0;
  let hover = 0;
  let targetHover = 0;
  let mouseX = 0.5;
  let animationFrameId = 0;
  let active = true;
  let time = 0;

  const stoneCanvas = document.createElement("canvas");
  stoneCanvas.width = 768;
  stoneCanvas.height = 768;

  const stoneContext = stoneCanvas.getContext("2d");

  if (!stoneContext) {
    return () => {};
  }

  buildStoneTexture(stoneContext);

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;

    width = container.clientWidth;
    height = container.clientHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const handleMouseMove = (event) => {
    const bounds = container.getBoundingClientRect();
    mouseX = (event.clientX - bounds.left) / bounds.width;
    targetHover = 1;
  };

  const handleMouseLeave = () => {
    targetHover = 0;
  };

  const handleTouchMove = (event) => {
    const bounds = container.getBoundingClientRect();
    mouseX = (event.touches[0].clientX - bounds.left) / bounds.width;
    targetHover = 1;
  };

  const handleTouchEnd = () => {
    targetHover = 0;
  };

  const handleResize = () => {
    context.setTransform(1, 0, 0, 1, 0, 0);
    resize();
  };

  resize();

  window.addEventListener("resize", handleResize);
  container.addEventListener("mousemove", handleMouseMove);
  container.addEventListener("mouseleave", handleMouseLeave);
  container.addEventListener("touchmove", handleTouchMove, { passive: true });
  container.addEventListener("touchend", handleTouchEnd);

  function drawFrame() {
    if (!active) {
      return;
    }

    time += 0.014;
    hover += (targetHover - hover) * 0.05;

    context.clearRect(0, 0, width, height);

    drawSky(context, width, height);
    drawGround(context, width, height);
    drawMonolith(context, stoneCanvas, width, height, hover, mouseX, time);

    animationFrameId = window.requestAnimationFrame(drawFrame);
  }

  animationFrameId = window.requestAnimationFrame(drawFrame);

  return () => {
    active = false;
    window.cancelAnimationFrame(animationFrameId);
    window.removeEventListener("resize", handleResize);
    container.removeEventListener("mousemove", handleMouseMove);
    container.removeEventListener("mouseleave", handleMouseLeave);
    container.removeEventListener("touchmove", handleTouchMove);
    container.removeEventListener("touchend", handleTouchEnd);
  };
}

function buildStoneTexture(context) {
  const gradient = context.createLinearGradient(0, 0, 768, 768);
  gradient.addColorStop(0, "#070809");
  gradient.addColorStop(0.4, "#050607");
  gradient.addColorStop(0.7, "#030405");
  gradient.addColorStop(1, "#010101");

  context.fillStyle = gradient;
  context.fillRect(0, 0, 768, 768);

  for (let index = 0; index < 12000; index += 1) {
    const x = Math.random() * 768;
    const y = Math.random() * 768;
    const size = Math.random() * 2.2;
    const variant = Math.random();

    if (variant > 0.96) {
      context.fillStyle = `rgba(58,58,58,${Math.random() * 0.12})`;
    } else if (variant > 0.88) {
      context.fillStyle = `rgba(28,28,28,${Math.random() * 0.18})`;
    } else {
      context.fillStyle = `rgba(8,8,8,${Math.random() * 0.24})`;
    }

    context.fillRect(x, y, size, size * (0.4 + Math.random() * 1.8));
  }

  for (let index = 0; index < 24; index += 1) {
    const y = Math.random() * 768;

    context.strokeStyle = `rgba(${Math.random() > 0.5 ? "42,42,42" : "15,15,15"},${
      Math.random() * 0.09
    })`;
    context.lineWidth = Math.random() * 1.8 + 0.3;
    context.beginPath();
    context.moveTo(0, y);

    for (let x = 0; x <= 768; x += 24) {
      context.lineTo(x, y + (Math.random() - 0.5) * 5);
    }

    context.stroke();
  }

  for (let index = 0; index < 8; index += 1) {
    const x = Math.random() * 768;

    context.strokeStyle = `rgba(6,6,6,${Math.random() * 0.15})`;
    context.lineWidth = Math.random() * 0.8;
    context.beginPath();
    context.moveTo(x, 0);

    for (let y = 0; y <= 768; y += 20) {
      context.lineTo(x + (Math.random() - 0.5) * 4, y);
    }

    context.stroke();
  }
}

function drawSky(context, width, height) {
  const sky = context.createLinearGradient(0, 0, 0, height * 0.72);
  sky.addColorStop(0, "#020202");
  sky.addColorStop(0.3, "#010101");
  sky.addColorStop(0.6, "#000000");
  sky.addColorStop(1, "#000000");

  context.fillStyle = sky;
  context.fillRect(0, 0, width, height * 0.72);

  for (let index = 0; index < 6; index += 1) {
    const x = width * (0.1 + index * 0.16);
    const y = height * (0.04 + (index % 2) * 0.08);
    const radius = width * (0.22 + Math.sin(index) * 0.08);
    const cloud = context.createRadialGradient(x, y, 0, x, y, radius);

    cloud.addColorStop(0, `rgba(6,6,6,${0.2 + index * 0.02})`);
    cloud.addColorStop(0.5, "rgba(2,2,2,0.08)");
    cloud.addColorStop(1, "rgba(0,0,0,0)");

    context.fillStyle = cloud;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
}

function drawGround(context, width, height) {
  const groundTop = height * 0.7;
  const gradient = context.createLinearGradient(0, groundTop, 0, height);

  gradient.addColorStop(0, "#010101");
  gradient.addColorStop(0.4, "#000000");
  gradient.addColorStop(1, "#000000");

  context.fillStyle = gradient;
  context.fillRect(0, groundTop, width, height - groundTop);

  context.save();
  context.globalAlpha = 0.4;

  for (let index = 0; index < 18; index += 1) {
    const x = width * (0.05 + Math.sin(index * 7.3) * 0.4 + index * 0.055);
    const y = groundTop + height * (0.04 + Math.abs(Math.cos(index * 3.7)) * 0.14);
    const rockWidth = width * (0.012 + Math.random() * 0.025);
    const rockHeight = rockWidth * (0.3 + Math.random() * 0.5);
    const rock = context.createRadialGradient(x, y, 0, x, y, rockWidth * 1.5);

    rock.addColorStop(0, "rgba(6,6,6,0.9)");
    rock.addColorStop(1, "rgba(0,0,0,0)");

    context.fillStyle = rock;
    context.fillRect(x - rockWidth, y - rockHeight, rockWidth * 2, rockHeight * 2);
  }

  context.restore();
}

function drawMonolith(context, stoneCanvas, width, height, hover, mouseX, time) {
  const isMobile = width <= 900;
  const centerX = width * (isMobile ? 0.5 : 0.49);
  const topY = height * (isMobile ? 0.08 : 0.09);
  const bottomY = height * (isMobile ? 0.8 : 0.965);
  const towerHeight = bottomY - topY;
  const shaftHalfWidthTop = width * (isMobile ? 0.17 : 0.132);
  const shaftHalfWidthBottom = width * (isMobile ? 0.195 : 0.158);
  const baseHeight = towerHeight * 0.18;
  const baseStartY = bottomY - baseHeight;
  const baseHalfWidth = width * (isMobile ? 0.285 : 0.235);
  const topLeft = { x: centerX - shaftHalfWidthTop, y: topY };
  const topRight = { x: centerX + shaftHalfWidthTop, y: topY };
  const bottomRight = { x: centerX + shaftHalfWidthBottom, y: baseStartY };
  const bottomLeft = { x: centerX - shaftHalfWidthBottom, y: baseStartY };
  const sideWidth = width * (isMobile ? 0.034 : 0.03) * (0.6 + mouseX * 0.4);
  const sideTopRight = { x: topRight.x + sideWidth, y: topY + height * 0.01 };
  const sideBottomRight = { x: bottomRight.x + sideWidth * 0.9, y: baseStartY };

  drawMonolithSide(context, topRight, bottomRight, sideTopRight, sideBottomRight);
  drawMonolithFace(
    context,
    stoneCanvas,
    topLeft,
    topRight,
    bottomRight,
    bottomLeft,
    topY,
    bottomY,
    width,
    towerHeight,
  );
  drawMonolithBase(
    context,
    stoneCanvas,
    bottomLeft,
    bottomRight,
    centerX,
    baseHalfWidth,
    baseStartY,
    baseHeight,
    bottomY,
    width,
  );
  drawMonolithCap(context, topLeft, topRight, sideTopRight, topY, height, width);
  drawMonolithSeam(context, centerX, topY, bottomY, towerHeight, width, height, hover, mouseX, time);
}

function drawMonolithSide(context, topRight, bottomRight, sideTopRight, sideBottomRight) {
  context.beginPath();
  context.moveTo(topRight.x, topRight.y);
  context.lineTo(sideTopRight.x, sideTopRight.y);
  context.lineTo(sideBottomRight.x, sideBottomRight.y);
  context.lineTo(bottomRight.x, bottomRight.y);
  context.closePath();

  const gradient = context.createLinearGradient(topRight.x, 0, sideTopRight.x, 0);
  gradient.addColorStop(0, "#090909");
  gradient.addColorStop(0.5, "#040404");
  gradient.addColorStop(1, "#010101");

  context.fillStyle = gradient;
  context.fill();
}

function drawMonolithFace(
  context,
  stoneCanvas,
  topLeft,
  topRight,
  bottomRight,
  bottomLeft,
  topY,
  bottomY,
  width,
  towerHeight,
) {
  context.beginPath();
  context.moveTo(topLeft.x, topLeft.y);
  context.lineTo(topRight.x, topRight.y);
  context.lineTo(bottomRight.x, bottomRight.y);
  context.lineTo(bottomLeft.x, bottomLeft.y);
  context.closePath();

  const face = context.createLinearGradient(topLeft.x, 0, topRight.x, 0);
  face.addColorStop(0, "#060708");
  face.addColorStop(0.3, "#030405");
  face.addColorStop(0.5, "#000000");
  face.addColorStop(0.7, "#020304");
  face.addColorStop(1, "#050607");

  context.fillStyle = face;
  context.fill();

  context.save();
  context.beginPath();
  context.moveTo(topLeft.x, topLeft.y);
  context.lineTo(topRight.x, topRight.y);
  context.lineTo(bottomRight.x, bottomRight.y);
  context.lineTo(bottomLeft.x, bottomLeft.y);
  context.closePath();
  context.clip();

  const pattern = context.createPattern(stoneCanvas, "repeat");
  context.globalAlpha = 0.12;
  context.fillStyle = pattern;
  context.fillRect(topLeft.x, topY, (topRight.x - topLeft.x) + 10, towerHeight);
  context.globalAlpha = 1;

  const light = context.createLinearGradient(topLeft.x, topY, bottomRight.x, bottomY);
  light.addColorStop(0, "rgba(20,20,20,0.18)");
  light.addColorStop(0.3, "rgba(0,0,0,0)");
  light.addColorStop(1, "rgba(0,0,0,0.45)");
  context.fillStyle = light;
  context.fillRect(topLeft.x, topY, topRight.x - topLeft.x, towerHeight);

  const leftEdge = context.createLinearGradient(topLeft.x, 0, topLeft.x + width * 0.055, 0);
  leftEdge.addColorStop(0, "rgba(0,0,0,0.75)");
  leftEdge.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = leftEdge;
  context.fillRect(topLeft.x, topY, width * 0.08, towerHeight * 0.8);

  const rightEdge = context.createLinearGradient(topRight.x, 0, topRight.x - width * 0.055, 0);
  rightEdge.addColorStop(0, "rgba(0,0,0,0.6)");
  rightEdge.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = rightEdge;
  context.fillRect(topRight.x - width * 0.08, topY, width * 0.08, towerHeight * 0.8);

  context.restore();
}

function drawMonolithBase(
  context,
  stoneCanvas,
  bottomLeft,
  bottomRight,
  centerX,
  baseHalfWidth,
  baseStartY,
  baseHeight,
  bottomY,
  width,
) {
  context.save();
  context.beginPath();
  context.moveTo(bottomLeft.x, baseStartY);
  context.lineTo(bottomRight.x, baseStartY);
  context.bezierCurveTo(
    bottomRight.x + width * 0.04,
    baseStartY + baseHeight * 0.3,
    centerX + baseHalfWidth * 0.8,
    baseStartY + baseHeight * 0.7,
    centerX + baseHalfWidth,
    bottomY,
  );
  context.lineTo(centerX - baseHalfWidth, bottomY);
  context.bezierCurveTo(
    centerX - baseHalfWidth * 0.8,
    baseStartY + baseHeight * 0.7,
    bottomLeft.x - width * 0.04,
    baseStartY + baseHeight * 0.3,
    bottomLeft.x,
    baseStartY,
  );
  context.closePath();

  const gradient = context.createLinearGradient(
    centerX - baseHalfWidth,
    baseStartY,
    centerX + baseHalfWidth,
    bottomY,
  );
  gradient.addColorStop(0, "#101010");
  gradient.addColorStop(0.3, "#080808");
  gradient.addColorStop(0.6, "#030405");
  gradient.addColorStop(1, "#000000");

  context.fillStyle = gradient;
  context.fill();

  const pattern = context.createPattern(stoneCanvas, "repeat");
  context.globalAlpha = 0.1;
  context.fillStyle = pattern;
  context.fill();
  context.globalAlpha = 1;

  const leftEdge = context.createLinearGradient(
    centerX - baseHalfWidth,
    0,
    centerX - baseHalfWidth + width * 0.08,
    0,
  );
  leftEdge.addColorStop(0, "rgba(0,0,0,0.8)");
  leftEdge.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = leftEdge;
  context.fill();

  const rightEdge = context.createLinearGradient(
    centerX + baseHalfWidth,
    0,
    centerX + baseHalfWidth - width * 0.08,
    0,
  );
  rightEdge.addColorStop(0, "rgba(0,0,0,0.7)");
  rightEdge.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = rightEdge;
  context.fill();

  context.restore();
}

function drawMonolithCap(context, topLeft, topRight, sideTopRight, topY, height, width) {
  const capHeight = height * 0.013;

  context.beginPath();
  context.moveTo(topLeft.x, topLeft.y);
  context.lineTo(topRight.x, topRight.y);
  context.lineTo(sideTopRight.x, topY + capHeight);
  context.lineTo(topLeft.x - width * 0.005, topY + capHeight * 0.7);
  context.closePath();

  const gradient = context.createLinearGradient(0, topY, 0, topY + capHeight);
  gradient.addColorStop(0, "#111111");
  gradient.addColorStop(1, "#050505");

  context.fillStyle = gradient;
  context.fill();
}

function drawMonolithSeam(context, centerX, topY, bottomY, towerHeight, width, height, hover, mouseX, time) {
  const seamX = centerX + (mouseX - 0.5) * width * 0.008;
  const idlePulse = 0.88 + Math.sin(time * 1.3) * 0.12;
  const glowBase = idlePulse;

  const atmosphericWidth = width * (0.13 + hover * 0.18);
  const atmospheric = context.createLinearGradient(
    seamX - atmosphericWidth,
    0,
    seamX + atmosphericWidth,
    0,
  );
  atmospheric.addColorStop(0, "rgba(0,0,0,0)");
  atmospheric.addColorStop(0.35, `rgba(40,2,1,${0.015 + hover * 0.035})`);
  atmospheric.addColorStop(0.5, `rgba(70,4,2,${0.03 + hover * 0.07})`);
  atmospheric.addColorStop(0.65, `rgba(40,2,1,${0.015 + hover * 0.035})`);
  atmospheric.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = atmospheric;
  context.fillRect(seamX - atmosphericWidth, topY, atmosphericWidth * 2, towerHeight);

  const middleWidth = width * (0.03 + hover * 0.04);
  const middleGlow = context.createLinearGradient(seamX - middleWidth, 0, seamX + middleWidth, 0);
  middleGlow.addColorStop(0, "rgba(0,0,0,0)");
  middleGlow.addColorStop(0.3, `rgba(180,12,4,${0.08 * glowBase + hover * 0.22})`);
  middleGlow.addColorStop(0.5, `rgba(220,18,6,${0.14 * glowBase + hover * 0.35})`);
  middleGlow.addColorStop(0.7, `rgba(180,12,4,${0.08 * glowBase + hover * 0.22})`);
  middleGlow.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = middleGlow;
  context.fillRect(seamX - middleWidth, topY, middleWidth * 2, towerHeight * 1.02);

  const innerWidth = width * (0.012 + hover * 0.022);
  const innerGlow = context.createLinearGradient(seamX - innerWidth, 0, seamX + innerWidth, 0);
  innerGlow.addColorStop(0, "rgba(0,0,0,0)");
  innerGlow.addColorStop(0.3, `rgba(255,40,10,${0.35 * glowBase + hover * 0.6})`);
  innerGlow.addColorStop(0.5, `rgba(255,70,20,${0.55 * glowBase + hover * 0.85})`);
  innerGlow.addColorStop(0.7, `rgba(255,40,10,${0.35 * glowBase + hover * 0.6})`);
  innerGlow.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = innerGlow;
  context.fillRect(seamX - innerWidth, topY, innerWidth * 2, towerHeight);

  const core = context.createLinearGradient(0, topY, 0, bottomY);
  core.addColorStop(0, `rgba(255,180,80,${0.7 * idlePulse + hover * 0.9})`);
  core.addColorStop(0.05, `rgba(255,100,30,${0.85 * idlePulse + hover * 0.95})`);
  core.addColorStop(0.15, `rgba(220,20,5,${0.9 * idlePulse + hover})`);
  core.addColorStop(0.4, `rgba(200,10,2,${glowBase + hover * 0.9})`);
  core.addColorStop(0.6, `rgba(210,12,3,${glowBase + hover * 0.9})`);
  core.addColorStop(0.85, `rgba(230,20,5,${0.85 * idlePulse + hover * 0.8})`);
  core.addColorStop(0.95, `rgba(255,90,20,${0.75 * idlePulse + hover * 0.7})`);
  core.addColorStop(1, `rgba(255,160,60,${0.6 * idlePulse + hover * 0.6})`);

  context.strokeStyle = core;
  context.lineWidth = 1.2 + hover * 2.8;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(seamX, topY);
  context.lineTo(seamX, bottomY);
  context.stroke();

  const topGlowRadius = width * (0.08 + hover * 0.1);
  const topGlow = context.createRadialGradient(seamX, topY, 0, seamX, topY, topGlowRadius);
  topGlow.addColorStop(0, `rgba(255,200,100,${0.55 * idlePulse + hover * 0.8})`);
  topGlow.addColorStop(0.2, `rgba(255,80,20,${0.3 * idlePulse + hover * 0.5})`);
  topGlow.addColorStop(0.6, `rgba(180,10,3,${0.08 + hover * 0.18})`);
  topGlow.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = topGlow;
  context.fillRect(
    seamX - topGlowRadius,
    topY - topGlowRadius * 0.6,
    topGlowRadius * 2,
    topGlowRadius * 1.5,
  );

  const poolPulse = 0.65 + Math.sin(time * 1.05) * 0.35 + hover * 0.6;
  const poolWidth = width * (0.18 + hover * 0.12);
  const pool = context.createRadialGradient(seamX, bottomY, 0, seamX, bottomY, poolWidth);
  pool.addColorStop(0, `rgba(220,18,4,${0.55 * poolPulse})`);
  pool.addColorStop(0.25, `rgba(160,10,3,${0.25 * poolPulse})`);
  pool.addColorStop(0.6, `rgba(80,4,1,${0.1 * poolPulse})`);
  pool.addColorStop(1, "rgba(0,0,0,0)");

  context.save();
  context.scale(1, 0.28);
  context.fillStyle = pool;
  context.beginPath();
  context.arc(seamX, bottomY / 0.28, poolWidth, 0, Math.PI * 2);
  context.fill();
  context.restore();

  drawMonolithFigures(context, seamX, bottomY, width, height, hover);
  drawMonolithMist(context, centerX, bottomY, width, height, hover);
  drawMonolithCracks(context, seamX, topY, towerHeight, width, height, hover);
}

function drawMonolithFigures(context, seamX, bottomY, width, height, hover) {
  const figureY = bottomY + height * 0.008;
  const figureHeight = height * 0.028;
  const figureSpacing = width * 0.028;

  context.save();
  context.globalAlpha = 0.55 + hover * 0.15;

  [-figureSpacing * 1.1, figureSpacing * 0.4].forEach((offset, index) => {
    const x = seamX + offset;
    const figureWidth = figureHeight * 0.22;

    context.fillStyle = "#0a090e";
    context.beginPath();
    context.ellipse(x, figureY - figureHeight * 0.25, figureWidth * 0.9, figureHeight * 0.38, 0, 0, Math.PI * 2);
    context.fill();

    context.beginPath();
    context.arc(
      x + (index === 0 ? -figureWidth * 0.3 : figureWidth * 0.2),
      figureY - figureHeight * 0.68,
      figureWidth * 0.85,
      0,
      Math.PI * 2,
    );
    context.fill();

    const rim = context.createRadialGradient(seamX, bottomY, 0, x, figureY - figureHeight * 0.4, figureHeight * 0.8);
    rim.addColorStop(0, `rgba(200,12,3,${0.12 + hover * 0.2})`);
    rim.addColorStop(1, "rgba(0,0,0,0)");

    context.fillStyle = rim;
    context.beginPath();
    context.ellipse(x, figureY - figureHeight * 0.35, figureWidth * 1.4, figureHeight * 0.55, 0, 0, Math.PI * 2);
    context.fill();
  });

  context.restore();
}

function drawMonolithMist(context, centerX, bottomY, width, height, hover) {
  const mistY = bottomY - height * 0.04;
  const mist = context.createLinearGradient(0, mistY, 0, mistY + height * 0.1);

  mist.addColorStop(0, "rgba(0,0,0,0)");
  mist.addColorStop(0.5, `rgba(2,2,2,${0.82 + hover * 0.04})`);
  mist.addColorStop(1, "rgba(0,0,0,0.96)");

  context.fillStyle = mist;
  context.fillRect(0, mistY, width, height * 0.12);

  const wideMist = context.createRadialGradient(centerX, bottomY, 0, centerX, bottomY, width * 0.55);
  wideMist.addColorStop(0, "rgba(4,4,4,0.2)");
  wideMist.addColorStop(0.5, "rgba(0,0,0,0.1)");
  wideMist.addColorStop(1, "rgba(0,0,0,0)");

  context.fillStyle = wideMist;
  context.fillRect(centerX - width * 0.55, bottomY - height * 0.08, width * 1.1, height * 0.16);
}

function drawMonolithCracks(context, seamX, topY, towerHeight, width, height, hover) {
  if (hover <= 0.15) {
    return;
  }

  context.save();
  context.globalAlpha = hover * 0.35;

  [0.2, 0.4, 0.55, 0.72, 0.88].forEach((fraction) => {
    const y = topY + towerHeight * fraction;
    const crackLength = width * (0.015 + hover * 0.04) * Math.random();

    context.strokeStyle = `rgba(200,8,2,${hover * 0.6})`;
    context.lineWidth = 0.5;

    context.beginPath();
    context.moveTo(seamX, y);
    context.lineTo(seamX - crackLength, y + (Math.random() - 0.5) * height * 0.015);
    context.stroke();

    context.beginPath();
    context.moveTo(seamX, y);
    context.lineTo(seamX + crackLength, y + (Math.random() - 0.5) * height * 0.015);
    context.stroke();
  });

  context.restore();
}
