defmodule Mobilizon.Storage.Repo.Migrations.RemoveTodos do
  use Ecto.Migration

  def change do
    execute("DROP TABLE IF EXISTS todos")
    execute("DROP TABLE IF EXISTS todo_lists")
  end
end
