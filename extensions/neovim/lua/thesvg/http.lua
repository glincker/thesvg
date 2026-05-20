-- http.lua: curl-based HTTP fetcher for thesvg plugin
-- Provides both a synchronous get (used for the cache-bootstrap path on first
-- launch) and an asynchronous get_async (used for inline SVG insert so the
-- editor stays responsive while curl runs).

local M = {}

--- Fetch a URL synchronously. Blocks the main thread; prefer get_async for
--- anything triggered by user interaction.
---@param url string
---@param timeout_ms? integer  default 5000
---@return string|nil body, string|nil err
function M.get(url, timeout_ms)
  timeout_ms = timeout_ms or 5000

  local result = vim.system(
    { "curl", "-fsSL", "--max-time", tostring(math.floor(timeout_ms / 1000)), url },
    { text = true }
  ):wait(timeout_ms + 500)

  if result.code ~= 0 then
    local msg = result.stderr or ("curl exited with code " .. result.code)
    return nil, vim.trim(msg)
  end

  if not result.stdout or result.stdout == "" then
    return nil, "empty response from " .. url
  end

  return result.stdout, nil
end

--- Fetch a URL asynchronously. Invokes callback(body, err) on the main loop
--- when curl completes. Does not block the editor.
---@param url string
---@param timeout_ms integer
---@param callback fun(body: string|nil, err: string|nil)
function M.get_async(url, timeout_ms, callback)
  vim.system(
    { "curl", "-fsSL", "--max-time", tostring(math.floor(timeout_ms / 1000)), url },
    { text = true },
    function(result)
      vim.schedule(function()
        if result.code ~= 0 then
          local msg = result.stderr or ("curl exited with code " .. result.code)
          callback(nil, vim.trim(msg))
          return
        end
        if not result.stdout or result.stdout == "" then
          callback(nil, "empty response from " .. url)
          return
        end
        callback(result.stdout, nil)
      end)
    end
  )
end

return M
