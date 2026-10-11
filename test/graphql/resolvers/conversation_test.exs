defmodule Mobilizon.GraphQL.Resolvers.ConversationTest do
  use Mobilizon.Web.ConnCase
  alias Mobilizon.Discussions
  alias Mobilizon.GraphQL.AbsintheHelpers

  import Mobilizon.Factory

  setup %{conn: conn} do
    user = insert(:user)
    actor = insert(:actor, user: user, preferred_username: "test")

    {:ok, conn: conn, user: user, actor: actor}
  end

  describe "Find conversations for event" do
    @event_conversations_query """
    query Event($uuid: UUID!) {
      event(uuid: $uuid) {
        id
        uuid
        conversations {
          total
          elements {
            id
            lastComment {
              id
              text
            }
            comments {
              total
              elements {
                id
                text
              }
            }
            actor {
              id
              preferredUsername
            }
          }
        }
      }
    }
    """

    test "for a given event", %{conn: conn, user: user, actor: actor} do
      event = insert(:event, organizer_actor: actor)
      origin_comment = insert(:comment, actor: actor)
      conversation = insert(:conversation, event: event, origin_comment: origin_comment)
      another_comment = insert(:comment, origin_comment: conversation.origin_comment)

      Discussions.update_comment(conversation.origin_comment, %{conversation_id: conversation.id})
      Discussions.update_comment(another_comment, %{conversation_id: conversation.id})

      conversation_participant =
        insert(:conversation_participant, actor: actor, conversation: conversation)

      res =
        conn
        |> auth_conn(user)
        |> AbsintheHelpers.graphql_query(
          query: @event_conversations_query,
          variables: %{uuid: conversation.event.uuid}
        )

      assert res["errors"] == nil
      assert res["data"]["event"]["uuid"] == to_string(conversation.event.uuid)
      assert res["data"]["event"]["conversations"]["total"] == 1
      conversation_data = hd(res["data"]["event"]["conversations"]["elements"])
      assert conversation_data["id"] == to_string(conversation.id)
      assert conversation_data["lastComment"]["text"] == conversation.last_comment.text

      assert conversation_data["comments"]["total"] == 2
      comments = conversation_data["comments"]["elements"]

      assert MapSet.new(Enum.map(comments, & &1["id"])) ==
               [conversation.origin_comment.id, another_comment.id]
               |> Enum.map(&to_string/1)
               |> MapSet.new()

      assert Enum.any?(comments, fn comment ->
               comment["text"] == conversation.origin_comment.text
             end)

      assert conversation_data["actor"]["preferredUsername"] ==
               conversation_participant.actor.preferred_username
    end
  end

  describe "Create conversations for event" do
    @post_conversation """
      mutation PostPrivateMessageMutation(
        $text: String!
        $actorId: ID!
        $language: String
        $mentions: [String]
      ) {
        postPrivateMessage(
          text: $text
          actorId: $actorId
          language: $language
          mentions: $mentions
        ) {
            id
            conversationParticipantId
            actor {
              id
              preferredUsername
            }
            participants {
              id
              preferredUsername
            }
        }
      }
    """

    @conversation_text "blablabla"

    test "no connected", %{conn: conn, actor: actor} do
      res =
        conn
        |> AbsintheHelpers.graphql_query(
          query: @post_conversation,
          variables: %{"actorId" => actor.id, "text" => @conversation_text, "language" => "fr"}
        )

      assert hd(res["errors"])["message"] ==
               "You need to be logged in"
    end

    test "bad connected", %{conn: conn, actor: actor} do
      user_without_actor = insert(:user, role: :administrator)

      res =
        conn
        |> auth_conn(user_without_actor)
        |> AbsintheHelpers.graphql_query(
          query: @post_conversation,
          variables: %{"actorId" => actor.id, "text" => @conversation_text, "language" => "fr"}
        )

      assert hd(res["errors"])["message"] ==
               "You are not allowed to create a conversation if not connected"
    end
  end
end
