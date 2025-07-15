package goal

type GoalDTO struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	ParentIDs []string `json:"parentIDs"`
	ChildIDs  []string `json:"childIDs"`
}
