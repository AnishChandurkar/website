/**
 * Lightweight markdown-style text formatter.
 * Supports:  **bold**  *italic*  `monospace`
 *
 * Escapes HTML first to prevent XSS, then applies formatting.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatText(raw: string): string {
  let s = escapeHtml(raw);

  // `monospace` → <code>
  s = s.replace(/`([^`]+?)`/g, '<code>$1</code>');

  // **bold** → <strong>
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // *italic* → <em>  (but not inside already-matched **)
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // preserve newlines
  s = s.replace(/\n/g, '<br/>');

  return s;
}
