defmodule Mobilizon.Events.CategoriesTest do
  use ExUnit.Case, async: false

  alias Mobilizon.Events.Categories

  setup do
    instance = Application.get_env(:mobilizon, :instance)
    on_exit(fn -> Application.put_env(:mobilizon, :instance, instance) end)
  end

  defp put_visible(value) do
    instance =
      :mobilizon
      |> Application.get_env(:instance)
      |> Keyword.put(:visible_categories, value)

    Application.put_env(:mobilizon, :instance, instance)
  end

  test "returns every category when unset" do
    put_visible(nil)
    assert Categories.selectable() == Categories.list()
  end

  test "filters to a comma-separated allowlist, case-insensitively" do
    put_visible("music, THEATRE")
    assert Enum.map(Categories.selectable(), & &1.id) == [:music, :theatre]
  end

  test "accepts a list of ids" do
    put_visible([:music, :theatre])
    assert Enum.map(Categories.selectable(), & &1.id) == [:music, :theatre]
  end

  test "returns nothing when the allowlist matches no category" do
    put_visible(["nope"])
    assert Categories.selectable() == []
  end

  test "does not narrow the list used by the GraphQL enum" do
    put_visible(["music"])
    assert length(Categories.list()) > length(Categories.selectable())
  end

  test "the configured allowlist only contains real category ids" do
    ids = Application.get_env(:mobilizon, :instance)[:visible_categories] || []
    known = Enum.map(Categories.list(), &to_string(&1.id))

    assert Enum.all?(ids, &(to_string(&1) in known)),
           "unknown category ids in :visible_categories: #{inspect(ids -- known)}"
  end
end
