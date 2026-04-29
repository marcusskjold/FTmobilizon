defmodule Mobilizon.Service.AntiSpam.Keyword do
  @moduledoc """
  Keyword-based anti-spam provider.

  Checks content against a configurable list of banned keywords.
  Returns `:spam` as soon as any keyword is found (case-insensitive).

  ## Configuration

      config :mobilizon, Mobilizon.Service.AntiSpam.Keyword,
        keywords: ["casino", "viagra", "buy now"]

  """

  alias Mobilizon.Service.AntiSpam.Provider

  @behaviour Provider

  @impl Provider
  @spec ready?() :: boolean()
  def ready?, do: keywords() != []

  @impl Provider
  @spec check_user(String.t(), String.t(), String.t()) :: Provider.result()
  def check_user(email, _ip, _user_agent) do
    check_fields([email])
  end

  @impl Provider
  @spec check_profile(
          String.t(),
          String.t(),
          String.t() | nil,
          String.t(),
          String.t() | nil
        ) :: Provider.result()
  def check_profile(username, summary, _email, _ip, _user_agent) do
    check_fields([username, summary])
  end

  @impl Provider
  @spec check_event(
          String.t(),
          String.t(),
          String.t() | nil,
          String.t(),
          String.t() | nil
        ) :: Provider.result()
  def check_event(event_body, username, _email, _ip, _user_agent) do
    check_fields([event_body, username])
  end

  @impl Provider
  @spec check_comment(
          String.t(),
          String.t(),
          boolean(),
          String.t() | nil,
          String.t(),
          String.t() | nil
        ) :: Provider.result()
  def check_comment(comment_body, username, _is_reply?, _email, _ip, _user_agent) do
    check_fields([comment_body, username])
  end

  @spec check_fields([String.t() | nil]) :: Provider.spam_result()
  defp check_fields(fields) do
    kws = keywords()

    spam? =
      fields
      |> Enum.reject(&is_nil/1)
      |> Enum.any?(fn field ->
        downcased = String.downcase(field)
        Enum.any?(kws, fn kw -> String.contains?(downcased, kw) end)
      end)

    if spam?, do: :spam, else: :ham
  end

  @spec keywords() :: [String.t()]
  defp keywords do
    :mobilizon
    |> Application.get_env(__MODULE__, [])
    |> Keyword.get(:keywords, [])
    |> Enum.map(&String.downcase/1)
  end
end
