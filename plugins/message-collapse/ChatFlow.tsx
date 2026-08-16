import { useMemo, useState, type ReactNode } from 'react'
import {
  IconChevronDownOutline14, IconThinkOutline14,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { ChatNodeOwnerProps, ChatViewSlotProps } from '../contract/slots.ts'
import type { ChatNode } from '../contract/chat-nodes.ts'
import { isSettledTool } from '../contract/chat-nodes.ts'
import { ChatNodeSeat } from './ChatNodeSeat.tsx'
import css from './ChatView.module.css'

type Presentation = NonNullable<ChatNodeOwnerProps['presentation']>

interface FlowItem {
  readonly nodeKey: string
  readonly presentation: Presentation
}

type FlowRow =
  | { readonly kind: 'node'; readonly item: FlowItem }
  | { readonly kind: 'execution'; readonly key: string; readonly items: readonly FlowItem[]; readonly failed: boolean }

function hasAnswer(node: ChatNode<'assistant-step'>): boolean {
  const blocks = node.data.blocks
  return !blocks.some(block => block.kind === 'tool-call')
    && blocks.some(block => block.kind === 'text' || block.kind === 'image' || block.kind === 'other')
}

function hasAssistantExecution(node: ChatNode<'assistant-step'>): boolean {
  return node.data.blocks.some(block => block.kind === 'reasoning' || block.kind === 'tool-call')
}

function isExecutionNode(node: ChatNode): boolean {
  return node.kind === 'context'
    || node.kind === 'tool-call'
    || node.kind === 'model-retry'
    || node.kind === 'turn-error'
    || node.kind === 'turn-max-tokens'
}

function isFailedExecution(node: ChatNode): boolean {
  if (node.kind === 'turn-error') return true
  return node.kind === 'tool-call' && isSettledTool(node.data.root) && node.data.root.isError
}

/** Recompose Chat-only presentation without changing the durable node stream. */
export function composeChatFlow(order: readonly string[], nodes: readonly ChatNode[]): readonly FlowRow[] {
  const byKey = new Map(nodes.map(node => [node.key, node]))
  const rows: FlowRow[] = []
  let pending: FlowItem[] = []
  let pendingFailed = false

  const flush = (): void => {
    if (pending.length === 0) return
    const first = pending[0]
    /* v8 ignore next -- pending is guarded non-empty above. */
    if (first === undefined) return
    rows.push({
      kind: 'execution',
      key: `execution:${first.nodeKey}`,
      items: pending,
      failed: pendingFailed,
    })
    pending = []
    pendingFailed = false
  }

  for (const nodeKey of order) {
    const node = byKey.get(nodeKey)
    if (node === undefined) continue
    if (node.kind === 'assistant-step') {
      const execution = hasAssistantExecution(node)
      const answer = hasAnswer(node)
        && (node.data.status !== 'running' || !execution)
      if (execution || !answer) {
        pending.push({ nodeKey, presentation: 'execution' })
      }
      if (answer) {
        flush()
        rows.push({ kind: 'node', item: { nodeKey, presentation: 'answer' } })
      }
      continue
    }
    if (isExecutionNode(node)) {
      pending.push({ nodeKey, presentation: 'full' })
      pendingFailed ||= isFailedExecution(node)
      continue
    }
    flush()
    rows.push({ kind: 'node', item: { nodeKey, presentation: 'full' } })
  }
  flush()
  return rows
}

interface ExecutionGroupProps {
  readonly anchorKey: string
  readonly count: number
  readonly failed: boolean
  readonly title: string
  readonly children: ReactNode
}

function ExecutionGroup({ anchorKey, count, failed, title, children }: ExecutionGroupProps) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className={css.executionGroup}
      data-chat-anchor-key={anchorKey}
      data-chat-flow-key={anchorKey}
      data-chat-flow-kind="execution"
      data-chat-execution-group=""
      data-failed={failed || undefined}
    >
      <button
        type="button"
        className={css.executionHeader}
        aria-expanded={open}
        onClick={() => { setOpen(value => !value) }}
      >
        <span className={css.executionIcon} aria-hidden>
          {open ? <IconChevronDownOutline14 /> : <IconThinkOutline14 size={14} />}
        </span>
        <span>{title}</span>
      </button>
      <div className={css.executionBody} hidden={!open} data-execution-count={count}>
        {children}
      </div>
    </div>
  )
}

interface ChatFlowProps extends Omit<ChatNodeOwnerProps, 'presentation'> {
  readonly useSession: ChatViewSlotProps['useSession']
  readonly renderSlot: ChatViewSlotProps['renderSlot']
  readonly t: ChatViewSlotProps['t']
}

/** Live Chat flow: only this assembler observes node content; keyed seats remain isolated. */
export function ChatFlow(props: ChatFlowProps) {
  const order = props.useSession(snapshot => snapshot.chat.order)
  const values = props.useSession(snapshot => snapshot.chat.nodes.values()) as readonly ChatNode[]
  const rows = useMemo(() => composeChatFlow(order, values), [order, values])
  const seat = (item: FlowItem, anchored: boolean): ReactNode => (
    <ChatNodeSeat
      key={`${item.nodeKey}:${item.presentation}`}
      {...props}
      nodeKey={item.nodeKey}
      presentation={item.presentation}
      anchored={anchored}
    />
  )
  return rows.map(row => row.kind === 'node'
    ? seat(row.item, true)
    : (
      <ExecutionGroup
        key={row.key}
        anchorKey={row.key}
        count={row.items.length}
        failed={row.failed}
        title={row.items.length === 1
          ? props.t('chat.executionProcessOne')
          : props.t('chat.executionProcess', { count: row.items.length })}
      >
        {row.items.map(item => seat(item, false))}
      </ExecutionGroup>
    ))
}
