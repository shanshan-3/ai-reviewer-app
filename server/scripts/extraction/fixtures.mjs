import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { JSZip, LIMITS } from './extract.mjs';

export function makePdf(pages, { imagePages = [], password = false } = {}) {
  const objects = [];
  const add = text => { objects.push(text); return objects.length; };
  add('<< /Type /Catalog /Pages 2 0 R >>');
  add('');
  const font = add('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');
  const image = add('<< /Type /XObject /Subtype /Image /Width 1 /Height 1 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /ASCIIHexDecode /Length 7 >>\nstream\nFF0000>\nendstream');
  const pageIds = [];
  for (const [index, lines] of pages.entries()) {
    const text = lines.map((line, row) => {
      const item = typeof line === 'string' ? { text: line, x: 50, y: 790 - row * 12 } : line;
      return `BT /F1 10 Tf 1 0 0 1 ${item.x} ${item.y} Tm (${item.text.replace(/[\\()]/g, '\\$&')}) Tj ET`;
    }).join('\n');
    const content = text + (imagePages.includes(index + 1) ? '\nq 180 0 0 80 50 300 cm /Im1 Do Q' : '');
    const stream = add(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`);
    pageIds.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font} 0 R >> /XObject << /Im1 ${image} 0 R >> >> /Contents ${stream} 0 R >>`));
  }
  objects[1] = `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] >>`;
  const encryption = password ? add(`<< /Filter /Standard /V 1 /R 2 /O <${'00'.repeat(32)}> /U <${'00'.repeat(32)}> /P -4 >>`) : null;
  let output = '%PDF-1.4\n';
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(output));
    output += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const start = Buffer.byteLength(output);
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  output += offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R ${encryption ? `/Encrypt ${encryption} 0 R /ID [<0011223344556677><0011223344556677>]` : ''} >>\nstartxref\n${start}\n%%EOF\n`;
  return Buffer.from(output);
}

const escapeXml = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const paragraph = text => `<w:p><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;

