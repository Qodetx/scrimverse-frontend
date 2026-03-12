// PREMIUM Scrimverse Standings Image Generator
// Creates ultra-premium, Instagram-ready tournament standings

const BACKGROUND_IMAGE_URL = '/standings-bg.jpeg';

// Premium font loading helper with modern fonts
const loadPremiumFonts = () => {
  return new Promise((resolve) => {
    // Load Google Fonts dynamically - Using Outfit for Branding and Inter/Space Grotesk for details
    const fontLink = document.createElement('link');
    fontLink.href =
      'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    // Wait a bit for fonts to load
    setTimeout(resolve, 500);
  });
};

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

  // Use the newest uploaded background image
  const UPLOADED_BG =
    'https://scrimverse-public.s3.ap-south-1.amazonaws.com/media/uploaded_media_1769422838293.jpg';
  // Fallback to existing path if needed
  const finalBgUrl = UPLOADED_BG || BACKGROUND_IMAGE_URL;

  return new Promise((resolve, reject) => {
    try {
      const bgImage = new Image();
      bgImage.crossOrigin = 'anonymous';

      bgImage.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Layout Constants
        const width = 1080;
        const headerHeight = 360;
        const rowHeight = 72;
        const footerHeight = 180;
        const tablePadding = 50;
        const totalHeight = headerHeight + standings.length * rowHeight + footerHeight;

        canvas.width = width;
        canvas.height = totalHeight;

        // 1. Draw Background
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, width, totalHeight);

        // Draw the background image
        const scale = Math.max(width / bgImage.width, totalHeight / bgImage.height);
        const imgW = bgImage.width * scale;
        const imgH = bgImage.height * scale;
        const offsetX = (width - imgW) / 2;
        const offsetY = (totalHeight - imgH) / 2;
        ctx.drawImage(bgImage, offsetX, offsetY, imgW, imgH);

        // Dark Overlay for High Contrast Legibility
        const overlay = ctx.createLinearGradient(0, 0, 0, totalHeight);
        overlay.addColorStop(0, 'rgba(0,0,0,0.75)'); // Heavier at top for branding
        overlay.addColorStop(0.35, 'rgba(0,0,0,0.4)');
        overlay.addColorStop(0.75, 'rgba(0,0,0,0.6)');
        overlay.addColorStop(1, 'rgba(0,0,0,0.85)'); // Heavier at bottom for footer
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, width, totalHeight);

        // 2. Branding (Premium Logo Style with Glow)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const logoY = 100;

        ctx.font = '950 80px "Outfit", sans-serif';
        ctx.letterSpacing = '-1.5px';

        const scrimText = 'SCRIM';
        const verseText = 'VERSE';
        const scrimWidth = ctx.measureText(scrimText).width;
        const verseWidth = ctx.measureText(verseText).width;
        const totalLogoW = scrimWidth + verseWidth;
        const startX = (width - totalLogoW) / 2;

        // Branding Shadow for Contrast
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 30;

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.fillText(scrimText, startX, logoY);

        // VS Style Purple Glow for VERSE
        ctx.shadowColor = 'rgba(255, 193, 7, 0.35)';
        ctx.shadowBlur = 40;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(verseText, startX + scrimWidth, logoY);

        ctx.shadowBlur = 0;
        ctx.letterSpacing = '0px';

        // 3. Header Information (Simplified and Sharp)
        let infoY = 220;
        ctx.textAlign = 'center';

        // Tournament Title (Sharp White)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 36px "Inter", sans-serif';
        const tTitle = (tournament?.title || 'Tournament Standings').toUpperCase();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText(tTitle, width / 2, infoY);
        ctx.shadowBlur = 0;

        infoY += 60;

        // Metadata: Game | Round | Group (High Visibility Gold)
        const details = [];
        if (tournament?.game_name) details.push(tournament.game_name.toUpperCase());

        let roundLabel = '';
        if (viewMode === 'match') {
          roundLabel = `MATCH ${selectedMatch}`;
        } else {
          roundLabel =
            tournament?.round_names?.[String(selectedRound)] || getRoundLabel(selectedRound);
        }
        if (roundLabel) details.push(roundLabel.toUpperCase());

        if (selectedGroup?.group_name) {
          details.push(selectedGroup.group_name.toUpperCase());
        }

        const detailsStr = details.join('   •   ');
        ctx.fillStyle = '#FFC107'; // Vivid Amber
        ctx.font = '700 24px "Space Grotesk", sans-serif';
        ctx.letterSpacing = '3px';
        ctx.fillText(detailsStr, width / 2, infoY);
        ctx.letterSpacing = '0px';

        // 4. Standings Section
        const tableY = headerHeight + 20;

        // Table Header Styling
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.roundRect(tablePadding, tableY, width - tablePadding * 2, 54, 8);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '900 14px "Inter", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('RANK', tablePadding + 30, tableY + 27);
        ctx.fillText('TEAM NAME', tablePadding + 140, tableY + 27);
        ctx.textAlign = 'center';
        ctx.fillText('W', width - 380, tableY + 27);
        ctx.fillText('POS', width - 290, tableY + 27);
        ctx.fillText('K', width - 210, tableY + 27);
        ctx.fillText('TOTAL', width - 100, tableY + 27);

        // Rows (Uniform for all ranks)
        standings.forEach((team, i) => {
          const ry = tableY + 70 + i * rowHeight;
          const rank = i + 1;

          // Row background (Solid contrast)
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.beginPath();
          ctx.roundRect(tablePadding, ry, width - tablePadding * 2, rowHeight - 10, 8);
          ctx.fill();

          // Left Highlight Strip
          ctx.fillStyle = 'rgba(255, 193, 7, 0.6)';
          ctx.fillRect(tablePadding, ry + 15, 4, rowHeight - 40);

          ctx.textBaseline = 'middle';

          // Rank
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.font = '700 24px "Space Grotesk", sans-serif';
          ctx.fillText(String(rank).padStart(2, '0'), tablePadding + 50, ry + rowHeight / 2 - 5);

          // Team Name
          ctx.textAlign = 'left';
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '700 22px "Inter", sans-serif';
          const tName = team.team_name || 'Anonymous';
          ctx.fillText(
            tName.length > 30 ? tName.substring(0, 28) + '...' : tName,
            tablePadding + 140,
            ry + rowHeight / 2 - 5
          );

          // Stats
          ctx.textAlign = 'center';
          ctx.font = '700 22px "Space Grotesk", sans-serif';

          // Wins
          ctx.fillStyle = (team.wins || 0) > 0 ? '#4ADE80' : 'rgba(255, 255, 255, 0.4)';
          ctx.fillText(team.wins || 0, width - 380, ry + rowHeight / 2 - 5);

          // Position Points
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.fillText(team.position_points || 0, width - 290, ry + rowHeight / 2 - 5);

          // Kill Points
          ctx.fillStyle = (team.kill_points || 0) > 0 ? '#F87171' : 'rgba(255, 255, 255, 0.4)';
          ctx.fillText(team.kill_points || 0, width - 210, ry + rowHeight / 2 - 5);

          // Total Highlighted
          ctx.fillStyle = '#FFC107';
          ctx.font = '900 28px "Space Grotesk", sans-serif';
          ctx.fillText(team.total_points || 0, width - 100, ry + rowHeight / 2 - 5);
        });

        // 5. Footer Branding
        const fy = totalHeight - footerHeight;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 24px "Outfit", sans-serif';
        ctx.letterSpacing = '6px';
        ctx.globalAlpha = 0.5;
        ctx.fillText('SCRIMVERSE.COM', width / 2, fy + 120);
        ctx.globalAlpha = 1.0;
        ctx.letterSpacing = '0px';

        resolve(canvas.toDataURL('image/png', 1.0));
      };

      bgImage.onerror = () => {
        bgImage.src = BACKGROUND_IMAGE_URL;
      };
      bgImage.src = finalBgUrl;
    } catch (e) {
      reject(e);
    }
  });
};

