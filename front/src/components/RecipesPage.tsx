import { useState } from 'react'
import { formatQty } from '../lib/quantity'
import type { IngredientCheck, Recipe } from '../lib/recipes'
import { AVAILABILITY, EXAMPLE_RECIPES, addChecksToList, checkRecipe, newRecipeId, scaleRecipe } from '../lib/recipes'
import type { ShoppingState } from '../lib/shopping'
import { RecipeForm } from './RecipeForm'

interface Props {
  recipes: Recipe[]
  shopping: ShoppingState
  onSave: (recipe: Recipe) => void
  onDelete: (id: string) => void
  updateShopping: (fn: (s: ShoppingState) => ShoppingState) => void
}

const needsBuying = (c: IngredientCheck) => c.status !== 'ok'

export function RecipesPage({ recipes, shopping, onSave, onDelete, updateShopping }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  // undefined recipe = creating one
  const [editing, setEditing] = useState<{ recipe?: Recipe } | null>(null)
  const open = recipes.find((r) => r.id === openId)

  const save = (recipe: Recipe) => {
    onSave(recipe)
    setEditing(null)
  }

  return (
    <div className="recipes-page">
      {open ? (
        <RecipeDetail
          key={open.id}
          recipe={open}
          shopping={shopping}
          onBack={() => setOpenId(null)}
          onEdit={() => setEditing({ recipe: open })}
          updateShopping={updateShopping}
        />
      ) : (
        <>
          <div className="today-head">
            <h2>Recettes</h2>
            <button className="primary" onClick={() => setEditing({})}>
              + Nouvelle recette
            </button>
          </div>

          {recipes.length === 0 && (
            <div className="empty">
              <p>
                Aucune recette.
                <br />
                Chaque recette compare ses ingrédients à ton stock et ajoute ce qui manque à la liste de courses.
              </p>
              <button
                className="secondary"
                onClick={() => EXAMPLE_RECIPES.forEach((r) => onSave({ ...r, id: newRecipeId() }))}
              >
                Ajouter 2 exemples
              </button>
            </div>
          )}

          <ul className="recipe-list">
            {recipes.map((recipe) => {
              const checks = checkRecipe(shopping, recipe)
              const ok = checks.filter((c) => !needsBuying(c)).length
              const total = checks.length
              return (
                <li key={recipe.id}>
                  <button className="recipe-card" onClick={() => setOpenId(recipe.id)}>
                    <span className="recipe-card-title">
                      {recipe.name}
                      {recipe.servings && <span className="hint"> · {recipe.servings} pers.</span>}
                    </span>
                    <span className={`badge ${ok === total ? 'status-badge-ok' : 'status-badge-aujourdhui'}`}>
                      {ok === total ? 'Tout est là ✅' : `${total - ok} à acheter`}
                    </span>
                    <span className="progress recipe-progress">
                      <span className="progress-bar" style={{ width: `${(ok / total) * 100}%` }} />
                    </span>
                    <span className="hint">
                      {ok}/{total} ingrédients dispo
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {editing && (
        <RecipeForm
          recipe={editing.recipe}
          onSave={save}
          onDelete={() => {
            if (editing.recipe) onDelete(editing.recipe.id)
            setEditing(null)
            setOpenId(null)
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

interface DetailProps {
  recipe: Recipe
  shopping: ShoppingState
  onBack: () => void
  onEdit: () => void
  updateShopping: Props['updateShopping']
}

const defaultSelection = (checks: IngredientCheck[]) =>
  new Set(checks.flatMap((c, i) => (needsBuying(c) && !c.onList ? [i] : [])))

function RecipeDetail({ recipe, shopping, onBack, onEdit, updateShopping }: DetailProps) {
  const baseServings = recipe.servings ?? 1
  const [servings, setServings] = useState(baseServings)
  const scaled = scaleRecipe(recipe, servings)
  const checks = checkRecipe(shopping, scaled)
  const [selected, setSelected] = useState(() => defaultSelection(checks))
  const [added, setAdded] = useState(0)

  // New quantities mean new shortfalls: start the selection over.
  const changeServings = (next: number) => {
    setServings(next)
    setSelected(defaultSelection(checkRecipe(shopping, scaleRecipe(recipe, next))))
    setAdded(0)
  }

  const toggle = (i: number) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  const addSelection = () => {
    const picked = checks.filter((_, i) => selected.has(i))
    updateShopping((s) => addChecksToList(s, picked))
    setAdded(picked.length)
    setSelected(new Set())
  }

  const buyable = checks.flatMap((c, i) => (needsBuying(c) ? [i] : []))

  return (
    <>
      <div className="recipe-detail-head">
        <button className="link" onClick={onBack}>
          ← Recettes
        </button>
        <button className="link" onClick={onEdit}>
          Modifier
        </button>
      </div>
      <h2 className="recipe-title">{recipe.name}</h2>
      <div className="servings">
        <span className="qty-stepper" role="group" aria-label="Nombre de portions">
          <button
            onClick={() => changeServings(servings - 1)}
            disabled={servings <= 1}
            aria-label="Une portion de moins"
          >
            −
          </button>
          <span className="qty" aria-live="polite">
            {servings} <small>pers.</small>
          </span>
          <button onClick={() => changeServings(servings + 1)} aria-label="Une portion de plus">
            +
          </button>
        </span>
        {servings !== baseServings && (
          <button className="link" onClick={() => changeServings(baseServings)}>
            Revenir à {baseServings} pers.
          </button>
        )}
      </div>

      <ul className="shop-list ingredient-list">
        {checks.map((c, i) => {
          const canBuy = needsBuying(c)
          const shortfall =
            c.toBuy.qty !== undefined && c.ingredient.qty !== undefined && c.toBuy.qty !== c.ingredient.qty
          return (
            <li key={i} className={`shop-item ingredient avail-${c.status}`}>
              {canBuy ? (
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggle(i)}
                  aria-label={`Ajouter ${c.ingredient.name} à la liste`}
                />
              ) : (
                <span className="avail-icon" aria-hidden>
                  ✅
                </span>
              )}
              <span className="shop-name">
                {c.ingredient.name}
                {c.ingredient.qty !== undefined && <span className="qty-badge">{formatQty(c.ingredient)}</span>}
                {c.ingredient.measure && <span className="qty-badge">{c.ingredient.measure}</span>}
                <span className="ingredient-status">
                  {c.status !== 'ok' && `${AVAILABILITY[c.status].icon} `}
                  {AVAILABILITY[c.status].label}
                  {c.stock?.qty !== undefined &&
                    ` · en stock : ${formatQty({ qty: c.stock.qty, unit: c.stock.unit ?? '' }).replace('×', '')}`}
                  {shortfall && ` · manque ${formatQty(c.toBuy).replace('×', '')}`}
                </span>
              </span>
              {c.onList && (
                <span className="on-list" title="Déjà sur la liste de courses">
                  🛒
                </span>
              )}
            </li>
          )
        })}
      </ul>

      {buyable.length > 0 ? (
        <div className="recipe-actions">
          <button
            className="link"
            onClick={() => setSelected(new Set(selected.size === buyable.length ? [] : buyable))}
          >
            {selected.size === buyable.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
          <button className="primary" disabled={selected.size === 0} onClick={addSelection}>
            🛒 Ajouter {selected.size || ''} à la liste
          </button>
        </div>
      ) : (
        <p className="empty">Tout est là, à toi de cuisiner 🍳</p>
      )}
      {added > 0 && (
        <p className="added-note" role="status">
          {added} ingrédient{added > 1 ? 's' : ''} ajouté{added > 1 ? 's' : ''} à la liste ✓
        </p>
      )}

      {recipe.steps && (
        <section className="group">
          <h2>Préparation</h2>
          <p className="recipe-steps">{recipe.steps}</p>
        </section>
      )}
    </>
  )
}
