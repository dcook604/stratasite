// Converts CMS content to HTML. Content saved through the rich-text editor is
// already HTML and passes through untouched; older markdown-style content is
// converted. A class preset controls the Tailwind classes applied to headings
// and paragraphs so the homepage and generic pages can share one implementation.

type ClassPreset = 'homepage' | 'page';

interface PresetClasses {
  h1: string;
  h2: string;
  h3: string;
  paragraph: string;
}

const PRESETS: Record<ClassPreset, PresetClasses> = {
  homepage: {
    h1: 'text-4xl md:text-5xl font-bold text-gray-900 mb-4',
    h2: 'text-xl text-gray-600 max-w-3xl mx-auto mb-4',
    h3: 'text-lg font-medium text-gray-700 mb-2',
    paragraph: 'text-xl text-gray-600 max-w-3xl mx-auto mb-4',
  },
  page: {
    h1: 'text-3xl font-bold mb-6',
    h2: 'text-2xl font-bold mb-4 mt-8',
    h3: 'text-xl font-semibold mb-3 mt-6',
    paragraph: 'mb-4',
  },
};

export function formatContent(content: string, preset: ClassPreset = 'page'): string {
  // Already HTML (from the WYSIWYG editor) — return as-is.
  if (content.includes('<p>') || content.includes('<div>') || content.includes('<h1>')) {
    return content;
  }

  const c = PRESETS[preset];

  return content
    .replace(/^# (.*$)/gm, `<h1 class="${c.h1}">$1</h1>`)
    .replace(/^## (.*$)/gm, `<h2 class="${c.h2}">$1</h2>`)
    .replace(/^### (.*$)/gm, `<h3 class="${c.h3}">$1</h3>`)
    .replace(/^\*\*(.*?)\*\*/gm, '<strong>$1</strong>')
    .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
    .replace(/^\|(.*)\|$/gm, (match, row: string) => {
      const cells = row.split('|').map(cell => cell.trim());
      if (cells[0] === '' && cells[cells.length - 1] === '') {
        cells.shift();
        cells.pop();
      }
      return '<tr>' + cells.map(cell => `<td class="border px-4 py-2">${cell}</td>`).join('') + '</tr>';
    })
    .replace(/\n\n/g, `</p><p class="${c.paragraph}">`)
    .replace(/\n/g, '<br/>');
}
