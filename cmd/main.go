package main

import (
	"encoding/json"
	"net/http"
	"strconv"
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
	// Пример: можно задать описание
	first.Description = "Описание для первой цели"
	second.Description = "Описание для второй цели"
	second.Done = true
	third.Description = "Описание для третьей цели"
	first.AddChilds(second, third)

	// Задаём начальные координаты для стартовых целей
	firstDTO := first.ToDTO()
	firstDTO.X = 400
	firstDTO.Y = 200

	secondDTO := second.ToDTO()
	secondDTO.X = 200
	secondDTO.Y = 350

	thirdDTO := third.ToDTO()
	thirdDTO.X = 600
	thirdDTO.Y = 350

	goalDTOs = append(goalDTOs, *firstDTO, *secondDTO, *thirdDTO)
}

func main() {
	initGoals()
	http.Handle("/", http.FileServer(http.Dir("web")))
	http.Handle("/api/goals", http.HandlerFunc(getGoals))
	http.Handle("/api/add", http.HandlerFunc(addGoal))
	http.Handle("/api/save", http.HandlerFunc(saveGoal))
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

func addGoal(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		Name        string   `json:"name"`
		ParentIDs   []string `json:"parentIDs"`
		ChildIDs    []string `json:"childIDs"`
		X           float64  `json:"x"`
		Y           float64  `json:"y"`
		Description string   `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	mu.Lock()
	defer mu.Unlock()
	// Генерируем новый id (строка)
	maxId := 0
	for _, g := range goalDTOs {
		if id, err := strconv.Atoi(g.ID); err == nil && id > maxId {
			maxId = id
		}
	}
	newId := strconv.Itoa(maxId + 1)
	// Формируем новый GoalDTO
	newGoal := goal.GoalDTO{
		ID:          newId,
		Name:        req.Name,
		ParentIDs:   req.ParentIDs,
		ChildIDs:    req.ChildIDs,
		X:           req.X,
		Y:           req.Y,
		Description: req.Description,
	}
	// Обновляем связи у родителей
	for _, pid := range req.ParentIDs {
		for i := range goalDTOs {
			if goalDTOs[i].ID == pid {
				goalDTOs[i].ChildIDs = append(goalDTOs[i].ChildIDs, newId)
			}
		}
	}
	// Обновляем связи у детей
	for _, cid := range req.ChildIDs {
		for i := range goalDTOs {
			if goalDTOs[i].ID == cid {
				goalDTOs[i].ParentIDs = append(goalDTOs[i].ParentIDs, newId)
			}
		}
	}
	// Добавляем в память
	goalDTOs = append(goalDTOs, newGoal)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(struct{ OK bool }{true})
}

// Эндпоинт для обновления узла целиком (позиция, имя, связи)
func saveGoal(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req goal.GoalDTO
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ID == "" {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	mu.Lock()
	defer mu.Unlock()
	updated := false
	for i := range goalDTOs {
		if goalDTOs[i].ID == req.ID {
			goalDTOs[i] = req
			updated = true
			break
		}
	}
	if !updated {
		http.Error(w, "Goal not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(struct{ OK bool }{true})
}
