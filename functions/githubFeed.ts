// GitHub commit feed — returns recent commits for the TAG repo
Deno.serve(async (req: Request) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  try {
    const token = Deno.env.get('GITHUB_ACCESS_TOKEN') ?? '';
    const repo = 'mcmullenr99-ux/Tactical-Adaptation-Hub';
    const r = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=20`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!r.ok) return new Response(JSON.stringify({ error: 'GitHub API error', status: r.status }), { status: 502, headers: cors });
    const commits = await r.json();
    const simplified = commits.map((c: any) => ({
      sha: c.sha.slice(0, 7),
      message: c.commit.message.split('\n')[0].slice(0, 100),
      author: c.commit.author.name,
      date: c.commit.author.date,
      url: c.html_url,
    }));
    return new Response(JSON.stringify(simplified), { headers: cors });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
  }
});
