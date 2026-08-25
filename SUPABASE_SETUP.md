# Supabase MCP + Agent Skills Setup

## MCP Configuration ✅
The MCP client configuration has been added to `.vscode/mcp.json`.

To activate it in VS Code:
1. Open Command Palette (`Ctrl+Shift+P`)
2. Run **"MCP: Add Server"** or restart VS Code
3. The Supabase MCP server should appear in your MCP panel

## Agent Skills (Optional)
To install Supabase Agent Skills for enhanced AI assistance, run in your terminal:

```bash
npx skills add supabase/agent-skills
```

Or install the skills CLI first:
```bash
npm install -g @anthropic-ai/skills
skills add supabase/agent-skills
```

## Project Details
- **Project Ref**: `sunajwnkvkvwjpoquqni`
- **Supabase URL**: `https://sunajwnkvkvwjpoquqni.supabase.co`
- **Features Enabled**: docs, account, database, debugging, development, functions, branching, storage

## Next Steps
1. Ensure `npm install` has been run to install `@supabase/supabase-js` and `@supabase/ssr`
2. Verify `.env.local` contains your Supabase credentials
3. Set up your database tables in the Supabase Dashboard
4. Configure Row Level Security (RLS) policies for your tables
