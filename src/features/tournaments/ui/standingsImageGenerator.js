// Scrimverse Standings Image Generator — NEON LEAGUE Edition

import pointsTableBg from '../../../assets/pointtablenew.png';

// ─── Custom background image calibration (pointtablenew.png 1086×1449 → scaled to 1080×1441) ─
const BG_TITLE_Y = 355; // Center Y of dynamic title text
const BG_TABLE_ROW_START_Y = 570; // Center Y of first data row (slot 1 center = 545+49/2)
const BG_ROW_H = 49; // Height of each row slot in the background image
const BG_MAX_ROWS_PG1 = 12; // Rows available on page 1 with custom bg

// Column center X positions (image is 1086px → 1080px canvas, near 1:1 scale):
const BG_COL_RANK_X = 185; // # column
const BG_COL_TEAM_LEFT_X = 252; // Team name left-align start
const BG_COL_WWCD_X = 586; // WWCD column center
const BG_COL_PP_X = 682; // PP column center
const BG_COL_KP_X = 798; // KP column center
const BG_COL_TOTAL_X = 900; // TOTAL column center

const BACKGROUND_IMAGE_URL = '/standings-bg.jpeg';
const UPLOADED_BG =
  'https://scrimverse-public.s3.ap-south-1.amazonaws.com/media/uploaded_media_1769422838293.jpg';

const loadPremiumFonts = () =>
  new Promise((resolve) => {
    const link = document.createElement('link');
    link.href =
      'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    setTimeout(resolve, 500);
  });

const roundRect = (ctx, x, y, w, h, r) => {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }
};

// ─── BR / Multi-team Standings Image ────────────────────────────────────────

const TEAMS_PAGE_1 = 15; // first page: full header
const TEAMS_PAGE_N = 18; // subsequent pages: compact header

