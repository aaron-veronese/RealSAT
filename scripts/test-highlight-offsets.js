// Quick test harness to validate computeNodeLengths and getOffsetFromContainer
const { JSDOM } = require('jsdom')

function computeNodeLengths(node, lengthMap) {
  if (node.nodeType === 3 /* TEXT_NODE */) {
    const text = (node.nodeValue || '').replace(/\r\n/g, '\n')
    lengthMap.set(node, text.length)
    return text.length
  }
  if (node.nodeType === 1 /* ELEMENT_NODE */) {
    const el = node
    if (el.tagName === 'BR') {
      lengthMap.set(node, 1)
      return 1
    }
    let total = 0
    for (let i = 0; i < node.childNodes.length; i++) {
      total += computeNodeLengths(node.childNodes[i], lengthMap)
    }
    lengthMap.set(node, total)
    return total
  }
  lengthMap.set(node, 0)
  return 0
}

function computeNodeStarts(node, lengthMap, startMap, start = 0) {
  startMap.set(node, start)
  if (node.nodeType === 3) return
  if (node.nodeType === 1) {
    const el = node
    if (el.tagName === 'BR') return
    let cur = start
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i]
      computeNodeStarts(child, lengthMap, startMap, cur)
      cur += (lengthMap.get(child) || 0)
    }
  }
}

function getOffsetFromContainer(range, lengthMap, startMap) {
  const container = range.container
  const offsetInContainer = range.offset
  if (container.nodeType === 3) {
    const nodeLen = lengthMap.get(container) || 0
    const off = Math.min(offsetInContainer, nodeLen)
    return (startMap.get(container) || 0) + off
  }
  if (container.nodeType === 1) {
    if (offsetInContainer === 0) return (startMap.get(container) || 0)
    const child = container.childNodes[offsetInContainer - 1]
    if (!child) return (startMap.get(container) || 0)
    return (startMap.get(child) || 0) + (lengthMap.get(child) || 0)
  }
  return 0
}

function runTest(description, html, selStart, selEnd) {
  const dom = new JSDOM(html)
  const doc = dom.window.document
  const root = doc.body
  const lengthMap = new Map()
  computeNodeLengths(root, lengthMap)
  const startMap = new Map()
  computeNodeStarts(root, lengthMap, startMap, 0)

  // create range
  const range = new dom.window.Range()
  const startContainer = getNodeAtOffset(root, selStart, lengthMap, startMap)
  const endContainer = getNodeAtOffset(root, selEnd, lengthMap, startMap)
  range.setStart(startContainer.node, startContainer.localOffset)
  range.setEnd(endContainer.node, endContainer.localOffset)
  const start = getOffsetFromContainer({ container: range.startContainer, offset: range.startOffset }, lengthMap, startMap)
  const end = getOffsetFromContainer({ container: range.endContainer, offset: range.endOffset }, lengthMap, startMap)
  console.log(description)
  console.log('HTML:', html)
  console.log('Computed start:', start, 'Computed end:', end)
  console.log('Range.toString():', range.toString())
  console.log('----')
}

function getNodeAtOffset(root, globalOffset, lengthMap, startMap) {
  // Find the deepest node holding this offset
  function walk(node) {
    const start = startMap.get(node) || 0
    const len = lengthMap.get(node) || 0
    if (globalOffset < start || globalOffset > start + len) {
      return null
    }
    // If text node, return
    if (node.nodeType === 3) {
      const localOff = globalOffset - start
      return { node, localOffset: localOff }
    }
    // Element node
    // iterate children
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i]
      const result = walk(child)
      if (result) return result
    }
    // If here, offset might be at the end of the element
    return { node, localOffset: node.childNodes.length }
  }
  return walk(root)
}

// Tests
runTest('Single line no break', '<span>Hello World</span>', 0, 5)
runTest('One line break', '<span>Line1</span><br><span>Line2</span>', 6, 11) // select 'Line2'
runTest('Two line breaks (blank line)', '<span>Line1</span><br><span></span><br><span>Line3</span>', 6, 12) // select 'Line3'
runTest('Multiple consecutive breaks', '<span>A</span><br><span></span><br><span></span><br><span>B</span>', 1, 3)

console.log('done')
