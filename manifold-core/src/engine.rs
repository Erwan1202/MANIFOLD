use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(PartialEq, Eq, Clone, Copy, Debug)]
pub enum Topology {
    Classic9x9,
    Cube6Faces,
}

#[wasm_bindgen]
pub struct SolveStats {
    pub success: bool,
    pub iterations: u32,
    pub backtracks: u32,
    pub max_depth: u32,
    pub time_us: f64,
}

#[wasm_bindgen]
pub struct ManifoldEngine {
    cells: Vec<u8>,
    fixed: Vec<bool>,
    constraints: Vec<Vec<usize>>,
    iter_count: u32,
    backtrack_count: u32,
    depth_max: u32,
}

#[wasm_bindgen]
impl ManifoldEngine {
    pub fn new(topo: Topology) -> ManifoldEngine {
        let (cells, constraints) = match topo {
            Topology::Classic9x9 => generate_classic_9x9(),
            Topology::Cube6Faces => generate_cube_topology(),
        };

        ManifoldEngine {
            fixed: vec![false; cells.len()],
            cells,
            constraints,
            iter_count: 0,
            backtrack_count: 0,
            depth_max: 0,
        }
    }

    pub fn get_grid(&self) -> Vec<u8> {
        self.cells.clone()
    }

    pub fn get_fixed_cells(&self) -> Vec<u8> {
        self.fixed.iter().map(|&b| if b { 1 } else { 0 }).collect()
    }

    pub fn is_fixed(&self, index: usize) -> bool {
        if index < self.cells.len() { self.fixed[index] } else { false }
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

    pub fn load_puzzle(&mut self, puzzle: Vec<u8>) -> bool {
        if puzzle.len() == 486 {
            for i in 0..486 {
                self.cells[i] = puzzle[i];
                self.fixed[i] = puzzle[i] != 0;
            }
            return true;
        } else if puzzle.len() == 81 {
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

    pub fn solve(&mut self) -> SolveStats {
        self.iter_count = 0;
        self.backtrack_count = 0;
        self.depth_max = 0;

        let window = web_sys::window().expect("no global window");
        let performance = window.performance().expect("no performance object");
        let start = performance.now();

        let success = self.solve_recursive(0);

        let end = performance.now();

        SolveStats {
            success,
            iterations: self.iter_count,
            backtracks: self.backtrack_count,
            max_depth: self.depth_max,
            time_us: (end - start) * 1000.0,
        }
    }

    fn solve_recursive(&mut self, depth: u32) -> bool {
        self.iter_count += 1;
        if depth > self.depth_max { self.depth_max = depth; }

        let mut best_cell: Option<usize> = None;
        let mut min_options = 10;

        for i in 0..self.cells.len() {
            if self.cells[i] == 0 {
                let mut options = 0;
                for val in 1..=9 {
                    if self.is_safe(i, val) { options += 1; }
                }

                if options == 0 { 
                    self.backtrack_count += 1;
                    return false; 
                }
                
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
                        if self.solve_recursive(depth + 1) { return true; }
                        self.cells[idx] = 0;
                    }
                }
                self.backtrack_count += 1;
                false
            }
        }
    }
}

fn generate_classic_9x9() -> (Vec<u8>, Vec<Vec<usize>>) {
    generate_sudoku_constraints(1)
}

fn generate_cube_topology() -> (Vec<u8>, Vec<Vec<usize>>) {
    let (cells, mut constraints) = generate_sudoku_constraints(6);

    let mut connect = |face_a: usize, dir_a: usize, face_b: usize, dir_b: usize| {
        let get_indices = |face: usize, dir: usize| -> Vec<usize> {
            let base = face * 81;
            match dir {
                0 => (0..9).map(|k| base + k).collect(),
                1 => (0..9).map(|k| base + k * 9 + 8).collect(),
                2 => (0..9).map(|k| base + 72 + k).collect(),
                3 => (0..9).map(|k| base + k * 9).collect(),
                _ => vec![]
            }
        };

        let edge_a = get_indices(face_a, dir_a);
        let edge_b = get_indices(face_b, dir_b);

        for i in 0..9 {
            let u = edge_a[i];
            let v = edge_b[i];
            constraints[u].push(v);
            constraints[v].push(u);
        }
    };

    connect(0, 1, 2, 3);
    connect(0, 3, 3, 1);
    connect(0, 0, 4, 2);
    connect(0, 2, 5, 0);

    connect(1, 3, 2, 1);
    connect(1, 1, 3, 3);
    connect(1, 0, 4, 0);
    connect(1, 2, 5, 2);

    for list in &mut constraints {
        list.sort_unstable();
        list.dedup();
    }

    (cells, constraints)
}

fn generate_sudoku_constraints(num_faces: usize) -> (Vec<u8>, Vec<Vec<usize>>) {
    let total_cells = num_faces * 81;
    let cells = vec![0; total_cells];
    let mut constraints = vec![vec![]; total_cells];

    for face in 0..num_faces {
        let base = face * 81;
        for i in 0..81 {
            let global_idx = base + i;
            let row = i / 9;
            let col = i % 9;
            let box_r = (row / 3) * 3;
            let box_c = (col / 3) * 3;

            for k in 0..9 {
                let r_idx = base + (row * 9 + k);
                if r_idx != global_idx { constraints[global_idx].push(r_idx); }
                
                let c_idx = base + (k * 9 + col);
                if c_idx != global_idx { constraints[global_idx].push(c_idx); }

                let b_idx = base + (box_r + (k / 3)) * 9 + (box_c + (k % 3));
                if b_idx != global_idx { constraints[global_idx].push(b_idx); }
            }
        }
    }
    (cells, constraints)
}