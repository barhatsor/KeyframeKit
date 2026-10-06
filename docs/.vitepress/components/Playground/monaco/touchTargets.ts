import type * as monaco from 'monaco-editor'

/**
 * Keeps a touch scroll going after the line it started on scrolls out of view.
 *
 * Monaco only renders the lines in view, removing a line's DOM node once it
 * scrolls out. Touch events, though, are always dispatched to the node the
 * touch started on, and once that node is detached they no longer bubble up
 * to the document, where monaco's gesture handler listens. Since the content
 * follows the finger, the touched line scrolls out right about when the finger
 * leaves the editor; from then on, the drag stops scrolling, and lifting the
 * finger gives no momentum.
 *
 * To keep the events reaching monaco, we move each touched node that monaco
 * detaches into a hidden holder inside the lines container (where monaco's
 * gesture handler expects touches to start) until the touch ends.
 */
export function retainTouchTargets(editor: monaco.editor.ICodeEditor): monaco.IDisposable {
  const linesContent = editor.getDomNode()!.querySelector<HTMLElement>('.lines-content')!

  const holder = document.createElement('div')
  holder.style.display = 'none'

  const touchTargets = new Map<number, Node>()

  // runs right after monaco renders, before the next touch event is dispatched
  const observer = new MutationObserver(() => {
    for (const target of touchTargets.values()) {
      if (target.isConnected) continue

      // re-attach the whole detached subtree (usually the view line)
      let root = target
      while (root.parentNode) root = root.parentNode
      holder.append(root)
    }
  })

  function onTouchStart(e: TouchEvent) {
    for (const touch of Array.from(e.changedTouches)) {
      touchTargets.set(touch.identifier, touch.target as Node)
    }

    if (!holder.isConnected) {
      linesContent.append(holder)
      observer.observe(linesContent, { childList: true, subtree: true })
    }
  }

  function onTouchEnd(e: TouchEvent) {
    const endedTouches = Array.from(e.changedTouches).filter(touch => touchTargets.has(touch.identifier))
    if (endedTouches.length === 0) return

    // release once the event has gone through: at touchend, monaco's
    // gesture handler still needs the target to start the momentum scroll
    setTimeout(() => {
      for (const touch of endedTouches) {
        // the identifier may already belong to a new touch
        if (touchTargets.get(touch.identifier) === touch.target) {
          touchTargets.delete(touch.identifier)
        }
      }
      if (touchTargets.size === 0) release()
    })
  }

  function release() {
    observer.disconnect()
    holder.replaceChildren()
    holder.remove()
  }

  const listenerOptions = { capture: true, passive: true }

  linesContent.addEventListener('touchstart', onTouchStart, listenerOptions)
  window.addEventListener('touchend', onTouchEnd, listenerOptions)
  window.addEventListener('touchcancel', onTouchEnd, listenerOptions)

  return {
    dispose() {
      linesContent.removeEventListener('touchstart', onTouchStart, listenerOptions)
      window.removeEventListener('touchend', onTouchEnd, listenerOptions)
      window.removeEventListener('touchcancel', onTouchEnd, listenerOptions)
      touchTargets.clear()
      release()
    }
  }
}
