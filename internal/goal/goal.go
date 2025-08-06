package goal

import "strconv"

type Goal struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Parents     []*Goal `json:"parents"`
	Childs      []*Goal `json:"childs"`
	Description string  `json:"description"`
	Done        bool    `json:"done"`
	Progress    float64 `json:"progress"`
}

func New(id int, name string, parents, childs []*Goal) *Goal {
	return &Goal{
		ID:          strconv.Itoa(id),
		Name:        name,
		Parents:     parents,
		Childs:      childs,
		Description: "",
		Done:        false,
		Progress:    0.0,
	}
}

func (g *Goal) AddParents(parents ...*Goal) {
	g.Parents = append(g.Parents, parents...)
}

func (g *Goal) AddChilds(childs ...*Goal) {
	g.Childs = append(g.Childs, childs...)
}

func (g *Goal) ToDTO() *GoalDTO {
	dto := &GoalDTO{
		ID:          g.ID,
		Name:        g.Name,
		Description: g.Description,
		Done:        g.Done,
		Progress:    g.Progress,
	}

	for _, p := range g.Parents {
		dto.ParentIDs = append(dto.ParentIDs, p.ID)
	}
	for _, c := range g.Childs {
		dto.ChildIDs = append(dto.ChildIDs, c.ID)
	}
	return dto
}
