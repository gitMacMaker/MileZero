// Receives quote-form submissions and forwards them to Discord.
// The webhook URL lives in the DISCORD_WEBHOOK env var so it is
// never exposed in the page source.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const b = req.body || {};

  // Honeypot — bots fill it; pretend success so they move on
  if (b.website) {
    res.status(200).json({ ok: true });
    return;
  }

  const clean = (v, max) => (v == null ? '' : String(v)).trim().slice(0, max);
  const name = clean(b.name, 100);
  const email = clean(b.email, 200);
  const desc = clean(b.desc, 1000);
  if (!name || !email || !desc) {
    res.status(400).json({ error: 'missing required fields' });
    return;
  }

  const opt = (v) => clean(v, 300) || '—';
  const embed = {
    color: 0x57c690,
    title: '🚧 New Project Request',
    fields: [
      { name: 'Name', value: '`' + name + '`', inline: true },
      { name: 'Email', value: '`' + email + '`', inline: true },
      { name: 'Business', value: '`' + opt(b.business) + '`', inline: true },
      { name: 'Current site', value: '`' + opt(b.site) + '`', inline: true },
      { name: 'Needs', value: '`' + opt(b.needs) + '`', inline: true },
      { name: 'Style', value: '`' + opt(b.style) + '`', inline: true },
      { name: 'Should include', value: opt(b.features), inline: false },
      { name: 'Branding', value: '`' + opt(b.branding) + '`', inline: true },
      { name: 'About the project', value: desc }
    ],
    footer: { text: 'Mile Zero Studio' },
    timestamp: new Date().toISOString()
  };

  const hook = process.env.DISCORD_WEBHOOK;
  if (!hook) {
    res.status(500).json({ error: 'notifier not configured' });
    return;
  }

  const r = await fetch(hook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'Mile Zero Notifier', embeds: [embed] })
  });

  if (!r.ok) {
    res.status(502).json({ error: 'notify failed' });
    return;
  }
  res.status(200).json({ ok: true });
};
