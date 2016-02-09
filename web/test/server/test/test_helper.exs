ExUnit.start

Mix.Task.run "ecto.create", ~w(-r Server.Repo --quiet)
Mix.Task.run "ecto.migrate", ~w(-r Server.Repo --quiet)
Ecto.Adapters.SQL.begin_test_transaction(Server.Repo)

