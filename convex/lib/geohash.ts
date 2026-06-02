/** Simple geohash (precision 6) for cache keys — not full geohash spec. */
export function toGeohash(lat: number, lng: number, precision = 6): string {
  const latBucket = Math.floor((lat + 90) * Math.pow(10, precision / 2));
  const lngBucket = Math.floor((lng + 180) * Math.pow(10, precision / 2));
  return `${latBucket}:${lngBucket}`;
}

export function departureTimeBucket(scheduledAt: number): string {
  const d = new Date(scheduledAt);
  const minutes = d.getUTCHours() * 60 + d.getUTCMinutes();
  const bucket = Math.floor(minutes / 15) * 15;
  const day = d.toISOString().slice(0, 10);
  return `${day}-${bucket}`;
}
