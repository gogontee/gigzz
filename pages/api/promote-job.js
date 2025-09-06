import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { job_id, plan, tokens } = req.body;

    // 1️⃣ Get user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const userId = session.user.id;

    // 2️⃣ Get wallet
    const { data: walletData, error: walletError } = await supabase
      .from('token_wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (walletError || !walletData) {
      return res.status(400).json({ success: false, message: 'Wallet not found' });
    }

    // 3️⃣ Check token balance
    if (walletData.balance < tokens) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // 4️⃣ Check if job is already promoted
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('promotion_tag, promotion_expires_at')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return res.status(400).json({ success: false, message: 'Job not found' });
    }

    const now = new Date();
    if (job.promotion_expires_at && new Date(job.promotion_expires_at) > now) {
      return res.status(400).json({ success: false, message: 'Job is already under promotion' });
    }

    // 5️⃣ Calculate expiration date
    let daysToExpire = 0;
    switch (plan.toLowerCase()) {
      case 'silver': daysToExpire = 3; break;
      case 'gold': daysToExpire = 7; break;
      case 'premium': daysToExpire = 20; break;
    }
    const promotionExpiresAt = new Date();
    promotionExpiresAt.setDate(promotionExpiresAt.getDate() + daysToExpire);

    // 6️⃣ Deduct tokens & update wallet
    const { error: walletUpdateError } = await supabase
      .from('token_wallets')
      .update({
        balance: walletData.balance - tokens,
        last_action: 'Job promotion',
      })
      .eq('user_id', userId);

    if (walletUpdateError) throw walletUpdateError;

    // 7️⃣ Update job promotion_tag and promotion_expires_at
    const { error: jobUpdateError } = await supabase
      .from('jobs')
      .update({
        promotion_tag: plan,
        promotion_expires_at: promotionExpiresAt.toISOString(),
      })
      .eq('id', job_id);

    if (jobUpdateError) throw jobUpdateError;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
