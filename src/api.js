import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Previously we used mock data for osbackend-zl1h.onrender.com, but now we'll connect directly
const isOsBackend = false; // Setting to false to bypass mock data and use real API calls

/**
 * Send a request to the backend API
 * @param {Object} data - The data to send to the API
 * @param {string} endpoint - The API endpoint (default: '/webhook')
 * @returns {Promise<Object>} - The API response
 */
export async function sendRequest(data, endpoint = '/webhook') {
  try {
    // Ensure proper URL construction by handling trailing slashes
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const apiEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // For all backends, try direct connection first
    const url = `${baseUrl}${apiEndpoint}`;
    
    console.log(`Sending direct request to: ${url}`);
    console.log(`Sending payload:`, data);
    
    // Add better error handling with timeouts and retry logic
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    // Format the payload according to the AudioRequest model in backend_implementation.py
    // The backend expects a payload with a "filename" field
    let formattedPayload;
    
    if (endpoint === '/webhook') {
      // Extract the filename from the data object
      let filename = '';
      if (data.data?.fileUrl) {
        filename = data.data.fileUrl;
      } else if (data.fileUrl) {
        filename = data.fileUrl;
      }
      
      formattedPayload = { filename };
    } else {
      // For other endpoints, use the data as is
      formattedPayload = data;
    }
    
    console.log('Sending formatted payload:', formattedPayload);
    
    try {
      // Get auth headers asynchronously
      const headers = await getAuthHeaders();
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...headers // Add authorization headers
        },
        body: JSON.stringify(formattedPayload),
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId); // Clear the timeout if the request completes
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        console.error('Request timed out after 30 seconds');
        throw new Error('Request timed out. The server might be experiencing high load or cold-starting.');
      }
      console.error('Direct request failed, attempting with CORS proxy', fetchError);
      // Try with CORS proxy as a fallback
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      console.log(`Trying with CORS proxy: ${proxyUrl}`);
      
      const proxyResponse = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(await getAuthHeaders())
        },
        body: JSON.stringify(formattedPayload),
        mode: 'cors',
        signal: controller.signal
      });
      
      if (!proxyResponse.ok) {
        const errorData = await proxyResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error ${proxyResponse.status} via proxy`);
      }
      
      return await proxyResponse.json();
    }
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Log activity to Supabase
 * @param {Object} activity - The activity to log
 * @returns {Promise<Object|null>} - The Supabase response or null if Supabase is not configured
 */
export async function logActivity(activity) {
  if (!supabase) {
    console.warn('Supabase not configured. Activity logging skipped.');
    return null;
  }
  
  try {
    // Check if the activity_log table exists and has the expected columns
    const { error: checkError } = await supabase
      .from('activity_log')
      .select('action')
      .limit(1)
      .single();
    
    // If the table doesn't exist or column is missing, log a warning and return null
    if (checkError && (checkError.code === 'PGRST116' || checkError.message.includes('column'))) {
      console.warn('activity_log table does not have the expected structure in Supabase. Activity logging skipped.', checkError);
      return null;
    }
    
    // If the table exists with the column, insert the activity
    const { data, error } = await supabase
      .from('activity_log')
      .insert([activity]);
      
    if (error) {
      console.error('Error logging activity to Supabase:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Exception logging activity to Supabase:', err);
    return null;
  }
}

/**
 * Get user token from Supabase session - REMOVED AUTHENTICATION
 * @returns {Promise<string|null>} The JWT token
 */
export async function getUserToken() {
  console.log('Authentication disabled - returning mock token');
  return 'mock-token';
}

/**
 * Include authorization header in API requests - REMOVED AUTHENTICATION
 * @returns {Promise<Object>} Headers object without Authorization
 */
export async function getAuthHeaders() {
  // Return only content-type header without authentication
  return {
    'Content-Type': 'application/json',
  };
}

/**
 * Get current user's usage statistics
 * @returns {Promise<Object>} Usage data
 */
export async function getUserUsage() {
  try {
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const url = `${baseUrl}/user/usage`;
    
    console.log(`Getting usage data from: ${url}`);
    
    // Get auth headers asynchronously
    const headers = await getAuthHeaders();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`Error getting usage: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching usage:', error);
    console.log('Failed to fetch usage, trying direct method');
    try {
      return await getUserUsageDirectly();
    } catch (directError) {
      console.error('Error fetching usage directly:', directError);
      console.log('Using mock usage data - backend endpoint not available');
      return getMockUserUsage();
    }
  }
}

