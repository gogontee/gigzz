import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { job_id, plan, tokens } = JSON.parse(req.body);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  // Get employer token balance
  const { data: tokenData, error: tokenError } = await supabase
    .from('tokens')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (tokenError || !tokenData) {
    return res.status(400).json({ success: false, message: 'No token balance found.' });
  }

  if (tokenData.balance < tokens) {
    return res.status(400).json({ success: false, message: 'Insufficient tokens.' });
  }

  // Deduct tokens
  const { error: updateTokenError } = await supabase
    .from('tokens')
    .update({ balance: tokenData.balance - tokens })
    .eq('user_id', user.id);

  // Promote job
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // 7-day promotion

  const { error: jobError } = await supabase
    .from('jobs')
    .update({
      promoted: true,
      promotion_plan: plan,
      promotion_expires_at: expires.toISOString(),
    })
    .eq('id', job_id);

  if (updateTokenError || jobError) {
    return res.status(500).json({ success: false, message: 'Failed to promote job.' });
  }

  return res.status(200).json({ success: true });
}
