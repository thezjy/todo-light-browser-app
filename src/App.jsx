import Ably from 'ably'
import React, { useEffect, useState } from 'react'
import { Replicache } from 'replicache'
import TodoApp from './TodoApp'

const LIST_ID_KEY = 'list_id'

const api_endpoint = import.meta.env.VITE_API_ENDPOINT

export default function App() {
  const [rep, setRep] = useState(null)

  useEffect(() => {
    let ably
    let channel
    let rep

    async function initReplicache() {
      const searchParams = new URLSearchParams(window.location.search)

      let listID = searchParams.get(LIST_ID_KEY)
      if (listID == null) {
        const response = await fetch(`${api_endpoint}/create-list-id`, {
          method: 'POST',
        })
        const json = await response.json()
        listID = json.listID
        searchParams.set(LIST_ID_KEY, listID)
        window.location.search = searchParams.toString()
      }

      const searchString = searchParams.toString()

      rep = new Replicache({
        pushURL: `${api_endpoint}/replicache-push?${searchString}`,
        pullURL: `${api_endpoint}/replicache-pull?${searchString}`,
        useMemstore: true,
        wasmModule: import.meta.env.DEV
          ? '/replicache.dev.wasm'
          : '/replicache.wasm',

        mutators: {
          async createTodo(tx, { clientSideID, completed, content, order }) {
            await tx.put(`todo/${clientSideID}`, {
              completed,
              content,
              order,
              clientSideID,
            })
          },
          async updateTodoOrder(tx, { order, clientSideID }) {
            const key = `todo/${clientSideID}`
            const todo = await tx.get(key)
            todo.order = order

            await tx.put(`todo/${clientSideID}`, todo)
          },
          async updateTodoCompleted(tx, { clientSideID, completed }) {
            const key = `todo/${clientSideID}`
            const todo = await tx.get(key)
            todo.completed = completed

            await tx.put(`todo/${clientSideID}`, todo)
          },
          async deleteTodo(tx, { clientSideID }) {
            await tx.del(`todo/${clientSideID}`)
          },
        },
      })

      setRep(rep)

      ably = new Ably.Realtime(import.meta.env.VITE_ABLY_AKY_KEY)
      channel = ably.channels.get(`todos-of-${listID}`)
      channel.subscribe('change', () => {
        rep.pull()
      })
    }

    initReplicache()

    return () => {
      if (channel != null) {
        channel.detach()
      }
      if (ably != null) {
        ably.close()
      }
      if (rep != null) {
        rep.close()
      }
    }
  }, [])

  return rep && <TodoApp rep={rep} />
}
