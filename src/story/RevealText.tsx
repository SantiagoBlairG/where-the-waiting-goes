import { createElement } from 'react'

type RevealTextProps = {
  text: string
  as: 'h1' | 'h2' | 'p'
  className?: string
  id?: string
  /** Words (or a short phrase) set in the italic serif for contrast. */
  accent?: string
}

/**
 * Renders text as masked words so a timeline can slide each word up from behind its own
 * mask (`[data-word]`). The words stay real text in normal order, so reading order, selection
 * and translation are unaffected. Without a timeline the words simply show.
 */
export function RevealText({ text, as, className, id, accent }: RevealTextProps) {
  const words = text.split(' ')
  const accented = new Set(accent ? accent.split(' ') : [])
  return createElement(
    as,
    { className, id },
    words.map((word, i) => (
      <span key={i}>
        <span className="word-mask">
          <span data-word className={`inline-block will-change-transform${accented.has(word) ? ' accent-serif' : ''}`}>
            {word}
          </span>
        </span>
        {i < words.length - 1 ? ' ' : null}
      </span>
    )),
  )
}
