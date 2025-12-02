use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(PartialEq, Eq, Clone, Copy, Debug)]
pub enum Topology {
    Classic9x9,
    Cube6Faces,
}

const GRID_SIZE: usize = 486;

#[wasm_bindgen]
pub struct ManifoldEngine {
    cells: [u8; GRID_SIZE],
    fixed: [bool; GRID_SIZE],
}

#[wasm_bindgen]
impl ManifoldEngine {
    pub fn new(_topo: Topology) -> ManifoldEngine {
        ManifoldEngine {
            cells: [0; GRID_SIZE],
            fixed: [false; GRID_SIZE],
        }
    }

    pub fn get_grid(&self) -> Vec<u8> {
        self.cells.to_vec()
    }

    pub fn get_fixed_cells(&self) -> Vec<u8> {
        self.fixed.iter().map(|&b| if b { 1 } else { 0 }).collect()
    }

    pub fn is_fixed(&self, index: usize) -> bool {
        if index < GRID_SIZE { self.fixed[index] } else { false }
    }

    pub fn get_cell(&self, index: usize) -> u8 {
        if index < GRID_SIZE { self.cells[index] } else { 0 }
    }

    pub fn set_cell(&mut self, index: usize, value: u8) -> bool {
        if index >= GRID_SIZE || value > 9 { return false; }
        if self.fixed[index] { return false; }

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
        if index >= GRID_SIZE { return false; }

        let face_idx = index / 81; 
        let base_idx = face_idx * 81;
        let local_index = index % 81;

        let row = local_index / 9;
        let col = local_index % 9;
        let box_row = (row / 3) * 3;
        let box_col = (col / 3) * 3;

        for c in 0..9 {
            let idx = base_idx + (row * 9 + c);
            if idx != index && self.cells[idx] == value { return false; }
        }

        for r in 0..9 {
            let idx = base_idx + (r * 9 + col);
            if idx != index && self.cells[idx] == value { return false; }
        }

        for r in box_row..(box_row + 3) {
            for c in box_col..(box_col + 3) {
                let idx = base_idx + (r * 9 + c);
                if idx != index && self.cells[idx] == value { return false; }
            }
        }

        true
    }

    pub fn reset(&mut self) {
        for i in 0..GRID_SIZE {
            if !self.fixed[i] { self.cells[i] = 0; }
        }
    }

    pub fn load_puzzle(&mut self, puzzle: Vec<u8>) -> bool {
        if puzzle.len() == 486 {
            for i in 0..486 {
                self.cells[i] = puzzle[i];
                self.fixed[i] = puzzle[i] != 0;
            }
            return true;
        } 
        else if puzzle.len() == 81 {
            for i in 0..81 {
                self.cells[i] = puzzle[i];
                self.fixed[i] = puzzle[i] != 0;
            }
            for i in 81..486 {
                self.cells[i] = 0;
                self.fixed[i] = false;
            }
            return true;
        }
        false
    }

    pub fn solve(&mut self) -> bool {
        self.solve_recursive()
    }

    fn solve_recursive(&mut self) -> bool {
        let mut best_cell: Option<usize> = None;
        let mut min_options = 10;

        for i in 0..GRID_SIZE {
            if self.cells[i] == 0 {
                let mut options = 0;
                for val in 1..=9 {
                    if self.is_safe(i, val) { options += 1; }
                }

                if options == 0 { return false; }
                if options < min_options {
                    min_options = options;
                    best_cell = Some(i);
                }
            }
        }

        match best_cell {
            None => true,
            Some(idx) => {
                for val in 1..=9 {
                    if self.is_safe(idx, val) {
                        self.cells[idx] = val;
                        if self.solve_recursive() { return true; }
                        self.cells[idx] = 0;
                    }
                }
                false
            }
        }
    }
}