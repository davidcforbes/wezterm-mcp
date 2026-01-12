-- WezTerm Configuration for MCP Server
-- Copy this to ~/.wezterm.lua (or merge with your existing config)

return {
  -- Enable the multiplexer server
  unix_domains = {
    {
      name = "unix",
    },
  },

  -- Default to the mux domain
  default_gui_startup_args = { "connect", "unix" },

  -- Optional: Add any other WezTerm settings you need
  -- font = wezterm.font("JetBrains Mono"),
  -- color_scheme = "Dracula",
}
