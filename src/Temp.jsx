import { Replicache } from 'replicache'
import { useSubscribe } from 'replicache-react'
import { nanoid } from 'nanoid'

const rep = new Replicache({
  // other replicache options

  mutators: {
    async createTodo(tx, { id, completed, content, order }) {
      await tx.put(`todo/${id}`, {
        completed,
        content,
        order,
        id,
      })
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

export default function TodoApp() {
  const todos =
    useSubscribe(rep, async (tx) => {
      return await tx.scan({ prefix: 'todo/' }).entries().toArray()
    }) ?? []

  const onSubmit = (e) => {
    e.preventDefault()
    if (content.length > 0) {
      rep.mutate.createTodo({
        id: nanoid(),
        content,
        completed: false,
      })

      setContent('')
    }
  }

  const onChangeCompleted = (e) => {
    rep.mutate.updateTodoCompleted({
      id: todo.id,
      completed: e.target.checked,
    })
  }

  const onDelete = (_e) => {
    rep.mutate.deleteTodo({ id: todo.id })
  }

  // render
}
