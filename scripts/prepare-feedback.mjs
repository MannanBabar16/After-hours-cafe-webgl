import fs from 'node:fs/promises';
const root = new URL('../docs/feedback/', import.meta.url);
const spec = JSON.parse(await fs.readFile(new URL('form-spec.json', root), 'utf8'));
const template = await fs.readFile(new URL('Create-Feedback-Form.template.gs', root), 'utf8');
await fs.writeFile(new URL('Create-Feedback-Form.gs', root), template.replace('__FORM_SPEC__', JSON.stringify(spec, null, 2)));
const preview = await fs.readFile(new URL('preview.template.html', root), 'utf8');
await fs.writeFile(new URL('preview.html', root), preview.replace('__FORM_SPEC__', JSON.stringify(spec).replaceAll('<', '\\u003c')));
console.log('Prepared ready-to-paste Google Form builder and standalone preview.');
