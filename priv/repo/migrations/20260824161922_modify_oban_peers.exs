defmodule Mobilizon.Storage.Repo.Migrations.ModifObanPeers do
  use Ecto.Migration

  def up, do: Oban.Migrations.up(version: 14)

  def down, do: Oban.Migrations.down(version: 14)
end
