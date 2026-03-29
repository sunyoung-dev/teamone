/**
 * Generate the next string ID for a Mongoose model with string _id.
 * e.g. nextId(Player, 'p') → 'p023'
 */
async function nextId(Model, prefix) {
  const docs = await Model.find({}, { _id: 1 }).lean();
  const maxNum = docs.reduce((max, doc) => {
    const num = parseInt(String(doc._id).replace(prefix, ''), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
}

module.exports = nextId;
