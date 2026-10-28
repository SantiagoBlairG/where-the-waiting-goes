import { Fragment } from 'react'

/**
 * Story copy with its key words in bold. Words between **double asterisks** become <strong>,
 * in the same colour as the sentence, so the emphasis is weight alone.
 */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split('**').map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-bold text-current">
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}
