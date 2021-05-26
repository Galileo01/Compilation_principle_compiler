export default function generateSponsorList(str: string) {
  const lines = str.split('\n').filter(item => item.length > 1);
  console.log(lines);
  let maxCount = 0;
  const table: string[][] = []
  lines.forEach(line => {
    const items = [];
    let [left, right] = line.split('->');
    left = left.trim();
    right = right.trim();
    // items.push(left, ...right.split(' '));
    items.push(left, '->', right);
    // items.length > maxCount && (maxCount = items.length);
    table.push(items)
  })
  return {
    table,
    maxCount
  }
}