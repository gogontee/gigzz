import { supabase } from './supabaseClient';

/**
 * Fetch all chat messages between a client and a creative.
 * @param {string} senderId - Supabase user ID of the sender.
 * @param {string} receiverId - Supabase user ID of the receiver.
 */
export async function fetchChatMessages(senderId, receiverId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Send a chat message from one user to another.
 * @param {Object} messageData - Includes sender_id, receiver_id, and content.
 */
export async function sendMessage(messageData) {
  const { data, error } = await supabase
    .from('messages')
    .insert([messageData]);

  if (error) throw new Error(error.message);
  return data[0];
}
