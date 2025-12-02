export interface Puzzle {
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  grid: number[];
}

export const puzzles: Puzzle[] = [
  {
    name: 'Classic Easy',
    difficulty: 'Easy',
    grid: [
      5, 3, 0, 0, 7, 0, 0, 0, 0,
      6, 0, 0, 1, 9, 5, 0, 0, 0,
      0, 9, 8, 0, 0, 0, 0, 6, 0,
      8, 0, 0, 0, 6, 0, 0, 0, 3,
      4, 0, 0, 8, 0, 3, 0, 0, 1,
      7, 0, 0, 0, 2, 0, 0, 0, 6,
      0, 6, 0, 0, 0, 0, 2, 8, 0,
      0, 0, 0, 4, 1, 9, 0, 0, 5,
      0, 0, 0, 0, 8, 0, 0, 7, 9
    ]
  },
  {
    name: 'Hard Maze',
    difficulty: 'Hard',
    grid: [
      0, 0, 5, 3, 0, 0, 0, 0, 0,
      8, 0, 0, 0, 0, 0, 0, 2, 0,
      0, 7, 0, 0, 1, 0, 5, 0, 0,
      4, 0, 0, 0, 0, 5, 3, 0, 0,
      0, 1, 0, 0, 7, 0, 0, 0, 6,
      0, 0, 3, 2, 0, 0, 0, 8, 0,
      0, 6, 0, 5, 0, 0, 0, 0, 9,
      0, 0, 4, 0, 0, 0, 0, 3, 0,
      0, 0, 0, 0, 0, 9, 7, 0, 0
    ]
  },
  {
    name: 'Expert Minimal',
    difficulty: 'Expert',
    grid: [
      0, 0, 5, 0, 1, 0, 0, 0, 0,
      2, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 3,
      0, 0, 1, 0, 0, 0, 0, 0, 0,
      0, 2, 0, 0, 0, 0, 4, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0,
      7, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 8,
      0, 0, 0, 0, 6, 0, 2, 0, 0
    ]
  }
];

export function getRandomPuzzle(): Puzzle {
  return puzzles[Math.floor(Math.random() * puzzles.length)];
}