// Simple search function that returns artists, venues and shows for autocomplete
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

interface Result {
  id: string;
  type: 'artist' | 'venue' | 'show';
  name: string;
  image_url?: string | null;
  extra?: Record<string, unknown>;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('', {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'content-type',
      },
    });
  }

  const { query } = await req.json();
  if (!query || query.length < 2) {
    return new Response(JSON.stringify({ data: [] }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const like = `%${query}%`;

  const [artistsRes, venuesRes, showsRes] = await Promise.all([
    supabase.from('artists').select('id,name,image_url').ilike('name', like).limit(5),
    supabase.from('venues').select('id,name,metadata').ilike('name', like).limit(5),
    supabase.from('cached_shows').select('id,name,date').ilike('name', like).limit(5),
  ]);

  const results: Result[] = [];

  if (!artistsRes.error) {
    results.push(
      ...artistsRes.data.map((a) => ({ id: a.id, type: 'artist', name: a.name, image_url: a.image_url }))
    );
  }
  if (!venuesRes.error) {
    results.push(
      ...venuesRes.data.map((v) => ({ id: v.id, type: 'venue', name: v.name }))
    );
  }
  if (!showsRes.error) {
    results.push(...showsRes.data.map((s) => ({ id: s.id, type: 'show', name: s.name })));
  }

  return new Response(JSON.stringify({ data: results }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});