export async function makeDocx(paragraphs, { table = false, expandedBytes, extraEntries = 0, external = false } = {}) {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  const tableXml = table ? `<w:tbl><w:tr><w:tc>${paragraph('Protocol')}</w:tc><w:tc>${paragraph('Port')}</w:tc></w:tr><w:tr><w:tc>${paragraph('HTTPS')}</w:tc><w:tc>${paragraph('443')}</w:tc></w:tr></w:tbl>` : '';
  const linkXml = external ? '<w:hyperlink r:id="rId2"><w:r><w:t>External reference label</w:t></w:r></w:hyperlink>' : '';
  zip.file('word/document.xml', `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${paragraphs.map(paragraph).join('')}${tableXml}${linkXml}</w:body></w:document>`);
  if (external) zip.file('word/_rels/document.xml.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="http://127.0.0.1:9/never-fetch" TargetMode="External"/></Relationships>');
  for (let i = 0; i < extraEntries; i++) zip.file(`extra/${i}`, 'x');
  if (expandedBytes) {
    let current = 0;
    for (const entry of Object.values(zip.files).filter(entry => !entry.dir)) current += (await entry.async('uint8array')).length;
    zip.file('word/media/padding.bin', Buffer.alloc(Math.max(0, expandedBytes - current), 65));
  }
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

export async function createFixtures(directory) {
  await mkdir(directory, { recursive: true });
  const cases = [];
  async function save(name, data, expected = {}) {
    const file = path.join(directory, name);
    await writeFile(file, data);
    cases.push({ name, file, status: 'needs_review', ...expected });
  }
  const prose = 'Prototyping validates design decisions before implementation.';
  const code = ['if (score >= 5 && score != 9) {', '    result = score <= 10;', '}'];
  await save('ordinary.pdf', makePdf([[prose], ['Second page: preserve source references.']]), { exact: [prose, 'Second page: preserve source references.'] });
  await save('ordinary.docx', await makeDocx([prose, 'Second paragraph: preserve source references.']), { exact: [prose, 'Second paragraph: preserve source references.'] });
  await save('mixed.pdf', makePdf([[prose], []], { imagePages: [1, 2] }), { warning: 'IMAGES_EXCLUDED' });
  await save('image-only.pdf', makePdf([[]], { imagePages: [1] }), { status: 'rejected', code: 'NO_USABLE_TEXT' });
  await save('code.pdf', makePdf([code]), { codeLines: code });
  await save('code.docx', await makeDocx(code), { codeLines: code });
  await save('columns.pdf', makePdf([[
    { text: 'Right column first in content stream.', x: 310, y: 790 },
    { text: 'Left column should be read first.', x: 50, y: 790 },
  ]]), { warning: 'FORMATTING_REVIEW' });
  await save('table.pdf', makePdf([[prose, 'Protocol     Port', 'HTTPS        443']]), { warning: 'FORMATTING_REVIEW' });
  await save('table.docx', await makeDocx([prose], { table: true }), { warning: 'FORMATTING_REVIEW' });
  await save('external.docx', await makeDocx([prose], { external: true }), { contains: 'External reference label' });
  for (const pages of [10, 50, 100, 101]) await save(`pages-${pages}.pdf`, makePdf(Array.from({ length: pages }, (_, i) => [`${prose} Page ${i + 1}.`])), pages > LIMITS.pdfPages ? { status: 'rejected', code: 'PAGE_LIMIT' } : {});
  for (const characters of [10_000, 100_000, 200_000, 200_001]) {
    await save(`text-${characters}.docx`, await makeDocx(['A'.repeat(characters)]), characters > LIMITS.textCharacters ? { status: 'rejected', code: 'TEXT_LIMIT' } : { textCharacters: characters });
    const lines = [];
    let remaining = characters;
    while (remaining > 0) {
      if (remaining === 1) { lines[lines.length - 1] += 'A'; break; }
      const length = Math.min(80, remaining);
      lines.push('A'.repeat(length - 1));
      remaining -= length;
    }
    const pages = [];
    for (let i = 0; i < lines.length; i += 60) pages.push(lines.slice(i, i + 60));
    await save(`text-${characters}.pdf`, makePdf(pages), characters > LIMITS.textCharacters ? { status: 'rejected', code: 'TEXT_LIMIT' } : { textCharacters: characters });
  }
  for (const bytes of [1024 * 1024, 10 * 1024 * 1024, LIMITS.docxExpandedBytes, LIMITS.docxExpandedBytes + 1]) {
    await save(`expanded-${bytes}.docx`, await makeDocx([prose], { expandedBytes: bytes }), bytes > LIMITS.docxExpandedBytes ? { status: 'rejected', code: 'DOCX_EXPANDED_LIMIT' } : { expandedBytes: bytes });
  }
  const pdf = makePdf([[prose]]);
  for (const bytes of [512 * 1024, 2 * 1024 * 1024, LIMITS.fileBytes, LIMITS.fileBytes + 1]) {
    await save(`bytes-${bytes}.pdf`, Buffer.concat([pdf, Buffer.alloc(bytes - pdf.length, 32)]), bytes > LIMITS.fileBytes ? { status: 'rejected', code: 'FILE_LIMIT' } : {});
  }
  const sizedZip = await JSZip.loadAsync(await makeDocx([prose]));
  sizedZip.file('padding.bin', Buffer.alloc(0), { compression: 'STORE' });
  const overhead = (await sizedZip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })).length;
  sizedZip.file('padding.bin', Buffer.alloc(LIMITS.fileBytes - overhead, 65), { compression: 'STORE' });
  const sizedDocx = await sizedZip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  await save('bytes-limit.docx', sizedDocx);
  await save('bytes-over-limit.docx', Buffer.concat([sizedDocx, Buffer.from(' ')]), { status: 'rejected', code: 'FILE_LIMIT' });
  const lyingZip = await makeDocx([prose], { expandedBytes: LIMITS.docxExpandedBytes + 1 });
  for (let i = 0; i < lyingZip.length - 46; i++) {
    if (lyingZip.readUInt32LE(i) === 0x02014b50 && lyingZip.subarray(i + 46, i + 46 + lyingZip.readUInt16LE(i + 28)).toString() === 'word/media/padding.bin') {
      lyingZip.writeUInt32LE(1, i + 24);
      lyingZip.writeUInt32LE(1, lyingZip.readUInt32LE(i + 42) + 22);
      break;
    }
  }
  await save('lying-expanded-size.docx', lyingZip, { status: 'rejected', code: 'DOCX_EXPANDED_LIMIT' });
  await save('entry-limit.docx', await makeDocx([prose], { extraEntries: LIMITS.docxEntries }), { status: 'rejected', code: 'DOCX_ENTRY_LIMIT' });
  await save('password.pdf', makePdf([[prose]], { password: true }), { status: 'rejected', code: 'PASSWORD_REQUIRED' });
  await save('corrupt.pdf', Buffer.from('%PDF-1.4\nbroken'), { status: 'rejected', code: 'INVALID_FILE' });
  await save('corrupt.docx', Buffer.from('PK\x03\x04broken'), { status: 'rejected', code: 'INVALID_FILE' });
  await save('not-word.docx', await new JSZip().file('unrelated.txt', 'not a Word document').generateAsync({ type: 'nodebuffer' }), { status: 'rejected', code: 'INVALID_FILE' });
  await save('unsupported.txt', Buffer.from(prose), { status: 'rejected', code: 'UNSUPPORTED_TYPE' });
  await save('empty.docx', await makeDocx([]), { status: 'rejected', code: 'NO_USABLE_TEXT' });
  return cases;
}
