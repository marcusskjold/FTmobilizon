defmodule Mobilizon.Service.HTTP.RemoteMediaDownloaderClient do
  @moduledoc """
  Tesla HTTP Basic Client that fetches HTML to extract metadata preview
  """

  use Tesla
  alias Mobilizon.Config
  import Mobilizon.Service.HTTP.Utils, only: [get_tls_config: 0]

  @default_opts [
    recv_timeout: 60_000
  ]

  adapter(Tesla.Adapter.Hackney, Keyword.merge([ssl_options: get_tls_config()], @default_opts))

  plug(Tesla.Middleware.FollowRedirects)

  plug(Tesla.Middleware.Timeout, timeout: 30_000)

  plug(Tesla.Middleware.Headers, [{"User-Agent", Config.instance_user_agent()}])

  plug(Tesla.Middleware.Retry, max_retries: 5, delay: 3_000)
end
