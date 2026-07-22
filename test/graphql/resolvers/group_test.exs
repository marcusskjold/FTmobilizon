defmodule Mobilizon.Web.Resolvers.GroupTest do
  use Mobilizon.Web.ConnCase
  use Oban.Testing, repo: Mobilizon.Storage.Repo

  import Mobilizon.Factory

  alias Mobilizon.Actors.{Actor, Follower, Member}
  alias Mobilizon.GraphQL.AbsintheHelpers

  @non_existent_username "nonexistent"
  @new_group_params %{name: "new group", preferredUsername: "new_group"}

  setup %{conn: conn} do
    user = insert(:user)
    actor = insert(:actor, user: user)

    {:ok, conn: conn, actor: actor, user: user}
  end

  describe "create_group/3" do
    @create_group_mutation """
    mutation CreateGroup(
    $preferredUsername: String!
    $name: String!
    $summary: String
    $avatar: MediaInput
    $banner: MediaInput
    $allowSeeParticipants: Boolean
    ) {
      createGroup(
        preferredUsername: $preferredUsername
        name: $name
        summary: $summary
        banner: $banner
        avatar: $avatar
        allowSeeParticipants: $allowSeeParticipants
      ) {
        preferredUsername
        type
        banner {
          uuid
          url
        }
        allowSeeParticipants
      }
    }
    """

    test "creates a group and check a group with this name does not already exist",
         %{conn: conn, user: user} do
      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @create_group_mutation,
          variables: @new_group_params
        )

      assert res["errors"] == nil

      assert res["data"]["createGroup"]["preferredUsername"] ==
               @new_group_params.preferredUsername

      assert res["data"]["createGroup"]["type"] == "GROUP"
      assert res["data"]["createGroup"]["allowSeeParticipants"] == false

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @create_group_mutation,
          variables: @new_group_params
        )

      assert hd(res["errors"])["message"] ==
               "A profile or group with that name already exists"
    end

    test "creates a group with allowSeeParticipants to false",
         %{conn: conn, user: user} do
      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @create_group_mutation,
          variables: Map.put(@new_group_params, :allowSeeParticipants, false)
        )

      assert res["errors"] == nil

      assert res["data"]["createGroup"]["preferredUsername"] ==
               @new_group_params.preferredUsername

      assert res["data"]["createGroup"]["type"] == "GROUP"
      assert res["data"]["createGroup"]["allowSeeParticipants"] == false
    end

    test "creates a group with allowSeeParticipants to true",
         %{conn: conn, user: user} do
      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @create_group_mutation,
          variables: Map.put(@new_group_params, :allowSeeParticipants, true)
        )

      assert res["errors"] == nil

      assert res["data"]["createGroup"]["preferredUsername"] ==
               @new_group_params.preferredUsername

      assert res["data"]["createGroup"]["type"] == "GROUP"
      assert res["data"]["createGroup"]["allowSeeParticipants"] == true
    end

    test "doesn't creates a group if the username doesn't match the requirements",
         %{conn: conn, user: user} do
      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @create_group_mutation,
          variables: Map.put(@new_group_params, :preferredUsername, "no@way")
        )

      assert hd(res["errors"])["message"] == [
               "Username must only contain alphanumeric lowercased characters and underscores."
             ]
    end

    test "bad connected", %{conn: conn} do
      user_without_actor = insert(:user, role: :administrator)

      res =
        conn
        |> auth_conn(user_without_actor)
        |> AbsintheHelpers.graphql_query(
          query: @create_group_mutation,
          variables: @new_group_params
        )

      assert hd(res["errors"])["message"] ==
               "You need to be logged-in to create a group"
    end
  end

  describe "list groups" do
    @list_groups_query """
    {
        groups {
            elements {
              preferredUsername,
            },
            total
        }
      }
    """

    test "list_groups/3 doesn't returns all groups if not authenticated", %{conn: conn} do
      insert(:group, visibility: :public)
      insert(:group, visibility: :unlisted)
      insert(:group, visibility: :private)

      res = AbsintheHelpers.graphql_query(conn, query: @list_groups_query)

      assert hd(res["errors"])["message"] == "You need to be logged in"
    end

    test "list_groups/3 doesn't return all groups if not a moderator", %{conn: conn} do
      insert(:group, visibility: :public)
      insert(:group, visibility: :unlisted)
      insert(:group, visibility: :private)
      user = insert(:user)

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(query: @list_groups_query)

      assert hd(res["errors"])["message"] == "You don't have permission to do this"
    end

    test "list_groups/3 returns all groups if a moderator", %{conn: conn} do
      group_1 = insert(:group, visibility: :public)
      group_2 = insert(:group, visibility: :unlisted)
      group_3 = insert(:group, visibility: :private)
      user = insert(:user, role: :moderator)

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(query: @list_groups_query)

      assert res["data"]["groups"]["total"] == 3

      assert res["data"]["groups"]["elements"]
             |> Enum.map(& &1["preferredUsername"])
             |> MapSet.new() ==
               [group_1, group_2, group_3] |> Enum.map(& &1.preferred_username) |> MapSet.new()
    end
  end

  describe "get groups" do
    @get_group_query """
      query GetGroup(
        $id: ID!
      ) {
        getGroup(id: $id) {
          mediaSize
          id
          preferredUsername
        }
      }
    """

    test "error not authenticated", %{conn: conn} do
      group = insert(:group, visibility: :public)

      res =
        AbsintheHelpers.graphql_query(conn,
          query: @get_group_query,
          variables: %{"id" => group.id}
        )

      assert hd(res["errors"])["message"] == "You need to be logged in"
    end

    test "error if not a moderator", %{conn: conn} do
      group = insert(:group, visibility: :public)
      user = insert(:user)

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(query: @get_group_query, variables: %{"id" => group.id})

      assert hd(res["errors"])["message"] == "You don't have permission to do this"
    end

    test "error if group not exist", %{conn: conn} do
      user = insert(:user, role: :moderator)

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(query: @get_group_query, variables: %{"id" => 123})

      assert hd(res["errors"])["message"] == "Group with ID 123 not found"
    end

    test "can see group suspended", %{conn: conn} do
      group = insert(:group, visibility: :public, suspended: true)
      user_moderate = insert(:user, role: :moderator)

      res =
        conn
        |> auth_conn(user_moderate)
        |> AbsintheHelpers.graphql_query(query: @get_group_query, variables: %{"id" => group.id})

      assert res["data"]["getGroup"]["preferredUsername"] == group.preferred_username
    end

    test "get group if a moderator", %{conn: conn} do
      group = insert(:group, visibility: :public)
      user = insert(:user, role: :moderator)

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(query: @get_group_query, variables: %{"id" => group.id})

      assert res["data"]["getGroup"]["preferredUsername"] == group.preferred_username
    end
  end

  describe "find a group" do
    @group_query """
      query Group($preferredUsername: String!) {
        group(preferredUsername: $preferredUsername) {
          preferredUsername
        }
      }
    """

    @group_with_member_query """
      query Group($preferredUsername: String!) {
        group(preferredUsername: $preferredUsername) {
            preferredUsername,
            members {
              total,
              elements {
                role,
                actor {
                  preferredUsername
                }
              }
            }
        }
      }
    """

    test "find_group/3 returns a group by its username", %{conn: conn, actor: actor, user: user} do
      user2 = insert(:user)
      insert(:actor, user: user2)
      group = insert(:group)
      insert(:member, parent: group, actor: actor, role: :administrator)
      insert(:member, parent: group, role: :member)

      # Unlogged
      res =
        conn
        |> AbsintheHelpers.graphql_query(
          query: @group_with_member_query,
          variables: %{
            preferredUsername: group.preferred_username
          }
        )

      assert hd(res["errors"])["message"] ==
               "Not authorized to access object member"

      # Login with non-member
      res =
        conn
        |> auth_conn(user2)
        |> AbsintheHelpers.graphql_query(
          query: @group_query,
          variables: %{
            preferredUsername: group.preferred_username
          }
        )

      assert res["errors"] == nil

      assert res["data"]["group"]["preferredUsername"] ==
               group.preferred_username

      # Login with member
      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @group_with_member_query,
          variables: %{
            preferredUsername: group.preferred_username,
            actorId: actor.id
          }
        )

      assert res["errors"] == nil

      assert res["data"]["group"]["members"]["total"] == 2

      admin =
        res["data"]["group"]["members"]["elements"]
        |> Enum.find(&(&1["role"] == "ADMINISTRATOR"))

      assert admin["actor"]["preferredUsername"] ==
               actor.preferred_username

      # Non existent username
      res =
        conn
        |> AbsintheHelpers.graphql_query(
          query: @group_query,
          variables: %{preferredUsername: @non_existent_username}
        )

      assert res["data"]["group"] == nil

      assert hd(res["errors"])["message"] == "Group not found"
    end

    test "find_group doesn't list group members access if group is private", %{
      conn: conn,
      actor: actor
    } do
      group = insert(:group, visibility: :private)
      insert(:member, parent: group, actor: actor, role: :administrator)

      res =
        conn
        |> AbsintheHelpers.graphql_query(
          query: @group_with_member_query,
          variables: %{
            preferredUsername: group.preferred_username
          }
        )

      assert hd(res["errors"])["message"] ==
               "Not authorized to access object member"
    end
  end

  describe "update a group" do
    @update_group_mutation """
      mutation UpdateGroup(
      $id: ID!
      $name: String
      $summary: String
      $avatar: MediaInput
      $banner: MediaInput
      $visibility: GroupVisibility
      $physicalAddress: AddressInput
      ) {
        updateGroup(
          id: $id
          name: $name
          summary: $summary
          banner: $banner
          avatar: $avatar
          visibility: $visibility
          physicalAddress: $physicalAddress
        ) {
          id
          preferredUsername
          name
          summary
          visibility
          avatar {
            url
          }
          banner {
            url
          }
        }
      }
    """
    @new_group_name "new name for group"

    test "update_group/3 updates a group", %{conn: conn, user: user, actor: actor} do
      group = insert(:group)
      insert(:member, parent: group, actor: actor, role: :administrator)

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @update_group_mutation,
          variables: %{
            id: group.id,
            name: @new_group_name,
            visibility: "UNLISTED"
          }
        )

      assert is_nil(res["errors"])
      assert res["data"]["updateGroup"]["name"] == @new_group_name
      assert res["data"]["updateGroup"]["visibility"] == "UNLISTED"
    end

    test "update_group/3 requires to be logged-in to update a group", %{conn: conn} do
      group = insert(:group)

      res =
        conn
        |> AbsintheHelpers.graphql_query(
          query: @update_group_mutation,
          variables: %{id: group.id, name: @new_group_name}
        )

      assert hd(res["errors"])["message"] == "You need to be logged in"
    end

    test "update_group/3 requires to be an admin of the group to update a group", %{
      conn: conn,
      actor: actor
    } do
      group = insert(:group)
      insert(:member, parent: group, actor: actor, role: :administrator)
      user = insert(:user)
      actor2 = insert(:actor, user: user)

      # Actor not member
      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @update_group_mutation,
          variables: %{id: group.id, name: @new_group_name}
        )

      assert hd(res["errors"])["message"] == "Profile is not administrator for the group"

      # Actor member but not admin
      insert(:member, parent: group, actor: actor2, role: :moderator)

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @update_group_mutation,
          variables: %{id: group.id, name: @new_group_name}
        )

      assert hd(res["errors"])["message"] == "Profile is not administrator for the group"
    end
  end

  describe "delete a group" do
    @delete_group_mutation """
    mutation DeleteGroup($groupId: ID!) {
      deleteGroup(
        groupId: $groupId
      ) {
          id
        }
      }
    """

    test "delete_group/3 deletes a group", %{conn: conn, user: user, actor: actor} do
      group = insert(:group)
      insert(:member, parent: group, actor: actor, role: :administrator)

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @delete_group_mutation,
          variables: %{groupId: group.id}
        )

      assert res["errors"] == nil
      assert res["data"]["deleteGroup"]["id"] == to_string(group.id)

      assert_enqueued(
        worker: Mobilizon.Service.Workers.Background,
        args: %{
          "actor_id" => group.id,
          "author_id" => actor.id,
          "op" => "delete_actor",
          "reserve_username" => true,
          "suspension" => false
        }
      )

      # Can't be used right now, probably because we try to run a transaction in a Oban Job while using Ecto Sandbox

      # assert %{success: 1, snoozed: 0, failure: 0, discard: 0, cancelled: 0} == Oban.drain_queue(queue: :background)

      # res =
      #   conn
      #   |> auth_conn(user)
      #   |> AbsintheHelpers.graphql_query(
      #     query: @delete_group_mutation,
      #     variables: %{groupId: group.id}
      #   )

      # assert res["data"] == "tt"
      # assert hd(json_response(res, 200)["errors"])["message"] =~ "not found"
    end

    test "delete_group/3 should check user authentication", %{conn: conn, actor: actor} do
      group = insert(:group)
      insert(:member, parent: group, actor: actor, role: :member)

      res =
        conn
        |> AbsintheHelpers.graphql_query(
          query: @delete_group_mutation,
          variables: %{groupId: group.id}
        )

      assert hd(res["errors"])["message"] == "You need to be logged in"
    end

    test "delete_group/3 should check the actor is owned by the user", %{
      conn: conn,
      user: user,
      actor: actor
    } do
      group = insert(:group)
      insert(:member, parent: group, actor: actor, role: :member)

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @delete_group_mutation,
          variables: %{groupId: group.id}
        )

      assert hd(res["errors"])["message"] ==
               "Current profile is not an administrator of the selected group"
    end

    test "delete_group/3 should check the actor is a member of this group", %{
      conn: conn,
      user: user
    } do
      group = insert(:group)

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @delete_group_mutation,
          variables: %{groupId: group.id}
        )

      assert hd(res["errors"])["message"] =~ "not a member"
    end

    test "delete_group/3 should check the actor is an administrator of this group", %{
      conn: conn,
      user: user,
      actor: actor
    } do
      group = insert(:group)
      insert(:member, parent: group, actor: actor, role: :member)

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @delete_group_mutation,
          variables: %{groupId: group.id}
        )

      assert hd(res["errors"])["message"] =~ "not an administrator"
    end

    test "bad connected", %{conn: conn} do
      group = insert(:group)
      user_without_actor = insert(:user, role: :administrator)

      res =
        conn
        |> auth_conn(user_without_actor)
        |> AbsintheHelpers.graphql_query(
          query: @delete_group_mutation,
          variables: %{groupId: group.id}
        )

      assert hd(res["errors"])["message"] ==
               "You need to be logged-in to delete a group"
    end
  end

  describe "follow a group" do
    @follow_group_mutation """
    mutation FollowGroup($groupId: ID!, $notify: Boolean) {
      followGroup(groupId: $groupId, notify: $notify) {
        id
      }
    }
    """

    test "when not authenticated", %{conn: conn, user: _user} do
      %Actor{type: :Group} = group = insert(:group)

      res =
        conn
        |> AbsintheHelpers.graphql_query(
          query: @follow_group_mutation,
          variables: %{groupId: group.id}
        )

      assert hd(res["errors"])["message"] == "You need to be logged in"
    end

    test "when group doesn't exist", %{conn: conn, user: user} do
      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @follow_group_mutation,
          variables: %{groupId: "89542"}
        )

      assert hd(res["errors"])["message"] == "Group not found"
    end

    test "success", %{conn: conn, user: user} do
      %Actor{type: :Group} = group = insert(:group)

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @follow_group_mutation,
          variables: %{groupId: group.id}
        )

      assert res["errors"] == nil
    end

    test "bad connected", %{conn: conn} do
      group = insert(:group)
      user_without_actor = insert(:user, role: :administrator)

      res =
        conn
        |> auth_conn(user_without_actor)
        |> AbsintheHelpers.graphql_query(
          query: @follow_group_mutation,
          variables: %{groupId: group.id}
        )

      assert hd(res["errors"])["message"] ==
               "You need to be logged-in to follow a group"
    end
  end

  describe "unfollow a group" do
    @unfollow_group_mutation """
    mutation UnfollowGroup($groupId: ID!) {
      unfollowGroup(groupId: $groupId) {
        id
      }
    }
    """

    test "when not authenticated", %{conn: conn, user: _user} do
      %Actor{type: :Group} = group = insert(:group)

      res =
        conn
        |> AbsintheHelpers.graphql_query(
          query: @unfollow_group_mutation,
          variables: %{groupId: group.id}
        )

      assert hd(res["errors"])["message"] == "You need to be logged in"
    end

    test "when group doesn't exist", %{conn: conn, user: user} do
      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @unfollow_group_mutation,
          variables: %{groupId: "89542"}
        )

      assert hd(res["errors"])["message"] == "Group not found"
    end

    test "when the profile is not following the group", %{conn: conn, user: user} do
      %Actor{type: :Group} = group = insert(:group)

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @unfollow_group_mutation,
          variables: %{groupId: group.id}
        )

      assert hd(res["errors"])["message"] =~ "Could not unfollow actor: you are not following"
    end

    test "success", %{conn: conn, user: user, actor: actor} do
      %Actor{type: :Group} = group = insert(:group)

      Mobilizon.Actors.follow(group, actor)

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @unfollow_group_mutation,
          variables: %{groupId: group.id}
        )

      assert res["errors"] == nil
      assert Mobilizon.Actors.get_follower_by_followed_and_following(group, actor) == nil
    end

    test "bad connected", %{conn: conn} do
      group = insert(:group)
      user_without_actor = insert(:user, role: :administrator)

      res =
        conn
        |> auth_conn(user_without_actor)
        |> AbsintheHelpers.graphql_query(
          query: @unfollow_group_mutation,
          variables: %{groupId: group.id}
        )

      assert hd(res["errors"])["message"] ==
               "You need to be logged-in to unfollow a group"
    end
  end

  describe "update a group follow" do
    @update_group_follow_mutation """
    mutation UpdateGroupFollow($followId: ID!, $notify: Boolean) {
      updateGroupFollow(followId: $followId, notify: $notify) {
        id
        notify
      }
    }
    """
    test "when not authenticated", %{conn: conn, user: _user, actor: actor} do
      %Actor{type: :Group} = group = insert(:group)
      follow = insert(:follower, target_actor: group, actor: actor)

      res =
        conn
        |> AbsintheHelpers.graphql_query(
          query: @update_group_follow_mutation,
          variables: %{followId: follow.id}
        )

      assert hd(res["errors"])["message"] == "You need to be logged in"
    end

    test "when follow doesn't exist", %{conn: conn, user: user} do
      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @update_group_follow_mutation,
          variables: %{followId: "d7c83493-e4a0-42a2-a15d-a469e955e80a"}
        )

      assert hd(res["errors"])["message"] == "Follow not found"
    end

    test "when follow does not match the current actor", %{conn: conn, user: user} do
      %Actor{type: :Group} = group = insert(:group)
      follow = insert(:follower, target_actor: group)

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @update_group_follow_mutation,
          variables: %{followId: follow.id}
        )

      assert hd(res["errors"])["message"] == "Follow does not match your account"
    end

    test "success", %{conn: conn, user: user, actor: actor} do
      %Actor{type: :Group} = group = insert(:group)
      follow = insert(:follower, target_actor: group, actor: actor)

      assert %Follower{notify: true} =
               Mobilizon.Actors.get_follower_by_followed_and_following(group, actor)

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @update_group_follow_mutation,
          variables: %{followId: follow.id, notify: false}
        )

      assert res["errors"] == nil
      assert res["data"]["updateGroupFollow"]["notify"] == false

      assert %Follower{notify: false} =
               Mobilizon.Actors.get_follower_by_followed_and_following(group, actor)
    end
  end

  describe "Member Resolver to join a group" do
    @join_group_mutation """
    mutation JoinGroup($groupId: ID!) {
      joinGroup(groupId: $groupId) {
        id
        role,
        actor {
          id
        },
        parent {
          id
        }
      }
    }
    """

    test "join_group/3 should create a member", %{conn: conn, user: user, actor: actor} do
      group = insert(:group)

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @join_group_mutation,
          variables: %{groupId: group.id}
        )

      assert res["errors"] == nil
      assert res["data"]["joinGroup"]["role"] == "NOT_APPROVED"
      assert res["data"]["joinGroup"]["parent"]["id"] == to_string(group.id)
      assert res["data"]["joinGroup"]["actor"]["id"] == to_string(actor.id)

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @join_group_mutation,
          variables: %{groupId: group.id}
        )

      assert hd(res["errors"])["message"] =~ "already a member"
    end

    test "join_group/3 should check the group is not invite only", %{
      conn: conn,
      user: user
    } do
      group = insert(:group, %{openness: :invite_only})

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @join_group_mutation,
          variables: %{groupId: group.id}
        )

      assert hd(res["errors"])["message"] =~ "cannot join this group"
    end

    test "join_group/3 should check the group exists", %{
      conn: conn,
      user: user
    } do
      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @join_group_mutation,
          variables: %{groupId: 1042}
        )

      assert hd(res["errors"])["message"] =~ "Group not found"
    end

    test "bad connected", %{conn: conn} do
      group = insert(:group)
      user_without_actor = insert(:user, role: :administrator)

      res =
        conn
        |> auth_conn(user_without_actor)
        |> AbsintheHelpers.graphql_query(
          query: @join_group_mutation,
          variables: %{groupId: group.id}
        )

      assert hd(res["errors"])["message"] ==
               "You need to be logged-in to join a group"
    end
  end

  describe "Member Resolver to leave from a group" do
    @leave_group_mutation """
    mutation LeaveGroup($groupId: ID!) {
      leaveGroup(groupId: $groupId) {
        id
      }
    }
    """

    test "leave_group/3 should delete a member from a group", %{
      conn: conn,
      user: user,
      actor: actor
    } do
      group = insert(:group)
      insert(:member, role: :administrator, parent: group)
      %Member{id: member_id} = insert(:member, %{actor: actor, parent: group})

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @leave_group_mutation,
          variables: %{groupId: group.id}
        )

      assert res["errors"] == nil
      assert res["data"]["leaveGroup"]["id"] == to_string(member_id)
    end

    test "leave_group/3 should check if the member is the only administrator", %{
      conn: conn,
      actor: actor,
      user: user
    } do
      group = insert(:group)
      insert(:member, %{actor: actor, role: :creator, parent: group})
      insert(:member, %{parent: group})

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @leave_group_mutation,
          variables: %{groupId: group.id}
        )

      assert hd(res["errors"])["message"] =~ "only administrator"
    end

    test "leave_group/3 should check the user is logged in", %{conn: conn, actor: actor} do
      group = insert(:group)
      insert(:member, %{actor: actor, parent: group})

      res =
        conn
        |> AbsintheHelpers.graphql_query(
          query: @leave_group_mutation,
          variables: %{groupId: group.id}
        )

      assert hd(res["errors"])["message"] == "You need to be logged in"
    end

    test "leave_group/3 should check the group exists", %{
      conn: conn,
      user: user,
      actor: actor
    } do
      group = insert(:group)
      insert(:member, %{actor: actor, parent: group})

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @leave_group_mutation,
          variables: %{groupId: 1042}
        )

      assert hd(res["errors"])["message"] =~ "Group not found"
    end

    test "bad connected", %{conn: conn} do
      group = insert(:group)
      user_without_actor = insert(:user, role: :administrator)

      res =
        conn
        |> auth_conn(user_without_actor)
        |> AbsintheHelpers.graphql_query(
          query: @leave_group_mutation,
          variables: %{groupId: group.id}
        )

      assert hd(res["errors"])["message"] ==
               "You need to be logged-in to leave a group"
    end
  end
end
