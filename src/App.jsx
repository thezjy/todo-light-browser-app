import React, { useEffect, useState } from 'react'
import { nanoid } from 'nanoid'
import { Replicache } from 'replicache'
import TodoApp from './TodoApp'
import Ably from 'ably'

const LIST_ID_KEY = 'list_id'

const api_endpoint = import.meta.env.VITE_API_ENDPOINT

export default function App() {
  const [rep, setRep] = useState(null)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)

    let listID
    if (searchParams.has(LIST_ID_KEY)) {
      listID = searchParams.get(LIST_ID_KEY)
    } else {
      listID = nanoid()
      searchParams.set(LIST_ID_KEY, listID)
      window.location.search = searchParams.toString()
    }

    const searchString = searchParams.toString()

    const rep = new Replicache({
      name: listID,
      pushURL: `${api_endpoint}/replicache-push?${searchString}`,
      pullURL: `${api_endpoint}/replicache-pull?${searchString}`,
      mutators: {
        async createTodo(tx, { id, completed, content, order }) {
          await tx.put(`todo/${id}`, {
            completed,
            content,
            order,
            id,
          })
        },
        async updateTodoOrder(tx, { id, order }) {
          const key = `todo/${id}`
          const todo = await tx.get(key)
          todo.order = order

          await tx.put(`todo/${id}`, todo)
        },
        async updateTodoCompleted(tx, { id, completed }) {
          const key = `todo/${id}`
          const todo = await tx.get(key)
          todo.completed = completed

          await tx.put(`todo/${id}`, todo)
        },
        async deleteTodo(tx, { id }) {
          await tx.del(`todo/${id}`)
        },
      },
    })

    setRep(rep)

    const ably = new Ably.Realtime(import.meta.env.VITE_ABLY_AKY_KEY)
    const channel = ably.channels.get(`todos-of-${listID}`)
    channel.subscribe('change', () => {
      rep.pull()
    })

    return () => {
      channel.detach()
      ably.close()
      rep.close()
    }
  }, [])

  return rep && <TodoApp rep={rep} />
}
