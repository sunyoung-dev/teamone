const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

async function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}

async function writeJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  const tempPath = filePath + '.tmp';
  try {
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tempPath, filePath);
  } catch (err) {
    // Clean up temp file on failure
    try { await fs.unlink(tempPath); } catch (_) {}
    const writeErr = new Error('JSON 파일 저장에 실패했습니다');
    writeErr.code = 'FILE_WRITE_ERROR';
    throw writeErr;
  }
}

function nextId(existingItems, prefix) {
  const maxNum = existingItems.reduce((max, item) => {
    const num = parseInt(item.id.replace(prefix, ''), 10);
    return num > max ? num : max;
  }, 0);
  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
}

module.exports = { readJSON, writeJSON, nextId };
