// Scrimverse Leaderboard Image Generator
// Mirrors standingsImageGenerator.js design — uses same pointtablenew.png background

import pointsTableBg from '../assets/pointtablenew.png';
import smrLogo from '../assets/smrlogo.png';

// ─── Custom background image calibration (pointtablenew.png 1086×1449 → scaled to 1080×1441) ─
const BG_TITLE_Y = 355; // Center Y of dynamic title text
const BG_TABLE_ROW_START_Y = 602.5; // Center Y of first data row
const BG_ROW_H = 34.05; // Height of each row slot in the background image
const BG_MAX_ROWS_PG1 = 20; // Rows available per canvas with custom bg

// Column center X positions (image is 1086px → 1080px canvas, near 1:1 scale):
const BG_COL_RANK_X = 185; // # column
const BG_COL_TEAM_LEFT_X = 252; // Team name left-align start
const BG_COL_WWCD_X = 590; // WINS column center
const BG_COL_PP_X = 690; // POS PTS column center
const BG_COL_KP_X = 794; // KILL PTS column center
const BG_COL_TOTAL_X = 898; // TOTAL column center

// Purple accent for global leaderboard
const ACCENT = '#9333EA';
const ACCENT_R = 147;
const ACCENT_G = 51;
const ACCENT_B = 234;

const AC = (a) => `rgba(${ACCENT_R},${ACCENT_G},${ACCENT_B},${a})`;

// 5v5 games use wins-only layout
const WINS_ONLY_GAMES = ['Valorant', 'COD'];

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

const loadImage = (url) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });

/**
 * Render a single leaderboard canvas page using the custom background image.
 * @param {object} params
 * @param {Array}  params.chunk       - slice of leaderboard entries for this page
 * @param {number} params.rankOffset  - 0-based index of first entry on this page
 * @param {string} params.gameFilter  - e.g. "BGMI", "ALL"
 * @param {string} params.activeTab   - "tournaments" or "scrims"
 * @param {number} params.pageNum     - 1-based page number
 * @param {number} params.totalPages  - total page count
 * @param {HTMLImageElement|null} params.bgImage   - loaded background HTMLImageElement
 * @param {HTMLImageElement|null} params.logoImage - loaded SMR logo HTMLImageElement
 * @returns {string} PNG data URL
 */
