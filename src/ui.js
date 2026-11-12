/** @param {unknown} value */
export const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
/** @param {string} name @param {number} [size] */
export function icon(name, size = 22) {
  const paths = /** @type {Record<string, string>} */ ({
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>', back: '<path d="M19 12H5m5-5-5 5 5 5"/>',
    check: '<path d="m5 12 4 4L19 6"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    external: '<path d="M14 3h7v7m0-7L10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>',
    book: '<path d="M12 5v16m0-16C8 2 4 3 2 4v15c3-1 6-1 10 2 4-3 7-3 10-2V4c-3-1-7-2-10 1Z"/>',
    layout: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M6 9h1m3 0h1m3 0h1m3 0h1M6 13h1m3 0h1m3 0h1m3 0h1M7 16h9"/>',
    switch: '<path d="m12 2 8 5v9l-8 5-8-5V7Z M4 7l8 5 8-5m-8 5v9m-4-16 8 5"/>',
    connection: '<path d="m12 2 6 5-6 5 6 5-6 5V2Zm0 10L5 6m7 6-7 6"/>',
    shield: '<path d="m12 2 8 3v6c0 5-4 9-8 11-4-2-8-6-8-11V5Z m-4 10 3 3 5-6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
    download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    compare: '<path d="M9 4H3v16h6m6-16h6v16h-6M9 8h6m-6 4h6m-6 4h6"/>',
  });
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.info}</svg>`;
}
/** Original schematic, deliberately not a product photograph. @param {boolean} [full] @param {string} [color] */
export function keyboard(full = false, color = 'sage') {
  const palette = color === 'lilac' ? ['#c7c2db', '#f3f0fb', '#665785'] : color === 'peach' ? ['#dbbfae', '#fff3e8', '#ae5438'] : ['#adbdaf', '#f1f3e8', '#315a48'];
  let keys = '';
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 12; col++) {
      if (row === 4 && col > 2 && col < 9) continue;
      const x = 20 + col * 23;
      const y = 21 + row * 24;
      const isAccent = (row === 0 && col === 0) || (row === 2 && col === 11);
      keys += `<rect x="${x}" y="${y + 2}" width="${row === 4 && col === 3 ? 132 : 20}" height="19" rx="4" fill="${palette[0]}"/><rect x="${x}" y="${y}" width="20" height="18" rx="4" fill="${isAccent ? (row === 0 ? '#e89164' : palette[2]) : palette[1]}"/>`;
      if (row === 0 && col === 0) keys += `<text x="${x+10}" y="${y+11}" text-anchor="middle" font-size="6" fill="#342a24">esc</text>`;
      else if (row < 4 && col > 0 && col < 11) keys += `<path d="M${x+7} ${y+7}h4" stroke="${palette[0]}" stroke-width="1.5" stroke-linecap="round"/>`;
    }
  }
  keys += `<rect x="89" y="119" width="133" height="19" rx="4" fill="${palette[0]}"/><rect x="89" y="117" width="133" height="18" rx="4" fill="${palette[1]}"/>`;
  if (full) for (let row=0;row<5;row++) for(let col=0;col<4;col++) keys+=`<rect x="${306+col*23}" y="${21+row*24}" width="20" height="19" rx="4" fill="${palette[1]}"/>`;
  return `<svg viewBox="0 0 ${full ? 415 : 315} 158" class="keyboard-art" aria-hidden="true"><rect x="4" y="7" width="${full ? 407 : 307}" height="148" rx="15" fill="${palette[0]}"/><rect x="4" y="2" width="${full ? 407 : 307}" height="145" rx="15" fill="${palette[0]}" stroke="#516457" stroke-opacity=".25"/>${keys}</svg>`;
}
/** @param {string} title @param {string} url */
export const externalLink = (title, url) => `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(title)} ${icon('external', 14)}<span class="sr-only"> (새 탭)</span></a>`;
