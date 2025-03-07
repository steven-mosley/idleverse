/**
 * Simple name generator for AI characters
 */

// Fantasy-style name generator data
const nameData = {
  prefixes: [
    'Ar', 'Bal', 'Bel', 'Cal', 'Cel', 'Dar', 'El', 'Eld', 'Fal', 'Fin',
    'Gal', 'Gil', 'Gor', 'Hal', 'Kel', 'Lor', 'Mal', 'Mor', 'Nal', 'Nor',
    'Ral', 'Sal', 'Sel', 'Tal', 'Thal', 'Val', 'Vor', 'Zan'
  ],
  suffixes: [
    'an', 'ar', 'ath', 'en', 'eon', 'erin', 'is', 'ith', 'or', 'th',
    'ion', 'ian', 'iel', 'il', 'io', 'ius', 'on', 'us', 'yn'
  ],
  titles: [
    'the Bold', 'the Brave', 'the Swift', 'the Wise', 'the Strong',
    'the Cunning', 'the Vigilant', 'of the Forest', 'of the Mountain',
    'the Gatherer', 'the Explorer', 'the Defender', 'the Crafter'
  ]
};

/**
 * Generate a random character name
 */
function generateName() {
  const prefix = nameData.prefixes[Math.floor(Math.random() * nameData.prefixes.length)];
  const suffix = nameData.suffixes[Math.floor(Math.random() * nameData.suffixes.length)];
  const useTitleChance = 0.3; // 30% chance to add a title
  
  let name = prefix + suffix;
  
  // Capitalize first letter
  name = name.charAt(0).toUpperCase() + name.slice(1);
  
  // Add title sometimes
  if (Math.random() < useTitleChance) {
    const title = nameData.titles[Math.floor(Math.random() * nameData.titles.length)];
    name = name + ' ' + title;
  }
  
  return name;
}

/**
 * Generate a set of unique names
 */
function generateUniqueNames(count) {
  const names = new Set();
  
  while (names.size < count) {
    names.add(generateName());
  }
  
  return Array.from(names);
}

module.exports = {
  generateName,
  generateUniqueNames
};
