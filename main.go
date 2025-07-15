package main

import (
	"encoding/json"
	"net/http"
	"sync"
)

func main() {

	var (
		words []string
		mu    sync.Mutex
	)

	// API эндпоинты
	http.HandleFunc("/api/words", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		mu.Lock()
		defer mu.Unlock()
		resp := struct {
			Words []string `json:"words"`
		}{Words: words}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})

	http.HandleFunc("/api/add", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		var req struct {
			Word string `json:"word"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Word == "" {
			http.Error(w, "Invalid input", http.StatusBadRequest)
			return
		}
		mu.Lock()
		defer mu.Unlock()
		words = append(words, req.Word)
		resp := struct {
			Words []string `json:"words"`
		}{Words: words}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})

	http.Handle("/", http.FileServer(http.Dir(".")))

	http.ListenAndServe(":8080", nil)
}
