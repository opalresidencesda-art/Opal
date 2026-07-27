export function shouldZoomMapFromWheel(event: Pick<WheelEvent, "ctrlKey" | "metaKey">) {
  return event.ctrlKey || event.metaKey;
}

export function shouldSetPropertyPosition(calibrating: boolean, targetId: string | null) {
  return calibrating && Boolean(targetId);
}
