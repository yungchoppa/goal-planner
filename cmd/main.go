package main

import (
	"encoding/json"
	"net/http"
	"sync"

	"github.com/yungchoppa/goal-planner/internal/goal"
)

var (
	goalDTOs []goal.GoalDTO
	mu       sync.Mutex
)

func initGoals() {
	first := goal.New(1, "first", nil, nil)
	second := goal.New(2, "second", nil, nil)
	third := goal.New(3, "third", nil, nil)
	first.AddChilds(second, third)
	goalDTOs = append(goalDTOs, *first.ToDTO(), *second.ToDTO(), *third.ToDTO())
}

func main() {
	initGoals()
	http.Handle("/", http.FileServer(http.Dir("web")))
	http.Handle("/api/goals", http.HandlerFunc(getGoals))
	// http.Handle("/api/add", http.HandlerFunc(addWord))
	http.ListenAndServe(":8080", nil)
}

func getGoals(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	mu.Lock()
	defer mu.Unlock()
	resp := struct {
		Goals []goal.GoalDTO `json:"goals"`
	}{Goals: goalDTOs}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// func addWord(w http.ResponseWriter, r *http.Request) {
// 	if r.Method != http.MethodPost {
// 		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
// 		return
// 	}
// 	var req struct {
// 		Word string `json:"word"`
// 	}
// 	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Word == "" {
// 		http.Error(w, "Invalid input", http.StatusBadRequest)
// 		return
// 	}
// 	mu.Lock()
// 	defer mu.Unlock()
// 	words = append(words, req.Word)
// 	resp := struct {
// 		Words []string `json:"words"`
// 	}{Words: words}
// 	w.Header().Set("Content-Type", "application/json")
// 	json.NewEncoder(w).Encode(resp)
// }
