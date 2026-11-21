export default function handler(req, res) {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const months = ["OCAK", "ŞUBAT", "MART", "NİSAN", "MAYIS", "HAZİRAN", "TEMMUZ", "AĞUSTOS", "EYLÜL", "EKİM", "KASIM", "ARALIK"];
  const daysHeader = ["P", "S", "Ç", "P", "C", "C", "P"];

  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  let cells = [];
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, current: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ day: i, current: true, isToday: i === today });
  }
  while (cells.length < 42) {
    cells.push({ day: cells.length - (startOffset + daysInMonth) + 1, current: false });
  }

  let svg = `<svg width="340" height="280" viewBox="0 0 340 280" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#4a0408"/>
        <stop offset="100%" stop-color="#141414"/>
      </linearGradient>
    </defs>
    <rect width="340" height="280" rx="14" fill="url(#bg)" stroke="#8c0810" stroke-width="1.5"/>
    <text x="170" y="30" fill="#ffffff" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">${months[month]} ${year}</text>`;

  daysHeader.forEach((d, idx) => {
    const x = 38 + idx * 44;
    svg += `<text x="${x}" y="60" fill="#ff3b47" font-family="Arial, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">${d}</text>`;
  });

  cells.forEach((cell, idx) => {
    const col = idx % 7;
    const row = Math.floor(idx / 7);
    const x = 38 + col * 44;
    const y = 92 + row * 32;

    if (cell.isToday) {
      svg += `<circle cx="${x}" cy="${y - 4}" r="13" fill="#e30a17"/>`;
    }
    const color = cell.isToday ? "#ffffff" : (cell.current ? "#ffffff" : "#555555");
    svg += `<text x="${x}" y="${y}" fill="${color}" font-family="Arial, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">${cell.day}</text>`;
  });

  svg += `</svg>`;

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.status(200).send(svg);
}
