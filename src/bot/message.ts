export function escapeMarkdownV2(text: string) {
  return text.replace(/[_*\[\]()~`>#\+\-=|{}.!]/g, '\\$&');
}
