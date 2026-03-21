function escapeHtml(text: string): string {
  // escape special html characters for safety
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatText(raw: string): string {
  // parse basic markdown into html components
  let s = escapeHtml(raw);

  // `monospace`
  s = s.replace(/`([^`]+?)`/g, '<code>$1</code>');

  // **bold** 
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // *italic* 
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // links 
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // lists
  s = s.replace(/(?:^[ \t]*-[ \t]+.*(?:\n|$))+/gm, (match) => {
    const listItems = match
      .trim()
      .split('\n')
      .map((line) => `<li>${line.replace(/^[ \t]*-[ \t]+/, '')}</li>`)
      .join('');
    return `<ul>${listItems}</ul>`;
  });

  // preserve newlines
  s = s.replace(/\n/g, '<br/>');

  return s;
}