const _renderLeaderboardPage = ({
  chunk,
  rankOffset,
  gameFilter,
  activeTab,
  pageNum,
  totalPages,
  bgImage,
  logoImage,
}) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const W = 1080;
  const PAD_X = 32;
  const isWinsOnly = WINS_ONLY_GAMES.includes(gameFilter);

  // ── Custom background image path ────────────────────────────────────────────
  if (bgImage) {
    const imgScaledH = Math.round((bgImage.naturalHeight / bgImage.naturalWidth) * W);
    canvas.width = W;
    canvas.height = imgScaledH;
    ctx.drawImage(bgImage, 0, 0, W, imgScaledH);

    // Draw SMR logo top-left area
    if (logoImage) {
      ctx.font = '800 30px "Outfit", sans-serif';
      const swL = ctx.measureText('SCRIM').width;
      const vwL = ctx.measureText('VERSE').width;
      const textWidth = swL + vwL;
      const logoH = 68;
      const logoW = (logoImage.naturalWidth / logoImage.naturalHeight) * logoH;
      const logoX = PAD_X + textWidth + 15;
      const logoY = 16;
      ctx.drawImage(logoImage, logoX, logoY, logoW, logoH);
    }

    // Stage heading — "GLOBAL LEADERBOARD"
    const stageHeading = 'GLOBAL LEADERBOARD';

    // Subtitle badge — e.g. "TOURNAMENTS RANKINGS  ·  PAGE 1 OF 3"
    let subtitleLabel = `${activeTab.toUpperCase()} RANKINGS`;
    if (totalPages > 1) {
      subtitleLabel += `   ·   PAGE ${pageNum} OF ${totalPages}`;
    }

    ctx.textBaseline = 'middle';

    // Big heading — capped at 72px so it doesn't overpower the background art
    let headingSize = 72;
    ctx.font = `900 ${headingSize}px "Outfit", sans-serif`;
    while (ctx.measureText(stageHeading).width > W - PAD_X * 4 && headingSize > 40) {
      headingSize -= 4;
      ctx.font = `900 ${headingSize}px "Outfit", sans-serif`;
    }
    ctx.shadowColor = 'rgba(147,51,234,0.65)';
    ctx.shadowBlur = 70;
    const titleGrad = ctx.createLinearGradient(
      0,
      BG_TITLE_Y - headingSize / 2,
      0,
      BG_TITLE_Y + headingSize / 2
    );
    titleGrad.addColorStop(0, '#FFFFFF');
    titleGrad.addColorStop(1, '#9333EA');
    ctx.fillStyle = titleGrad;
    ctx.textAlign = 'center';
    ctx.fillText(stageHeading, W / 2, BG_TITLE_Y);
    ctx.shadowBlur = 0;

    // Decorative lines + diamonds flanking title
    const headW = ctx.measureText(stageHeading).width;
    const DGAP = 28;
    const lEndX = W / 2 - headW / 2 - DGAP;
    const rStartX = W / 2 + headW / 2 + DGAP;
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
    const stPillW = stLabelW + 56;
    const stPillH = 34;
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

    // Info line — game filter + SCRIMVERSE
    const gameLabel = gameFilter === 'ALL' ? 'ALL GAMES' : gameFilter.toUpperCase();
    const infoText = `${gameLabel}   ·   SCRIMVERSE`;
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = '500 14px "Inter", sans-serif';
    ctx.letterSpacing = '1.5px';
    ctx.textAlign = 'center';
    ctx.fillText(infoText, W / 2, stPillY + 32);
    ctx.letterSpacing = '0px';

    // Data rows
    chunk.forEach((team, i) => {
      const actualRank = rankOffset + i + 1;
      const rowMidY = BG_TABLE_ROW_START_Y + i * BG_ROW_H;

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

      ctx.textAlign = 'center';

      // WINS column
      const winsVal = activeTab === 'scrims' ? (team.scrim_wins ?? 0) : (team.tournament_wins ?? 0);
      ctx.font = '700 16px "Inter", sans-serif';
      ctx.fillStyle = winsVal > 0 ? '#4ade80' : 'rgba(255,255,255,0.55)';
      ctx.fillText(String(winsVal), BG_COL_WWCD_X, rowMidY);

      if (!isWinsOnly) {
        // POS PTS
        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.fillText(String(team.total_position_points ?? 0), BG_COL_PP_X, rowMidY);

        // KILL PTS
        ctx.fillText(String(team.total_kill_points ?? 0), BG_COL_KP_X, rowMidY);

        // TOTAL
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
      }
    });

    return canvas.toDataURL('image/png', 1.0);
  }

  // ── Fallback: no background image — solid dark canvas ───────────────────────
  // This path is a safety net; the custom bg should always load in production.
  const HEADER_H = 320;
  const ROW_H = 44;
  const FOOTER_H = 90;
  const TOTAL_H = HEADER_H + chunk.length * ROW_H + FOOTER_H;
  canvas.width = W;
  canvas.height = TOTAL_H;

  ctx.fillStyle = '#02020E';
  ctx.fillRect(0, 0, W, TOTAL_H);

  const blobTop = ctx.createRadialGradient(W / 2, -40, 0, W / 2, -40, W * 0.72);
  blobTop.addColorStop(0, AC('0.32'));
  blobTop.addColorStop(0.45, AC('0.10'));
  blobTop.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = blobTop;
  ctx.fillRect(0, 0, W, HEADER_H + 120);

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
  ctx.fillText('SCRIM', PAD_X, LOGO_Y);
  ctx.fillStyle = '#C084FC';
  ctx.fillText('VERSE', PAD_X + swL, LOGO_Y);

  // Heading
  const STAGE_Y = LOGO_Y + 150;
  ctx.font = '900 80px "Outfit", sans-serif';
  ctx.shadowColor = AC('0.45');
  ctx.shadowBlur = 70;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText('GLOBAL LEADERBOARD', W / 2, STAGE_Y);
  ctx.shadowBlur = 0;

  // Subtitle
  let subtitleLabel = `${activeTab.toUpperCase()} RANKINGS`;
  if (totalPages > 1) subtitleLabel += `   ·   PAGE ${pageNum} OF ${totalPages}`;
  const SUBTITLE_Y = STAGE_Y + 80;
  ctx.font = '700 15px "Inter", sans-serif';
  ctx.letterSpacing = '4px';
  const stLabelW = ctx.measureText(subtitleLabel).width;
  const stPillW = stLabelW + 56;
  const stPillH = 34;
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

  // Rows
  chunk.forEach((team, i) => {
    const actualRank = rankOffset + i + 1;
    const rowY = HEADER_H + i * ROW_H;
    const mid = rowY + ROW_H / 2;

    ctx.fillStyle = i % 2 === 0 ? 'rgba(16,13,42,0.90)' : 'rgba(9,8,28,0.92)';
    ctx.fillRect(PAD_X, rowY, W - PAD_X * 2, ROW_H);

    const medalColor =
      actualRank === 1
        ? '#F59E0B'
        : actualRank === 2
          ? '#94A3B8'
          : actualRank === 3
            ? '#B45309'
            : null;

    ctx.font = medalColor ? '800 19px "Inter", sans-serif' : '700 16px "Inter", sans-serif';
    ctx.fillStyle = medalColor || 'rgba(255,255,255,0.60)';
    ctx.textAlign = 'center';
    ctx.fillText(String(actualRank), BG_COL_RANK_X, mid);

    ctx.font = '600 17px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.90)';
    ctx.textAlign = 'left';
    const rawName = (team.team_name || '—').toUpperCase();
    ctx.fillText(
      rawName.length > 22 ? rawName.substring(0, 21) + '…' : rawName,
      BG_COL_TEAM_LEFT_X,
      mid
    );

    ctx.textAlign = 'center';
    const winsVal = activeTab === 'scrims' ? (team.scrim_wins ?? 0) : (team.tournament_wins ?? 0);
    ctx.font = '700 16px "Inter", sans-serif';
    ctx.fillStyle = winsVal > 0 ? '#4ade80' : 'rgba(255,255,255,0.55)';
    ctx.fillText(String(winsVal), BG_COL_WWCD_X, mid);

    if (!isWinsOnly) {
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.fillText(String(team.total_position_points ?? 0), BG_COL_PP_X, mid);
      ctx.fillText(String(team.total_kill_points ?? 0), BG_COL_KP_X, mid);
      ctx.font = '800 17px "Inter", sans-serif';
      ctx.fillStyle =
        actualRank === 1
          ? '#FDE68A'
          : actualRank === 2
            ? '#E2E8F0'
            : actualRank === 3
              ? '#D97706'
              : '#C084FC';
      ctx.fillText(String(team.total_points ?? 0), BG_COL_TOTAL_X, mid);
    }
  });

  // Footer
  const FOOTER_START = HEADER_H + chunk.length * ROW_H;
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

  const btmBar = ctx.createLinearGradient(0, 0, W, 0);
  btmBar.addColorStop(0, AC('0'));
  btmBar.addColorStop(0.15, AC('1'));
  btmBar.addColorStop(0.85, AC('1'));
  btmBar.addColorStop(1, AC('0'));
  ctx.fillStyle = btmBar;
  ctx.fillRect(0, TOTAL_H - 5, W, 5);

  return canvas.toDataURL('image/png', 1.0);
};

