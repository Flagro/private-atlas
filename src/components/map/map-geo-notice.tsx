import { MAX_MAP_CITY_MARKERS } from "@/constants/visits";

export function MapGeoNotice({
  markersTruncated,
}: {
  markersTruncated?: boolean;
}) {
  if (!markersTruncated) return null;

  return (
    <p className="text-xs text-zinc-500 dark:text-zinc-400">
      Showing up to {MAX_MAP_CITY_MARKERS} city markers (most recently visited). All
      countries you&apos;ve logged still appear on the map.
    </p>
  );
}