/**
 * Check user authentication status - REMOVED AUTHENTICATION
 * @returns {Promise<Object>} - The authentication status
 */
export async function checkAuthStatus() {
  console.log('Authentication disabled - returning mock authenticated status');
  return { 
    authenticated: true,
    user: {
      id: 'default-user-id',
      name: 'Default User',
      email: 'user@example.com'
    }
  };
}

/**
 * Authenticate with password - REMOVED AUTHENTICATION
 * @param {string} password - The password to authenticate with
 * @param {Object} userData - Optional user data for registration
 * @returns {Promise<Object>} - The authentication response
 */
export async function authenticate(password, userData = null) {
  console.log('Authentication disabled - returning mock authentication response');
  return { 
    success: true,
    user: {
      id: 'default-user-id',
      name: 'Default User',
      email: userData?.email || 'user@example.com'
    },
    session: { access_token: 'mock-token' }
  };
}

/**
 * Register a new user - REMOVED AUTHENTICATION
 * @param {Object} userData - The user data for registration
 * @returns {Promise<Object>} - The registration response
 */
export async function register(userData) {
  console.log('Authentication disabled - returning mock registration response');
  return { 
    success: true,
    user: {
      id: 'default-user-id',
      name: userData?.name || 'Default User',
      email: userData?.email || 'user@example.com'
    }
  };
}

/**
 * Upload a file to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} filePath - The path to store the file at
 * @param {Function} progressCallback - Optional callback for upload progress
 * @returns {Promise<Object>} - The upload result
 */
export async function uploadFile(file, filePath, progressCallback = null) {
  if (!supabase) {
    console.error('Supabase not configured. File upload not possible.');
    return { error: { message: 'Supabase storage not configured' } };
  }
  
  try {
    console.log('Starting file upload to Supabase...');
    
    // First check if the bucket exists
    console.log('Checking if bucket exists: audiorecordings');
    try {
      const { data: bucketData, error: bucketError } = await supabase
        .storage
        .getBucket('audiorecordings');
      
      // If there's an error but it's not because the bucket doesn't exist
      if (bucketError && bucketError.code !== 'PGRST116') {
        console.error('Error checking bucket existence:', bucketError);
        return { error: bucketError };
      }
      
      // If the bucket doesn't exist, create it
      if (!bucketData || (bucketError && bucketError.code === 'PGRST116')) {
        console.log('Bucket does not exist, creating it...');
        try {
          const { data: createData, error: createError } = await supabase
            .storage
            .createBucket('audiorecordings', {
              public: true,
              fileSizeLimit: 52428800 // 50MB in bytes
            });
          
          if (createError) {
            console.error('Error creating bucket:', createError);
            return { error: createError };
          }
          
          console.log('Bucket created successfully:', createData);
        } catch (createErr) {
          console.error('Exception creating bucket:', createErr);
          return { error: createErr };
        }
      } else {
        console.log('Bucket already exists:', bucketData);
      }
    } catch (bucketErr) {
      console.error('Exception checking bucket:', bucketErr);
      // Continue anyway, as this might be a temporary error
    }

    // List existing buckets to help with debugging
    try {
      const { data: listData, error: listError } = await supabase
        .storage
        .listBuckets();
        
      if (listError) {
        console.error('Error listing buckets:', listError);
      } else {
        console.log('Available buckets:', listData.map(b => b.name));
      }
    } catch (listErr) {
      console.error('Exception listing buckets:', listErr);
    }
    
    // Upload the file
    console.log(`Uploading file to path: ${filePath}`);
    const { data, error } = await supabase
      .storage
      .from('audiorecordings')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        onUploadProgress: progressCallback ? 
          (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            progressCallback(percent);
            console.log(`Upload progress: ${percent}%`);
          } : undefined
      });
      
    if (error) {
      console.error('Error uploading file:', error);
      return { error };
    }
    
    console.log('File uploaded successfully:', data);
    
    // Get the public URL
    console.log('Getting public URL for uploaded file');
    const { data: { publicUrl } } = supabase
      .storage
      .from('audiorecordings')
      .getPublicUrl(filePath);
      
    console.log('Public URL:', publicUrl);
    
    return { data: { ...data, publicUrl } };
  } catch (err) {
    console.error('Exception uploading file:', err);
    return { error: err };
  }
}

/**
 * Create a new conversation record in Supabase
 * @param {Object} conversationData - The conversation data
 * @returns {Promise<Object>} - The Supabase response
 */
