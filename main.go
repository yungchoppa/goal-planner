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
	http.HandleFunc("/words", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		mu.Lock()
		resp := struct {
			Words []string `json:"words"`
		}{Words: words}
		mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})

	http.HandleFunc("/add", func(w http.ResponseWriter, r *http.Request) {
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
		words = append(words, req.Word)
		resp := struct {
			Words []string `json:"words"`
		}{Words: words}
		mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})

	// Статическая раздача файлов (должна быть последней)
	http.Handle("/", http.FileServer(http.Dir(".")))

	http.ListenAndServe(":8080", nil)
}
