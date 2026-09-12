'use client';

import { useEffect } from 'react';

function textOffset(root, node, offset) {
  try {
    const range = document.createRange();
    range.selectNodeContents(root);
    range.setEnd(node, offset);
    return range.toString().length;
  } catch {
    return null;
  }
}

function restoreOffset(root, offset) {
  if (offset == null) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  let node = walker.nextNode();

  while (node) {
    const length = node.nodeValue?.length || 0;
    if (remaining <= length) {
      const range = document.createRange();
      range.setStart(node, Math.max(0, remaining));
      range.collapse(true);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    remaining -= length;
    node = walker.nextNode();
  }

  const range = document.createRange();
  range.selectNodeContents(root);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

export default function EditorCaretFix() {
  useEffect(() => {
    let frame = null;

    function handleInput(event) {
      const editor = event.target;
      if (!(editor instanceof HTMLElement) || !editor.isContentEditable) return;

      const selection = window.getSelection();
      if (!selection || !selection.rangeCount || !editor.contains(selection.anchorNode)) return;
      const offset = textOffset(editor, selection.anchorNode, selection.anchorOffset);
      if (offset == null) return;

      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!document.contains(editor)) return;
        editor.focus({ preventScroll: true });
        restoreOffset(editor, offset);
      });
    }

    document.addEventListener('input', handleInput, true);
    return () => {
      document.removeEventListener('input', handleInput, true);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