export async function createConversation(conversationData) {
  if (!supabase) {
    console.error('Supabase not configured. Cannot create conversation.');
    return { error: { message: 'Supabase not configured' } };
  }
  
  try {
    const { data, error } = await supabase
      .from('repspheres_conversations')
      .insert([conversationData])
      .select();
      
    if (error) {
      console.error('Error creating conversation:', error);
      return { error };
    }
    
    return { data };
  } catch (err) {
    console.error('Exception creating conversation:', err);
    return { error: err };
  }
}

/**
 * Update a conversation's status
 * @param {string} conversationId - The conversation ID
 * @param {string} status - The new status
 * @param {string} errorMessage - Optional error message if status is 'error'
 * @returns {Promise<Object>} - The Supabase response
 */
export async function updateConversationStatus(conversationId, status, errorMessage = null) {
  if (!supabase) {
    console.error('Supabase not configured. Cannot update conversation status.');
    return { error: { message: 'Supabase not configured' } };
  }
  
  try {
    const updateData = { status, updated_at: new Date().toISOString() };
    if (errorMessage) {
      updateData.error_message = errorMessage;
    }
    
    const { data, error } = await supabase
      .from('repspheres_conversations')
      .update(updateData)
      .eq('id', conversationId)
      .select();
      
    if (error) {
      console.error('Error updating conversation status:', error);
      return { error };
    }
    
    return { data };
  } catch (err) {
    console.error('Exception updating conversation status:', err);
    return { error: err };
  }
}

/**
 * Store behavioral analysis results
 * @param {Object} analysisData - The analysis data
 * @returns {Promise<Object>} - The Supabase response
 */
export async function storeBehavioralAnalysis(analysisData) {
  if (!supabase) {
    console.error('Supabase not configured. Cannot store analysis.');
    return { error: { message: 'Supabase not configured' } };
  }
  
  try {
    const { data, error } = await supabase
      .from('repspheres_behavioral_analysis')
      .insert([analysisData])
      .select();
      
    if (error) {
      console.error('Error storing behavioral analysis:', error);
      return { error };
    }
    
    return { data };
  } catch (err) {
    console.error('Exception storing behavioral analysis:', err);
    return { error: err };
  }
}

/**
 * Store participant information
 * @param {Object} participantData - The participant data
 * @returns {Promise<Object>} - The Supabase response
 */
export async function storeParticipant(participantData) {
  if (!supabase) {
    console.error('Supabase not configured. Cannot store participant.');
    return { error: { message: 'Supabase not configured' } };
  }
  
  try {
    const { data, error } = await supabase
      .from('repspheres_participants')
      .insert([participantData])
      .select();
      
    if (error) {
      console.error('Error storing participant:', error);
      return { error };
    }
    
    return { data };
  } catch (err) {
    console.error('Exception storing participant:', err);
  }
}

/**
 * Get a conversation with its analysis and participants
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object>} - The conversation data with analysis and participants
 */
export async function getConversationWithAnalysis(conversationId) {
  if (!supabase) {
    console.error('Supabase not configured. Cannot get conversation.');
    return { error: { message: 'Supabase not configured' } };
  }
  
  try {
    // Get the conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('repspheres_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
      
    if (conversationError) {
      console.error('Error getting conversation:', conversationError);
      return { error: conversationError };
    }
    
    // Get the linguistics analysis for this conversation
    const { data: linguistics, error: linguisticsError } = await supabase
      .from('repspheres_linguistics_results')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (linguisticsError && linguisticsError.code !== 'PGRST116') { // PGRST116 is "Results contain 0 rows" - not a true error
      console.error('Error fetching linguistics analysis:', linguisticsError);
      // Continue anyway as we still want to return the conversation
    }

    // Format the analysis for the frontend
    let formattedAnalysis = null;
    
    if (linguistics) {
      // Parse JSON string fields if needed
      const parseJsonField = (field) => {
        if (!field) return null;
        if (typeof field === 'string') {
          try {
            return JSON.parse(field);
          } catch (e) {
            return field;
          }
        }
        return field;
      };
      
      const key_points = parseJsonField(linguistics.key_points) || [];
      const pain_points = parseJsonField(linguistics.pain_points) || [];
      const objections = parseJsonField(linguistics.objections) || [];
      const next_steps = parseJsonField(linguistics.next_steps) || [];
      
      formattedAnalysis = {
        ...linguistics,
        key_points,
        pain_points,
        objections,
        next_steps,
        sentiment: linguistics.sentiment || 'neutral',
        full_analysis: linguistics.full_analysis || ''
      };
    }

    // Get the behavioral analysis
    const { data: analysis, error: analysisError } = await supabase
      .from('repspheres_behavioral_analysis')
      .select('*')
      .eq('conversation_id', conversationId)
      .single();
      
    if (analysisError && analysisError.code !== 'PGRST116') { // Not found is ok
      console.error('Error getting behavioral analysis:', analysisError);
      return { error: analysisError };
    }
    
    // Get the participants
    const { data: participants, error: participantsError } = await supabase
      .from('repspheres_participants')
      .select('*')
      .eq('conversation_id', conversationId);
      
    if (participantsError) {
      console.error('Error getting participants:', participantsError);
      return { error: participantsError };
    }
    
    return { 
      data: { 
        conversation, 
        analysis: analysis || null, 
        linguistics: formattedAnalysis,
        participants: participants || [] 
      } 
    };
  } catch (err) {
    console.error('Exception getting conversation with analysis:', err);
    return { error: err };
  }
}

