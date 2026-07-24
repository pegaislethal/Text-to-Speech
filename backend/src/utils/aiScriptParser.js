/**
 * 21st Tech AI Script Parser
 * Parses documentary and video scripts into individual scene narration blocks.
 * Automatically detects scene headers (e.g., Scene1:, Scene 2:, SCENE 3:, scene-4:, Scene_5:).
 * Strips scene labels so they are NEVER included in the audio synthesis.
 */

function parseScriptIntoScenes(script) {
  if (!script || typeof script !== 'string') {
    return [];
  }

  // Regex pattern matching various scene label variations:
  // e.g. "Scene1:", "Scene 1:", "SCENE 1:", "scene-1:", "Scene_1:", "Scene #1:"
  const headerRegex = /(?:^|\n)\s*(?:Scene|SCENE|scene)\s*[\-_#]?\s*(\d+)\s*[:|-]\s*/g;

  const matches = [];
  let match;

  while ((match = headerRegex.exec(script)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      sceneNumber: parseInt(match[1], 10),
      rawLabel: match[0]
    });
  }

  // If primary scene regex finds no matches, check for simple "1:", "2:", "1 - ", "2 - " format as fallback
  if (matches.length === 0) {
    const fallbackRegex = /(?:^|\n)\s*(\d+)\s*[:|-]\s*/g;
    while ((match = fallbackRegex.exec(script)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        sceneNumber: parseInt(match[1], 10),
        rawLabel: match[0]
      });
    }
  }

  if (matches.length === 0) {
    return [];
  }

  const scenes = [];

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const startIndex = current.index + current.length;
    const endIndex = (i + 1 < matches.length) ? matches[i + 1].index : script.length;

    const rawText = script.substring(startIndex, endIndex);
    
    // Clean narration text: remove extra whitespace, leading/trailing blank lines
    const cleanText = rawText
      .replace(/\r\n/g, '\n')
      .trim();

    if (cleanText.length > 0) {
      scenes.push({
        sceneNumber: current.sceneNumber,
        text: cleanText
      });
    }
  }

  return scenes;
}

module.exports = {
  parseScriptIntoScenes
};
