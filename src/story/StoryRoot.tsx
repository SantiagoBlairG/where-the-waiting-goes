import { StoryExperience } from './StoryExperience'
import { StoryStatic } from './StoryStatic'
import { useStoryMode } from './useStoryMode'

/**
 * Chooses how the same story is presented. Wide screens with motion allowed get the pinned,
 * scroll-driven stage. Phones, tablets and anyone who prefers reduced motion get the same
 * beats as ordinary sections: all text and every state, with no scroll scrubbing.
 */
export function StoryRoot() {
  return useStoryMode() === 'pinned' ? <StoryExperience /> : <StoryStatic />
}