const _renderStandingsPage = ({
  tournament,
  standings,
  viewMode,
  selectedRound,
  selectedMatch,
  selectedGroup,
  getRoundLabel,
  pageNum,
  totalPages,
  rankOffset,
  bgImage,
}) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const isFirstPage = pageNum === 1;

  const W = 1080;
  const PAD_X = 32;
  const HEADER_H = isFirstPage ? 340 : 190;
  const CARD_H_TOP3 = 92;
  const CARD_H = 72;
  const CARD_GAP = 6;
  const FOOTER_H = 90;
  const CARDS_PAD = 30;
  const COL_HDR_H = 24;

  const cardHeights = standings.map((_, i) => (rankOffset + i < 3 ? CARD_H_TOP3 : CARD_H));
  const totalCardsH =
    cardHeights.reduce((s, h) => s + h, 0) + Math.max(0, standings.length - 1) * CARD_GAP;
  const TOTAL_H = HEADER_H + COL_HDR_H + CARDS_PAD + totalCardsH + CARDS_PAD + FOOTER_H;

  canvas.width = W;
  canvas.height = TOTAL_H;

  // Game accent
  const gameName = (tournament?.game_name || '').toLowerCase();
  let ACCENT = '#F59E0B',
    ACCENT_R = 245,
    ACCENT_G = 158,
    ACCENT_B = 11;
  if (gameName.includes('free fire') || gameName.includes('freefire')) {
    ACCENT = '#EF4444';
    ACCENT_R = 239;
    ACCENT_G = 68;
    ACCENT_B = 68;
  } else if (gameName.includes('cod') || gameName.includes('call of duty')) {
    ACCENT = '#22C55E';
    ACCENT_R = 34;
    ACCENT_G = 197;
    ACCENT_B = 94;
  } else if (gameName.includes('valorant')) {
    ACCENT = '#FF4655';
    ACCENT_R = 255;
    ACCENT_G = 70;
    ACCENT_B = 85;
  }
  const AC = (a) => `rgba(${ACCENT_R},${ACCENT_G},${ACCENT_B},${a})`;

  // ── Custom background image path (page 1 only) ──────────────────────────
  if (bgImage && isFirstPage) {
    const imgScaledH = Math.round((bgImage.naturalHeight / bgImage.naturalWidth) * W);
    canvas.height = imgScaledH;
    ctx.drawImage(bgImage, 0, 0, W, imgScaledH);

    // Stage heading
    let stageHeading = '';
    let subtitleLabel = '';
    if (viewMode === 'match') {
      const rName =
        tournament?.round_names?.[String(selectedRound)] || getRoundLabel(selectedRound);
      stageHeading = rName.toUpperCase();
      subtitleLabel = `MATCH ${selectedMatch} STANDINGS`;
    } else {
      stageHeading = (
        tournament?.round_names?.[String(selectedRound)] || getRoundLabel(selectedRound)
      ).toUpperCase();
      subtitleLabel = 'OVERALL STANDINGS';
    }

    ctx.textBaseline = 'middle';
    let headingSize = 112;
    ctx.font = `900 ${headingSize}px "Outfit", sans-serif`;
    while (ctx.measureText(stageHeading).width > W - PAD_X * 4 && headingSize > 48) {
      headingSize -= 4;
      ctx.font = `900 ${headingSize}px "Outfit", sans-serif`;
    }
    ctx.shadowColor = AC('0.45');
    ctx.shadowBlur = 70;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(stageHeading, W / 2, BG_TITLE_Y);
    ctx.shadowBlur = 0;

    // Decorative lines + diamonds flanking title
    const headW = ctx.measureText(stageHeading).width;
    const DGAP = 28,
      lEndX = W / 2 - headW / 2 - DGAP,
      rStartX = W / 2 + headW / 2 + DGAP;
    if (lEndX > PAD_X + 30) {
      const drawDecLine = (x1, x2, toRight) => {
        const g = ctx.createLinearGradient(x1, 0, x2, 0);
        if (toRight) {
          g.addColorStop(0, 'rgba(255,255,255,0)');
          g.addColorStop(1, AC('0.75'));
        } else {
          g.addColorStop(0, AC('0.75'));
          g.addColorStop(1, 'rgba(255,255,255,0)');
        }
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, BG_TITLE_Y);
        ctx.lineTo(x2, BG_TITLE_Y);
        ctx.stroke();
      };
      drawDecLine(PAD_X + 16, lEndX - 8, true);
      drawDecLine(rStartX + 8, W - PAD_X - 16, false);
      const drawDiamond = (cx, cy) => {
        ctx.fillStyle = ACCENT;
        ctx.shadowColor = ACCENT;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 6);
        ctx.lineTo(cx + 6, cy);
        ctx.lineTo(cx, cy + 6);
        ctx.lineTo(cx - 6, cy);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      };
      drawDiamond(lEndX, BG_TITLE_Y);
      drawDiamond(rStartX, BG_TITLE_Y);
    }

    // Subtitle badge
    const stPillY = BG_TITLE_Y + headingSize / 2 + 22;
    ctx.font = '700 15px "Inter", sans-serif';
    ctx.letterSpacing = '4px';
    const stLabelW = ctx.measureText(subtitleLabel).width;
    const stPillW = stLabelW + 56,
      stPillH = 34;
    ctx.strokeStyle = AC('0.65');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    roundRect(ctx, W / 2 - stPillW / 2, stPillY - stPillH / 2, stPillW, stPillH, 4);
    ctx.stroke();
    ctx.fillStyle = AC('0.08');
    ctx.beginPath();
    roundRect(ctx, W / 2 - stPillW / 2, stPillY - stPillH / 2, stPillW, stPillH, 4);
    ctx.fill();
    ctx.fillStyle = ACCENT;
    ctx.textAlign = 'center';
    ctx.fillText(subtitleLabel, W / 2, stPillY);
    ctx.letterSpacing = '0px';

    // Tournament info line
    const infoParts = [];
    if (tournament?.game_name) infoParts.push(tournament.game_name.toUpperCase());
    if (tournament?.title) {
      const t = tournament.title.toUpperCase();
      infoParts.push(t.length > 50 ? t.substring(0, 48) + '…' : t);
    }
    if (selectedGroup?.group_name) infoParts.push(selectedGroup.group_name.toUpperCase());
    if (infoParts.length > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.font = '500 14px "Inter", sans-serif';
      ctx.letterSpacing = '1.5px';
      ctx.textAlign = 'center';
      ctx.fillText(infoParts.join('   ·   '), W / 2, stPillY + 32);
      ctx.letterSpacing = '0px';
    }

    // Data rows
    standings.forEach((team, i) => {
      const actualRank = rankOffset + i + 1;
      const rowMidY = BG_TABLE_ROW_START_Y + i * BG_ROW_H + BG_ROW_H / 2;
      const medalColor =
        actualRank === 1
          ? '#F59E0B'
          : actualRank === 2
            ? '#94A3B8'
            : actualRank === 3
              ? '#B45309'
              : null;

      // Rank
      ctx.font = medalColor ? '800 19px "Inter", sans-serif' : '700 16px "Inter", sans-serif';
      ctx.fillStyle = medalColor || 'rgba(255,255,255,0.60)';
      ctx.textAlign = 'center';
      ctx.fillText(String(actualRank), BG_COL_RANK_X, rowMidY);

      // Team name
      ctx.font = '600 17px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.90)';
      ctx.textAlign = 'left';
      const rawName = (team.team_name || '—').toUpperCase();
      ctx.fillText(
        rawName.length > 22 ? rawName.substring(0, 21) + '…' : rawName,
        BG_COL_TEAM_LEFT_X,
        rowMidY
      );

      // WWCD
      ctx.textAlign = 'center';
      ctx.font = '700 16px "Inter", sans-serif';
      ctx.fillStyle = (team.wwcd ?? 0) > 0 ? '#4ade80' : 'rgba(255,255,255,0.55)';
      ctx.fillText(String(team.wwcd ?? 0), BG_COL_WWCD_X, rowMidY);

      // PP
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.fillText(String(team.position_points ?? 0), BG_COL_PP_X, rowMidY);

      // KP
      ctx.fillText(String(team.kill_points ?? 0), BG_COL_KP_X, rowMidY);

      // Total
      ctx.font = '800 17px "Inter", sans-serif';
      ctx.fillStyle =
        actualRank === 1
          ? '#FDE68A'
          : actualRank === 2
            ? '#E2E8F0'
            : actualRank === 3
              ? '#D97706'
              : '#C084FC';
      ctx.fillText(String(team.total_points ?? 0), BG_COL_TOTAL_X, rowMidY);
    });

    return canvas.toDataURL('image/png', 1.0);
  }
  // ── End custom background path ───────────────────────────────────────────

  // Background
  ctx.fillStyle = '#02020E';
  ctx.fillRect(0, 0, W, TOTAL_H);

  // Hex grid (header area, fades at bottom)
  const HEX_R = 42,
    HEX_ROW_H = HEX_R * Math.sqrt(3),
    HEX_COL_W = HEX_R * 1.5;
  for (let col = -1; col <= Math.ceil(W / HEX_COL_W) + 2; col++) {
    for (let row = -1; row <= Math.ceil((HEADER_H + 60) / HEX_ROW_H) + 2; row++) {
      const cx = col * HEX_COL_W * 2;
      const cy = row * HEX_ROW_H + (col % 2 !== 0 ? HEX_ROW_H / 2 : 0);
      if (cy - HEX_R > HEADER_H + 40) continue;
      const fadeAlpha = cy > HEADER_H - 60 ? (1 - (cy - (HEADER_H - 60)) / 100) * 0.06 : 0.06;
      ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, fadeAlpha).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let a = 0; a < 6; a++) {
        const angle = (Math.PI / 3) * a - Math.PI / 6;
        const px = cx + HEX_R * Math.cos(angle);
        const py = cy + HEX_R * Math.sin(angle);
        a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }

  const blobTop = ctx.createRadialGradient(W / 2, -40, 0, W / 2, -40, W * 0.72);
  blobTop.addColorStop(0, AC('0.32'));
  blobTop.addColorStop(0.45, AC('0.10'));
  blobTop.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = blobTop;
  ctx.fillRect(0, 0, W, HEADER_H + 120);

  const blobPurple = ctx.createRadialGradient(0, TOTAL_H * 0.65, 0, 0, TOTAL_H * 0.65, W * 0.55);
  blobPurple.addColorStop(0, 'rgba(76,29,149,0.22)');
  blobPurple.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = blobPurple;
  ctx.fillRect(0, 0, W, TOTAL_H);

  const blobBlue = ctx.createRadialGradient(W, TOTAL_H * 0.75, 0, W, TOTAL_H * 0.75, W * 0.5);
  blobBlue.addColorStop(0, 'rgba(29,78,216,0.18)');
  blobBlue.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = blobBlue;
  ctx.fillRect(0, 0, W, TOTAL_H);

  const btmFade = ctx.createLinearGradient(0, TOTAL_H - 200, 0, TOTAL_H);
  btmFade.addColorStop(0, 'rgba(2,2,14,0)');
  btmFade.addColorStop(1, 'rgba(2,2,14,0.80)');
  ctx.fillStyle = btmFade;
  ctx.fillRect(0, TOTAL_H - 200, W, 200);

  const topBar = ctx.createLinearGradient(0, 0, W, 0);
  topBar.addColorStop(0, AC('0'));
  topBar.addColorStop(0.15, AC('1'));
  topBar.addColorStop(0.85, AC('1'));
  topBar.addColorStop(1, AC('0'));
  ctx.fillStyle = topBar;
  ctx.fillRect(0, 0, W, 5);

  ctx.textBaseline = 'middle';

  // SCRIMVERSE wordmark
  const LOGO_Y = 54;
  ctx.font = '800 30px "Outfit", sans-serif';
  const swL = ctx.measureText('SCRIM').width;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 14;
  ctx.fillText('SCRIM', PAD_X, LOGO_Y);
  ctx.fillStyle = '#C084FC';
  ctx.fillText('VERSE', PAD_X + swL, LOGO_Y);
  ctx.shadowBlur = 0;

  // Game badge
  const gameLabel = (tournament?.game_name || '').toUpperCase();
  if (gameLabel) {
    ctx.font = '700 12px "Inter", sans-serif';
    ctx.letterSpacing = '2px';
    const gbW = ctx.measureText(gameLabel).width + 28,
      gbH = 28,
      gbX = W - PAD_X - gbW;
    ctx.strokeStyle = AC('0.55');
    ctx.lineWidth = 1.5;
    ctx.fillStyle = AC('0.10');
    ctx.beginPath();
    roundRect(ctx, gbX, LOGO_Y - gbH / 2, gbW, gbH, 4);
    ctx.fill();
    ctx.beginPath();
    roundRect(ctx, gbX, LOGO_Y - gbH / 2, gbW, gbH, 4);
    ctx.stroke();
    ctx.fillStyle = ACCENT;
    ctx.textAlign = 'center';
    ctx.fillText(gameLabel, gbX + gbW / 2, LOGO_Y);
    ctx.letterSpacing = '0px';
  }

  // Stage info
  let stageHeading = '';
  let subtitleLabel = '';
  if (viewMode === 'match') {
    const rName = tournament?.round_names?.[String(selectedRound)] || getRoundLabel(selectedRound);
    stageHeading = rName.toUpperCase();
    subtitleLabel = `MATCH ${selectedMatch} STANDINGS`;
  } else {
    stageHeading = (
      tournament?.round_names?.[String(selectedRound)] || getRoundLabel(selectedRound)
    ).toUpperCase();
    subtitleLabel = 'OVERALL STANDINGS';
  }

  if (isFirstPage) {
    // Full header
    const STAGE_Y = LOGO_Y + 150;
    let headingSize = 112;
    ctx.font = `900 ${headingSize}px "Outfit", sans-serif`;
    while (ctx.measureText(stageHeading).width > W - PAD_X * 4 && headingSize > 48) {
      headingSize -= 4;
      ctx.font = `900 ${headingSize}px "Outfit", sans-serif`;
    }
    ctx.shadowColor = AC('0.45');
    ctx.shadowBlur = 70;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(stageHeading, W / 2, STAGE_Y);
    ctx.shadowBlur = 0;

    const headW = ctx.measureText(stageHeading).width;
    const DGAP = 28,
      lEndX = W / 2 - headW / 2 - DGAP,
      rStartX = W / 2 + headW / 2 + DGAP;
    if (lEndX > PAD_X + 30) {
      const drawDecLine = (x1, x2, toRight) => {
        const g = ctx.createLinearGradient(x1, 0, x2, 0);
        if (toRight) {
          g.addColorStop(0, 'rgba(255,255,255,0)');
          g.addColorStop(1, AC('0.75'));
        } else {
          g.addColorStop(0, AC('0.75'));
          g.addColorStop(1, 'rgba(255,255,255,0)');
        }
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, STAGE_Y);
        ctx.lineTo(x2, STAGE_Y);
        ctx.stroke();
      };
      drawDecLine(PAD_X + 16, lEndX - 8, true);
      drawDecLine(rStartX + 8, W - PAD_X - 16, false);
      const drawDiamond = (cx, cy, size) => {
        ctx.fillStyle = ACCENT;
        ctx.shadowColor = ACCENT;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(cx, cy - size);
        ctx.lineTo(cx + size, cy);
        ctx.lineTo(cx, cy + size);
        ctx.lineTo(cx - size, cy);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      };
      drawDiamond(lEndX, STAGE_Y, 6);
      drawDiamond(rStartX, STAGE_Y, 6);
    }

    const SUBTITLE_Y = STAGE_Y + headingSize / 2 + 38;
    ctx.font = '700 15px "Inter", sans-serif';
    ctx.letterSpacing = '4px';
    const stLabelW = ctx.measureText(subtitleLabel).width;
    const stPillW = stLabelW + 56,
      stPillH = 34;
    ctx.strokeStyle = AC('0.65');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    roundRect(ctx, W / 2 - stPillW / 2, SUBTITLE_Y - stPillH / 2, stPillW, stPillH, 4);
    ctx.stroke();
    ctx.fillStyle = AC('0.08');
    ctx.beginPath();
    roundRect(ctx, W / 2 - stPillW / 2, SUBTITLE_Y - stPillH / 2, stPillW, stPillH, 4);
    ctx.fill();
    ctx.fillStyle = ACCENT;
    ctx.textAlign = 'center';
    ctx.fillText(subtitleLabel, W / 2, SUBTITLE_Y);
    ctx.letterSpacing = '0px';

    const INFO_Y = SUBTITLE_Y + 48;
    const infoParts = [];
    if (tournament?.game_name) infoParts.push(tournament.game_name.toUpperCase());
    if (tournament?.title) {
      const t = tournament.title.toUpperCase();
      infoParts.push(t.length > 50 ? t.substring(0, 48) + '\u2026' : t);
    }
    if (selectedGroup?.group_name) infoParts.push(selectedGroup.group_name.toUpperCase());
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.font = '500 14px "Inter", sans-serif';
    ctx.letterSpacing = '1.5px';
    ctx.textAlign = 'center';
    ctx.fillText(infoParts.join('   \u00b7   '), W / 2, INFO_Y);
    ctx.letterSpacing = '0px';
  } else {
    // Compact header for page 2+
    const STAGE_Y = 96;
    let headingSize = 56;
    ctx.font = `900 ${headingSize}px "Outfit", sans-serif`;
    while (ctx.measureText(stageHeading).width > W - PAD_X * 4 && headingSize > 32) {
      headingSize -= 2;
      ctx.font = `900 ${headingSize}px "Outfit", sans-serif`;
    }
    ctx.shadowColor = AC('0.35');
    ctx.shadowBlur = 40;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(stageHeading, W / 2, STAGE_Y);
    ctx.shadowBlur = 0;

    const pageBadge = `${subtitleLabel}   \u00b7   PAGE ${pageNum} OF ${totalPages}`;
    ctx.font = '700 12px "Inter", sans-serif';
    ctx.letterSpacing = '3px';
    const pbW = ctx.measureText(pageBadge).width + 44,
      pbH = 30;
    const pbY = STAGE_Y + headingSize / 2 + 28;
    ctx.strokeStyle = AC('0.55');
    ctx.lineWidth = 1.5;
    ctx.fillStyle = AC('0.08');
    ctx.beginPath();
    roundRect(ctx, W / 2 - pbW / 2, pbY - pbH / 2, pbW, pbH, 4);
    ctx.fill();
    ctx.beginPath();
    roundRect(ctx, W / 2 - pbW / 2, pbY - pbH / 2, pbW, pbH, 4);
    ctx.stroke();
    ctx.fillStyle = ACCENT;
    ctx.textAlign = 'center';
    ctx.fillText(pageBadge, W / 2, pbY);
    ctx.letterSpacing = '0px';
  }

  // Column headers
  const RANK_ZONE_W = 96,
    TOTAL_CHIP_W = 120,
    STAT_W = 82;
  const STATS_START_X = W - PAD_X - TOTAL_CHIP_W - STAT_W * 3 - 8;
  const COL_WWCD = STATS_START_X + STAT_W * 0 + STAT_W / 2;
  const COL_PP = STATS_START_X + STAT_W * 1 + STAT_W / 2;
  const COL_FP = STATS_START_X + STAT_W * 2 + STAT_W / 2;
  const COL_TOTAL_X = W - PAD_X - TOTAL_CHIP_W / 2;

  const COL_HDR_Y = HEADER_H + 13;
  ctx.font = '700 10px "Inter", sans-serif';
  ctx.letterSpacing = '2.5px';
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.textAlign = 'center';
  ctx.fillText('WWCD', COL_WWCD, COL_HDR_Y);
  ctx.fillText('PP', COL_PP, COL_HDR_Y);
  ctx.fillText('FP', COL_FP, COL_HDR_Y);
  ctx.fillStyle = AC('0.75');
  ctx.fillText('TOTAL', COL_TOTAL_X, COL_HDR_Y);
  ctx.letterSpacing = '0px';

  const MEDALS = [
    { fill: '#F59E0B', stroke: '#FDE68A', shadow: 'rgba(245,158,11,', dark: '#1C1000' },
    { fill: '#94A3B8', stroke: '#E2E8F0', shadow: 'rgba(148,163,184,', dark: '#0F1117' },
    { fill: '#B45309', stroke: '#D97706', shadow: 'rgba(180,83,9,', dark: '#1A0C00' },
  ];

  let cardY = HEADER_H + COL_HDR_H + CARDS_PAD;
  const BADGE_X_CENTER = PAD_X + 20 + RANK_ZONE_W / 2 - 10;

  standings.forEach((team, i) => {
    const actualRank = rankOffset + i + 1;
    const isTop3 = actualRank <= 3;
    const ch = isTop3 ? CARD_H_TOP3 : CARD_H;
    const medal = isTop3 ? MEDALS[actualRank - 1] : null;
    const mid = cardY + ch / 2;

    if (isTop3) {
      const cardBg = ctx.createLinearGradient(PAD_X, 0, W - PAD_X, 0);
      cardBg.addColorStop(0, medal.shadow + '0.65)');
      cardBg.addColorStop(0.09, medal.shadow + '0.38)');
      cardBg.addColorStop(0.42, 'rgba(10,8,28,0.96)');
      cardBg.addColorStop(1, 'rgba(6,5,18,0.98)');
      ctx.fillStyle = cardBg;
      ctx.beginPath();
      roundRect(ctx, PAD_X, cardY, W - PAD_X * 2, ch, 10);
      ctx.fill();
      const lBorder = ctx.createLinearGradient(0, cardY, 0, cardY + ch);
      lBorder.addColorStop(0, medal.stroke);
      lBorder.addColorStop(1, medal.fill);
      ctx.fillStyle = lBorder;
      ctx.fillRect(PAD_X, cardY, 6, ch);
      ctx.shadowColor = medal.shadow + '0.50)';
      ctx.shadowBlur = 22;
      ctx.strokeStyle = medal.shadow + '0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      roundRect(ctx, PAD_X, cardY, W - PAD_X * 2, ch, 10);
      ctx.stroke();
      ctx.shadowBlur = 0;
      const sepG = ctx.createLinearGradient(PAD_X, 0, PAD_X + W - PAD_X * 2, 0);
      sepG.addColorStop(0, medal.shadow + '0.60)');
      sepG.addColorStop(0.5, medal.shadow + '0.20)');
      sepG.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.strokeStyle = sepG;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD_X + 6, cardY + ch - 0.5);
      ctx.lineTo(PAD_X + W - PAD_X * 2, cardY + ch - 0.5);
      ctx.stroke();
    } else {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(16,13,42,0.90)' : 'rgba(9,8,28,0.92)';
      ctx.beginPath();
      roundRect(ctx, PAD_X, cardY, W - PAD_X * 2, ch, 8);
      ctx.fill();
      const purpleBar = ctx.createLinearGradient(0, cardY, 0, cardY + ch);
      purpleBar.addColorStop(0, 'rgba(139,92,246,0.80)');
      purpleBar.addColorStop(1, 'rgba(109,40,217,0.50)');
      ctx.fillStyle = purpleBar;
      ctx.fillRect(PAD_X, cardY, 4, ch);
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      roundRect(ctx, PAD_X, cardY, W - PAD_X * 2, ch, 8);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD_X + 4, cardY + ch - 0.5);
      ctx.lineTo(PAD_X + W - PAD_X * 2, cardY + ch - 0.5);
      ctx.stroke();
    }

    ctx.textBaseline = 'middle';

    const BSIZE = isTop3 ? 26 : 20;
    if (isTop3) {
      ctx.shadowColor = medal.fill;
      ctx.shadowBlur = 24;
      const bGrad = ctx.createRadialGradient(
        BADGE_X_CENTER - 8,
        mid - 8,
        0,
        BADGE_X_CENTER,
        mid,
        BSIZE
      );
      bGrad.addColorStop(0, medal.stroke);
      bGrad.addColorStop(1, medal.fill);
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(BADGE_X_CENTER, mid, BSIZE, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.30)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(BADGE_X_CENTER, mid, BSIZE - 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = medal.dark;
      ctx.font = '900 17px "Space Grotesk", sans-serif';
    } else {
      ctx.fillStyle = 'rgba(139,92,246,0.18)';
      ctx.beginPath();
      ctx.arc(BADGE_X_CENTER, mid, BSIZE, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(139,92,246,0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(BADGE_X_CENTER, mid, BSIZE, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '600 14px "Space Grotesk", sans-serif';
    }
    ctx.textAlign = 'center';
    ctx.fillText(String(actualRank).padStart(2, '0'), BADGE_X_CENTER, mid);

    if (isTop3) {
      ctx.save();
      ctx.globalAlpha = 0.055;
      ctx.font = '900 110px "Outfit", sans-serif';
      ctx.fillStyle = medal.stroke;
      ctx.textAlign = 'left';
      ctx.fillText(String(actualRank), PAD_X + 76, mid + 10);
      ctx.restore();
    }

    const TEAM_NAME_X = PAD_X + RANK_ZONE_W + 4;
    const maxTeamW = STATS_START_X - TEAM_NAME_X - 16;
    ctx.textAlign = 'left';
    ctx.fillStyle = isTop3 ? '#FFFFFF' : 'rgba(255,255,255,0.90)';
    if (isTop3) {
      ctx.shadowColor = 'rgba(0,0,0,0.95)';
      ctx.shadowBlur = 8;
    }
    const rawName = team.team_name || 'Unknown';
    ctx.font = `${isTop3 ? '700' : '600'} ${isTop3 ? 24 : 21}px "Inter", sans-serif`;
    let displayName = rawName;
    while (ctx.measureText(displayName).width > maxTeamW && displayName.length > 4)
      displayName = displayName.substring(0, displayName.length - 1);
    if (displayName.length < rawName.length) displayName += '\u2026';
    ctx.fillText(displayName, TEAM_NAME_X, mid);
    ctx.shadowBlur = 0;

    ctx.textAlign = 'center';

    const wins = team.wins || 0;
    if (wins > 0) {
      ctx.shadowColor = 'rgba(74,222,128,0.7)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#4ADE80';
      ctx.font = `700 ${isTop3 ? 23 : 19}px "Space Grotesk", sans-serif`;
      ctx.fillText(String(wins), COL_WWCD, mid);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.20)';
      ctx.font = `400 ${isTop3 ? 20 : 17}px "Space Grotesk", sans-serif`;
      ctx.fillText('\u2014', COL_WWCD, mid);
    }

    const pp = team.position_points || 0;
    ctx.font = `${isTop3 ? '600' : '500'} ${isTop3 ? 23 : 19}px "Space Grotesk", sans-serif`;
    ctx.fillStyle = isTop3 ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.80)';
    ctx.fillText(pp > 0 ? String(pp) : '\u2014', COL_PP, mid);

    const kills = team.kill_points || 0;
    if (kills > 0) {
      ctx.fillStyle = '#FCA5A5';
      ctx.shadowColor = 'rgba(252,165,165,0.45)';
      ctx.shadowBlur = 8;
      ctx.font = `${isTop3 ? '600' : '500'} ${isTop3 ? 23 : 19}px "Space Grotesk", sans-serif`;
      ctx.fillText(String(kills), COL_FP, mid);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.20)';
      ctx.font = `400 ${isTop3 ? 20 : 17}px "Space Grotesk", sans-serif`;
      ctx.fillText('\u2014', COL_FP, mid);
    }

    const total = team.total_points || 0;
    const totalStr = String(total);
    const tFontSz = isTop3 ? 28 : 21;
    ctx.font = `${isTop3 ? '900' : '700'} ${tFontSz}px "Space Grotesk", sans-serif`;
    const totalTxtW = ctx.measureText(totalStr).width;
    const cW = Math.max(totalTxtW + 34, 68),
      cH = isTop3 ? 48 : 36;
    const cX = COL_TOTAL_X - cW / 2,
      cY2 = mid - cH / 2;
    const chipBg = ctx.createLinearGradient(cX, cY2, cX, cY2 + cH);
    chipBg.addColorStop(0, isTop3 ? AC('0.48') : AC('0.22'));
    chipBg.addColorStop(1, isTop3 ? AC('0.26') : AC('0.10'));
    ctx.fillStyle = chipBg;
    ctx.beginPath();
    roundRect(ctx, cX, cY2, cW, cH, 9);
    ctx.fill();
    ctx.strokeStyle = isTop3 ? AC('0.88') : AC('0.38');
    ctx.lineWidth = isTop3 ? 1.5 : 1;
    ctx.beginPath();
    roundRect(ctx, cX, cY2, cW, cH, 9);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cX + 10, cY2 + 1.5);
    ctx.lineTo(cX + cW - 10, cY2 + 1.5);
    ctx.stroke();
    if (isTop3) {
      ctx.shadowColor = ACCENT;
      ctx.shadowBlur = 18;
    }
    ctx.fillStyle = isTop3 ? '#FEF3C7' : '#FCD34D';
    ctx.textAlign = 'center';
    ctx.fillText(totalStr, COL_TOTAL_X, mid);
    ctx.shadowBlur = 0;

    cardY += ch + CARD_GAP;
  });

  // Footer
  const FOOTER_START = HEADER_H + COL_HDR_H + CARDS_PAD + totalCardsH + CARDS_PAD;
  const F_MID = FOOTER_START + FOOTER_H / 2;
  const footSep = ctx.createLinearGradient(PAD_X, 0, W - PAD_X, 0);
  footSep.addColorStop(0, 'rgba(255,255,255,0)');
  footSep.addColorStop(0.2, AC('0.55'));
  footSep.addColorStop(0.8, AC('0.55'));
  footSep.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = footSep;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD_X, FOOTER_START);
  ctx.lineTo(W - PAD_X, FOOTER_START);
  ctx.stroke();

  ctx.font = '800 26px "Outfit", sans-serif';
  const swF = ctx.measureText('SCRIM').width;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 10;
  ctx.fillText('SCRIM', PAD_X, F_MID);
  ctx.fillStyle = '#C084FC';
  ctx.fillText('VERSE', PAD_X + swF, F_MID);
  ctx.shadowBlur = 0;

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.09)';
  ctx.font = '500 11px "Inter", sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('SCRIMVERSE.COM', W / 2, F_MID);
  ctx.letterSpacing = '0px';

  const socials = [
    { platform: 'INSTAGRAM', handle: '@scrimverse' },
    { platform: 'YOUTUBE', handle: 'ScrimverseGG' },
  ];
  let sx = W - PAD_X;
  socials.forEach((item, idx) => {
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.60)';
    ctx.font = '500 13px "Inter", sans-serif';
    const hW = ctx.measureText(item.handle).width;
    ctx.fillText(item.handle, sx, F_MID + 11);
    ctx.fillStyle = 'rgba(255,255,255,0.26)';
    ctx.font = '700 9px "Inter", sans-serif';
    ctx.letterSpacing = '1.5px';
    const pW = ctx.measureText(item.platform).width;
    ctx.fillText(item.platform, sx, F_MID - 11);
    ctx.letterSpacing = '0px';
    sx -= Math.max(hW, pW) + 28;
    if (idx < socials.length - 1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + 14, F_MID - 18);
      ctx.lineTo(sx + 14, F_MID + 18);
      ctx.stroke();
    }
  });

  const btmBar = ctx.createLinearGradient(0, 0, W, 0);
  btmBar.addColorStop(0, AC('0'));
  btmBar.addColorStop(0.15, AC('1'));
  btmBar.addColorStop(0.85, AC('1'));
  btmBar.addColorStop(1, AC('0'));
  ctx.fillStyle = btmBar;
  ctx.fillRect(0, TOTAL_H - 5, W, 5);

  return canvas.toDataURL('image/png', 1.0);
};

