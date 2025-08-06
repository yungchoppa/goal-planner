package goal

type GoalDTO struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	ParentIDs   []string `json:"parentIDs"`
	ChildIDs    []string `json:"childIDs"`
	X           float64  `json:"x"`
	Y           float64  `json:"y"`
	Description string   `json:"description"`
	Done        bool     `json:"done"`
}
