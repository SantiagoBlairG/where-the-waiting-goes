import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { App } from './App'

it('opens with the welcome, and the story question is the first chapter', () => {
  render(<App />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Where the waiting goes')
  expect(screen.getAllByRole('heading', { level: 2 })[0]).toHaveTextContent('If ordering gets faster, why doesn’t your coffee?')
})
