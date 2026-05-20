-- http.lua: curl-based HTTP fetcher for thesvg plugin
-- Uses vim.system (Neovim 0.10+) with a synchronous wait.

local M = {}

-- Fetch a URL and return the response body string, or nil + error message.
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

return M
