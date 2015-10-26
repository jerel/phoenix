defmodule Phoenix.PubSub.GC do
  @moduledoc """
  A garbage collector process that cleans up the table used
  by `Phoenix.PubSub.Local`.
  """

  use GenServer

  @doc """
  Starts the server.

    * `server_name` - The name to register the server under
    * `table_name` - The name of the local table

  """
  def start_link(server_name, topics_table, pids_table) do
    GenServer.start_link(__MODULE__, [topics_table, pids_table], name: server_name)
  end

  def init([topics_table, pids_table]) do
    {:ok, %{topics: topics_table, pids: pids_table}}
  end

  @doc """
  Unsubscribes the pid from the topic synchronously.

    * `gc_server` - The registered server name or pid
    * `pid` - The subscriber pid
    * `topic` - The string topic, for example "users:123"

  ## Examples

      iex> unsubscribe(:gc_server, self, "foo")
      :ok

  """
  def unsubscribe(gc_server, pid, topic) when is_atom(gc_server) do
    GenServer.call(gc_server, {:unsubscribe, pid, topic})
  end

  @doc """
  Force table clean up because the given pid is down asynchronously.

    * `local_server` - The registered server name or pid
    * `pid` - The subscriber pid

  ## Examples

      iex> down(:gc_server, self)
      :ok

  """
  def down(gc_server, pid) when is_atom(gc_server) do
    GenServer.cast(gc_server, {:down, pid})
  end

  def handle_call({:unsubscribe, pid, topic}, _from, state) do
    try do
      true = :ets.match_delete(state.topics, {topic, {pid, :_}})
      true = :ets.match_delete(state.pids, {pid, topic})
    catch
      :error, :badarg -> :badarg
    end

    {:reply, :ok, state}
  end

  def handle_cast({:down, pid}, state) do
    try do
      topics = :ets.lookup_element(state.pids, pid, 2)
      for topic <- topics do
        true = :ets.match_delete(state.topics, {topic, {pid, :_}})
      end
      true = :ets.match_delete(state.pids, {pid, :_})
    catch
      :error, :badarg -> :badarg
    end

    {:noreply, state}
  end
end
