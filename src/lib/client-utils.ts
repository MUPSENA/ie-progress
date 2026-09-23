export const formatDate = (value: string, withTime = false) => new Intl.DateTimeFormat("ja-JP", withTime ? { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" } : { month: "numeric", day: "numeric", weekday: "short" }).format(new Date(value));
export const formatFullDate = (value: string) => new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value));
export const isOverdue = (value: string | null) => Boolean(value && new Date(value).getTime() < Date.now());
export const statusLabel: Record<string, string> = { NOT_STARTED: "未着手", IN_PROGRESS: "進行中", DONE: "完了", DELAYED: "遅延", PENDING: "承認待ち", APPROVED: "承認済み", REJECTED: "差し戻し", QUESTIONING: "質問中", ANSWERED: "回答済み", RESOLVED: "解決済み", UNCHECKED: "未確認", WAITING: "回答待ち", COMPLETED: "完了", RETURNED: "差し戻し" };
export async function apiFetch(url: string, options?: RequestInit) { const response = await fetch(url, options); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error || "通信に失敗しました"); return body; }
export async function compressImage(file: File): Promise<{ blob: Blob; dataUrl: string }> {
  if (!file.type.startsWith("image/") || file.type.includes("heic") || file.type.includes("heif")) return { blob: file, dataUrl: await fileToDataUrl(file) };
  const bitmap = await createImageBitmap(file); const max = 1600; const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas"); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d"); if (!context) throw new Error("写真を処理できませんでした"); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("写真を圧縮できませんでした")), "image/jpeg", 0.78));
  return { blob, dataUrl: canvas.toDataURL("image/jpeg", 0.78) };
}
function fileToDataUrl(file: Blob) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); }); }
export function dataUrlToBlob(dataUrl: string) { const [header, data] = dataUrl.split(","); const mime = header.match(/data:(.*?);/)?.[1] || "image/jpeg"; const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0)); return new Blob([bytes], { type: mime }); }
