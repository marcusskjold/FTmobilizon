defmodule Mobilizon.GraphQL.Resolvers.ActorTest do
  use Mobilizon.Web.ConnCase
  import Mobilizon.Factory
  import Swoosh.TestAssertions

  import Mock

  alias Mobilizon.Actors
  alias Mobilizon.Actors.Actor
  alias Mobilizon.Config
  alias Mobilizon.Federation.ActivityPub.Federator
  alias Mobilizon.Service.Workers.Background
  alias Mobilizon.Users
  alias Mobilizon.Users.User

  alias Mobilizon.GraphQL.{AbsintheHelpers, API}

  describe "Resolver: refresh profile" do
    @refresh_profile """
    mutation refresh_profile($actorId: ID!) {
    	refresh_profile(id: $actorId) {
    	id
    	}
    }
    """

    test "role not moderator", %{conn: conn} do
      %User{} = user_user = insert(:user, role: :user)

      res =
        conn
        |> auth_conn(user_user)
        |> AbsintheHelpers.graphql_query(query: @refresh_profile, variables: %{"actorId" => 10})

      assert res["errors"] |> hd |> Map.get("status_code") == 403
      assert res["errors"] |> hd |> Map.get("message") == "You don't have permission to do this"
    end

    test "user id not exist", %{conn: conn} do
      %User{} = user_moderator = insert(:user, role: :moderator)

      res =
        conn
        |> auth_conn(user_moderator)
        |> AbsintheHelpers.graphql_query(query: @refresh_profile, variables: %{"actorId" => 10})

      assert res["errors"] |> hd |> Map.get("status_code") == 500
      assert res["errors"] |> hd |> Map.get("message") == "No profile found with this ID"
    end

    test "user id is not remote", %{conn: conn} do
      %User{} = user_admin = insert(:user, role: :administrator)
      %Actor{} = actor = insert(:actor, domain: nil)

      res =
        conn
        |> auth_conn(user_admin)
        |> AbsintheHelpers.graphql_query(
          query: @refresh_profile,
          variables: %{"actorId" => actor.id}
        )

      assert res["errors"] |> hd |> Map.get("status_code") == 500
      assert res["errors"] |> hd |> Map.get("message") == "Only remote profiles may be refreshed"
    end

    test "user id refresh", %{conn: conn} do
      with_mock Background, [:passthrough], enqueue: fn _, _ -> :ok end do
        %User{} = user_admin = insert(:user, role: :administrator)
        %Actor{} = actor = insert(:actor, domain: "https://kaihuri.fr")

        res =
          conn
          |> auth_conn(user_admin)
          |> AbsintheHelpers.graphql_query(
            query: @refresh_profile,
            variables: %{"actorId" => actor.id}
          )

        assert res == %{"data" => %{"refresh_profile" => %{"id" => to_string(actor.id)}}}

        assert_called(
          Background.enqueue("refresh_profile", %{
            "actor_id" => actor.id
          })
        )
      end
    end
  end

  describe "Resolver: suspend_profile" do
    @suspend_profile """
    mutation suspend_profile($id: ID!) {
    	suspend_profile(id: $id) {
    		id
    	}
    }
    """

    setup %{conn: conn} do
      user = insert(:user, role: :moderator)
      actor = insert(:actor, user: user)
      {:ok, conn: conn, actor: actor, user: user}
    end

    test "role not moderator", %{conn: conn} do
      %User{} = user_user = insert(:user, role: :user)

      res =
        conn
        |> auth_conn(user_user)
        |> AbsintheHelpers.graphql_query(query: @suspend_profile, variables: %{"id" => 10})

      assert res["errors"] |> hd |> Map.get("status_code") == 403
      assert res["errors"] |> hd |> Map.get("message") == "You don't have permission to do this"
    end

    test "user id not exist", %{conn: conn, user: user} do
      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(query: @suspend_profile, variables: %{"id" => 10})

      assert res["errors"] |> hd |> Map.get("status_code") == 500
      assert res["errors"] |> hd |> Map.get("message") == "Profile not found"
    end

    test "user id is not remote", %{conn: conn, user: user} do
      %Actor{} = actor = insert(:actor, domain: nil)

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(query: @suspend_profile, variables: %{"id" => actor.id})

      assert res["errors"] |> hd |> Map.get("status_code") == 500
      assert res["errors"] |> hd |> Map.get("message") == "No remote profile found with this ID"
    end

    test "user id already suspended", %{conn: conn, user: user} do
      %Actor{} =
        actor = insert(:actor, domain: "https://kaihuri.fr", suspended: true, type: :Group)

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(query: @suspend_profile, variables: %{"id" => actor.id})

      assert res["errors"] |> hd |> Map.get("status_code") == 500
      assert res["errors"] |> hd |> Map.get("message") == "Profile already suspended"
    end

    test "user id is group", %{conn: conn, user: user} do
      %Actor{} =
        actor = insert(:actor, domain: "https://kaihuri.fr", suspended: false, type: :Group)

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(query: @suspend_profile, variables: %{"id" => actor.id})

      assert res == %{"data" => %{"suspend_profile" => %{"id" => to_string(actor.id)}}}
    end

    test "user id is person", %{conn: conn, user: user} do
      actor_user = insert(:user)

      %Actor{} =
        actor =
        insert(:actor,
          domain: "https://kaihuri.fr",
          suspended: false,
          type: :Person,
          user: actor_user
        )

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(query: @suspend_profile, variables: %{"id" => actor.id})

      assert res == %{"data" => %{"suspend_profile" => %{"id" => to_string(actor.id)}}}
    end
  end

  describe "Resolver: unsuspend_profile" do
    @unsuspend_profile """
    mutation unsuspend_profile($id: ID!) {
    	unsuspend_profile(id: $id) {
    		id
    	}
    }
    """

    setup %{conn: conn} do
      user = insert(:user, role: :moderator)
      actor = insert(:actor, user: user)
      {:ok, conn: conn, actor: actor, user: user}
    end

    test "role not moderator", %{conn: conn} do
      %User{} = user_user = insert(:user, role: :user)

      res =
        conn
        |> auth_conn(user_user)
        |> AbsintheHelpers.graphql_query(query: @unsuspend_profile, variables: %{"id" => 10})

      assert res["errors"] |> hd |> Map.get("status_code") == 403
      assert res["errors"] |> hd |> Map.get("message") == "You don't have permission to do this"
    end

    test "user id not exist", %{conn: conn, user: user} do
      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(query: @unsuspend_profile, variables: %{"id" => 10})

      assert res["errors"] |> hd |> Map.get("status_code") == 500
      assert res["errors"] |> hd |> Map.get("message") == "No remote profile found with this ID"
    end

    test "user id is person", %{conn: conn, user: user} do
      actor_user = insert(:user)

      %Actor{} =
        actor =
        insert(:actor,
          domain: "https://kaihuri.fr",
          suspended: true,
          type: :Person,
          user: actor_user
        )

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @unsuspend_profile,
          variables: %{"id" => actor.id}
        )

      assert res == %{"data" => %{"unsuspend_profile" => %{"id" => to_string(actor.id)}}}
    end
  end
end