/**
 * Generate leaderboard images, one per 20-team chunk.
 * @param {Array}  leaderboard  - full leaderboard array (up to 50 teams)
 * @param {string} gameFilter   - e.g. "BGMI", "ALL"
 * @param {string} activeTab    - "tournaments" or "scrims"
 * @returns {Promise<Array<{dataUrl: string, label: string}>>}
 *   Array of { dataUrl, label } — label is e.g. "1-20", "21-40", "41-50"
 */
export async function generateLeaderboardImages(leaderboard, gameFilter, activeTab) {
  await loadPremiumFonts();

  const [bgImage, logoImage] = await Promise.all([loadImage(pointsTableBg), loadImage(smrLogo)]);

  // Split into chunks of BG_MAX_ROWS_PG1 (20)
  const chunks = [];
  let idx = 0;
  while (idx < leaderboard.length) {
    chunks.push(leaderboard.slice(idx, idx + BG_MAX_ROWS_PG1));
    idx += BG_MAX_ROWS_PG1;
  }
  if (chunks.length === 0) return [];

  const totalPages = chunks.length;
  let rankOffset = 0;

  return chunks.map((chunk, p) => {
    const startRank = rankOffset + 1;
    const endRank = rankOffset + chunk.length;
    const label = `${startRank}-${endRank}`;

    const dataUrl = _renderLeaderboardPage({
      chunk,
      rankOffset,
      gameFilter,
      activeTab,
      pageNum: p + 1,
      totalPages,
      bgImage,
      logoImage,
    });

    rankOffset += chunk.length;
    return { dataUrl, label };
  });
}