/**
 * Store linguistics analysis results in the new table
 * @param {Object} linguisticsData - The linguistics analysis data
 * @returns {Promise<Object>} - The Supabase response
 */
export async function storeLinguisticsResults(linguisticsData) {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return { data: null, error: 'Supabase client not initialized' };
  }

  try {
    const { data, error } = await supabase
      .from('repspheres_linguistics_results')
      .insert([
        {
          conversation_id: linguisticsData.conversation_id,
          transcription: linguisticsData.transcription,
          sentiment: linguisticsData.sentiment || 'neutral',
          key_points: Array.isArray(linguisticsData.key_points) ? linguisticsData.key_points : [],
          pain_points: Array.isArray(linguisticsData.pain_points) ? linguisticsData.pain_points : [],
          objections: Array.isArray(linguisticsData.objections) ? linguisticsData.objections : [],
          next_steps: Array.isArray(linguisticsData.next_steps) ? linguisticsData.next_steps : [],
          full_analysis: linguisticsData.full_analysis || linguisticsData.conversation_summary || '',
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Error storing linguistics results:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Exception storing linguistics results:', error);
    return { data: null, error };
  }
}

/**
 * Get all conversations for the current user
 * @param {number} limit - Optional limit on number of conversations to return
 * @param {number} offset - Optional offset for pagination
 * @returns {Promise<Object>} - The conversations
 */
export async function getUserConversations(limit = 10, offset = 0) {
  if (!supabase) {
    console.error('Supabase not configured. Cannot get user conversations.');
    return { error: { message: 'Supabase not configured' } };
  }
  
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: { message: 'User not authenticated' } };
    }
    
    // Get the conversations
    const { data, error, count } = await supabase
      .from('repspheres_conversations')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) {
      console.error('Error getting user conversations:', error);
      return { error };
    }
    
    return { data, count };
  } catch (err) {
    console.error('Exception getting user conversations:', err);
    return { error: err };
  }
}

// Mock implementation of getUserUsage for when the backend is not available
export async function getMockUserUsage() {
  console.log('Using mock usage data - backend endpoint not available');
  return {
    tier: 'free',
    usage: 0,
    quota: 10,
    reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
  };
}

// Direct API call without CORS proxy - alternative method if CORS proxy fails
export async function getUserUsageDirectly() {
  try {
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const targetUrl = `${baseUrl}/user/usage`;
    
    // Get auth headers asynchronously
    const headers = await getAuthHeaders();
    
    const response = await fetch(targetUrl, {
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Error getting usage: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching usage directly:', error);
    return getMockUserUsage();
  }
}

/**
 * Get the status of a conversation
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object>} - The conversation status
 */
export async function getConversationStatus(conversationId) {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return { data: null, error: 'Supabase client not initialized' };
  }

  try {
    // Get the conversation with just basic fields
    const { data, error } = await supabase
      .from('repspheres_conversations')
      .select('id, status, error_message')
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error getting conversation status:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Exception getting conversation status:', error);
    return { data: null, error };
  }
}

export default {
  sendRequest,
  logActivity,
  checkAuthStatus,
  authenticate,
  register,
  uploadFile,
  supabase,
  getUserToken,
  getAuthHeaders,
  getUserUsage,
  createConversation,
  updateConversationStatus,
  storeBehavioralAnalysis,
  storeParticipant,
  storeLinguisticsResults,
  getConversationWithAnalysis,
  getUserConversations,
  getConversationStatus,
  supabase
};
