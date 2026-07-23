export function shouldZoomMapFromWheel(event: Pick<WheelEvent, "ctrlKey" | "metaKey">) {
  return event.ctrlKey || event.metaKey;
}
