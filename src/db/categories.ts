import { ICategory } from '../model/category.js';

export const categories: ICategory[] = [
  {
    id: 'dnb',
    name: 'Drum & Bass',
    tags: ['dnb', 'drum and bass', 'drum & bass', "drum'n'bass", "drum 'n' bass", "drum n' bass", 'drum n bass', 'drumnbass', 'drumandbass']
  },
  {
    id: 'hiphop',
    name: 'Hip-Hop',
    tags: ['hiphop', 'hip hop', 'hip-hop']
  },
  {
    id: 'punk',
    name: 'Punk',
    tags: [],
    regex: /punk/
  },
  {
    id: 'rock',
    name: 'Rock',
    tags: [],
    regex: /rock|metal/
  },
  {
    id: 'pop',
    name: 'Pop',
    tags: [],
    regex: /pop/
  },
  {
    id: 'rap',
    name: 'Rap',
    tags: [],
    regex: /rap/
  },
  {
    id: 'techno',
    name: 'Techno',
    tags: ['downtempo'],
    regex: /techno|house/
  },
  {
    id: 'psy',
    name: 'Psy / Goa',
    tags: ['goa', 'psy', 'tek']
  },
  {
    id: 'dub',
    name: 'Dub / Reggae',
    tags: ['reggae', 'dub', 'bass']
  },
  {
    id: 'sonstiges',
    name: 'Sonstiges',
    tags: ['lesung', 'markt', 'podcast', 'bingo', 'flohmarkt']
  }
];

/**
 * Resolves a list of tags to categories
 * @param tags tags to check
 * @returns List of categories
 */
export function resolveCategories(tags: string[]) {
  let setCategories = new Set<string>();

  for (let tag of tags) {
    const lower = tag.toLowerCase();

    // Iterate through the list of categories.
    for (let category of categories) {
      let match = false;

      // Check if the tag matches any of the category tags.
      if (category.tags && category.tags?.includes(lower)) {
        match = true;
      }

      // Check if the tag matches the category regex.
      if (category.regex) {
        if (category.regex.test(lower)) {
          match = true;
        }
      }

      // If the tag matches the category, add the category to the list of matches.
      if (match == true) {
        setCategories.add(category.id);
      }
    }
  }

  // Return the list of categories.
  return [...setCategories];
}
