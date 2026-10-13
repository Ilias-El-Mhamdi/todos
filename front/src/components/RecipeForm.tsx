import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Recipe } from '../lib/recipes'
import { formatIngredients, newRecipeId, parseIngredients } from '../lib/recipes'

interface Props {
  /** Recipe being edited; undefined to create one. */
  recipe: Recipe | undefined
  onSave: (recipe: Recipe) => void
  onDelete: () => void
  onClose: () => void
}

export function RecipeForm({ recipe, onSave, onDelete, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState(recipe?.name ?? '')
  const [servings, setServings] = useState(recipe?.servings ? String(recipe.servings) : '')
  const [ingredients, setIngredients] = useState(formatIngredients(recipe?.ingredients ?? []))
  const [steps, setSteps] = useState(recipe?.steps ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('Le nom est obligatoire.')
    const parsed = parseIngredients(ingredients)
    if (!parsed.length) return setError('Ajoute au moins un ingrédient.')
    onSave({
      id: recipe?.id ?? newRecipeId(),
      name: name.trim(),
      servings: Number(servings) > 0 ? Number(servings) : undefined,
      ingredients: parsed,
      steps: steps.trim() || undefined,
    })
  }

  return (
    <dialog ref={dialogRef} className="task-form" onClose={onClose}>
      <form onSubmit={submit}>
        <h2>{recipe ? 'Modifier la recette' : 'Nouvelle recette'}</h2>

        <div className="form-row recipe-head-row">
          <label>
            Nom
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </label>
          <label>
            Portions
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
            />
          </label>
        </div>

        <label>
          <span>
            Ingrédients{' '}
            <span className="hint">(un par ligne, quantité au début : « 200 g pâtes », « 3 œufs », « sel »)</span>
          </span>
          <textarea
            rows={7}
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder={'200 g pâtes\n3 œufs\n100 g lardons\nsel'}
          />
        </label>

        <label>
          <span>
            Préparation <span className="hint">(optionnel)</span>
          </span>
          <textarea rows={4} value={steps} onChange={(e) => setSteps(e.target.value)} />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          {recipe && (
            <button
              type="button"
              className="danger"
              onClick={() => window.confirm(`Supprimer la recette « ${recipe.name} » ?`) && onDelete()}
            >
              Supprimer
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="secondary" onClick={() => dialogRef.current?.close()}>
            Annuler
          </button>
          <button type="submit" className="primary">
            Enregistrer
          </button>
        </div>
      </form>
    </dialog>
  )
}
