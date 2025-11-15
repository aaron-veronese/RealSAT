import { supabase } from './client'

export interface VideoRequestResult {
  success: boolean
  error?: string
  remainingGems?: number
}

/**
 * Unlock a video explanation for a question (costs 10 gems)
 */
export async function unlockVideo(userId: string, questionId: string): Promise<VideoRequestResult> {
  try {
    console.log('[UNLOCK VIDEO] Starting unlock for user:', userId, 'question:', questionId)
    
    // Call the RPC function which bypasses RLS and handles everything
    console.log('[UNLOCK VIDEO] RPC payload:', {
      p_user_id: userId,
      p_question_id: questionId,
    })
    const { data, error } = await supabase.rpc('unlock_video_for_user', {
      p_user_id: userId,
      p_question_id: questionId,
    })

    console.log('[UNLOCK VIDEO] RPC response:', { data, error })

    if (error) {
      console.error('[UNLOCK VIDEO] RPC error details:', error)
      if (error.details) console.error('[UNLOCK VIDEO] RPC error details field:', error.details)
      if (error.hint) console.error('[UNLOCK VIDEO] RPC error hint:', error.hint)
      if (error.code) console.error('[UNLOCK VIDEO] RPC error code:', error.code)
      return { success: false, error: error.message }
    }

    // The RPC returns a JSON object with success, error, and remainingGems
    return data as VideoRequestResult
  } catch (error) {
    console.error('[UNLOCK VIDEO] Exception:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Request a video explanation for a question (free, no gems cost)
 */
export async function requestVideo(userId: string, questionId: string): Promise<VideoRequestResult> {
  try {
    // 1. Get user's current video_requests
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('video_requests, gems_balance')
      .eq('id', userId)
      .single()

    if (userError) {
      return { success: false, error: userError.message }
    }

    if (!userData) {
      return { success: false, error: 'User not found' }
    }

    // Check if already requested
    const videoRequests = userData.video_requests || []
    if (videoRequests.includes(questionId)) {
      return { success: false, error: 'Video already requested' }
    }

    // 2. Add question to video_requests
    const updatedRequests = [...videoRequests, questionId]

    const { error: updateUserError } = await supabase
      .from('users')
      .update({
        video_requests: updatedRequests,
      })
      .eq('id', userId)

    if (updateUserError) {
      return { success: false, error: updateUserError.message }
    }

    // 3. Increment question's video_requests counter
    const { error: updateQuestionError } = await supabase.rpc('increment_video_requests', {
      question_uuid: questionId,
    })

    if (updateQuestionError) {
      console.error('Failed to increment question video_requests:', updateQuestionError)
      // Don't fail the whole operation if this fails
    }

    // 4. TODO: Trigger email notification to admin
    // This would be handled by a Supabase Edge Function or webhook

    return { success: true, remainingGems: userData.gems_balance }
  } catch (error) {
    console.error('Error requesting video:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get user's video requests and gems balance
 */
export async function getUserVideoData(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('video_requests, gems_balance')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user video data:', error)
    return { videoRequests: [], gemsBalance: 0 }
  }

  return {
    videoRequests: data?.video_requests || [],
    gemsBalance: data?.gems_balance || 0,
  }
}

/**
 * Check if a question has a video available
 */
export async function checkVideoAvailability(questionId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('questions')
    .select('video')
    .eq('id', questionId)
    .single()

  if (error) {
    console.error('Error checking video availability:', error)
    return false
  }

  return !!data?.video
}

/**
 * Get video URL for a question
 */
export async function getQuestionVideo(questionId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('questions')
    .select('video')
    .eq('id', questionId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching question video:', error)
    return null
  }

  return data?.video || null
}

/**
 * Get video URLs for multiple questions at once (efficient batch loading)
 */
export async function getQuestionVideos(questionIds: string[]): Promise<Map<string, string>> {
  const videoMap = new Map<string, string>()
  
  if (questionIds.length === 0) return videoMap

  const { data, error } = await supabase
    .from('questions')
    .select('id, video')
    .in('id', questionIds)

  if (error) {
    console.error('Error fetching question videos:', error)
    return videoMap
  }

  data?.forEach(question => {
    if (question.video) {
      videoMap.set(question.id, question.video)
    }
  })

  return videoMap
}
