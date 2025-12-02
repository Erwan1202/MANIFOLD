use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn init_core() {
    console_error_panic_hook::set_once();
    log("MANIFOLD ENGINE: Wasm Core Initialized.");
}