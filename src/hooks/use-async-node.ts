import { ReactNode, DependencyList, useState } from 'react'
import { useAsyncEffect } from './use-async-effect'

export function useAsyncNode<T extends ReactNode>(
  fetchNode: () => Promise<T>,
  deps: DependencyList
) {
  const [node, setNode] = useState<T>()
  useAsyncEffect(async signal => {
    const node = await fetchNode()
    if (signal.aborted) return
    setNode(node)
  }, deps)
  return node
}
