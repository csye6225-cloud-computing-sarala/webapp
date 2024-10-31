export const calculateDuration = (start) => {
  const diff = process.hrtime(start);
  return diff[0] * 1000 + diff[1] / 1e6; // Convert to milliseconds
};
