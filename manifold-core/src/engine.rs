use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

#[wasm_bindgen]
#[derive(PartialEq, Eq, Clone, Copy, Serialize, Deserialize, Debug)]
pub enum Topology {
    Classic9x9,
}

#[wasm_bindgen]
pub struct ManifoldEngine {
    cells: Vec<u8>,
    adjacency: Vec<Vec<usize>>,
    size: usize,
}

#[wasm_bindgen]
impl ManifoldEngine {
    pub fn new(topo: Topology) -> ManifoldEngine {
        let (cells, adjacency) = match topo {
            Topology::Classic9x9 => generate_classic_9x9(),
        };

        ManifoldEngine {
            size: cells.len(),
            cells,
            adjacency,
        }
    }

    pub fn get_grid(&self) -> Vec<u8> {
        self.cells.clone()
    }

    pub fn set_cell(&mut self, index: usize, value: u8) -> bool {
        if index >= self.size { return false; }
        
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
        for &neighbor in &self.adjacency[index] {
            if self.cells[neighbor] == value {
                return false;
            }
        }
        true
    }

    pub fn reset(&mut self) {
        self.cells.fill(0);
    }

    pub fn solve(&mut self) -> bool {
        self.solve_recursive()
    }

    fn solve_recursive(&mut self) -> bool {
        let mut best_cell = None;
        let mut min_options = 10;

        for i in 0..self.size {
            if self.cells[i] == 0 {
                let options = self.count_legal_moves(i);
                if options == 0 { return false; }
                
                if options < min_options {
                    min_options = options;
                    best_cell = Some(i);
                    if min_options == 1 { break; }
                }
            }
        }

        let idx = match best_cell {
            Some(i) => i,
            None => return true,
        };

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

    fn count_legal_moves(&self, index: usize) -> u8 {
        let mut count = 0;
        for val in 1..=9 {
            if self.is_safe(index, val) {
                count += 1;
            }
        }
        count
    }
}

fn generate_classic_9x9() -> (Vec<u8>, Vec<Vec<usize>>) {
    let size = 81;
    let cells = vec![0; size];
    let mut adj = vec![vec![]; size];

    for i in 0..size {
        let row = i / 9;
        let col = i % 9;
        let box_r = (row / 3) * 3;
        let box_c = (col / 3) * 3;

        for k in 0..9 {
            let r_idx = row * 9 + k;
            if r_idx != i { adj[i].push(r_idx); }
            
            let c_idx = k * 9 + col;
            if c_idx != i { adj[i].push(c_idx); }

            let b_r = box_r + (k / 3);
            let b_c = box_c + (k % 3);
            let b_idx = b_r * 9 + b_c;
            if b_idx != i { adj[i].push(b_idx); }
        }
        
        adj[i].sort_unstable();
        adj[i].dedup();
    }
    (cells, adj)
}