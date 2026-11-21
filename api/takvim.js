import { Resvg } from '@resvg/resvg-js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fontPath = require.resolve('@fontsource/roboto/files/roboto-latin-ext-700-normal.woff2');

export default async function handler(req, res) {
  const KULUP_ID = "chesst-rk";

  try {
    const nowTR = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
    const year = nowTR.getFullYear();
    const month = String(nowTR.getMonth() + 1).padStart(2, "0");
    const todayStr = `${year}-${month}-${String(nowTR.getDate()).padStart(2, "0")}`;

    const headers = { "User-Agent": "ChessClubLeaderboard/1.0" };

    const clubRes = await fetch(`https://chess.com{KULUP_ID}/members`, { headers });
    const clubData = clubRes.ok ? await clubRes.json() : {};

    const allMembers = [
      ...(clubData.weekly || []),
      ...(clubData.monthly || []),
      ...(clubData.all_time || [])
    ].map(m => m.username);

    const uniqueMembers = [...new Set(allMembers)].slice(0, 40);

    const scores = await Promise.all(
      uniqueMembers.map(async (username) => {
        try {
          const gamesRes = await fetch(
            `https://chess.com{username}/games/${year}/${month}`,
            { headers }
          );
          if (!gamesRes.ok) return { username, count: 0 };
          const gamesData = await gamesRes.json();

          const todayCount = (gamesData.games || []).filter((g) => {
            if (!g.end_time) return false;
            const gameDate = new Date(g.end_time * 1000).toLocaleDateString("en-CA", {
              timeZone: "Europe/Istanbul"
            });
            return gameDate === todayStr;
          }).length;

          return { username, count: todayCount };
        } catch {
          return { username, count: 0 };
        }
      })
    );

    const top3 = scores.sort((a, b) => b.count - a.count).slice(0, 3);
    while (top3.length < 3) {
      top3.push({ username: "Henüz Oyun Yok", count: 0 });
    }

    const borderColors = ["#ffd700", "#c0c0c0", "#cd7f32"];
    const textColors = ["#ffffff", "#e0e0e0", "#cccccc"];

    let svg = `
    <svg width="340" height="195" viewBox="0 0 340 195" xmlns="http://w3.org">
      <rect width="340" height="195" rx="14" fill="#1a1a1a" stroke="#333333" stroke-width="1.5"/>
      <text x="170" y="28" fill="#e30a17" font-family="Roboto" font-size="14" font-weight="bold" text-anchor="middle">GÜNÜN EN AKTİFLERİ</text>
    `;

    top3.forEach((player, i) => {
      const y = 44 + i * 46;
      svg += `
        <rect x="14" y="${y}" width="312" height="38" rx="8" fill="#111111"/>
        <rect x="14" y="${y}" width="4" height="38" rx="2" fill="${borderColors[i]}"/>
        <text x="28" y="${y + 24}" fill="${textColors[i]}" font-family="Roboto" font-size="13" font-weight="bold">
          ${i + 1}. ${player.username}
        </text>
        <text x="314" y="${y + 24}" fill="#ff3b47" font-family="Roboto" font-size="12" font-weight="bold" text-anchor="end">
          ${player.count} Oyun
        </text>
      `;
    });

    svg += `</svg>`;

    const resvg = new Resvg(svg, {
      font: { fontFiles: [fontPath], loadSystemFonts: false }
    });
    const pngBuffer = resvg.render().asPng();

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    res.status(200).send(pngBuffer);
  } catch (err) {
    res.status(500).send("Hata olustu");
  }
}
