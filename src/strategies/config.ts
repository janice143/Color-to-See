export const viewConfig = {
  // 是否匹配单词颜色
  matchWords: false,
  // Highlight HEX values using ARGB instead of RGBA (default)
  useARGB: false,
  // Highlight rgb without functions like rgb() ('255, 255, 255', [255, 255, 255], '255 255 255', etc.)
  matchRgbWithNoFunction: false,
  // An array of language ids which should be highlighted by Color Highlight with the rgbWithNoFunction pattern. \"*\" to trigger on any language; Prepend language id with \"!\" to exclude the language (i.e \"!typescript\", \"!javascript\")
  rgbWithNoFunctionLanguages: ['*'],
  // Highlight hsl without functions like hsl() ('255, 100%, 80%', [255, 100%, 80%], '255 100% 80%', etc.)
  matchHslWithNoFunction: false,
  // An array of language ids which should be highlighted by Color Highlight with the rgbWithNoFunction pattern. \"*\" to trigger on any language; Prepend language id with \"!\" to exclude the language (i.e \"!typescript\", \"!javascript\")
  hslWithNoFunctionLanguages: ['*']
};
