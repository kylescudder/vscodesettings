<script lang="ts">
  import { onMount } from "svelte";
  import type { User } from "../types";

  export let user: User;
  export let accessToken: string;
  let text = "";
  let todos: Array<{
    text: String;
    completed: boolean;
    id: number;
    categorieText: string;
  }> = [];
  let selected: number;
  let answer = "";
  let categorie: Array<{
    id: number;
    text: string;
    randomColour: string;
  }> = [];

  async function addToDo(t: string, categorieText: string) {
    const response = await fetch(`${apiBaseUrl}/todo`, {
      method: "POST",
      body: JSON.stringify({
        text: t,
        categorieText: categorieText,
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
          addToDo(message.value, selected.toString());
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
    const categorieResponse = await fetch(`${apiBaseUrl}/categories`, {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    const categoriePayload = await categorieResponse.json();
    categorie = categoriePayload.categorie;
    for (let i = 0; i < categorie.length; i++) {
      const element = categorie[i];
      if (element.id % 1) {
        element.randomColour = "red";
      } else if (element.id % 2) {
        element.randomColour = "green";
      } else if (element.id % 3) {
        element.randomColour = "brown";
      } else if (element.id % 4) {
        element.randomColour = "orange";
      } else if (element.id % 5) {
        element.randomColour = "blue";
      } else if (element.id % 6) {
        element.randomColour = "pink";
      } else if (element.id % 7) {
        element.randomColour = "yellow";
      } else if (element.id % 8) {
        element.randomColour = "teal";
      } else if (element.id % 9) {
        element.randomColour = "cyan";
      }
    }
  });
</script>

<div>Hello {user.name}</div>
<form
  on:submit|preventDefault={async () => {
    addToDo(text, selected.toString());
    text = "";
  }}
>
  <input bind:value={text} />
  <select bind:value={selected} on:blur={() => (answer = "")}>
    {#each categorie as categories}
      <option value={categories.text}>
        {categories.text}
      </option>
    {/each}
  </select>
</form>
{#each categorie as categories (categories.id)}
  <div class="card">
    <h2 style="color:{categories.randomColour}">{categories.text}</h2>
    {#each todos as todo (todo.id)}
      {#if categories.text === todo.categorieText}
        <article
          class:completed={todo.completed}
          style="color:{categories.randomColour}"
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
        </article>
      {/if}
    {/each}
  </div>
{/each}

<style>
  .completed {
    text-decoration: line-through;
    color: rgba(255, 255, 255, 0.5);
  }
  li {
    padding-top: 0.5rem;
    font-size: calc(11px + 0.5rem);
  }
</style>
