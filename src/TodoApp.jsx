import { generateKeyBetween } from 'fractional-indexing'
import { nanoid } from 'nanoid'
import React, { useState } from 'react'
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd'
import { useSubscribe } from 'replicache-react'

export default function TodoApp({ rep }) {
  const todos =
    useSubscribe(rep, async (tx) => {
      const todos = await tx.scan({ prefix: 'todo/' }).entries().toArray()
      todos.sort(([, { order: a }], [, { order: b }]) => {
        if (a < b) {
          return -1
        }

        if (a > b) {
          return 1
        }

        return 0
      })

      return todos
    }) ?? []

  const [content, setContent] = useState('')

  const onDragEnd = (result) => {
    if (result.destination != null) {
      const {
        draggableId: clientSideID,
        source: { index: sourceIndex },
        destination: { index: destinationIndex },
      } = result

      if (sourceIndex != destinationIndex) {
        const getOrderByIndex = (index) => {
          return todos[index]?.[1]?.order ?? null
        }
        const order =
          sourceIndex < destinationIndex
            ? generateKeyBetween(
                getOrderByIndex(destinationIndex),
                getOrderByIndex(destinationIndex + 1),
              )
            : generateKeyBetween(
                getOrderByIndex(destinationIndex - 1),
                getOrderByIndex(destinationIndex),
              )

        const [key, { id }] = todos.find(
          (todo) => todo[1].clientSideID === clientSideID,
        )
        rep.mutate.updateTodoOrder({ id, order, clientSideID })
      }
    }
  }

  return (
    <div className="p-2 mx-auto font-sans text-xl sm:max-w-lg">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (content.length > 0) {
            const lastTodo =
              todos.length > 0 ? todos[todos.length - 1][1] : null
            const order = generateKeyBetween(lastTodo?.order ?? null, null)

            rep.mutate.createTodo({
              clientSideID: nanoid(),
              content,
              order,
              completed: false,
            })

            setContent('')
          }
        }}
      >
        <input
          autoFocus
          className="w-full p-1 mb-4 border rounded"
          value={content}
          placeholder="Create something to do..."
          onChange={(e) => setContent(e.target.value)}
        />
      </form>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable">
          {(droppableProvided, droppableSnapshot) => (
            <ul
              {...droppableProvided.droppableProps}
              ref={droppableProvided.innerRef}
            >
              {todos.map(([_key, todo], index) => {
                return (
                  <Draggable
                    key={todo.clientSideID}
                    draggableId={todo.clientSideID}
                    index={index}
                  >
                    {(draggableProvided, draggableSnapshot) => (
                      <li
                        {...draggableProvided.draggableProps}
                        {...draggableProvided.dragHandleProps}
                        ref={draggableProvided.innerRef}
                        className="flex items-center justify-between bg-white border-b"
                      >
                        <span
                          className={`flex-1 block p-1 mr-4 ${
                            todo.completed ? 'line-through' : ''
                          }`}
                        >
                          {todo.content}
                        </span>

                        <div className="flex items-center">
                          <label className="flex p-2 mr-1">
                            <input
                              type="checkbox"
                              checked={todo.completed}
                              onChange={(e) => {
                                rep.mutate.updateTodoCompleted({
                                  id: todo.id,
                                  completed: e.target.checked,
                                  clientSideID: todo.clientSideID,
                                })
                              }}
                            />
                          </label>

                          <button
                            onClick={() => {
                              rep.mutate.deleteTodo({
                                id: todo.id,
                                clientSideID: todo.clientSideID,
                              })
                            }}
                            className="flex items-center p-2 font-mono text-base leading-4"
                          >
                            x
                          </button>
                        </div>
                      </li>
                    )}
                  </Draggable>
                )
              })}
              {droppableProvided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
