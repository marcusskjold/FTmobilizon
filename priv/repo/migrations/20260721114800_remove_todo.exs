defmodule Mobilizon.Storage.Repo.Migrations.RemoveTodos do
  use Ecto.Migration

  def change do
    alter table(:actors) do
      remove_if_exists :todos_url, :string
    end

    execute("DROP TABLE IF EXISTS todos")
    execute("DROP TABLE IF EXISTS todo_lists")
  end
end
