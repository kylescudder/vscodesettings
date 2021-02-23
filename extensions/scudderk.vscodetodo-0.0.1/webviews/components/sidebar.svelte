<script lang="ts">
  import { onMount } from "svelte";
  import type { User } from "../types";
  import ToDos from "./ToDos.svelte";

  let accessToken = "";
  let loading = true;
  let user: User | null = null;
  let page: "todos" | "contact" = tsvscode.getState()?.page || "todos";

  $: {
    tsvscode.setState({ page });
  }

  onMount(async () => {
    window.addEventListener("message", async (event) => {
      const message = event.data; // The json data that the extension sent
      switch (message.type) {
        case "token":
          accessToken = message.value;
          const response = await fetch(`${apiBaseUrl}/me`, {
            headers: {
              authorization: `Bearer ${accessToken}`,
            },
          });
          const data = await response.json();
          user = data.user;
          loading = false;
          break;
      }
    });

    tsvscode.postMessage({ type: "get-token", value: undefined });
  });
</script>

<div>
  <h1>To Do List</h1>
</div>
{#if loading}
  <div>loading...</div>
{:else if user}
  {#if page === "todos"}
    <ToDos {user} {accessToken} />
    <button
      on:click={() => {
        page = "contact";
      }}>Go to contact page</button
    >
  {:else}
    <div>Contact me here: edfsfsdf</div>
    <button
      on:click={() => {
        page = "todos";
      }}>Go to back</button
    >
  {/if}
  <button
    on:click={() => {
      accessToken = "";
      user = null;
      tsvscode.postMessage({ type: "logout", value: undefined });
    }}>Logout</button
  >
{:else}
  <button
    on:click={() => {
      tsvscode.postMessage({ type: "authenticate", value: undefined });
    }}>Login with GitHub</button
  >
{/if}
