---
slug: "list-reverse-reverse"
title: "List Reverse Reverse"
difficulty: "hard"
tags: ["lists", "induction", "program-verification"]
sort_order: 8
starter_code: |
  -- Prove that reversing a list twice gives back the original list.
  -- You may need helper lemmas about reverse and append.

  theorem reverse_reverse (α : Type) (xs : List α) : xs.reverse.reverse = xs := by
    sorry
---

# List Reverse Reverse

## Goal

Prove that reversing a list twice yields the original list:

$$\text{reverse}(\text{reverse}(xs)) = xs$$

## Background

List reverse is defined recursively:
- `[].reverse = []`
- `(x :: xs).reverse = xs.reverse ++ [x]`

Proving `reverse (reverse xs) = xs` requires induction on the list and a key helper lemma about how reverse distributes over append.

## Hints

- You will likely need: `List.reverse_append : (xs ++ ys).reverse = ys.reverse ++ xs.reverse`
- Do induction on `xs`.
- **Base case**: `[].reverse.reverse = []` — follows by simplification.
- **Inductive step**: `(x :: xs).reverse.reverse = x :: xs` — unfold reverse, use the append-reverse lemma, then apply the induction hypothesis.
- `simp [List.reverse_cons, List.reverse_append]` might close goals.

## Difficulty Note

This is rated **hard** because it requires understanding how multiple list operations interact and potentially proving or invoking auxiliary lemmas.
