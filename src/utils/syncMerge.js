/**
 * Merge two arrays of items by ID, keeping whichever version has the
 * newer updatedAt. Items with no updatedAt are treated as older.
 * Items that exist only in one array are always kept.
 */
export function mergeByUpdatedAt(local = [], remote = []) {
  const map = new Map();
  for (const item of local)  map.set(item.id, item);
  for (const item of remote) {
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
    } else {
      const localTs  = existing.updatedAt ?? '';
      const remoteTs = item.updatedAt    ?? '';
      if (remoteTs > localTs) map.set(item.id, item);
    }
  }
  return [...map.values()];
}

export function now() {
  return new Date().toISOString();
}