// 5v5 Lobby-based Image Generator
// Renders all lobbies with team matchups (Team A score - score Team B)
export const generate5v5Image = async ({
  tournament,
  lobbies,
  viewMode,
  selectedRound,
  selectedMatch,
  getRoundLabel,
}) => {
  await loadPremiumFonts();

  const UPLOADED_BG =
    'https://scrimverse-public.s3.ap-south-1.amazonaws.com/media/uploaded_media_1769422838293.jpg';
  const finalBgUrl = UPLOADED_BG || BACKGROUND_IMAGE_URL;

  return new Promise((resolve, reject) => {
    try {
      const bgImage = new Image();
      bgImage.crossOrigin = 'anonymous';

      bgImage.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Layout Constants
        const width = 1080;
        const headerHeight = 360;
        const lobbyCardHeight = 160;
        const lobbyGap = 24;
        const footerHeight = 180;
        const sidePadding = 50;
        const lobbiesHeight = lobbies.length * lobbyCardHeight + (lobbies.length - 1) * lobbyGap;
        const totalHeight = headerHeight + lobbiesHeight + footerHeight + 40;

        canvas.width = width;
        canvas.height = totalHeight;

        // 1. Draw Background
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, width, totalHeight);

        const scale = Math.max(width / bgImage.width, totalHeight / bgImage.height);
        const imgW = bgImage.width * scale;
        const imgH = bgImage.height * scale;
        const offsetX = (width - imgW) / 2;
        const offsetY = (totalHeight - imgH) / 2;
        ctx.drawImage(bgImage, offsetX, offsetY, imgW, imgH);

        // Dark Overlay
        const overlay = ctx.createLinearGradient(0, 0, 0, totalHeight);
        overlay.addColorStop(0, 'rgba(0,0,0,0.75)');
        overlay.addColorStop(0.35, 'rgba(0,0,0,0.4)');
        overlay.addColorStop(0.75, 'rgba(0,0,0,0.6)');
        overlay.addColorStop(1, 'rgba(0,0,0,0.85)');
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, width, totalHeight);

        // 2. Branding
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const logoY = 100;

        ctx.font = '950 80px "Outfit", sans-serif';
        ctx.letterSpacing = '-1.5px';

        const scrimText = 'SCRIM';
        const verseText = 'VERSE';
        const scrimWidth = ctx.measureText(scrimText).width;
        const verseWidth = ctx.measureText(verseText).width;
        const totalLogoW = scrimWidth + verseWidth;
        const startX = (width - totalLogoW) / 2;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.fillText(scrimText, startX, logoY);

        ctx.shadowColor = 'rgba(255, 193, 7, 0.35)';
        ctx.shadowBlur = 40;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(verseText, startX + scrimWidth, logoY);

        ctx.shadowBlur = 0;
        ctx.letterSpacing = '0px';

        // 3. Header Info
        let infoY = 220;
        ctx.textAlign = 'center';

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 36px "Inter", sans-serif';
        const tTitle = (tournament?.title || 'Tournament Results').toUpperCase();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText(tTitle, width / 2, infoY);
        ctx.shadowBlur = 0;

        infoY += 60;

        // Metadata
        const details = [];
        if (tournament?.game_name) details.push(tournament.game_name.toUpperCase());

        let roundLabel = '';
        if (viewMode === 'match') {
          roundLabel = `MATCH ${selectedMatch}`;
        } else {
          roundLabel =
            tournament?.round_names?.[String(selectedRound)] || getRoundLabel(selectedRound);
        }
        if (roundLabel) details.push(roundLabel.toUpperCase());
        details.push(`${lobbies.length} LOBBIES`);

        const detailsStr = details.join('   •   ');
        ctx.fillStyle = '#FFC107';
        ctx.font = '700 24px "Space Grotesk", sans-serif';
        ctx.letterSpacing = '3px';
        ctx.fillText(detailsStr, width / 2, infoY);
        ctx.letterSpacing = '0px';

        // 4. Lobby Cards
        let cardY = headerHeight + 20;

        lobbies.forEach((lobby) => {
          const teamA = lobby.teams[0];
          const teamB = lobby.teams[1];
          const aIsWinner = lobby.winner_id && teamA && lobby.winner_id === teamA.team_id;
          const bIsWinner = lobby.winner_id && teamB && lobby.winner_id === teamB.team_id;
          const cardWidth = width - sidePadding * 2;

          // Card background
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.beginPath();
          ctx.roundRect(sidePadding, cardY, cardWidth, lobbyCardHeight, 12);
          ctx.fill();

          // Card border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(sidePadding, cardY, cardWidth, lobbyCardHeight, 12);
          ctx.stroke();

          // Lobby header bar
          const headerBarHeight = 36;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.beginPath();
          ctx.roundRect(sidePadding, cardY, cardWidth, headerBarHeight, [12, 12, 0, 0]);
          ctx.fill();

          // Lobby label
          ctx.fillStyle = '#4ADE80';
          ctx.font = '800 13px "Inter", sans-serif';
          ctx.textAlign = 'left';
          ctx.letterSpacing = '2px';
          ctx.fillText(
            `LOBBY ${lobby.lobby_number}`,
            sidePadding + 20,
            cardY + headerBarHeight / 2
          );
          ctx.letterSpacing = '0px';

          // Map name
          if (lobby.map_name) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '600 13px "Inter", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(lobby.map_name, sidePadding + cardWidth - 20, cardY + headerBarHeight / 2);
          }

          // Matchup area
          const matchupY = cardY + headerBarHeight + (lobbyCardHeight - headerBarHeight) / 2;
          const centerX = width / 2;

          // Team A name (left side)
          const teamAName = teamA?.team_name || 'TBD';
          ctx.textAlign = 'right';
          ctx.font = '700 26px "Inter", sans-serif';
          ctx.fillStyle = aIsWinner ? '#4ADE80' : '#FFFFFF';
          ctx.fillText(
            teamAName.length > 20 ? teamAName.substring(0, 18) + '...' : teamAName,
            centerX - 130,
            matchupY
          );

          // Crown for winner A
          if (aIsWinner) {
            ctx.fillStyle = '#FFC107';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(
              '\u{1F451}',
              centerX -
                135 -
                ctx.measureText(
                  teamAName.length > 20 ? teamAName.substring(0, 18) + '...' : teamAName
                ).width,
              matchupY
            );
          }

          // Score box background
          const scoreBoxW = 200;
          const scoreBoxH = 52;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.beginPath();
          ctx.roundRect(
            centerX - scoreBoxW / 2,
            matchupY - scoreBoxH / 2,
            scoreBoxW,
            scoreBoxH,
            10
          );
          ctx.fill();

          // Team A score
          const scoreA = lobby.has_scores || viewMode === 'results' ? (teamA?.score ?? 0) : '—';
          ctx.textAlign = 'center';
          ctx.font = '900 32px "Space Grotesk", sans-serif';
          ctx.fillStyle = aIsWinner ? '#4ADE80' : '#FFFFFF';
          ctx.fillText(String(scoreA), centerX - 50, matchupY);

          // Dash
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.font = '700 28px "Space Grotesk", sans-serif';
          ctx.fillText('–', centerX, matchupY);

          // Team B score
          const scoreB = lobby.has_scores || viewMode === 'results' ? (teamB?.score ?? 0) : '—';
          ctx.font = '900 32px "Space Grotesk", sans-serif';
          ctx.fillStyle = bIsWinner ? '#4ADE80' : '#FFFFFF';
          ctx.fillText(String(scoreB), centerX + 50, matchupY);

          // Team B name (right side)
          const teamBName = teamB?.team_name || 'TBD';
          ctx.textAlign = 'left';
          ctx.font = '700 26px "Inter", sans-serif';
          ctx.fillStyle = bIsWinner ? '#4ADE80' : '#FFFFFF';
          ctx.fillText(
            teamBName.length > 20 ? teamBName.substring(0, 18) + '...' : teamBName,
            centerX + 130,
            matchupY
          );

          // Crown for winner B
          if (bIsWinner) {
            const bNameDisplay =
              teamBName.length > 20 ? teamBName.substring(0, 18) + '...' : teamBName;
            const bNameWidth = ctx.measureText(bNameDisplay).width;
            ctx.fillStyle = '#FFC107';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('\u{1F451}', centerX + 135 + bNameWidth, matchupY);
          }

          cardY += lobbyCardHeight + lobbyGap;
        });

        // 5. Footer Branding
        const fy = totalHeight - footerHeight;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 24px "Outfit", sans-serif';
        ctx.letterSpacing = '6px';
        ctx.globalAlpha = 0.5;
        ctx.fillText('SCRIMVERSE.COM', width / 2, fy + 120);
        ctx.globalAlpha = 1.0;
        ctx.letterSpacing = '0px';

        resolve(canvas.toDataURL('image/png', 1.0));
      };

      bgImage.onerror = () => {
        bgImage.src = BACKGROUND_IMAGE_URL;
      };
      bgImage.src = finalBgUrl;
    } catch (e) {
      reject(e);
    }
  });
};