// Returns string[] — always an array (1 item for ≤15 teams, multiple pages for larger rosters)
export const generateStandingsImage = async ({
  tournament,
  standings,
  viewMode,
  selectedRound,
  selectedMatch,
  selectedGroup,
  getRoundLabel,
}) => {
  await loadPremiumFonts();

  // Load custom background image for page 1
  let bgImage = null;
  try {
    bgImage = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = pointsTableBg;
    });
  } catch {
    // fallback to procedural rendering if image fails
  }

  const pg1Max = bgImage ? BG_MAX_ROWS_PG1 : TEAMS_PAGE_1;

  const chunks = [];
  if (standings.length <= pg1Max) {
    chunks.push(standings);
  } else {
    chunks.push(standings.slice(0, pg1Max));
    let i = pg1Max;
    while (i < standings.length) {
      chunks.push(standings.slice(i, i + TEAMS_PAGE_N));
      i += TEAMS_PAGE_N;
    }
  }

  const totalPages = chunks.length;
  const baseParams = {
    tournament,
    viewMode,
    selectedRound,
    selectedMatch,
    selectedGroup,
    getRoundLabel,
  };
  let rankOffset = 0;

  return chunks.map((chunk, p) => {
    const url = _renderStandingsPage({
      ...baseParams,
      standings: chunk,
      pageNum: p + 1,
      totalPages,
      rankOffset,
      bgImage: p === 0 ? bgImage : null,
    });
    rankOffset += chunk.length;
    return url;
  });
};

