function isWhitespace(char: string): boolean {
  if (!char || char.length !== 1) {
    throw new Error(`Not a character: ${char}`);
  }
  return char.charCodeAt(0) <= 32;
}

/**
 * a utility function used to trim {@param text} so that its length stays under {@param charLimit}.
 * prefers to keep whole words together instead of chopping words up in order to trim the text.
 * looks for the next whitespace that it can chop it off at
 */
export default function (text: string, charLimit: number): string {
  let trimmedText = text.trim();
  if (
    trimmedText[charLimit] === undefined ||
    isWhitespace(trimmedText[charLimit])
  ) {
    // look ahead to see if we're already looking at a whole word
    return trimmedText.slice(0, charLimit);
  }
  let cutOffIndex = charLimit - 1;
  while (cutOffIndex >= 0 && !isWhitespace(trimmedText[cutOffIndex])) {
    cutOffIndex -= 1;
  }
  return trimmedText.slice(0, cutOffIndex + 1).trim();
}
