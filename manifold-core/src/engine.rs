use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(PartialEq, Eq, Clone, Copy, Debug)]
pub enum Topology {
    Classic9x9,
    Cube486, 
}

#[wasm_bindgen]
pub struct ManifoldEngine {
    cells: Vec<u8>,              
    fixed: Vec<bool>,            
    constraints: Vec<Vec<usize>>, 
}

#[wasm_bindgen]
impl ManifoldEngine {
    pub fn new(topo: Topology) -> ManifoldEngine {
        let (cells, constraints) = match topo {
            Topology::Classic9x9 => generate_classic_9x9(),
            Topology::Cube486 => generate_empty_graph(486),
        };

        ManifoldEngine {
            fixed: vec![false; cells.len()],
            cells,
            constraints,
        }
    }

    pub fn get_grid(&self) -> Vec<u8> {
        self.cells.clone()
    }

    pub fn get_fixed_cells(&self) -> Vec<u8> {
        self.fixed.iter().map(|&b| if b { 1 } else { 0 }).collect()
    }

    pub fn load_puzzle(&mut self, puzzle: Vec<u8>) -> bool {
        if puzzle.len() != self.cells.len() {
            return false;
        }
        
        for i in 0..self.cells.len() {
            self.cells[i] = puzzle[i];
            self.fixed[i] = puzzle[i] != 0;
        }
        true
    }

    pub fn set_cell(&mut self, index: usize, value: u8) -> bool {
        if index >= self.cells.len() || value > 9 { return false; }
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
        for &neighbor_idx in &self.constraints[index] {
            if self.cells[neighbor_idx] == value {
                return false;
            }
        }
        true
    }

    pub fn reset(&mut self) {
        for i in 0..self.cells.len() {
            if !self.fixed[i] { self.cells[i] = 0; }
        }
    }

    pub fn solve(&mut self) -> bool {
        self.solve_recursive()
    }

    fn solve_recursive(&mut self) -> bool {
        let mut best_cell: Option<usize> = None;
        let mut min_options = 10;

        for i in 0..self.cells.len() {
            if self.cells[i] == 0 {
                let mut options = 0;
                for val in 1..=9 {
                    if self.is_safe(i, val) { options += 1; }
                }

                if options == 0 { return false; }
                if options < min_options {
                    min_options = options;
                    best_cell = Some(i);
                    if min_options == 1 { break; }
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


fn generate_empty_graph(size: usize) -> (Vec<u8>, Vec<Vec<usize>>) {
    (vec![0; size], vec![vec![]; size])
}

fn generate_classic_9x9() -> (Vec<u8>, Vec<Vec<usize>>) {
    let size = 81;
    let cells = vec![0; size];
    let mut constraints = vec![vec![]; size];

    for i in 0..size {
        let row = i / 9;
        let col = i % 9;
        let box_r = (row / 3) * 3;
        let box_c = (col / 3) * 3;

        for k in 0..9 {
            let r_idx = row * 9 + k;
            if r_idx != i { constraints[i].push(r_idx); }

            let c_idx = k * 9 + col;
            if c_idx != i { constraints[i].push(c_idx); }

            let b_r = box_r + (k / 3);
            let b_c = box_c + (k % 3);
            let b_idx = b_r * 9 + b_c;
            if b_idx != i { constraints[i].push(b_idx); }
        }
        
        constraints[i].sort_unstable();
        constraints[i].dedup();
    }
    (cells, constraints)
}