// ─── 5v5 Lobby-based Image Generator ────────────────────────────────────────

export const generate5v5Image = async ({
  tournament,
  lobbies,
  viewMode,
  selectedRound,
  selectedMatch,
  getRoundLabel,
}) => {
  await loadPremiumFonts();

  return new Promise((resolve, reject) => {
    try {
      const bgImage = new Image();
      bgImage.crossOrigin = 'anonymous';

      bgImage.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const W = 1080;
        const HEADER_H = 420;
        const CARD_H = 160;
        const CARD_GAP = 24;
        const FOOTER_H = 130;
        const PAD = 50;
        const CARDS_H = lobbies.length * CARD_H + (lobbies.length - 1) * CARD_GAP;
        const TOTAL_H = HEADER_H + CARDS_H + FOOTER_H + 40;

        canvas.width = W;
        canvas.height = TOTAL_H;

        // Background
        ctx.fillStyle = '#06060f';
        ctx.fillRect(0, 0, W, TOTAL_H);
        const scale = Math.max(W / bgImage.width, TOTAL_H / bgImage.height);
        const imgW = bgImage.width * scale;
        const imgH = bgImage.height * scale;
        ctx.drawImage(bgImage, (W - imgW) / 2, (TOTAL_H - imgH) / 2, imgW, imgH);

        const ov = ctx.createLinearGradient(0, 0, 0, TOTAL_H);
        ov.addColorStop(0, 'rgba(6,6,15,0.90)');
        ov.addColorStop(0.3, 'rgba(6,6,15,0.50)');
        ov.addColorStop(0.7, 'rgba(6,6,15,0.68)');
        ov.addColorStop(1, 'rgba(6,6,15,0.94)');
        ctx.fillStyle = ov;
        ctx.fillRect(0, 0, W, TOTAL_H);

        const sv = ctx.createLinearGradient(0, 0, W, 0);
        sv.addColorStop(0, 'rgba(6,6,15,0.45)');
        sv.addColorStop(0.18, 'rgba(6,6,15,0)');
        sv.addColorStop(0.82, 'rgba(6,6,15,0)');
        sv.addColorStop(1, 'rgba(6,6,15,0.45)');
        ctx.fillStyle = sv;
        ctx.fillRect(0, 0, W, TOTAL_H);

        ctx.textBaseline = 'middle';

        // SCRIMVERSE logo
        const LOGO_Y = 66;
        ctx.font = '800 46px "Outfit", sans-serif';
        const sw = ctx.measureText('SCRIM').width;
        const vw = ctx.measureText('VERSE').width;
        const logoX = W / 2 - (sw + vw) / 2;
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.fillText('SCRIM', logoX, LOGO_Y);
        ctx.fillStyle = '#C084FC';
        ctx.fillText('VERSE', logoX + sw, LOGO_Y);
        ctx.shadowBlur = 0;

        ctx.strokeStyle = 'rgba(255,255,255,0.13)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PAD, LOGO_Y + 40);
        ctx.lineTo(W - PAD, LOGO_Y + 40);
        ctx.stroke();

        // Stage heading
        let stageHeading = '';
        let subtitleLabel = '';
        if (viewMode === 'match') {
          const rName =
            tournament?.round_names?.[String(selectedRound)] || getRoundLabel(selectedRound);
          stageHeading = rName.toUpperCase();
          subtitleLabel = `MATCH ${selectedMatch} RESULTS`;
        } else {
          stageHeading = (
            tournament?.round_names?.[String(selectedRound)] || getRoundLabel(selectedRound)
          ).toUpperCase();
          subtitleLabel = `${lobbies.length} LOBBY RESULTS`;
        }

        const STAGE_Y = LOGO_Y + 40 + 96;
        let headingSize = 96;
        ctx.font = `900 ${headingSize}px "Outfit", sans-serif`;
        while (ctx.measureText(stageHeading).width > W - PAD * 4 && headingSize > 48) {
          headingSize -= 4;
          ctx.font = `900 ${headingSize}px "Outfit", sans-serif`;
        }
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.95)';
        ctx.shadowBlur = 50;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(stageHeading, W / 2, STAGE_Y);
        ctx.shadowBlur = 0;

        const PILL_Y = STAGE_Y + headingSize / 2 + 44;
        ctx.font = '800 20px "Inter", sans-serif';
        ctx.letterSpacing = '3px';
        const pTW = ctx.measureText(subtitleLabel).width;
        const pPX = 36;
        const pH = 42;
        const pW = pTW + pPX * 2;
        ctx.fillStyle = '#D97706';
        ctx.beginPath();
        roundRect(ctx, W / 2 - pW / 2, PILL_Y - pH / 2, pW, pH, 6);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText(subtitleLabel, W / 2, PILL_Y);
        ctx.letterSpacing = '0px';

        const INFO_Y = PILL_Y + 56;
        const infoParts = [];
        if (tournament?.game_name) infoParts.push(tournament.game_name.toUpperCase());
        if (tournament?.title) {
          const t = tournament.title.toUpperCase();
          infoParts.push(t.length > 50 ? t.substring(0, 48) + '…' : t);
        }
        ctx.fillStyle = 'rgba(255,255,255,0.50)';
        ctx.font = '500 19px "Inter", sans-serif';
        ctx.letterSpacing = '1px';
        ctx.textAlign = 'center';
        ctx.fillText(infoParts.join('   ·   '), W / 2, INFO_Y);
        ctx.letterSpacing = '0px';

        // Lobby cards
        let cardY = HEADER_H + 20;
        lobbies.forEach((lobby) => {
          const teamA = lobby.teams[0];
          const teamB = lobby.teams[1];
          const aIsWinner = lobby.winner_id && teamA && lobby.winner_id === teamA.team_id;
          const bIsWinner = lobby.winner_id && teamB && lobby.winner_id === teamB.team_id;
          const cardW = W - PAD * 2;

          ctx.fillStyle = 'rgba(0,0,0,0.58)';
          ctx.beginPath();
          roundRect(ctx, PAD, cardY, cardW, CARD_H, 12);
          ctx.fill();

          ctx.strokeStyle = 'rgba(255,255,255,0.07)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          roundRect(ctx, PAD, cardY, cardW, CARD_H, 12);
          ctx.stroke();

          const HBH = 36;
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          ctx.beginPath();
          roundRect(ctx, PAD, cardY, cardW, HBH, [12, 12, 0, 0]);
          ctx.fill();

          ctx.fillStyle = '#4ADE80';
          ctx.font = '800 13px "Inter", sans-serif';
          ctx.textAlign = 'left';
          ctx.letterSpacing = '2px';
          ctx.fillText(`LOBBY ${lobby.lobby_number}`, PAD + 20, cardY + HBH / 2);
          ctx.letterSpacing = '0px';

          if (lobby.map_name) {
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.font = '600 13px "Inter", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(lobby.map_name, PAD + cardW - 20, cardY + HBH / 2);
          }

          const matchupY = cardY + HBH + (CARD_H - HBH) / 2;
          const centerX = W / 2;

          const teamAName = teamA?.team_name || 'TBD';
          const teamADisplay = teamAName.length > 20 ? teamAName.substring(0, 18) + '…' : teamAName;
          ctx.textAlign = 'right';
          ctx.font = '700 26px "Inter", sans-serif';
          ctx.fillStyle = aIsWinner ? '#4ADE80' : '#FFFFFF';
          ctx.fillText(teamADisplay, centerX - 130, matchupY);

          if (aIsWinner) {
            ctx.fillStyle = '#FFC107';
            ctx.font = '18px sans-serif';
            ctx.fillText(
              '\u{1F451}',
              centerX - 136 - ctx.measureText(teamADisplay).width,
              matchupY
            );
          }

          const scoreBoxW = 200;
          const scoreBoxH = 52;
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.beginPath();
          roundRect(
            ctx,
            centerX - scoreBoxW / 2,
            matchupY - scoreBoxH / 2,
            scoreBoxW,
            scoreBoxH,
            10
          );
          ctx.fill();

          const scoreA = lobby.has_scores || viewMode === 'results' ? (teamA?.score ?? 0) : '—';
          ctx.textAlign = 'center';
          ctx.font = '900 32px "Space Grotesk", sans-serif';
          ctx.fillStyle = aIsWinner ? '#4ADE80' : '#FFFFFF';
          ctx.fillText(String(scoreA), centerX - 50, matchupY);

          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.font = '700 28px "Space Grotesk", sans-serif';
          ctx.fillText('–', centerX, matchupY);

          const scoreB = lobby.has_scores || viewMode === 'results' ? (teamB?.score ?? 0) : '—';
          ctx.font = '900 32px "Space Grotesk", sans-serif';
          ctx.fillStyle = bIsWinner ? '#4ADE80' : '#FFFFFF';
          ctx.fillText(String(scoreB), centerX + 50, matchupY);

          const teamBName = teamB?.team_name || 'TBD';
          const teamBDisplay = teamBName.length > 20 ? teamBName.substring(0, 18) + '…' : teamBName;
          ctx.textAlign = 'left';
          ctx.font = '700 26px "Inter", sans-serif';
          ctx.fillStyle = bIsWinner ? '#4ADE80' : '#FFFFFF';
          ctx.fillText(teamBDisplay, centerX + 130, matchupY);

          if (bIsWinner) {
            const bW = ctx.measureText(teamBDisplay).width;
            ctx.fillStyle = '#FFC107';
            ctx.font = '18px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('\u{1F451}', centerX + 136 + bW, matchupY);
          }

          cardY += CARD_H + CARD_GAP;
        });

        // Footer
        const TABLE_END_Y = cardY - CARD_GAP + 20;
        const F_MID = TABLE_END_Y + (FOOTER_H - 16) / 2;

        ctx.strokeStyle = 'rgba(255,255,255,0.10)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PAD, TABLE_END_Y);
        ctx.lineTo(W - PAD, TABLE_END_Y);
        ctx.stroke();

        ctx.font = '800 30px "Outfit", sans-serif';
        const sw2 = ctx.measureText('SCRIM').width;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 12;
        ctx.fillText('SCRIM', PAD + 16, F_MID);
        ctx.fillStyle = '#C084FC';
        ctx.fillText('VERSE', PAD + 16 + sw2, F_MID);
        ctx.shadowBlur = 0;

        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.font = '500 14px "Inter", sans-serif';
        ctx.letterSpacing = '3px';
        ctx.fillText('SCRIMVERSE.COM', W / 2, F_MID);
        ctx.letterSpacing = '0px';

        const socialItems = [
          { platform: 'INSTAGRAM', handle: '@scrimverse' },
          { platform: 'YOUTUBE', handle: 'ScrimverseGG' },
        ];

        let sx = W - PAD - 16;
        socialItems.forEach((item, idx) => {
          ctx.textAlign = 'right';
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.font = '500 15px "Inter", sans-serif';
          const hW = ctx.measureText(item.handle).width;
          ctx.fillText(item.handle, sx, F_MID + 11);
          ctx.fillStyle = 'rgba(255,255,255,0.30)';
          ctx.font = '700 11px "Inter", sans-serif';
          ctx.letterSpacing = '1.5px';
          const pW = ctx.measureText(item.platform).width;
          ctx.fillText(item.platform, sx, F_MID - 11);
          ctx.letterSpacing = '0px';
          sx -= Math.max(hW, pW) + 36;
          if (idx < socialItems.length - 1) {
            ctx.strokeStyle = 'rgba(255,255,255,0.14)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(sx + 18, F_MID - 20);
            ctx.lineTo(sx + 18, F_MID + 20);
            ctx.stroke();
          }
        });

        resolve(canvas.toDataURL('image/png', 1.0));
      };

      bgImage.onerror = () => {
        bgImage.src = BACKGROUND_IMAGE_URL;
      };
      bgImage.src = UPLOADED_BG;
    } catch (e) {
      reject(e);
    }
  });
};
