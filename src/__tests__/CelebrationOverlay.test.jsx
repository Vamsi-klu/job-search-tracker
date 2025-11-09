import { render, screen } from '@testing-library/react'
import { act } from 'react'
import CelebrationOverlay, { getOverlayRoot } from '../components/CelebrationOverlay'
import { vi } from 'vitest'

describe('CelebrationOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders success graffiti overlay and auto closes after duration', () => {
    const handleClose = vi.fn()
    render(
      <CelebrationOverlay
        celebration={{
          type: 'success',
          title: 'Milestone',
          message: 'Great work',
          duration: 1200
        }}
        onClose={handleClose}
        theme="dark"
      />
    )

    expect(screen.getByText('Milestone')).toBeInTheDocument()
    expect(screen.getByText('Great work')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1200)
    })
    expect(handleClose).toHaveBeenCalled()
  })

  it('renders failure overlay with thumbs down icon', () => {
    render(
      <CelebrationOverlay
        celebration={{
          type: 'failure',
          title: 'Needs Attention',
          message: 'Application removed'
        }}
        onClose={() => {}}
        theme="dark"
      />
    )

    expect(screen.getByText('Needs Attention')).toBeInTheDocument()
    expect(screen.getByText('Application removed')).toBeInTheDocument()
    // thumbs down emoji particles should appear
    expect(screen.getAllByText('😞').length).toBeGreaterThan(0)
  })

  it('uses fallback titles and handles missing portal roots', () => {
    const { container, rerender } = render(
      <CelebrationOverlay
        celebration={null}
        onClose={() => {}}
        theme="dark"
        portalTarget={null}
      />
    )
    expect(container).toBeEmptyDOMElement()

    rerender(
      <CelebrationOverlay
        celebration={{
          type: 'failure',
          message: 'Default title path'
        }}
        onClose={() => {}}
        theme="dark"
      />
    )

    expect(screen.getByText('Heads up!')).toBeInTheDocument()
    expect(screen.getByText('Default title path')).toBeInTheDocument()
  })

  it('uses success fallback titles when missing', () => {
    render(
      <CelebrationOverlay
        celebration={{
          type: 'success',
          message: 'All done'
        }}
        onClose={() => {}}
        theme="dark"
      />
    )

    expect(screen.getByText('Great news!')).toBeInTheDocument()
    expect(screen.getByText('All done')).toBeInTheDocument()
  })

  it('returns null overlay root when document is unavailable', () => {
    const originalDocument = global.document
    global.document = undefined
    expect(getOverlayRoot()).toBeNull()
    global.document = originalDocument
  })
})
