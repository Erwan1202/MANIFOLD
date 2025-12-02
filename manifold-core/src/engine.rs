use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(PartialEq, Eq, Clone, Copy, Debug)]
pub enum Topology {
    Classic9x9,
}

// Use a static allocation to avoid memory issues
const GRID_SIZE: usize = 81;

#[wasm_bindgen]
pub struct ManifoldEngine {
    cells: [u8; GRID_SIZE],
}

#[wasm_bindgen]
impl ManifoldEngine {
    pub fn new(_topo: Topology) -> ManifoldEngine {
        ManifoldEngine {
            cells: [0; GRID_SIZE],
        }
    }

    pub fn get_cell(&self, index: usize) -> u8 {
        if index < GRID_SIZE {
            self.cells[index]
        } else {
            0
        }
    }

    pub fn set_cell(&mut self, index: usize, value: u8) -> bool {
        if index >= GRID_SIZE || value > 9 {
            return false;
        }

        if value == 0 {
            self.cells[index] = 0;
            return true;
        }

        if self.is_safe(index, value) {
            self.cells[index] = value;
            return true;
        }

        false
    }

    pub fn is_safe(&self, index: usize, value: u8) -> bool {
        if index >= GRID_SIZE {
            return false;
        }

        let row = index / 9;
        let col = index % 9;
        let box_row = (row / 3) * 3;
        let box_col = (col / 3) * 3;

        // Check row
        for c in 0..9 {
            let idx = row * 9 + c;
            if idx != index && self.cells[idx] == value {
                return false;
            }
        }

        // Check column
        for r in 0..9 {
            let idx = r * 9 + col;
            if idx != index && self.cells[idx] == value {
                return false;
            }
        }

        // Check 3x3 box
        for r in box_row..(box_row + 3) {
            for c in box_col..(box_col + 3) {
                let idx = r * 9 + c;
                if idx != index && self.cells[idx] == value {
                    return false;
                }
            }
        }

        true
    }

    pub fn reset(&mut self) {
        self.cells = [0; GRID_SIZE];
    }

    pub fn load_example(&mut self) {
        // Sudoku "Hard" standard
        let example: [u8; GRID_SIZE] = [
            0, 0, 0, 8, 0, 1, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 4, 3, 0,
            5, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 7, 0, 8, 0, 0,
            0, 0, 0, 0, 0, 0, 1, 0, 0,
            0, 2, 0, 0, 3, 0, 0, 0, 0,
            6, 0, 0, 0, 0, 0, 0, 7, 5,
            0, 0, 3, 4, 0, 0, 0, 0, 0,
            0, 0, 0, 2, 0, 0, 6, 0, 0
        ];
        self.cells = example;
    }

    pub fn solve(&mut self) -> bool {
        // Simpler recursive approach with optimized memory
        self.solve_recursive()
    }

    fn solve_recursive(&mut self) -> bool {
        // Find empty cell with minimum remaining values heuristic
        let mut best_cell: Option<usize> = None;
        let mut min_options = 10;

        for i in 0..GRID_SIZE {
            if self.cells[i] == 0 {
                let mut options = 0;
                for val in 1..=9 {
                    if self.is_safe(i, val) {
                        options += 1;
                    }
                }

                if options == 0 {
                    return false;
                }

                if options < min_options {
                    min_options = options;
                    best_cell = Some(i);
                }
            }
        }

        match best_cell {
            None => true, // All cells filled
            Some(idx) => {
                for val in 1..=9 {
                    if self.is_safe(idx, val) {
                        self.cells[idx] = val;
                        if self.solve_recursive() {
                            return true;
                        }
                        self.cells[idx] = 0;
                    }
                }
                false
            }
        }
    }
}