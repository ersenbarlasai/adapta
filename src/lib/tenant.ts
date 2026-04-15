import { createClient } from './supabase/server';
import { cache } from 'react';

/**
 * Fetches the current tenant context based on the authenticated session.
 * Uses React cache to prevent redundant DB calls within the same request.
 */
export const getTenantContext = cache(async () => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch profile to get tenant_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, profile_type')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  // Fetch tenant configuration
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', profile.tenant_id)
    .single();

  if (!tenant) return null;

  // Provide fallback terminology if not set
  const defaultTerminology = {
    provider: 'Öğretmen',
    client: 'Öğrenci',
  };

  return {
    user,
    profile,
    tenant,
    terminology: {
      ...defaultTerminology,
      ...(tenant.theme_config?.terminology || {}),
    },
    branding: {
      primaryColor: tenant.theme_config?.branding?.primary_color || '#4f46e5',
    },
  };
});

/**
 * Resolves a tenant by its unique slug (public URL).
 * Used for public booking pages (/k/[slug]).
 */
export const getTenantBySlug = cache(async (slug: string) => {
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!tenant) return null;

  const defaultTerminology = {
    provider: 'Öğretmen',
    client: 'Öğrenci',
  };

  return {
    tenant,
    terminology: {
      ...defaultTerminology,
      ...(tenant.theme_config?.terminology || {}),
    },
    branding: {
      primaryColor: tenant.theme_config?.branding?.primary_color || '#4f46e5',
    },
  };
});

