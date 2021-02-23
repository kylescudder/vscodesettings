<script lang="ts">
  import { onMount } from "svelte";
  import type { User } from "../types";

  export let user: User;
  export let accessToken: string;
  let text = "";
  let todos: Array<{ text: String; completed: boolean; id: number }> = [];

  async function addToDo(t: string) {
    const response = await fetch(`${apiBaseUrl}/todo`, {
      method: "POST",
      body: JSON.stringify({
        text: t,
      }),
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`,
      },
    });
    const { todo } = await response.json();
    todos = [todo, ...todos];
  }
  onMount(async () => {
    window.addEventListener("message", async (event) => {
      const message = event.data; // The json data that the extension sent
      switch (message.type) {
        case "new-todo":
          addToDo(message.value);
          break;
      }
    });
    const response = await fetch(`${apiBaseUrl}/todo`, {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    const payload = await response.json();
    todos = payload.todos;
  });
</script>

<div>Hello {user.name}</div>
<form
  on:submit|preventDefault={async () => {
    addToDo(text);
    text = "";
  }}
>
  <input bind:value={text} />
</form>

<ul>
  {#each todos as todo (todo.id)}
    <li
      class:completed={todo.completed}
      on:click={async () => {
        todo.completed = !todo.completed;
        const response = await fetch(`${apiBaseUrl}/todo`, {
          method: "PUT",
          body: JSON.stringify({
            id: todo.id,
          }),
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${accessToken}`,
          },
        });
        if (todo.completed) {
          tsvscode.postMessage({
            type: "onInfo",
            value: todo.text + " completed! Well done 🥳",
          });
        }
        const payload = await response.json();
        todos = payload.todos;
      }}
    >
      {todo.text}
    </li>
  {/each}
</ul>

<style>
  .completed {
    text-decoration: line-through;
    color: rgba(255, 255, 255, 0.5);
  }
  li {
    padding-top: 0.5rem;
    font-size: calc(11px + .5rem);
  }
</style>
