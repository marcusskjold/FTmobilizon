defmodule Mobilizon.Service.AntiSpam.KeywordTest do
  use ExUnit.Case, async: true

  import Mobilizon.Tests.Helpers

  alias Mobilizon.Service.AntiSpam.Keyword, as: KeywordProvider

  @module Mobilizon.Service.AntiSpam.Keyword

  setup do
    clear_config(@module)
  end

  describe "ready?/0" do
    test "returns false when no keywords are configured" do
      Application.put_env(:mobilizon, @module, keywords: [])
      refute KeywordProvider.ready?()
    end

    test "returns false when config key is absent" do
      Application.delete_env(:mobilizon, @module)
      refute KeywordProvider.ready?()
    end

    test "returns true when keywords are configured" do
      Application.put_env(:mobilizon, @module, keywords: ["casino"])
      assert KeywordProvider.ready?()
    end
  end

  describe "check_user/3" do
    setup do
      Application.put_env(:mobilizon, @module, keywords: ["casino", "buy now"])
      :ok
    end

    test "returns :ham for a clean email" do
      assert :ham = KeywordProvider.check_user("user@example.com", "127.0.0.1", "Mozilla/5.0")
    end

    test "returns :spam when the email contains a keyword" do
      assert :spam =
               KeywordProvider.check_user("casino-deals@example.com", "127.0.0.1", "Mozilla/5.0")
    end

    test "is case-insensitive" do
      assert :spam = KeywordProvider.check_user("CASINO@example.com", "127.0.0.1", "Mozilla/5.0")
    end

    test "matches multi-word keywords" do
      assert :spam = KeywordProvider.check_user("buy now@deals.com", "127.0.0.1", nil)
    end
  end

  describe "check_profile/5" do
    setup do
      Application.put_env(:mobilizon, @module, keywords: ["viagra", "buy now"])
      :ok
    end

    test "returns :ham for a clean profile" do
      assert :ham = KeywordProvider.check_profile("alice", "I love hiking", nil, "127.0.0.1", nil)
    end

    test "returns :spam when username contains a keyword" do
      assert :spam =
               KeywordProvider.check_profile("viagra_dealer", "Hello", nil, "127.0.0.1", nil)
    end

    test "returns :spam when summary contains a keyword" do
      assert :spam =
               KeywordProvider.check_profile(
                 "bob",
                 "Buy now at great prices!",
                 nil,
                 "127.0.0.1",
                 nil
               )
    end

    test "is case-insensitive on summary" do
      assert :spam =
               KeywordProvider.check_profile("alice", "VIAGRA for sale", nil, "127.0.0.1", nil)
    end

    test "returns :ham when summary is nil" do
      assert :ham = KeywordProvider.check_profile("alice", nil, nil, "127.0.0.1", nil)
    end
  end

  describe "check_event/5" do
    setup do
      Application.put_env(:mobilizon, @module, keywords: ["free money", "casino"])
      :ok
    end

    test "returns :ham for clean event content" do
      assert :ham =
               KeywordProvider.check_event("Join our meetup!", "alice", nil, "127.0.0.1", nil)
    end

    test "returns :spam when event body contains a keyword" do
      assert :spam =
               KeywordProvider.check_event(
                 "Win free money today!",
                 "alice",
                 nil,
                 "127.0.0.1",
                 nil
               )
    end

    test "returns :spam when username contains a keyword" do
      assert :spam =
               KeywordProvider.check_event(
                 "Community event",
                 "casino_king",
                 nil,
                 "127.0.0.1",
                 nil
               )
    end

    test "is case-insensitive" do
      assert :spam =
               KeywordProvider.check_event("FREE MONEY giveaway", "alice", nil, "127.0.0.1", nil)
    end
  end

  describe "check_comment/6" do
    setup do
      Application.put_env(:mobilizon, @module, keywords: ["spam", "click here"])
      :ok
    end

    test "returns :ham for clean comment" do
      assert :ham =
               KeywordProvider.check_comment(
                 "Great event, thanks!",
                 "alice",
                 false,
                 nil,
                 "127.0.0.1",
                 nil
               )
    end

    test "returns :spam when comment body contains a keyword" do
      assert :spam =
               KeywordProvider.check_comment(
                 "This is spam content",
                 "alice",
                 false,
                 nil,
                 "127.0.0.1",
                 nil
               )
    end

    test "returns :spam when username contains a keyword" do
      assert :spam =
               KeywordProvider.check_comment(
                 "Nice event",
                 "spam_bot",
                 true,
                 nil,
                 "127.0.0.1",
                 nil
               )
    end

    test "returns :spam for a reply with a keyword" do
      assert :spam =
               KeywordProvider.check_comment(
                 "Click here to win!",
                 "bob",
                 true,
                 nil,
                 "127.0.0.1",
                 nil
               )
    end

    test "is case-insensitive" do
      assert :spam =
               KeywordProvider.check_comment(
                 "CLICK HERE now",
                 "alice",
                 false,
                 nil,
                 "127.0.0.1",
                 nil
               )
    end
  end

  describe "with no keywords configured" do
    setup do
      Application.put_env(:mobilizon, @module, keywords: [])
      :ok
    end

    test "check_user always returns :ham" do
      assert :ham = KeywordProvider.check_user("casino@spam.com", "127.0.0.1", nil)
    end

    test "check_profile always returns :ham" do
      assert :ham =
               KeywordProvider.check_profile("spammer", "buy viagra now", nil, "127.0.0.1", nil)
    end

    test "check_event always returns :ham" do
      assert :ham =
               KeywordProvider.check_event("free money casino", "spammer", nil, "127.0.0.1", nil)
    end

    test "check_comment always returns :ham" do
      assert :ham =
               KeywordProvider.check_comment(
                 "click here for viagra",
                 "bot",
                 false,
                 nil,
                 "127.0.0.1",
                 nil
               )
    end
  end
end
