import { ICategory } from '../model/category.js';

export const categories: ICategory[] = [
  {
    id: 'dnb',
    name: 'Drum & Bass',
    tags: [/dnb/, /drum\s*(&|and|n'?|'?n'?|\s*)\s*bass/]
  },
  {
    id: 'hiphop',
    name: 'Hip-Hop',
    tags: [/hiphop/, /hip hop/, /hip-hop/]
  },
  {
    id: 'punk',
    name: 'Punk',
    tags: [/punk/]
  },
  {
    id: 'rock',
    name: 'Rock',
    tags: [/rock/, /metal/]
  },
  {
    id: 'pop',
    name: 'Pop',
    tags: [/pop/]
  },
  {
    id: 'rap',
    name: 'Rap',
    tags: [/rap/]
  },
  {
    id: 'techno',
    name: 'Techno',
    tags: [/downtempo/, /techno/, /house/]
  },
  {
    id: 'psy',
    name: 'Psy / Goa',
    tags: [/goa/, /psy/, /tek/]
  },
  {
    id: 'dub',
    name: 'Dub / Reggae',
    tags: [/reggae/, /dub/]
  },
  {
    id: 'sonstiges',
    name: 'Sonstiges',
    tags: [/lesung/, /markt/, /podcast/, /bingo/, /flohmarkt/]
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
      if (category.tags) {
        for (let categoryTag of category.tags) {
          if (categoryTag.test(lower)) {
            match = true;
            break;
          }
        }
        // If the tag matches the category, add the category to the list of matches.
        if (match == true) {
          setCategories.add(category.id);
        }
      }
    }
  }

  // Return the list of categories.
  return [...setCategories];
}
