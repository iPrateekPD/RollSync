const fs = require('fs');
const path = require('path');

const replacements = {
  'bg-blue-600': 'bg-zinc-950',
  'hover:bg-blue-500': 'hover:bg-zinc-800',
  'hover:bg-blue-700': 'hover:bg-zinc-800',
  'text-blue-600': 'text-zinc-900',
  'text-blue-700': 'text-zinc-950',
  'text-blue-500': 'text-zinc-500',
  'text-blue-900': 'text-zinc-950',
  'bg-blue-50': 'bg-zinc-100',
  'bg-blue-100': 'bg-zinc-200',
  'border-blue-500': 'border-zinc-900',
  'border-blue-600': 'border-zinc-950',
  'focus:ring-blue-500': 'focus:ring-zinc-950',
  'focus:border-blue-500': 'focus:border-zinc-950',
  'focus-visible:outline-blue-600': 'focus-visible:outline-zinc-950',
  'ring-blue-700/10': 'ring-zinc-900/10',
  'text-purple-700': 'text-zinc-600',
  'bg-purple-50': 'bg-zinc-100',
  'ring-purple-700/10': 'ring-zinc-600/10',
  'border-l-blue-600': 'border-l-zinc-900',
  'from-blue-600': 'from-zinc-900',
  'to-indigo-600': 'to-zinc-700'
};

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content;
      
      for (const [oldClass, newClass] of Object.entries(replacements)) {
        // Simple string replacement might be enough if we just want to replace all occurrences.
        // We'll use split and join to replace all instances globally.
        newContent = newContent.split(oldClass).join(newClass);
      }
      
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

walk('./src');
